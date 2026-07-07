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
  camera.position.z = 6;

  const group = new THREE.Group();
  scene.add(group);

  const outerGeo = new THREE.IcosahedronGeometry(2.1, 1);
  const wire = new THREE.LineSegments(
    new THREE.EdgesGeometry(outerGeo),
    new THREE.LineBasicMaterial({ color: 0xc9a227, transparent: true, opacity: 0.55 })
  );
  group.add(wire);

  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 64;
  const dctx = dotCanvas.getContext("2d");
  const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(224,193,92,1)");
  grad.addColorStop(1, "rgba(224,193,92,0)");
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 64, 64);
  const dotTexture = new THREE.CanvasTexture(dotCanvas);

  const nodesGeo = new THREE.BufferGeometry();
  nodesGeo.setAttribute("position", outerGeo.getAttribute("position").clone());
  const nodes = new THREE.Points(
    nodesGeo,
    new THREE.PointsMaterial({
      size: 0.16,
      map: dotTexture,
      color: 0xe0c15c,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  group.add(nodes);

  const innerWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.2, 0)),
    new THREE.LineBasicMaterial({ color: 0x4f8f74, transparent: true, opacity: 0.35 })
  );
  group.add(innerWire);

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

  let t = 0;
  let autoRotate = 0;
  let curTiltX = 0;
  let curTiltY = 0;

  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    t += 0.01;
    autoRotate += 0.0035;
    curTiltX += (targetTiltX - curTiltX) * 0.04;
    curTiltY += (targetTiltY - curTiltY) * 0.04;

    group.rotation.x = curTiltX;
    group.rotation.y = autoRotate + curTiltY;
    innerWire.rotation.y -= 0.006;
    innerWire.rotation.x += 0.003;

    const pulse = 1 + Math.sin(t * 1.6) * 0.03;
    nodes.scale.setScalar(pulse);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    dim = getDim();
    renderer.setSize(dim, dim);
  });
})();
