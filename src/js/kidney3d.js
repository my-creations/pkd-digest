'use strict';

/* Kidney 3D island (home only). Progressive enhancement contract:
   - Controls work immediately (DOM state + aria-pressed), even before WebGL.
   - three.js loads lazily when the section nears the viewport.
   - No WebGL / load failure -> static SVG fallback stays visible.
   - prefers-reduced-motion disables auto-rotation. */

const mount = document.querySelector('[data-kidney3d]');
if (mount) {
  initKidney(mount);
}

function initKidney(mount) {
  const status = mount.querySelector('[data-kidney3d-status]');
  const canvas = mount.querySelector('[data-kidney3d-canvas]');
  const fallback = mount.querySelector('[data-kidney3d-fallback]');
  const viewButtons = Array.from(mount.querySelectorAll('[data-kidney3d-view]'));
  const modeButtons = Array.from(mount.querySelectorAll('[data-kidney3d-mode]'));
  const severity = mount.querySelector('[data-kidney3d-severity]');
  const severityValue = mount.querySelector('[data-kidney3d-severity-value]');
  const focusButtons = Array.from(mount.querySelectorAll('[data-kidney3d-focus]'));
  const hint = mount.querySelector('[data-kidney3d-hint]');

  const state = { view: 'external', mode: 'healthy', severity: 3 };
  let scene = null;

  const setPressed = (buttons, value, attr) => {
    for (const button of buttons) {
      const active = button.dataset[attr] === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    }
  };

  const applyView = (view) => {
    state.view = view;
    setPressed(viewButtons, view, 'kidney3dView');
    if (scene) scene.setView(view);
  };

  const syncModeUI = () => {
    const cystic = state.mode === 'cystic';
    if (severity) {
      if (severityValue) severityValue.textContent = severity.value;
      severity.disabled = !cystic;
      const group = severity.closest('.kidney3d__group');
      if (group) group.classList.toggle('is-disabled', !cystic);
    }
  };

  const applyMode = (mode) => {
    state.mode = mode;
    setPressed(modeButtons, mode, 'kidney3dMode');
    syncModeUI();
    if (scene) scene.setMode(mode);
  };

  for (const button of viewButtons) {
    button.addEventListener('click', () => applyView(button.dataset.kidney3dView));
  }
  for (const button of modeButtons) {
    button.addEventListener('click', () => applyMode(button.dataset.kidney3dMode));
  }
  if (severity) {
    severity.addEventListener('input', () => {
      state.severity = Number(severity.value);
      syncModeUI();
      if (scene) scene.setSeverity(state.severity);
    });
  }
  // Structures hidden in the current view also switch to the view where
  // they are visible (interior pieces live in the cross-section; cysts
  // only exist in polycystic mode).
  const focusTarget = { medulla: 'section', calyx: 'section', pelvis: 'section', cyst: 'cystic', fat: 'section' };
  for (const button of focusButtons) {
    button.addEventListener('click', () => {
      const part = button.dataset.kidney3dFocus;
      if (focusTarget[part] === 'cystic') applyMode('cystic');
      else if (focusTarget[part]) applyView(focusTarget[part]);
      if (status) status.textContent = button.dataset.name || '';
      if (scene) scene.flash(part);
    });
  }
  setPressed(viewButtons, state.view, 'kidney3dView');
  setPressed(modeButtons, state.mode, 'kidney3dMode');
  syncModeUI();

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const load = async () => {
    if (status && mount.dataset.loading) status.textContent = mount.dataset.loading;
    try {
      const probe = document.createElement('canvas');
      if (!window.WebGLRenderingContext || !(probe.getContext('webgl2') || probe.getContext('webgl'))) {
        throw new Error('webgl-unavailable');
      }
      const THREE = await import(new URL('./vendor/three.module.min.js', import.meta.url));
      scene = createScene(THREE, canvas, { reduceMotion });
      scene.setView(state.view);
      scene.setMode(state.mode);
      scene.setSeverity(state.severity);
      canvas.hidden = false;
      if (hint) hint.hidden = false;
      if (fallback) fallback.hidden = true;
      // Do not overwrite a structure name the reader picked while the model loaded.
      if (status && mount.dataset.ready && status.textContent === mount.dataset.loading) {
        status.textContent = mount.dataset.ready;
      }
    } catch (_error) {
      console.error(_error);
      if (status && mount.dataset.noWebgl) status.textContent = mount.dataset.noWebgl;
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.disconnect();
            load();
          }
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(mount);
  } else {
    load();
  }
}

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

/* Kidney-local frame: +y superior pole, +x medial (hilum), +z anterior.
   Proportions follow an adult kidney (~11 x 6 x 3 cm). The outer surface is
   a "lens" swept over a 2D coronal outline, so the coronal cut at z = 0 is
   exactly that outline and the section caps can be drawn as flat layers. */
