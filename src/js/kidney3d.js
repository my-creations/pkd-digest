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
  const focusTarget = { medulla: 'section', pelvis: 'section', cyst: 'cystic' };
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
      if (fallback) fallback.hidden = true;
      if (status && mount.dataset.ready) status.textContent = mount.dataset.ready;
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

/* Shared bean transform: unit-sphere point -> kidney surface point. */
function beanPoint(x, y, z) {
  const scaled = { x, y: y * 1.32, z: z * 0.78 };
  const dent = Math.exp(-((scaled.y / 0.5) ** 2 + (scaled.z / 0.55) ** 2));
  if (scaled.x > 0) scaled.x -= 0.65 * dent;
  scaled.x += 0.18 * Math.sin(scaled.y * 1.1);
  return scaled;
}

function createMedullaStriationTexture(THREE) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#b05238';
  ctx.fillRect(0, 0, 256, 256);

  // Dense medullary rays / striations running from base (v=1) to papilla (v=0)
  for (let x = 0; x < 256; x += 1) {
    const wave1 = Math.sin(x * 0.42);
    const wave2 = Math.sin(x * 0.95 + 1.2);
    const wave3 = Math.sin(x * 2.3 + 0.7);
    const combined = wave1 * 0.5 + wave2 * 0.3 + wave3 * 0.2;
    if (combined > 0.12) {
      ctx.fillStyle = `rgba(105, 30, 18, ${0.3 + combined * 0.45})`;
      ctx.fillRect(x, 0, 1, 256);
    } else if (combined < -0.15) {
      ctx.fillStyle = `rgba(225, 140, 110, ${0.25 + Math.abs(combined) * 0.35})`;
      ctx.fillRect(x, 0, 1, 256);
    }
  }

  // Vertical gradient: pale papilla tip at top (v=0), rich corticomedullary zone at base (v=1)
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(235, 170, 145, 0.45)');
  grad.addColorStop(0.18, 'rgba(200, 120, 95, 0.15)');
  grad.addColorStop(0.55, 'rgba(0, 0, 0, 0)');
  grad.addColorStop(1, 'rgba(95, 25, 15, 0.35)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(3, 1);
  return texture;
}

