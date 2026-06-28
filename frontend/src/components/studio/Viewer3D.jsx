import { useEffect, useRef } from "react";
import * as THREE from "three";

// Pre-canned sample geometry mirroring backend SAMPLE_HEADS / SAMPLE_PIPES
const HEADS = [
    [10, 10], [20, 10], [30, 10], [40, 10], [50, 10],
    [10, 20], [20, 20], [30, 20], [40, 20], [50, 20],
    [10, 30], [20, 30], [30, 30], [40, 30], [50, 30],
];
const PIPES = [
    [[0, 20], [60, 20]],
    [[10, 10], [50, 10]],
    [[10, 30], [50, 30]],
    [[10, 10], [10, 30]],
    [[20, 10], [20, 30]],
    [[30, 10], [30, 30]],
    [[40, 10], [40, 30]],
    [[50, 10], [50, 30]],
];

// Center the bay around origin: 60x40 bay → translate by (-30, -20)
const OFFX = -30;
const OFFY = -20;
const CEILING_Z = 4; // pipes hang near ceiling, heads point down from there

export default function Viewer3D() {
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const width = container.clientWidth;
        const height = container.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000);
        scene.fog = new THREE.Fog(0x000000, 60, 140);

        const camera = new THREE.PerspectiveCamera(
            55,
            width / height,
            0.1,
            500,
        );
        camera.position.set(38, 28, 38);
        camera.lookAt(0, 4, 0);

        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        container.appendChild(renderer.domElement);

        // Lights
        scene.add(new THREE.AmbientLight(0xffffff, 0.35));
        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(20, 40, 20);
        scene.add(dir);
        const red = new THREE.PointLight(0xef4444, 1.2, 80, 1.5);
        red.position.set(0, 8, 0);
        scene.add(red);

        // --- Floor grid ---
        const grid = new THREE.GridHelper(80, 40, 0x1f2937, 0x111827);
        grid.position.y = 0;
        scene.add(grid);

        // Bay outline (60 x 40)
        const bayGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0 + OFFX, 0.02, 0 + OFFY),
            new THREE.Vector3(60 + OFFX, 0.02, 0 + OFFY),
            new THREE.Vector3(60 + OFFX, 0.02, 40 + OFFY),
            new THREE.Vector3(0 + OFFX, 0.02, 40 + OFFY),
            new THREE.Vector3(0 + OFFX, 0.02, 0 + OFFY),
        ]);
        const bay = new THREE.Line(
            bayGeo,
            new THREE.LineBasicMaterial({ color: 0x64748b }),
        );
        scene.add(bay);

        // Floor fill
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(60, 40),
            new THREE.MeshBasicMaterial({
                color: 0x0a0a0a,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.7,
            }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(30 + OFFX, 0.01, 20 + OFFY);
        scene.add(floor);

        // Ceiling beams (structural — white thin lines at CEILING_Z)
        const beamMat = new THREE.LineBasicMaterial({
            color: 0x334155,
            transparent: true,
            opacity: 0.6,
        });
        for (let x = 10; x < 60; x += 10) {
            const g = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(x + OFFX, CEILING_Z, 0 + OFFY),
                new THREE.Vector3(x + OFFX, CEILING_Z, 40 + OFFY),
            ]);
            scene.add(new THREE.Line(g, beamMat));
        }

        // Pipes (red lines + thin cylinders)
        const pipeGroup = new THREE.Group();
        const pipeMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            metalness: 0.4,
            roughness: 0.4,
            emissive: 0x440a0a,
        });
        PIPES.forEach(([a, b]) => {
            const ax = a[0] + OFFX, az = a[1] + OFFY;
            const bx = b[0] + OFFX, bz = b[1] + OFFY;
            const start = new THREE.Vector3(ax, CEILING_Z, az);
            const end = new THREE.Vector3(bx, CEILING_Z, bz);
            const dirV = new THREE.Vector3().subVectors(end, start);
            const len = dirV.length();
            const cyl = new THREE.Mesh(
                new THREE.CylinderGeometry(0.14, 0.14, len, 12),
                pipeMat,
            );
            cyl.position.copy(start).add(dirV.multiplyScalar(0.5));
            const axis = new THREE.Vector3(0, 1, 0);
            const target = new THREE.Vector3(bx, CEILING_Z, bz)
                .sub(new THREE.Vector3(ax, CEILING_Z, az))
                .normalize();
            cyl.quaternion.setFromUnitVectors(axis, target);
            pipeGroup.add(cyl);
        });
        scene.add(pipeGroup);

        // Sprinkler heads (small inverted cones)
        const headGroup = new THREE.Group();
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xfca5a5,
            emissive: 0x7f1d1d,
            roughness: 0.3,
            metalness: 0.5,
        });
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
        HEADS.forEach(([x, y]) => {
            const px = x + OFFX;
            const pz = y + OFFY;
            const cone = new THREE.Mesh(
                new THREE.ConeGeometry(0.35, 0.7, 16),
                headMat,
            );
            cone.position.set(px, CEILING_Z - 0.4, pz);
            cone.rotation.x = Math.PI;
            headGroup.add(cone);
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.5, 0.7, 24),
                ringMat,
            );
            ring.position.set(px, 0.05, pz);
            ring.rotation.x = -Math.PI / 2;
            headGroup.add(ring);
        });
        scene.add(headGroup);

        // Watermark sprite (Three.js)
        const wmCanvas = document.createElement("canvas");
        wmCanvas.width = 1024;
        wmCanvas.height = 256;
        const ctx = wmCanvas.getContext("2d");
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(0, 0, wmCanvas.width, wmCanvas.height);
        ctx.font = "bold 64px monospace";
        ctx.fillStyle = "rgba(245,158,11,0.55)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
            "DEMO — NOT FOR ENGINEERING USE",
            wmCanvas.width / 2,
            wmCanvas.height / 2,
        );
        ctx.font = "bold 28px monospace";
        ctx.fillText(
            "SAMPLE DATA · PE REVIEW REQUIRED",
            wmCanvas.width / 2,
            wmCanvas.height / 2 + 64,
        );
        const wmTex = new THREE.CanvasTexture(wmCanvas);
        const wmSprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: wmTex,
                transparent: true,
                depthWrite: false,
            }),
        );
        wmSprite.scale.set(50, 12.5, 1);
        wmSprite.position.set(0, 2.5, 0);
        scene.add(wmSprite);

        // --- Camera controls (simple orbit) ---
        let isDown = false;
        let lastX = 0;
        let lastY = 0;
        let theta = Math.atan2(camera.position.x, camera.position.z);
        let phi = Math.acos(camera.position.y / camera.position.length());
        let radius = camera.position.length();

        const updateCamera = () => {
            const x = radius * Math.sin(phi) * Math.sin(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.cos(theta);
            camera.position.set(x, y, z);
            camera.lookAt(0, 4, 0);
        };

        const onDown = (e) => {
            isDown = true;
            lastX = e.clientX ?? e.touches?.[0]?.clientX;
            lastY = e.clientY ?? e.touches?.[0]?.clientY;
        };
        const onUp = () => {
            isDown = false;
        };
        const onMove = (e) => {
            if (!isDown) return;
            const cx = e.clientX ?? e.touches?.[0]?.clientX;
            const cy = e.clientY ?? e.touches?.[0]?.clientY;
            const dx = (cx - lastX) * 0.008;
            const dy = (cy - lastY) * 0.008;
            theta -= dx;
            phi = Math.max(0.2, Math.min(Math.PI / 2 - 0.05, phi - dy));
            lastX = cx;
            lastY = cy;
            updateCamera();
        };
        const onWheel = (e) => {
            e.preventDefault();
            radius = Math.max(15, Math.min(120, radius + e.deltaY * 0.03));
            updateCamera();
        };

        const dom = renderer.domElement;
        dom.addEventListener("mousedown", onDown);
        dom.addEventListener("mouseup", onUp);
        dom.addEventListener("mouseleave", onUp);
        dom.addEventListener("mousemove", onMove);
        dom.addEventListener("touchstart", onDown);
        dom.addEventListener("touchend", onUp);
        dom.addEventListener("touchmove", onMove);
        dom.addEventListener("wheel", onWheel, { passive: false });

        // Gentle auto-rotate when idle
        let lastInteraction = Date.now();
        const markInteract = () => {
            lastInteraction = Date.now();
        };
        dom.addEventListener("mousedown", markInteract);
        dom.addEventListener("wheel", markInteract);

        let rafId;
        const animate = () => {
            if (Date.now() - lastInteraction > 1500) {
                theta += 0.0015;
                updateCamera();
            }
            renderer.render(scene, camera);
            rafId = requestAnimationFrame(animate);
        };
        animate();

        // Resize handler
        const ro = new ResizeObserver(() => {
            const w = container.clientWidth;
            const h = container.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        });
        ro.observe(container);

        return () => {
            cancelAnimationFrame(rafId);
            ro.disconnect();
            dom.removeEventListener("mousedown", onDown);
            dom.removeEventListener("mouseup", onUp);
            dom.removeEventListener("mouseleave", onUp);
            dom.removeEventListener("mousemove", onMove);
            dom.removeEventListener("touchstart", onDown);
            dom.removeEventListener("touchend", onUp);
            dom.removeEventListener("touchmove", onMove);
            dom.removeEventListener("wheel", onWheel);
            renderer.dispose();
            wmTex.dispose();
            if (dom.parentNode) dom.parentNode.removeChild(dom);
        };
    }, []);

    return (
        <div className="relative h-full w-full" data-testid="viewer-3d">
            <div ref={containerRef} className="absolute inset-0" />
            {/* HUD overlays */}
            <div className="absolute top-3 left-3 flex items-center gap-2 fsrs-label text-amber-300/80 bg-black/60 border border-amber-500/40 px-2 py-1">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                DEMO&nbsp;SCENE&nbsp;//&nbsp;SAMPLE&nbsp;DATA
            </div>
            <div className="absolute top-3 right-3 fsrs-label text-slate-400 bg-black/60 border border-white/10 px-2 py-1">
                60&apos; × 40&apos; · 15 HEADS · 8 PIPE SEGMENTS
            </div>
            <div className="absolute bottom-3 left-3 fsrs-label text-slate-500 bg-black/60 border border-white/10 px-2 py-1">
                DRAG&nbsp;TO&nbsp;ORBIT&nbsp;·&nbsp;SCROLL&nbsp;TO&nbsp;ZOOM
            </div>
            <div className="absolute bottom-3 right-3 fsrs-label text-red-500 bg-black/60 border border-red-500/40 px-2 py-1">
                FSRS&nbsp;DEMO&nbsp;VIEWER&nbsp;v0.9.0
            </div>
        </div>
    );
}
