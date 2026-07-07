(() => {
  if (typeof THREE === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "three-bg-canvas";
  document.body.prepend(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 1, 2000);
  camera.position.z = 520;

  const isMobile = window.innerWidth < 760;
  const COUNT = isMobile ? 42 : 88;
  const RANGE_X = 620;
  const RANGE_Y = 420;
  const RANGE_Z = 320;

  const positions = new Float32Array(COUNT * 3);
  const velocities = [];
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * RANGE_X * 2;
    positions[i * 3 + 1] = (Math.random() - 0.5) * RANGE_Y * 2;
    positions[i * 3 + 2] = (Math.random() - 0.5) * RANGE_Z * 2;
    velocities.push({
      x: (Math.random() - 0.5) * 0.16,
      y: (Math.random() - 0.5) * 0.16,
      z: (Math.random() - 0.5) * 0.16,
    });
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const dotCanvas = document.createElement("canvas");
  dotCanvas.width = dotCanvas.height = 64;
  const dctx = dotCanvas.getContext("2d");
  const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(224,193,92,1)");
  grad.addColorStop(1, "rgba(224,193,92,0)");
  dctx.fillStyle = grad;
  dctx.fillRect(0, 0, 64, 64);
  const dotTexture = new THREE.CanvasTexture(dotCanvas);

  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 6,
      map: dotTexture,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
  scene.add(points);

  const LINK_DIST = isMobile ? 130 : 165;
  const lineGeometry = new THREE.BufferGeometry();
  const linePositions = new Float32Array(COUNT * COUNT * 6);
  lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));
  const lines = new THREE.LineSegments(
    lineGeometry,
    new THREE.LineBasicMaterial({ color: 0x4f8f74, transparent: true, opacity: 0.14 })
  );
  scene.add(lines);

  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener("pointermove", (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function updateLines() {
    const pos = geometry.attributes.position.array;
    let idx = 0;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        const dx = pos[i * 3] - pos[j * 3];
        const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
        const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < LINK_DIST) {
          linePositions[idx++] = pos[i * 3];
          linePositions[idx++] = pos[i * 3 + 1];
          linePositions[idx++] = pos[i * 3 + 2];
          linePositions[idx++] = pos[j * 3];
          linePositions[idx++] = pos[j * 3 + 1];
          linePositions[idx++] = pos[j * 3 + 2];
        }
      }
    }
    lineGeometry.setDrawRange(0, idx / 3);
    lineGeometry.attributes.position.needsUpdate = true;
  }

  let frame = 0;
  function animate() {
    requestAnimationFrame(animate);
    if (document.hidden) return;
    frame++;

    const pos = geometry.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] += velocities[i].x;
      pos[i * 3 + 1] += velocities[i].y;
      pos[i * 3 + 2] += velocities[i].z;
      if (Math.abs(pos[i * 3]) > RANGE_X) velocities[i].x *= -1;
      if (Math.abs(pos[i * 3 + 1]) > RANGE_Y) velocities[i].y *= -1;
      if (Math.abs(pos[i * 3 + 2]) > RANGE_Z) velocities[i].z *= -1;
    }
    geometry.attributes.position.needsUpdate = true;

    if (frame % 4 === 0) updateLines();

    points.rotation.y += 0.0006;
    lines.rotation.y = points.rotation.y;

    camera.position.x += (mouseX * 60 - camera.position.x) * 0.02;
    camera.position.y += (-mouseY * 60 - camera.position.y) * 0.02;
    camera.lookAt(scene.position);

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