const SHAPE = { a: 0.7, b: 1.3, dent: 0.36, dentWidth: 0.42, cx: -0.06 };
const SINUS = { x: 0.14, y: -0.02, a: 0.3, b: 0.62 };
const CORTEX_THICKNESS = 0.15;
const HILUM_GAP = 0.62;

function wrapAngle(theta) {
  return Math.atan2(Math.sin(theta), Math.cos(theta));
}

function outlinePoint(theta) {
  const dent = SHAPE.dent * Math.exp(-((wrapAngle(theta) / SHAPE.dentWidth) ** 2));
  const widen = 1 + 0.06 * Math.sin(theta); // upper pole a little broader
  return { x: SHAPE.a * Math.cos(theta) * widen - dent, y: SHAPE.b * Math.sin(theta) };
}

function halfThickness(theta) {
  return 0.4 * (0.84 + 0.16 * Math.cos(theta) ** 2);
}

function lensPoint(theta, phi, s = 1) {
  const o = outlinePoint(theta);
  const g = Math.max(0, Math.cos(phi)) ** 0.72;
  // Thickness converges to one value at the face centre so the pole closes cleanly.
  const thickness = 0.38 + (halfThickness(theta) - 0.38) * g;
  return {
    x: SHAPE.cx + (o.x - SHAPE.cx) * g * s,
    y: o.y * g * s,
    z: thickness * Math.sin(phi) * s,
  };
}

function lensNormal(theta, phi) {
  const e = 1e-3;
  const p = lensPoint(theta, phi);
  const du = lensPoint(theta + e, phi);
  const dv = lensPoint(theta, Math.min(phi + e, Math.PI / 2));
  const ax = du.x - p.x;
  const ay = du.y - p.y;
  const az = du.z - p.z;
  const bx = dv.x - p.x;
  const by = dv.y - p.y;
  const bz = dv.z - p.z;
  const nx = ay * bz - az * by;
  const ny = az * bx - ax * bz;
  const nz = ax * by - ay * bx;
  const len = Math.hypot(nx, ny, nz) || 1;
  return { x: nx / len, y: ny / len, z: nz / len };
}

/* Corticomedullary junction: outline pulled toward the sinus by the cortex thickness. */
function junctionPoint(theta) {
  const o = outlinePoint(theta);
  const dx = o.x - SINUS.x;
  const dy = o.y - SINUS.y;
  const k = 1 - CORTEX_THICKNESS / Math.hypot(dx, dy);
  return { x: SINUS.x + dx * k, y: SINUS.y + dy * k };
}

function sinusPoint(towards, scale = 1) {
  const dx = towards.x - SINUS.x;
  const dy = towards.y - SINUS.y;
  const angle = Math.atan2(dy / SINUS.b, dx / SINUS.a);
  return { x: SINUS.x + SINUS.a * Math.cos(angle) * scale, y: SINUS.y + SINUS.b * Math.sin(angle) * scale };
}

function sampleProfile(profile, t) {
  for (let i = 1; i < profile.length; i += 1) {
    const [t1, v1] = profile[i];
    const [t0, v0] = profile[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      return v0 + (v1 - v0) * k * k * (3 - 2 * k);
    }
  }
  return profile[profile.length - 1][1];
}

