(() => {
  if (typeof THREE === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Below this width the metrics card covers almost the entire globe anyway —
  // skip the extra WebGL context and render loop rather than pay for a scene
  // nobody can see.
  if (window.innerWidth < 640) return;

  const container = document.querySelector(".hero-visual");
  if (!container) return;

  const canvas = document.createElement("canvas");
  canvas.className = "hero-3d-canvas";
  container.prepend(canvas);

  const getDim = () => Math.min(Math.max(container.clientWidth, 260), 480);
  let dim = getDim();

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(dim, dim);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 6.4;

  const group = new THREE.Group();
  scene.add(group);

  const RADIUS = 2;

  // Low-poly globe grid
  const globeGeo = new THREE.SphereGeometry(RADIUS, 22, 14);
  const globe = new THREE.LineSegments(
    new THREE.WireframeGeometry(globeGeo),
    new THREE.LineBasicMaterial({ color: 0xc9a227, transparent: true, opacity: 0.22 })
  );
  group.add(globe);

  // Glow dot texture (shared)
  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 64;
  const dctx = dotCanvas.getContext("2d");
  const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(224,193,92,1)");
  grad.addColorStop(1, "rgba(224,193,92,0)");
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 64, 64);
  const dotTexture = new THREE.CanvasTexture(dotCanvas);

  // Network nodes distributed uniformly on the sphere surface
  const NODE_COUNT = 14;
  const nodePositions = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const z = Math.random() * 2 - 1;
    const theta = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    nodePositions.push(
      new THREE.Vector3(r * Math.cos(theta), z, r * Math.sin(theta)).multiplyScalar(RADIUS * 1.01)
    );
  }
  const nodesArr = new Float32Array(NODE_COUNT * 3);
  nodePositions.forEach((p, i) => p.toArray(nodesArr, i * 3));
  const nodesGeo = new THREE.BufferGeometry();
  nodesGeo.setAttribute("position", new THREE.BufferAttribute(nodesArr, 3));
  const nodes = new THREE.Points(
    nodesGeo,
    new THREE.PointsMaterial({
      size: 0.1,
      map: dotTexture,
      color: 0xe0c15c,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(nodes);

  // Great-circle-ish arc between two surface points, lifted outward at the midpoint
  function arcPoint(a, b, t, bulge) {
    const dir = a.clone().normalize().lerp(b.clone().normalize(), t).normalize();
    const lift = Math.sin(Math.PI * t) * bulge;
    return dir.multiplyScalar(RADIUS + lift);
  }

  // Connection pairs: a spread ring plus a few cross-links for a network look
  const pairs = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    pairs.push([i, (i + 4) % NODE_COUNT]);
  }
  for (let i = 0; i < 5; i++) {
    pairs.push([Math.floor(Math.random() * NODE_COUNT), Math.floor(Math.random() * NODE_COUNT)]);
  }

  const SEGMENTS = 36;
  const arcsGroup = new THREE.Group();
  const arcMeta = [];
  pairs.forEach(([ai, bi]) => {
    const a = nodePositions[ai];
    const b = nodePositions[bi];
    if (a === b) return;
    const bulge = 0.45 + Math.random() * 0.35;
    const pts = [];
    for (let s = 0; s <= SEGMENTS; s++) pts.push(arcPoint(a, b, s / SEGMENTS, bulge));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const line = new THREE.Line(
      geo,
      new THREE.LineBasicMaterial({ color: 0x4f8f74, transparent: true, opacity: 0.4 })
    );
    arcsGroup.add(line);
    arcMeta.push({ a, b, bulge, t: Math.random(), speed: 0.12 + Math.random() * 0.1 });
  });
  group.add(arcsGroup);

  // Traveling pulses along each arc — payments/data moving across the network
  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(arcMeta.length * 3), 3));
  const pulses = new THREE.Points(
    pulseGeo,
    new THREE.PointsMaterial({
      size: 0.14,
      map: dotTexture,
      color: 0xe0c15c,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(pulses);

  let targetTiltX = 0;
  let targetTiltY = 0;
  container.addEventListener("pointermove", (e) => {
    const rect = container.getBoundingClientRect();
    targetTiltY = ((e.clientX - rect.left) / rect.width - 0.5) * 0.9;
    targetTiltX = ((e.clientY - rect.top) / rect.height - 0.5) * -0.9;
  });
  container.addEventListener("pointerleave", () => {
    targetTiltX = 0;
    targetTiltY = 0;
  });

  let autoRotate = 0;
  let curTiltX = 0;
  let curTiltY = 0;

  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;

    autoRotate += 0.0025;
    curTiltX += (targetTiltX - curTiltX) * 0.04;
    curTiltY += (targetTiltY - curTiltY) * 0.04;
    group.rotation.x = curTiltX;
    group.rotation.y = autoRotate + curTiltY;

    const pulsePos = pulseGeo.attributes.position.array;
    arcMeta.forEach((m, i) => {
      m.t += m.speed * 0.016;
      if (m.t > 1) m.t -= 1;
      const p = arcPoint(m.a, m.b, m.t, m.bulge);
      pulsePos[i * 3] = p.x;
      pulsePos[i * 3 + 1] = p.y;
      pulsePos[i * 3 + 2] = p.z;
    });
    pulseGeo.attributes.position.needsUpdate = true;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    dim = getDim();
    renderer.setSize(dim, dim);
  });
})();
