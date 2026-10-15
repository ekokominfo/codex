import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

type Props = { theme: string; onStatus: (status: 'ready' | 'fallback') => void };

export default function TempleScene({ theme, onStatus }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const themeRef = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  useEffect(() => {
    const host = container.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' }); }
    catch { onStatus('fallback'); return; }
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#263c37');
    scene.fog = new THREE.FogExp2('#263c37', 0.023);
    const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 180);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    host.appendChild(renderer.domElement);
    const resources: (THREE.BufferGeometry | THREE.Material)[] = [];
    const material = (color: string, options: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
      const result = new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...options }); resources.push(result); return result;
    };
    const wood = material('#2c2721');
    const redWood = material('#854b35');
    const roofMaterial = material('#202d2b', { metalness: 0.2 });
    const stone = material('#62635a');
    const darkStone = material('#3e4942');
    const gold = material('#a8966c');
    const glow = material('#ffcf81', { emissive: '#ff9c46', emissiveIntensity: 2 });
    const ground = material('#253a2e');
    function box(width: number, height: number, depth: number, x: number, y: number, z: number, mat: THREE.Material, parent: THREE.Object3D = scene) {
      const geometry = new THREE.BoxGeometry(width, height, depth); resources.push(geometry);
      const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    }
    function cylinder(top: number, bottom: number, height: number, x: number, y: number, z: number, mat: THREE.Material, parent: THREE.Object3D = scene, segments = 10) {
      const geometry = new THREE.CylinderGeometry(top, bottom, height, segments); resources.push(geometry);
      const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); parent.add(mesh); return mesh;
    }
    function roof(width: number, depth: number, height: number, x: number, y: number, z: number, parent: THREE.Object3D) {
      const positions: number[] = []; const indices: number[] = [];
      const segments = 20;
      // Both curved roof planes meet at a ridge; lifted eaves form the temple silhouette.
      for (const side of [-1, 1]) {
        const offset = positions.length / 3;
        for (let i = 0; i <= segments; i++) {
          const t = i / segments;
          const roofY = height * (1 - t) ** 1.55 + Math.pow(t, 9) * 0.52;
          const span = width * (0.75 + 0.25 * t) / 2;
          for (const end of [-1, 1]) positions.push(end * span, roofY, side * depth / 2 * t);
        }
        for (let i = 0; i < segments; i++) { const k = offset + i * 2; indices.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); geometry.setIndex(indices); geometry.computeVertexNormals(); resources.push(geometry);
      const mat = roofMaterial.clone(); mat.side = THREE.DoubleSide; resources.push(mat);
      const mesh = new THREE.Mesh(geometry, mat); mesh.position.set(x, y, z); parent.add(mesh);
      box(width * 0.78, 0.13, 0.2, x, y + height + 0.05, z, gold, parent);
      for (const side of [-1, 1]) box(width, 0.17, 0.16, x, y + 0.45, z + side * depth / 2, wood, parent);
    }
    scene.add(new THREE.HemisphereLight('#b8c8b4', '#18261c', 2.1));
    const sun = new THREE.DirectionalLight('#ebc29b', 2.5); sun.position.set(-14, 25, 8); scene.add(sun);
    box(180, 0.3, 180, 0, -0.6, -25, ground);

    // Raised sanctuary, an open veranda and a warm shoji doorway.
    const temple = new THREE.Group(); temple.position.set(3, 1.5, -12); temple.rotation.y = -0.12; scene.add(temple);
    box(12, 0.7, 8.8, 0, 0.1, 0, darkStone, temple);
    box(10.4, 0.25, 7.6, 0, 0.65, 0, wood, temple);
    box(8.6, 3.4, 5.8, 0, 2.35, -0.2, wood, temple);
    for (const x of [-4.7, -2.9, 2.9, 4.7]) for (const z of [-3.2, 3.2]) { cylinder(0.14, 0.19, 4.5, x, 2.9, z, redWood, temple); box(0.65, 0.25, 0.6, x, 4.7, z, redWood, temple); }
    box(3.6, 2.75, 0.05, 0, 2.35, 2.73, glow, temple);
    for (let x = -1.8; x <= 1.81; x += 0.3) box(0.035, 2.8, 0.08, x, 2.35, 2.81, wood, temple);
    for (let y = 1; y < 3.8; y += 0.4) box(3.6, 0.035, 0.08, 0, y, 2.81, wood, temple);
    roof(14.3, 10.6, 3.1, 0, 4.25, 0, temple);
    box(5.5, 1.25, 3.5, 0, 7.65, -0.3, wood, temple);
    roof(8.3, 5.8, 2.1, 0, 8.1, -0.3, temple);
    const templeLight = new THREE.PointLight('#ffac59', 38, 16, 2); templeLight.position.set(3, 4, -6); scene.add(templeLight);
    for (let i = 0; i < 18; i++) { const z = -7 + i * 0.94; const y = 1.8 - i * 0.115; box(4.9 + i * 0.045, 0.28, 0.98, 3 + i * 0.07, y, z, i % 3 ? stone : darkStone); }

    function torii(x: number, y: number, z: number, scale: number) {
      const group = new THREE.Group(); group.position.set(x, y, z); group.scale.setScalar(scale); scene.add(group);
      for (const side of [-1, 1]) { const post = cylinder(0.21, 0.3, 6.2, side * 2.3, 2.9, 0, redWood, group); post.rotation.z = side * 0.035; cylinder(0.35, 0.4, 0.6, side * 2.4, 0, 0, darkStone, group); }
      box(6.4, 0.3, 0.35, 0, 4.9, 0, redWood, group);
      box(0.23, 1.15, 0.25, 0, 5.45, 0, redWood, group);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.6, 6.3, 0), new THREE.Vector3(-2.5, 6.05, 0), new THREE.Vector3(0, 5.95, 0), new THREE.Vector3(2.5, 6.05, 0), new THREE.Vector3(3.6, 6.3, 0)]);
      const geometry = new THREE.TubeGeometry(curve, 20, 0.22, 4, false); resources.push(geometry); group.add(new THREE.Mesh(geometry, roofMaterial));
      box(0.55, 0.8, 0.15, 0, 5.48, 0.24, gold, group);
    }
    torii(3.75, -0.05, 9, 1.3);
    function lantern(x: number, y: number, z: number, scale = 1) {
      const group = new THREE.Group(); group.position.set(x, y, z); group.scale.setScalar(scale); scene.add(group);
      box(0.9, 0.2, 0.9, 0, 0, 0, darkStone, group); cylinder(0.18, 0.26, 1.2, 0, 0.65, 0, stone, group);
      box(0.7, 0.12, 0.7, 0, 1.3, 0, darkStone, group); box(0.49, 0.6, 0.49, 0, 1.65, 0, glow, group);
      for (const xx of [-0.28, 0.28]) for (const zz of [-0.28, 0.28]) box(0.08, 0.7, 0.08, xx, 1.65, zz, darkStone, group);
      const cap = cylinder(0, 0.68, 0.55, 0, 2.2, 0, darkStone, group, 4); cap.rotation.y = Math.PI / 4;
      // Emissive windows supply the visual glow; only the nearest pair needs
      // dynamic lighting, keeping fragment shaders inexpensive.
      if (z > 10) { const light = new THREE.PointLight('#ff9e43', 4, 5, 2); light.position.set(0, 1.7, 0); group.add(light); }
    }
    for (let i = 0; i < 5; i++) { const z = -5 + i * 4; const y = Math.max(0, 1.1 - i * 0.32); lantern(-0.4, y, z, 0.85); lantern(7.2, y, z, 0.85); }

    let seed = 47;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const leafMaterials = ['#1b3028', '#20372c', '#243c2f', '#2a3f2d'].map(color => material(color));
    const trunk = material('#302d24');
    // Seeded geometry makes the scene self-contained and stable across reloads.
    for (let i = 0; i < 95; i++) {
      let x = (i % 2 ? -1 : 1) * (10 + random() * 38);
      const z = -36 + random() * 62;
      if (z > 2 && Math.abs(x) < 24) x += Math.sign(x) * 16;
      const height = 7 + random() * 12;
      cylinder(0.12, 0.34, height * 0.65, x, height * 0.25, z, trunk);
      for (let layer = 0; layer < 4; layer++) {
        const geometry = new THREE.ConeGeometry(height * (0.24 - layer * 0.033), height * 0.4, 7); resources.push(geometry);
        const mesh = new THREE.Mesh(geometry, leafMaterials[i % leafMaterials.length]); mesh.position.set(x, height * (0.38 + layer * 0.17), z); mesh.rotation.y = random(); scene.add(mesh);
      }
    }
    for (let i = 0; i < 28; i++) {
      const geometry = new THREE.DodecahedronGeometry(0.3 + random() * 1.1, 0); resources.push(geometry);
      const rock = new THREE.Mesh(geometry, darkStone); rock.position.set((random() > 0.5 ? -1 : 1) * (8 + random() * 10), -0.1, random() * 35 - 15); rock.scale.set(1.6, 0.8, 1); scene.add(rock);
    }
    const mountainMat = material('#344a3e');
    for (let i = 0; i < 8; i++) { const mountain = cylinder(0, 20 + random() * 20, 25 + random() * 20, i * 22 - 75, 5, -65 - random() * 20, mountainMat, scene, 5); mountain.rotation.y = random() * 2; }
    const moonGeometry = new THREE.SphereGeometry(3.8, 32, 20); resources.push(moonGeometry);
    const moonMat = new THREE.MeshBasicMaterial({ color: '#e8d9b4' }); resources.push(moonMat);
    const moon = new THREE.Mesh(moonGeometry, moonMat); moon.position.set(-6, 24, -58); scene.add(moon);

    const particlePositions = new Float32Array(100 * 3);
    for (let i = 0; i < 100; i++) { particlePositions[i * 3] = random() * 40 - 20; particlePositions[i * 3 + 1] = random() * 15; particlePositions[i * 3 + 2] = random() * 40 - 18; }
    const particleGeometry = new THREE.BufferGeometry(); particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3)); resources.push(particleGeometry);
    const particleMaterial = new THREE.PointsMaterial({ color: '#efbf74', size: 0.038, transparent: true, opacity: 0.6, depthWrite: false }); resources.push(particleMaterial);
    const particles = new THREE.Points(particleGeometry, particleMaterial); scene.add(particles);

    // All architecture is static. Batch it by material so the forest and temple
    // need only a handful of draw calls instead of hundreds on mobile devices.
    scene.updateMatrixWorld(true);
    const batches = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const sourceMeshes: THREE.Mesh[] = [];
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      const batch = batches.get(object.material) ?? [];
      batch.push(geometry); batches.set(object.material, batch); sourceMeshes.push(object);
    });
    for (const [mat, geometries] of batches) {
      const merged = mergeGeometries(geometries);
      geometries.forEach(geometry => geometry.dispose());
      if (merged) { resources.push(merged); scene.add(new THREE.Mesh(merged, mat)); }
    }
    sourceMeshes.forEach(mesh => mesh.removeFromParent());

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pointerX = 0; let pointerY = 0; let frame = 0; let elapsed = 0; let last = 0; let visible = true; let lost = false; let disposed = false;
    const target = new THREE.Vector3(0, 4.5, -9);
    function resize() { const { width, height } = host.getBoundingClientRect(); camera.aspect = width / Math.max(height, 1); camera.updateProjectionMatrix(); renderer.setSize(width, height); draw(); }
    function draw() { if (disposed || lost) return; renderer.render(scene, camera); }
    function animate(now: number) {
      frame = 0;
      if (disposed || !visible || document.hidden || lost) return;
      // Cap at 24 fps: the atmosphere needs slow movement, not a costly render loop.
      if (now - last > 41) {
        const dt = Math.min((now - last) / 1000, 0.08); last = now; elapsed += dt;
        const mobile = host.clientWidth < 760;
        const selected = themeRef.current;
        const desiredX = selected === 'garden' ? 10 : selected === 'temple' ? 4 : 10.5;
        const desiredZ = selected === 'temple' ? 12 : selected === 'garden' ? 24 : 25;
        const movement = reducedMotion.matches ? 0 : 1;
        const desiredPosition = new THREE.Vector3(desiredX + pointerX * 0.65 * movement, (mobile ? 7.2 : 7.5) + pointerY * 0.3 * movement, mobile ? desiredZ + 7 : desiredZ);
        const moving = camera.position.distanceToSquared(desiredPosition) > 0.0001;
        camera.position.lerp(desiredPosition, reducedMotion.matches ? 1 : 0.04);
        target.set(mobile ? 2.5 : -1.8, 4.2, -9); camera.lookAt(target);
        if (!reducedMotion.matches) { particles.rotation.y = elapsed * 0.009; particles.position.y = Math.sin(elapsed * 0.14) * 0.35; templeLight.intensity = 38 + Math.sin(elapsed * 2) * 1.5; }
        if (!reducedMotion.matches || moving) draw();
      }
      frame = requestAnimationFrame(animate);
    }
    function start() { if (!frame && !disposed && visible && !document.hidden && !lost) { last = performance.now(); frame = requestAnimationFrame(animate); } }
    function stop() { cancelAnimationFrame(frame); frame = 0; }
    function visibility() { if (document.hidden) stop(); else start(); }
    function pointer(event: PointerEvent) { pointerX = event.clientX / window.innerWidth - 0.5; pointerY = event.clientY / window.innerHeight - 0.5; }
    function contextLost(event: Event) { event.preventDefault(); lost = true; stop(); host.style.opacity = '0'; onStatus('fallback'); }
    function contextRestored() { lost = false; host.style.opacity = '1'; onStatus('ready'); draw(); start(); }
    const observer = new ResizeObserver(resize); observer.observe(host);
    const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) start(); else stop(); }); intersection.observe(host);
    window.addEventListener('pointermove', pointer, { passive: true }); document.addEventListener('visibilitychange', visibility);
    renderer.domElement.addEventListener('webglcontextlost', contextLost); renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
    camera.position.set(10.5, 7.5, 25); camera.lookAt(target); resize(); start(); onStatus('ready');
    return () => {
      disposed = true; stop(); observer.disconnect(); intersection.disconnect();
      window.removeEventListener('pointermove', pointer); document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', contextLost); renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
      resources.forEach(resource => resource.dispose()); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); scene.clear();
    };
  }, [onStatus]);
  return <div className="temple-scene" ref={container} aria-hidden="true" />;
}