function canvasTexture(THREE, size, draw, { color = true, repeat = 1 } = {}) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  draw(ctx, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  if (color) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function speckle(ctx, size, count, colors, minR, maxR, random) {
  for (let i = 0; i < count; i += 1) {
    const x = random() * size;
    const y = random() * size;
    const r = minR + random() * (maxR - minR);
    ctx.fillStyle = colors[Math.floor(random() * colors.length)];
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        ctx.beginPath();
        ctx.arc(x + ox, y + oy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function buildTextures(THREE) {
  const random = mulberry32(11042026);
  return {
    // Capsule surface: soft mottling (color) and fine relief (bump).
    capsule: canvasTexture(THREE, 256, (ctx, size) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.globalAlpha = 0.12;
      speckle(ctx, size, 220, ['#c79a8f', '#ffffff', '#e8cfc6'], 4, 18, random);
    }),
    bump: canvasTexture(
      THREE,
      256,
      (ctx, size) => {
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = 0.18;
        speckle(ctx, size, 900, ['#000000', '#ffffff'], 1, 5, random);
      },
      { color: false }
    ),
    // Cut cortex is granular (glomeruli); cut fat is lobulated.
    cortexCut: canvasTexture(
      THREE,
      256,
      (ctx, size) => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = 0.35;
        speckle(ctx, size, 1400, ['#d9a99a', '#f6e2da', '#b97c6c'], 0.6, 2.2, random);
      },
      { repeat: 2.5 }
    ),
    fatCut: canvasTexture(
      THREE,
      256,
      (ctx, size) => {
        ctx.fillStyle = '#f4e3b0';
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = 0.55;
        speckle(ctx, size, 160, ['#ffffff', '#fff3cf', '#ead18a'], 6, 16, random);
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#c9a75a';
        ctx.lineWidth = 1;
        for (let i = 0; i < 90; i += 1) {
          ctx.beginPath();
          ctx.arc(random() * size, random() * size, 6 + random() * 12, 0, Math.PI * 2);
          ctx.stroke();
        }
      },
      { repeat: 3 }
    ),
    // Pyramid striations run from the papilla (v = 0) to the base (v = 1).
    pyramid: canvasTexture(THREE, 256, (ctx, size) => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      for (let x = 0; x < size; x += 1) {
        const wave = Math.sin(x * 0.45) * 0.55 + Math.sin(x * 1.3 + 1.1) * 0.3 + Math.sin(x * 3.1) * 0.15;
        ctx.fillStyle = wave > 0 ? `rgba(70, 15, 10, ${0.12 + wave * 0.3})` : `rgba(255, 220, 205, ${-wave * 0.22})`;
        ctx.fillRect(x, 0, 1, size);
      }
      const grad = ctx.createLinearGradient(0, size, 0, 0);
      grad.addColorStop(0, 'rgba(255, 225, 205, 0.55)');
      grad.addColorStop(0.3, 'rgba(255, 220, 200, 0.1)');
      grad.addColorStop(0.75, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(60, 10, 5, 0.3)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }),
    // Cut cyst: thin pale wall, fluid with a soft highlight.
    cystCut: canvasTexture(THREE, 128, (ctx, size) => {
      const c = size / 2;
      const grad = ctx.createRadialGradient(c * 0.8, c * 0.75, size * 0.04, c, c, c);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.55, '#e4e4e4');
      grad.addColorStop(0.88, '#b4b4b4');
      grad.addColorStop(0.93, '#f2f2f2');
      grad.addColorStop(1, '#d0d0d0');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
    }),
  };
}

/* Vertex normals with the lens poles pointing straight out and the lateral
   seam averaged, so neither shows as a crease. */
function computeKidneyNormals(geometry) {
  const { segU, segV } = geometry.userData.grid;
  const row = segU + 1;
  geometry.computeVertexNormals();
  const normals = geometry.attributes.normal;
  for (let j = 0; j <= segV; j += 1) {
    const first = j * row;
    const last = first + segU;
    if (j === 0 || j === segV) {
      for (let i = 0; i <= segU; i += 1) normals.setXYZ(first + i, 0, 0, j === 0 ? -1 : 1);
      continue;
    }
    const nx = normals.getX(first) + normals.getX(last);
    const ny = normals.getY(first) + normals.getY(last);
    const nz = normals.getZ(first) + normals.getZ(last);
    const len = Math.hypot(nx, ny, nz) || 1;
    normals.setXYZ(first, nx / len, ny / len, nz / len);
    normals.setXYZ(last, nx / len, ny / len, nz / len);
  }
}

function buildKidneyGeometry(THREE, segU = 144, segV = 60) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let j = 0; j <= segV; j += 1) {
    const phi = -Math.PI / 2 + (Math.PI * j) / segV;
    for (let i = 0; i <= segU; i += 1) {
      const theta = Math.PI + (Math.PI * 2 * i) / segU; // seam on the lateral border
      const p = lensPoint(theta, phi);
      positions.push(p.x, p.y, p.z);
      uvs.push(p.x * 1.3, p.y * 1.3);
    }
  }
  const row = segU + 1;
  for (let j = 0; j < segV; j += 1) {
    for (let i = 0; i < segU; i += 1) {
      const a = j * row + i;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.userData.grid = { segU, segV };
  computeKidneyNormals(geometry);
  geometry.userData.basePositions = geometry.attributes.position.array.slice();
  geometry.userData.baseNormals = geometry.attributes.normal.array.slice();
  return geometry;
}

function taperedTube(THREE, points, profile, { segments = 48, radial = 16 } = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const geometry = new THREE.TubeGeometry(curve, segments, 1, radial, false);
  const position = geometry.attributes.position;
  const center = new THREE.Vector3();
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    curve.getPointAt(t, center);
    const r = sampleProfile(profile, t);
    for (let k = 0; k <= radial; k += 1) {
      const index = i * (radial + 1) + k;
      position.setXYZ(
        index,
        center.x + (position.getX(index) - center.x) * r,
        center.y + (position.getY(index) - center.y) * r,
        center.z + (position.getZ(index) - center.z) * r
      );
    }
  }
  return geometry;
}

/* Flat ribbon along a smooth 2D path, for drawing on the section cap. */
function ribbon(THREE, points, profile, { segments = 32, closed = false } = {}) {
  const curve = new THREE.CatmullRomCurve3(
    points.map(([x, y]) => new THREE.Vector3(x, y, 0)),
    closed
  );
  const positions = [];
  const indices = [];
  const p = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    curve.getPointAt(t, p);
    curve.getTangentAt(t, tangent);
    const half = sampleProfile(profile, t) / 2;
    positions.push(
      p.x - tangent.y * half,
      p.y + tangent.x * half,
      0,
      p.x + tangent.y * half,
      p.y - tangent.x * half,
      0
    );
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setIndex(indices);
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(
      positions.map((_, i) => (i % 3 === 2 ? 1 : 0)),
      3
    )
  );
  return geometry;
}

