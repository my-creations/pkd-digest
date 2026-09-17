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

  const applyMode = (mode) => {
    state.mode = mode;
    setPressed(modeButtons, mode, 'kidney3dMode');
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

function createScene(THREE, canvas, { reduceMotion }) {
  const stage = canvas.parentElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
  const homePosition = new THREE.Vector3(0.6, 0.3, 6.4);
  const cystPosition = new THREE.Vector3(2.1, 0.8, 4.4);
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
  const cortexMaterial = new THREE.MeshStandardMaterial({
    color: 0x9c3f36,
    roughness: 0.5,
    metalness: 0.05,
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
      color: 0x6e231e,
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

  const medullaMaterial = new THREE.MeshStandardMaterial({ color: 0xbd6f52, roughness: 0.65 });
  for (let i = 0; i < 5; i += 1) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.4, 24), medullaMaterial);
    const spread = (i - 2) / 2;
    cone.position.set(0.0 + spread * 0.08, 0.3 + (1 - Math.abs(spread)) * 0.12, spread * 0.3);
    cone.rotation.z = Math.PI;
    cone.rotation.x = spread * 0.4;
    sectionInner.add(cone);
  }
  const pelvisMaterial = new THREE.MeshStandardMaterial({ color: 0xead9b8, roughness: 0.6 });
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.26, 32, 24), pelvisMaterial);
  pelvis.scale.set(0.9, 1.4, 0.8);
  pelvis.position.set(0.08, -0.2, 0);
  sectionInner.add(pelvis);

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
  artery.position.set(0.62, 0.12, 0.1);
  kidney.add(artery);
  const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 16), veinMaterial);
  vein.rotation.z = Math.PI / 2;
  vein.position.set(0.62, -0.06, -0.08);
  kidney.add(vein);

  const sectionUreterCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.1, -0.35, 0),
    new THREE.Vector3(0.12, -0.8, 0.01),
    new THREE.Vector3(0.12, -1.2, 0),
    new THREE.Vector3(0.1, -1.55, -0.01),
  ]);
  sectionInner.add(new THREE.Mesh(new THREE.TubeGeometry(sectionUreterCurve, 32, 0.085, 16), ureterMaterial));
  for (const [material, y, z] of [
    [arteryMaterial, 0.12, 0.08],
    [veinMaterial, -0.06, -0.06],
  ]) {
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.4, 16), material);
    stump.rotation.z = Math.PI / 2;
    stump.position.set(0.3, y, z);
    sectionInner.add(stump);
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
    camera.position.copy(section ? sectionPosition : view === 'cysts' ? cystPosition : homePosition);
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