function createScene(THREE, canvas, { reduceMotion }) {
  const stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const homePosition = new THREE.Vector3(0.6, 0.3, 6.4);
  const sectionPosition = new THREE.Vector3(3.3, 0.5, 3.0);
  camera.position.copy(homePosition);
  camera.lookAt(0, -0.1, 0);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a6f5c, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xf6ead0, 0.5);
  fill.position.set(-4, -1, 2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xfff0dd, 0.6);
  rim.position.set(-3, 2, -4);
  scene.add(rim);

  const kidney = new THREE.Group();
  scene.add(kidney);

  const clipPlane = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0.15);

  const cortexGeometry = new THREE.SphereGeometry(1, 64, 48);
  const positions = cortexGeometry.attributes.position;
  for (let i = 0; i < positions.count; i += 1) {
    const p = beanPoint(positions.getX(i), positions.getY(i), positions.getZ(i));
    positions.setXYZ(i, p.x, p.y, p.z);
  }
  cortexGeometry.computeVertexNormals();
  const cortexMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9c3f36,
    roughness: 0.5,
    metalness: 0.05,
    clearcoat: 0.55,
    clearcoatRoughness: 0.5,
  });
  kidney.add(new THREE.Mesh(cortexGeometry, cortexMaterial));

  /* Curated cutaway shown in section view: layered shells read as solid,
     with pyramids, pelvis, ureter and vessel stumps seated in the cut plane. */
  const sectionInner = new THREE.Group();
  sectionInner.visible = false;
  kidney.add(sectionInner);

  const cortexCap = new THREE.Mesh(
    cortexGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x7a3226,
      roughness: 0.7,
      side: THREE.BackSide,
      clippingPlanes: [clipPlane],
    })
  );
  sectionInner.add(cortexCap);
  const medullaCap = new THREE.Mesh(
    cortexGeometry,
    new THREE.MeshStandardMaterial({
      color: 0x8a5638,
      roughness: 0.75,
      side: THREE.BackSide,
      clippingPlanes: [clipPlane],
    })
  );
  medullaCap.scale.setScalar(0.86);
  sectionInner.add(medullaCap);

  const striationMap = createMedullaStriationTexture(THREE);
  const medullaMaterial = new THREE.MeshStandardMaterial({
    color: 0xbd6f52,
    roughness: 0.65,
    ...(striationMap ? { map: striationMap } : {}),
  });

  const pelvisMaterial = new THREE.MeshStandardMaterial({ color: 0xead9b8, roughness: 0.6 });
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), pelvisMaterial);
  pelvis.scale.set(0.72, 1.15, 0.72);
  pelvis.position.set(0.08, -0.2, 0);
  sectionInner.add(pelvis);

  /* Medullary pyramids fanning radially around the pelvis, with papillae draining
     into minor calyces funnels (pelvisMaterial) seated in the renal sinus. */
  const pyramids = [
    // [bx, by, bz, px, py, pz, rBase, rTip]
    [0.06, 0.76, -0.02, 0.07, 0.16, -0.01, 0.15, 0.04],
    [-0.32, 0.6, -0.08, -0.06, 0.1, -0.05, 0.14, 0.038],
    [-0.48, 0.44, 0.06, -0.1, 0.02, 0.04, 0.14, 0.038],
    [-0.66, 0.12, -0.06, -0.16, -0.1, -0.04, 0.14, 0.038],
    [-0.68, -0.14, 0.06, -0.17, -0.22, 0.04, 0.14, 0.038],
    [-0.54, -0.46, 0.04, -0.12, -0.36, 0.03, 0.14, 0.038],
    [-0.34, -0.68, -0.08, -0.06, -0.44, -0.05, 0.14, 0.038],
    [-0.04, -0.86, -0.02, 0.04, -0.48, -0.01, 0.14, 0.038],
  ];

  const upVector = new THREE.Vector3(0, 1, 0);
  for (const [bx, by, bz, px, py, pz, rBase, rTip] of pyramids) {
    const base = new THREE.Vector3(bx, by, bz);
    const papilla = new THREE.Vector3(px, py, pz);
    const delta = new THREE.Vector3().subVectors(papilla, base);
    const length = delta.length();
    const dir = delta.clone().normalize();

    // Striated pyramid body tapering from cortex base to papilla
    const pyrGeom = new THREE.CylinderGeometry(rTip, rBase, length, 14);
    const pyrMesh = new THREE.Mesh(pyrGeom, medullaMaterial);
    const center = new THREE.Vector3().addVectors(base, papilla).multiplyScalar(0.5);
    pyrMesh.position.copy(center);
    pyrMesh.quaternion.setFromUnitVectors(upVector, dir);
    sectionInner.add(pyrMesh);

    // Convex arched base cap facing cortex
    const baseDomeGeom = new THREE.SphereGeometry(rBase, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    baseDomeGeom.scale(1, 0.35, 1);
    const baseDomeMesh = new THREE.Mesh(baseDomeGeom, medullaMaterial);
    baseDomeMesh.position.copy(base);
    baseDomeMesh.quaternion.setFromUnitVectors(upVector, dir.clone().negate());
    sectionInner.add(baseDomeMesh);

    // Rounded papilla dome at the apex
    const domeGeom = new THREE.SphereGeometry(rTip, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMesh = new THREE.Mesh(domeGeom, medullaMaterial);
    domeMesh.position.copy(papilla);
    domeMesh.quaternion.setFromUnitVectors(upVector, dir);
    sectionInner.add(domeMesh);

    // Pale papilla tip where it meets the calyx
    const tipMesh = new THREE.Mesh(new THREE.SphereGeometry(rTip * 0.75, 10, 8), pelvisMaterial);
    tipMesh.position.copy(papilla).addScaledVector(dir, 0.015);
    tipMesh.scale.set(1, 0.8, 1);
    sectionInner.add(tipMesh);

    // Minor calyx funnel cupping the papilla and draining into the pelvis
    const calyxLength = 0.11;
    const calyxGeom = new THREE.CylinderGeometry(rTip * 0.85, rTip * 1.35, calyxLength, 10, 1, true);
    const calyxMesh = new THREE.Mesh(calyxGeom, pelvisMaterial);
    const calyxCenter = papilla.clone().addScaledVector(dir, calyxLength * 0.5);
    calyxMesh.position.copy(calyxCenter);
    calyxMesh.quaternion.setFromUnitVectors(upVector, dir);
    sectionInner.add(calyxMesh);
  }

  /* Renal columns: thin septa seated in the gaps between pyramids. */
  const renalColumns = [
    // [baseX, baseY, baseZ, tipX, tipY, tipZ, rBase, rTip]
    [-0.4, 0.52, -0.01, -0.08, 0.06, -0.005, 0.045, 0.025],
    [-0.67, -0.01, 0.0, -0.165, -0.16, 0.0, 0.045, 0.025],
    [-0.44, -0.57, -0.02, -0.09, -0.4, -0.01, 0.045, 0.025],
  ];
  for (const [cbx, cby, cbz, ctx, cty, ctz, crBase, crTip] of renalColumns) {
    const colBase = new THREE.Vector3(cbx, cby, cbz);
    const colTip = new THREE.Vector3(ctx, cty, ctz);
    const colDelta = new THREE.Vector3().subVectors(colTip, colBase);
    const colDir = colDelta.clone().normalize();
    const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(crTip, crBase, colDelta.length(), 10), medullaMaterial);
    colMesh.position.copy(new THREE.Vector3().addVectors(colBase, colTip).multiplyScalar(0.5));
    colMesh.quaternion.setFromUnitVectors(upVector, colDir);
    sectionInner.add(colMesh);
  }

  /* Major calyx stems merging the minor funnels toward the pelvis. */
  const superiorMajorCalyxCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.06, 0.1, -0.03),
    new THREE.Vector3(0.0, 0.03, -0.01),
    new THREE.Vector3(0.06, -0.06, 0.0),
  ]);
  sectionInner.add(new THREE.Mesh(new THREE.TubeGeometry(superiorMajorCalyxCurve, 16, 0.05, 12), pelvisMaterial));
  const inferiorMajorCalyxCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.12, -0.36, 0.02),
    new THREE.Vector3(-0.02, -0.33, 0.01),
    new THREE.Vector3(0.06, -0.3, 0.0),
  ]);
  sectionInner.add(new THREE.Mesh(new THREE.TubeGeometry(inferiorMajorCalyxCurve, 16, 0.055, 12), pelvisMaterial));

  const ureterMaterial = new THREE.MeshStandardMaterial({ color: 0xd9a06b, roughness: 0.6 });
  const ureterCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.2, -0.4, 0),
    new THREE.Vector3(0.28, -0.8, 0.02),
    new THREE.Vector3(0.3, -1.2, 0),
    new THREE.Vector3(0.26, -1.6, -0.02),
  ]);
  const ureter = new THREE.Mesh(new THREE.TubeGeometry(ureterCurve, 32, 0.09, 16), ureterMaterial);
  kidney.add(ureter);

  const arteryMaterial = new THREE.MeshStandardMaterial({ color: 0xb03028, roughness: 0.5 });
  const veinMaterial = new THREE.MeshStandardMaterial({ color: 0x3f5f9c, roughness: 0.5 });
  const artery = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.5, 16), arteryMaterial);
  artery.rotation.z = Math.PI / 2;
  artery.position.set(0.56, 0.02, -0.06);
  kidney.add(artery);
  const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16), veinMaterial);
  vein.rotation.z = Math.PI / 2;
  vein.position.set(0.56, -0.14, 0.1);
  kidney.add(vein);

  /* Tapered section ureter: stacked shrinking tubes exiting below the bean. */
  const ureterUpperCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.08, -0.42, 0.0),
    new THREE.Vector3(0.1, -0.65, 0.01),
    new THREE.Vector3(0.11, -0.86, 0.0),
  ]);
  sectionInner.add(new THREE.Mesh(new THREE.TubeGeometry(ureterUpperCurve, 20, 0.075, 14), ureterMaterial));
  const ureterLowerCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.11, -0.86, 0.0),
    new THREE.Vector3(0.12, -1.15, 0.0),
    new THREE.Vector3(0.1, -1.5, -0.01),
  ]);
  sectionInner.add(new THREE.Mesh(new THREE.TubeGeometry(ureterLowerCurve, 20, 0.06, 14), ureterMaterial));
  for (const [material, y, z] of [
    [arteryMaterial, 0.02, -0.04],
    [veinMaterial, -0.14, 0.08],
  ]) {
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.4, 16), material);
    stump.rotation.z = Math.PI / 2;
    stump.position.set(0.3, y, z);
    sectionInner.add(stump);
  }

  /* Interlobar vessels arcing between pyramid bases (shared vessel materials). */
  const sinusCenter = new THREE.Vector3(0.08, -0.2, 0);
  for (let i = 0; i < pyramids.length - 1; i += 1) {
    const a = pyramids[i];
    const b = pyramids[i + 1];
    const baseMid = new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    const inner = baseMid.clone().lerp(sinusCenter, 0.6);
    const outer = new THREE.Vector3(baseMid.x * 1.25, baseMid.y * 1.05, baseMid.z);
    [
      [arteryMaterial, -0.022],
      [veinMaterial, 0.022],
    ].forEach(([material, zOff]) => {
      const curve = new THREE.CatmullRomCurve3([
        inner.clone().add(new THREE.Vector3(0, 0, zOff)),
        baseMid.clone().add(new THREE.Vector3(0, 0, zOff)),
        outer.clone().add(new THREE.Vector3(0, 0, zOff)),
      ]);
      sectionInner.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 10, 0.018, 5), material));
    });
  }

  /* Peripelvic fat nodules in the renal sinus (no legend entry). */
  const fatMaterial = new THREE.MeshStandardMaterial({ color: 0xd9be7a, roughness: 0.85 });
  for (const [fx, fy, fz, fr] of [
    [0.02, 0.3, 0.12, 0.07],
    [-0.24, -0.28, -0.12, 0.08],
    [0.12, -0.44, 0.08, 0.06],
    [-0.3, 0.3, -0.1, 0.06],
  ]) {
    const fatMesh = new THREE.Mesh(new THREE.SphereGeometry(fr, 12, 10), fatMaterial);
    fatMesh.position.set(fx, fy, fz);
    fatMesh.scale.set(1, 0.7, 1);
    sectionInner.add(fatMesh);
  }

  const cystMaterial = new THREE.MeshStandardMaterial({
    color: 0xe6c46c,
    roughness: 0.25,
    metalness: 0.05,
    transparent: true,
    opacity: 0.92,
  });
  const cysts = new THREE.Group();
  cysts.visible = false;
  kidney.add(cysts);

  const parts = {
    cortex: [cortexMaterial],
    medulla: [medullaMaterial],
    pelvis: [pelvisMaterial],
    ureter: [ureterMaterial],
    cyst: [cystMaterial],
  };

  let currentView = 'external';
  let currentMode = 'healthy';

  const updateCystVisibility = () => {
    cysts.visible = currentMode === 'cystic';
    for (const cyst of cysts.children) {
      cyst.visible = !(currentView === 'section' && cyst.userData.baseX > 0.2);
    }
  };

  const setSeverity = (level) => {
    while (cysts.children.length > 0) {
      const child = cysts.children.pop();
      child.geometry.dispose();
      cysts.remove(child);
    }
    const random = mulberry32(20260917);
    const count = level * 4;
    let placed = 0;
    for (let attempts = 0; placed < count && attempts < count * 12; attempts += 1) {
      const theta = random() * Math.PI * 2;
      const z = random() * 2 - 1;
      const radius = Math.sqrt(Math.max(0, 1 - z * z));
      const surface = beanPoint(radius * Math.cos(theta), z * 0.9, radius * Math.sin(theta));
      if (surface.x > 0.2 && Math.abs(surface.y) < 0.55) continue; // keep the hilum clear
      const size = (0.1 + random() * 0.16) * (0.7 + level * 0.12);
      const cyst = new THREE.Mesh(new THREE.SphereGeometry(size, 24, 18), cystMaterial);
      const push = 0.92 + random() * 0.12;
      cyst.position.set(surface.x * push, surface.y * push, surface.z * push);
      cyst.scale.y = 0.85;
      cyst.userData.baseX = cyst.position.x;
      cysts.add(cyst);
      placed += 1;
    }
    updateCystVisibility();
  };

  const setView = (view) => {
    currentView = view;
    const section = view === 'section';
    cortexMaterial.clippingPlanes = section ? [clipPlane] : [];
    sectionInner.visible = section;
    ureter.visible = !section;
    artery.visible = !section;
    vein.visible = !section;
    updateCystVisibility();
    camera.position.copy(section ? sectionPosition : homePosition);
    camera.lookAt(0, -0.1, 0);
  };

  const setMode = (mode) => {
    currentMode = mode;
    updateCystVisibility();
  };

  let flashTimer = 0;
  const flash = (part) => {
    for (const materials of Object.values(parts)) {
      for (const material of materials) material.emissive.setHex(0x000000);
    }
    window.clearTimeout(flashTimer);
    for (const material of parts[part] || []) material.emissive.setHex(0x7a2d00);
    flashTimer = window.setTimeout(() => {
      for (const materials of Object.values(parts)) {
        for (const material of materials) material.emissive.setHex(0x000000);
      }
    }, 1200);
  };

  const resize = () => {
    const width = stage.clientWidth || 1;
    const height = stage.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
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
  });
  const stopDrag = () => {
    dragging = false;
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerup', stopDrag);
  canvas.addEventListener('pointercancel', stopDrag);

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible || document.hidden) return;
    if (!reduceMotion && !dragging) kidney.rotation.y += 0.0025;
    renderer.render(scene, camera);
  };
  tick();

  return { setView, setMode, setSeverity, flash };
}