function createScene(THREE, canvas, { reduceMotion }) {
  const stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const target = new THREE.Vector3(0.1, -0.3, 0);
  const lookAt = target.clone();
  const homePosition = new THREE.Vector3(0.5, 0.35, 7.2);
  const sectionPosition = new THREE.Vector3(0.25, 0.2, 6.6);

  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6b5446, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xf3e3cc, 0.7);
  fill.position.set(-4, -1, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffeedd, 1.1);
  rim.position.set(-2, 3, -5);
  scene.add(rim);

  /* kidney: user/auto rotation. anatomy: fixed tilt (upper pole medial) and
     PKD enlargement; everything anatomical lives in its local frame. */
  const kidney = new THREE.Group();
  scene.add(kidney);
  const anatomy = new THREE.Group();
  anatomy.rotation.z = -0.14;
  kidney.add(anatomy);

  const textures = buildTextures(THREE);
  const localClip = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0); // keep the posterior half
  const clipPlane = localClip.clone();

  /* Outer surface (capsule over cortex). */
  const cortexMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x93402f,
    roughness: 0.42,
    metalness: 0,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    ...(textures.capsule ? { map: textures.capsule } : {}),
    ...(textures.bump ? { bumpMap: textures.bump, bumpScale: 0.6 } : {}),
  });
  const kidneyGeometry = buildKidneyGeometry(THREE);
  anatomy.add(new THREE.Mesh(kidneyGeometry, cortexMaterial));

  /* Hilum: renal vein (anterior), artery, pelvis/ureter (posterior), hilar fat. */
  const arteryMaterial = new THREE.MeshStandardMaterial({ color: 0xb3262a, roughness: 0.38, side: THREE.DoubleSide });
  const veinMaterial = new THREE.MeshStandardMaterial({ color: 0x3e5c9e, roughness: 0.42, side: THREE.DoubleSide });
  const ureterMaterial = new THREE.MeshStandardMaterial({ color: 0xe0b58a, roughness: 0.5, side: THREE.DoubleSide });
  const hilarFatMaterial = new THREE.MeshStandardMaterial({ color: 0xe2b752, roughness: 0.8 });
  const hilum = new THREE.Group();
  anatomy.add(hilum);
  const hilarFat = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), hilarFatMaterial);
  hilarFat.scale.set(0.14, 0.4, 0.22);
  hilarFat.position.set(0.32, -0.04, -0.01);
  hilum.add(hilarFat);
  hilum.add(
    new THREE.Mesh(
      taperedTube(
        THREE,
        [
          [0.18, 0.06, -0.02],
          [0.42, 0.1, 0.02],
          [0.78, 0.13, 0.02],
          [1.3, 0.2, -0.02],
        ],
        [
          [0, 0.05],
          [0.35, 0.06],
          [1, 0.072],
        ]
      ),
      arteryMaterial
    )
  );
  hilum.add(
    new THREE.Mesh(
      taperedTube(
        THREE,
        [
          [0.5, 0.11, 0.02],
          [0.4, 0.26, 0.03],
          [0.26, 0.36, 0.0],
        ],
        [
          [0, 0.034],
          [1, 0.024],
        ],
        { segments: 16, radial: 10 }
      ),
      arteryMaterial
    )
  );
  hilum.add(
    new THREE.Mesh(
      taperedTube(
        THREE,
        [
          [0.18, -0.09, 0.01],
          [0.42, -0.08, 0.02],
          [0.78, -0.05, 0.02],
          [1.3, 0.01, 0.02],
        ],
        [
          [0, 0.06],
          [0.35, 0.08],
          [1, 0.092],
        ]
      ),
      veinMaterial
    )
  );
  hilum.add(
    new THREE.Mesh(
      taperedTube(
        THREE,
        [
          [0.52, -0.07, 0.02],
          [0.42, -0.2, 0.02],
          [0.28, -0.3, 0.01],
        ],
        [
          [0, 0.04],
          [1, 0.03],
        ],
        { segments: 16, radial: 10 }
      ),
      veinMaterial
    )
  );
  hilum.add(
    new THREE.Mesh(
      taperedTube(
        THREE,
        [
          [0.2, -0.18, -0.04],
          [0.46, -0.32, -0.06],
          [0.64, -0.6, -0.07],
          [0.69, -1.0, -0.07],
          [0.63, -1.5, -0.06],
          [0.55, -2.05, -0.05],
        ],
        [
          [0, 0.13],
          [0.12, 0.1],
          [0.3, 0.062],
          [1, 0.05],
        ],
        { segments: 80 }
      ),
      ureterMaterial
    )
  );

  /* Coronal section cap: flat layers at z = 0 painted back to front. */
  const section = new THREE.Group();
  section.visible = false;
  anatomy.add(section);
  const addLayer = (geometry, material, layer) => {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = 0.0012 * layer;
    mesh.renderOrder = layer;
    section.add(mesh);
    return mesh;
  };
  const flatMaterial = (color, map, extra = {}) =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.62,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      ...(map ? { map } : {}),
      ...extra,
    });

  const outline = [];
  for (let k = 0; k < 240; k += 1) {
    const o = outlinePoint((Math.PI * 2 * k) / 240);
    outline.push(new THREE.Vector2(o.x, o.y));
  }
  const cortexCapMaterial = flatMaterial(0xb85a45, textures.cortexCut);
  addLayer(new THREE.ShapeGeometry(new THREE.Shape(outline), 1), cortexCapMaterial, 0);

  const fatMaterial = flatMaterial(0xe6bb55, textures.fatCut, { roughness: 0.8 });
  const sinusShape = new THREE.Shape();
  sinusShape.absellipse(SINUS.x, SINUS.y, SINUS.a, SINUS.b, 0, Math.PI * 2, false, 0);
  addLayer(new THREE.ShapeGeometry(sinusShape, 32), fatMaterial, 1);

  // Pyramids fan around the sinus; the cortex shows between them as renal columns.
  const pyramidCount = 9;
  const pyramids = [];
  for (let i = 0; i < pyramidCount; i += 1) {
    const theta = HILUM_GAP + 0.12 + ((Math.PI * 2 - 2 * (HILUM_GAP + 0.12)) * i) / (pyramidCount - 1);
    const half = 0.22 - 0.04 * Math.abs(Math.cos(theta));
    const base = junctionPoint(theta);
    const papilla = sinusPoint(base, 0.84);
    pyramids.push({ theta, half, base, papilla });
  }
  const pyramidMaterial = flatMaterial(0x8f2e25, textures.pyramid, { roughness: 0.55 });
  const calyxMaterial = flatMaterial(0xf6ecd9, null, { roughness: 0.5 });
  const calyxEdgeMaterial = flatMaterial(0xcfae86, null);
  const pelvisMaterial = calyxMaterial.clone();
  const pelvisEdgeMaterial = calyxEdgeMaterial.clone();
  // Urothelium edge drawn under each lumen so the collecting system reads as one tree.
  const addCalyx = (points, profile, segments = 32, [fill, edge] = [calyxMaterial, calyxEdgeMaterial]) => {
    addLayer(
      ribbon(
        THREE,
        points,
        profile.map(([t, w]) => [t, w + 0.022]),
        { segments }
      ),
      edge,
      3
    );
    addLayer(ribbon(THREE, points, profile, { segments }), fill, 3.5);
  };
  const papillaMaterial = flatMaterial(0xc4705c, null);

  // Collecting system: pelvis -> major calyces -> minor calyx cups under each papilla.
  const calyxRibbons = [
    [
      [
        [0.0, 0.08],
        [0.18, -0.1],
        [0.36, -0.24],
        [0.5, -0.33],
      ],
      [
        [0, 0.2],
        [0.6, 0.13],
        [1, 0.095],
      ],
    ],
    [
      [
        [0.04, 0.0],
        [-0.02, 0.26],
        [0.02, 0.46],
      ],
      [
        [0, 0.11],
        [1, 0.07],
      ],
    ],
    [
      [
        [0.06, -0.08],
        [-0.02, -0.32],
        [0.04, -0.5],
      ],
      [
        [0, 0.11],
        [1, 0.07],
      ],
    ],
  ];
  calyxRibbons.forEach(([points, profile], index) =>
    addCalyx(points, profile, 32, index === 0 ? [pelvisMaterial, pelvisEdgeMaterial] : undefined)
  );
  const calyxAnchors = [
    { x: 0.02, y: 0.44 },
    { x: -0.06, y: 0.02 },
    { x: 0.04, y: -0.48 },
  ];
  const vesselCapArtery = flatMaterial(0xb3262a, null, { roughness: 0.45 });
  const vesselCapVein = flatMaterial(0x3e5c9e, null, { roughness: 0.45 });

  const axis = new THREE.Vector2();
  const rel = new THREE.Vector2();
  for (const { theta, half, base, papilla } of pyramids) {
    axis.set(base.x - papilla.x, base.y - papilla.y);
    const length = axis.length();
    axis.normalize();
    const perp = { x: -axis.y, y: axis.x };

    // Minor calyx funnel cupping the papilla (drawn under the pyramid).
    const anchor = calyxAnchors.reduce((best, a) =>
      Math.hypot(a.x - papilla.x, a.y - papilla.y) < Math.hypot(best.x - papilla.x, best.y - papilla.y) ? a : best
    );
    const cupEnd = { x: papilla.x + axis.x * 0.05, y: papilla.y + axis.y * 0.05 };
    addCalyx(
      [
        [anchor.x, anchor.y],
        [(anchor.x + papilla.x) / 2, (anchor.y + papilla.y) / 2],
        [cupEnd.x, cupEnd.y],
      ],
      [
        [0, 0.05],
        [0.6, 0.042],
        [0.86, 0.09],
        [1, 0.12],
      ],
      20
    );

    const shape = new THREE.Shape();
    const tipL = { x: papilla.x + perp.x * 0.035 + axis.x * 0.04, y: papilla.y + perp.y * 0.035 + axis.y * 0.04 };
    const tipR = { x: papilla.x - perp.x * 0.035 + axis.x * 0.04, y: papilla.y - perp.y * 0.035 + axis.y * 0.04 };
    const cornerL = junctionPoint(theta + half);
    const cornerR = junctionPoint(theta - half);
    shape.moveTo(tipR.x, tipR.y);
    shape.quadraticCurveTo(papilla.x - axis.x * 0.01, papilla.y - axis.y * 0.01, tipL.x, tipL.y);
    const bulge = 0.02;
    shape.quadraticCurveTo(
      (tipL.x + cornerL.x) / 2 + perp.x * bulge,
      (tipL.y + cornerL.y) / 2 + perp.y * bulge,
      cornerL.x,
      cornerL.y
    );
    for (let k = 1; k <= 12; k += 1) {
      const p = junctionPoint(theta + half - (2 * half * k) / 12);
      shape.lineTo(p.x, p.y);
    }
    shape.quadraticCurveTo(
      (tipR.x + cornerR.x) / 2 - perp.x * bulge,
      (tipR.y + cornerR.y) / 2 - perp.y * bulge,
      tipR.x,
      tipR.y
    );
    const geometry = new THREE.ShapeGeometry(shape, 12);
    const position = geometry.attributes.position;
    const uv = geometry.attributes.uv;
    for (let k = 0; k < position.count; k += 1) {
      rel.set(position.getX(k) - papilla.x, position.getY(k) - papilla.y);
      const angle = Math.atan2(axis.x * rel.y - axis.y * rel.x, axis.dot(rel));
      uv.setXY(k, angle * 2.2 + 0.5, rel.length() / length);
    }
    addLayer(geometry, pyramidMaterial, 4);
    const tip = new THREE.Mesh(new THREE.CircleGeometry(0.032, 16), papillaMaterial);
    tip.position.set(papilla.x + axis.x * 0.035, papilla.y + axis.y * 0.035, 0.0012 * 5);
    tip.renderOrder = 5;
    section.add(tip);

    // Arcuate vessels along the base, cortical radiate branches toward the capsule.
    const arc = [];
    for (let k = 0; k <= 8; k += 1) {
      const p = junctionPoint(theta + (half + 0.05) * (1 - (2 * k) / 8));
      arc.push([p.x, p.y]);
    }
    addLayer(
      ribbon(THREE, arc, [
        [0, 0.012],
        [1, 0.012],
      ]),
      vesselCapArtery,
      6
    );
    for (const offset of [-0.6, 0, 0.6]) {
      const from = junctionPoint(theta + half * offset);
      const to = outlinePoint(theta + half * offset);
      addLayer(
        ribbon(
          THREE,
          [
            [from.x, from.y],
            [from.x + (to.x - from.x) * 0.75, from.y + (to.y - from.y) * 0.75],
          ],
          [
            [0, 0.007],
            [1, 0.003],
          ],
          { segments: 4 }
        ),
        vesselCapArtery,
        6
      );
    }
  }

  // Interlobar vessels in the renal columns; segmental branches through the sinus fat.
  for (let i = 0; i < pyramids.length - 1; i += 1) {
    const theta = (pyramids[i].theta + pyramids[i + 1].theta) / 2;
    const top = junctionPoint(theta);
    const bottom = sinusPoint(top, 0.97);
    // Hilar entry points fan out (artery above, vein below) so branches do not stack.
    const spread = i / (pyramids.length - 2) - 0.5;
    for (const [material, shift, width, layer, hilumPoint] of [
      [vesselCapVein, 0.012, 0.016, 2, [0.44, -0.08 + spread * 0.1]],
      [vesselCapArtery, -0.012, 0.013, 2.3, [0.44, 0.1 + spread * 0.1]],
    ]) {
      const n = { x: -(top.y - bottom.y), y: top.x - bottom.x };
      const len = Math.hypot(n.x, n.y) || 1;
      const ox = (n.x / len) * shift;
      const oy = (n.y / len) * shift;
      addLayer(
        ribbon(
          THREE,
          [
            [bottom.x + ox, bottom.y + oy],
            [top.x + ox, top.y + oy],
          ],
          [
            [0, width],
            [1, width * 0.8],
          ],
          { segments: 4 }
        ),
        material,
        6
      );
      addLayer(
        ribbon(
          THREE,
          [
            hilumPoint,
            [(hilumPoint[0] + bottom.x) / 2 + 0.06, (hilumPoint[1] + bottom.y) / 2],
            [bottom.x + ox, bottom.y + oy],
          ],
          [
            [0, width * 1.6],
            [1, width],
          ],
          { segments: 20 }
        ),
        material,
        layer
      );
    }
  }

  // Fibrous capsule: thin pale rim around the cut.
  addLayer(
    ribbon(
      THREE,
      outline.map((v) => [v.x, v.y]),
      [
        [0, 0.016],
        [1, 0.016],
      ],
      { segments: 480, closed: true }
    ),
    flatMaterial(0xe6c0b0, null, { roughness: 0.4 }),
    7
  );

  /* Cysts: one set of spheres inside the parenchyma. Those near the surface
     bulge out (external view); those crossing z = 0 are drawn on the cap. */
  const cystPalette = [
    [0xf6e8b8, 0.6],
    [0xdcb35a, 0.22],
    [0xb5703a, 0.12],
    [0x6e3226, 0.06],
  ];
  const cystMaterials = cystPalette.map(
    ([color]) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.14,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      })
  );
  const cystCapMaterials = cystPalette.map(([color]) => flatMaterial(color, textures.cystCut, { roughness: 0.2 }));
  const cysts = new THREE.Group();
  cysts.visible = false;
  anatomy.add(cysts);
  const cystCaps = new THREE.Group();
  section.add(cystCaps);
  const cystSphere = new THREE.SphereGeometry(1, 28, 20);
  const cystDisc = new THREE.CircleGeometry(1, 40);

  const clippedMaterials = [
    cortexMaterial,
    arteryMaterial,
    veinMaterial,
    ureterMaterial,
    hilarFatMaterial,
    ...cystMaterials,
  ];
  const parts = {
    cortex: [cortexMaterial, cortexCapMaterial],
    medulla: [pyramidMaterial, papillaMaterial],
    calyx: [calyxMaterial, calyxEdgeMaterial],
    pelvis: [pelvisMaterial, pelvisEdgeMaterial],
    ureter: [ureterMaterial],
    vessels: [arteryMaterial, veinMaterial, vesselCapArtery, vesselCapVein],
    cyst: [...cystMaterials, ...cystCapMaterials],
    fat: [fatMaterial, hilarFatMaterial],
  };

  let dirty = true;
  const invalidate = () => {
    dirty = true;
  };
  let currentView = 'external';
  let currentMode = 'healthy';
  let currentLevel = 3;

  const pickPalette = (value) => {
    let acc = 0;
    for (let i = 0; i < cystPalette.length; i += 1) {
      acc += cystPalette[i][1];
      if (value < acc) return i;
    }
    return 0;
  };

  /* Lift the capsule around bulging cysts so domes blend into a lumpy
     surface instead of sitting on it like beads. */
  const deformCapsule = (bulges) => {
    const { basePositions, baseNormals } = kidneyGeometry.userData;
    const position = kidneyGeometry.attributes.position;
    const out = position.array;
    out.set(basePositions);
    for (let i = 0; i < out.length; i += 3) {
      const x = basePositions[i];
      const y = basePositions[i + 1];
      const z = basePositions[i + 2];
      let lift = 0;
      for (const c of bulges) {
        if (!c.surface) continue;
        const reach = c.r * 1.6;
        const dx = x - c.x;
        const dy = y - c.y;
        const dz = z - c.z;
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > reach * reach) continue;
        const k = 1 - Math.sqrt(d2) / reach;
        lift = Math.max(lift, c.r * 0.6 * k * k);
      }
      if (lift > 0) {
        out[i] += baseNormals[i] * lift;
        out[i + 1] += baseNormals[i + 1] * lift;
        out[i + 2] += baseNormals[i + 2] * lift;
      }
    }
    position.needsUpdate = true;
    computeKidneyNormals(kidneyGeometry);
    kidneyGeometry.computeBoundingSphere();
  };

  const setSeverity = (level) => {
    currentLevel = level;
    cysts.clear();
    cystCaps.clear();
    const random = mulberry32(20260917);
    const count = [0, 10, 18, 28, 40, 56][level] || 28;
    const sizeScale = 0.7 + 0.12 * level;
    const placed = [];
    const surfaceShare = 0.65;
    for (let attempts = 0; placed.length < count && attempts < count * 40; attempts += 1) {
      const surface = placed.length < count * surfaceShare;
      const theta = random() * Math.PI * 2;
      // Surface cysts: area-uniform over both faces and the rim; deep ones near the cut.
      const side = random() < 0.5 ? -1 : 1;
      const phi = surface ? side * Math.acos(Math.min(1, Math.sqrt(random()) ** (1 / 0.72))) : (random() * 2 - 1) * 0.6;
      const radius = (0.06 + 0.26 * random() ** 2) * sizeScale;
      const depth = 0.05 + 0.4 * random();
      const s = 0.4 + 0.45 * random();
      const tone = random();
      if (Math.abs(wrapAngle(theta)) < HILUM_GAP - 0.1) continue; // keep the hilum clear
      let p;
      if (surface) {
        // Centre sits just under the capsule so only a dome bulges out.
        const q = lensPoint(theta, phi);
        const n = lensNormal(theta, phi);
        p = { x: q.x - n.x * radius * depth, y: q.y - n.y * radius * depth, z: q.z - n.z * radius * depth };
      } else {
        p = lensPoint(theta, phi, s);
      }
      const sx = (p.x - SINUS.x) / (SINUS.a + radius * 0.4);
      const sy = (p.y - SINUS.y) / (SINUS.b + radius * 0.4);
      if (sx * sx + sy * sy < 1) continue; // cysts are parenchymal, not in the sinus
      if (placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y, q.z - p.z) < (q.r + radius) * 0.72)) continue;
      placed.push({ ...p, r: radius, tone: pickPalette(tone), surface });
    }
    cystLayout = placed;
    for (const c of placed) {
      const sphere = new THREE.Mesh(cystSphere, cystMaterials[c.tone]);
      sphere.position.set(c.x, c.y, c.z);
      sphere.scale.set(c.r, c.r * 0.94, c.r * 0.9);
      cysts.add(sphere);
      if (Math.abs(c.z) < c.r * 0.9) {
        const r = c.r * Math.sqrt(1 - (c.z / (c.r * 0.9)) ** 2);
        const disc = new THREE.Mesh(cystDisc, cystCapMaterials[c.tone]);
        disc.position.set(c.x, c.y, 0.0012 * 8);
        disc.scale.set(r, r * 0.94, 1);
        disc.renderOrder = 8;
        cystCaps.add(disc);
      }
    }
    applyMode();
  };

  const frame = () => {
    const scale = currentMode === 'cystic' ? 1 + 0.11 * (currentLevel - 1) : 1;
    anatomy.scale.setScalar(scale);
    const base = currentView === 'section' ? sectionPosition : homePosition;
    // Pull back less than the PKD enlargement: the kidney visibly grows but stays framed.
    lookAt.copy(target).multiplyScalar(scale);
    camera.position
      .copy(base)
      .sub(target)
      .multiplyScalar(0.5 + 0.5 * scale)
      .add(lookAt);
    camera.lookAt(lookAt);
    invalidate();
  };

  let cystLayout = [];
  function applyMode() {
    const cystic = currentMode === 'cystic';
    deformCapsule(cystic ? cystLayout : []);
    cysts.visible = cystic;
    cystCaps.visible = cystic;
    frame();
  }

  const setView = (view) => {
    currentView = view;
    const cut = view === 'section';
    for (const material of clippedMaterials) material.clippingPlanes = cut ? [clipPlane] : [];
    section.visible = cut;
    kidney.rotation.set(0, cut ? -0.32 : 0, 0);
    frame();
  };

  const setMode = (mode) => {
    currentMode = mode;
    applyMode();
  };

  let flashTimer = 0;
  const clearFlash = () => {
    for (const materials of Object.values(parts)) {
      for (const material of materials) material.emissive.setHex(0x000000);
    }
  };
  const flash = (part) => {
    clearFlash();
    window.clearTimeout(flashTimer);
    for (const material of parts[part] || []) material.emissive.setHex(0x7a2d00);
    invalidate();
    flashTimer = window.setTimeout(() => {
      clearFlash();
      invalidate();
    }, 1200);
  };

  const resize = () => {
    const width = stage.clientWidth || 1;
    const height = stage.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  };
  resize();
  if ('ResizeObserver' in window) {
    new ResizeObserver(resize).observe(stage);
  } else {
    window.addEventListener('resize', resize);
  }

  let visible = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      visible = entries.some((entry) => entry.isIntersecting);
      invalidate();
    }).observe(stage);
  }

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    kidney.rotation.y += (event.clientX - lastX) * 0.008;
    kidney.rotation.x = Math.max(-0.6, Math.min(0.6, kidney.rotation.x + (event.clientY - lastY) * 0.005));
    lastX = event.clientX;
    lastY = event.clientY;
    invalidate();
  });
  const stopDrag = () => {
    dragging = false;
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  // Render on demand: only the spinning outside view needs every frame.
  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    // The cut face stays put so it can be read; only the outside view spins.
    const spinning = !reduceMotion && !dragging && currentView === 'external';
    if (spinning) kidney.rotation.y += 0.0025;
    else if (!dirty) return;
    dirty = false;
    // Clip in the kidney's own frame so the cut follows rotation. Update from the
    // scene root: the parent group's rotation may have changed since the last frame.
    scene.updateMatrixWorld();
    clipPlane.copy(localClip).applyMatrix4(anatomy.matrixWorld);
    renderer.render(scene, camera);
  };
  tick();

  return { setView, setMode, setSeverity, flash };
}
