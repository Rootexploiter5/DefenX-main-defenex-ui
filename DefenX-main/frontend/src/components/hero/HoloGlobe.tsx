import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/** Decorative scene geometry only: nodes/arcs are visual, NOT telemetry. */
function fibonacciSphere(n: number, r: number) {
  const pts: THREE.Vector3[] = [];
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = ga * i;
    pts.push(new THREE.Vector3(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r));
  }
  return pts;
}

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function Globe({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null!);
  const rings = useRef<THREE.Group>(null!);
  const R = 2.0;

  const { nodePos, nodeColors, arcs } = useMemo(() => {
    const rnd = seeded(7);
    const pts = fibonacciSphere(240, R * 1.005);
    const colors = new Float32Array(pts.length * 3);
    const gold = new THREE.Color("#FFD98F"), red = new THREE.Color("#FF3350");
    pts.forEach((_, i) => { const c = rnd() > 0.55 ? red : gold; colors.set([c.r, c.g, c.b], i * 3); });
    const pos = new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]));
    const lines: THREE.Line[] = [];
    for (let i = 0; i < 26; i++) {
      const a = pts[Math.floor(rnd() * pts.length)], b = pts[Math.floor(rnd() * pts.length)];
      if (a.distanceTo(b) < 1.2) continue;
      const mid = a.clone().add(b).multiplyScalar(0.5).normalize().multiplyScalar(R * (1.25 + rnd() * 0.25));
      const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
      const geo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(32));
      lines.push(new THREE.Line(geo, new THREE.LineBasicMaterial({
        color: rnd() > 0.5 ? "#FF4D63" : "#FFD98F", transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending,
      })));
    }
    return { nodePos: pos, nodeColors: colors, arcs: lines };
  }, []);

  const dust = useMemo(() => {
    const rnd = seeded(21);
    return new Float32Array(Array.from({ length: 260 * 3 }, (_, i) => (rnd() - 0.5) * (i % 3 === 1 ? 7 : 11)));
  }, []);

  useFrame((_, dt) => {
    if (!animate) return;
    group.current.rotation.y += dt * 0.07;
    rings.current.rotation.z += dt * 0.05;
  });

  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[R, 64, 64]} />
          <meshPhysicalMaterial color="#4a0d22" transparent opacity={0.72} roughness={0.25} metalness={0.2}
            clearcoat={1} emissive="#3a0715" emissiveIntensity={0.7} />
        </mesh>
        <mesh>
          <sphereGeometry args={[R * 1.002, 36, 24]} />
          <meshBasicMaterial color="#D9AD62" wireframe transparent opacity={0.16} />
        </mesh>
        <points>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[nodePos, 3]} />
            <bufferAttribute attach="attributes-color" args={[nodeColors, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.07} vertexColors transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} sizeAttenuation />
        </points>
        {arcs.map((l, i) => <primitive key={i} object={l} />)}
      </group>

      {/* atmosphere */}
      <mesh scale={1.12}>
        <sphereGeometry args={[R, 48, 48]} />
        <shaderMaterial transparent side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false}
          vertexShader={`varying vec3 n; void main(){ n = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
          fragmentShader={`varying vec3 n; void main(){ float i = pow(0.72 - dot(n, vec3(0,0,1.0)), 3.0); gl_FragColor = vec4(1.0,0.36,0.30,1.0)*i*1.3; }`} />
      </mesh>

      {/* orbit rings */}
      <group ref={rings} rotation={[1.15, 0.2, 0.15]}>
        {[2.55, 2.8, 3.1].map((r, i) => (
          <mesh key={r} rotation={[0, 0, i]}>
            <torusGeometry args={[r, i === 1 ? 0.012 : 0.007, 8, 180]} />
            <meshBasicMaterial color={i === 1 ? "#FFE2A0" : "#FF5468"} transparent opacity={i === 1 ? 0.95 : 0.7} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>

      <points position={[0, 0.4, 0]}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[dust, 3]} /></bufferGeometry>
        <pointsMaterial size={0.035} color="#FFE2A0" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </>
  );
}

function Platform() {
  const layers: [number, number, string, string, number][] = [
    // radius, height, color, emissive, y
    [5.6, 0.14, "#5a0e27", "#2a0510", 0],
    [5.0, 0.1, "#D9AD62", "#98662D", 0.12],
    [4.5, 0.12, "#7a1a3a", "#3a0715", 0.22],
    [3.7, 0.08, "#FFE2A0", "#B98746", 0.32],
    [3.2, 0.14, "#3A0715", "#1a050b", 0.4],
    [2.3, 0.08, "#D9233D", "#D9233D", 0.5],
    [1.8, 0.1, "#19060B", "#19060B", 0.55],
  ];
  return (
    <group position={[0, -2.55, 0]} scale={0.72}>
      {layers.map(([r, h, c, e, y], i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[r, r * 1.02, h, 96]} />
          <meshStandardMaterial color={c} emissive={e} emissiveIntensity={i === 5 ? 1.6 : 0.5} metalness={0.85} roughness={0.28} />
        </mesh>
      ))}
      <mesh position={[0, 0.62, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.9, 2.2, 96]} />
        <meshBasicMaterial color="#FF3350" transparent opacity={0.8} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

export default function HoloGlobe({ animate }: { animate: boolean }) {
  return (
    <Canvas frameloop={animate ? "always" : "demand"} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 3.2, 11.2], fov: 30 }}
      onCreated={({ camera }) => camera.lookAt(0, -0.35, 0)}
      aria-hidden style={{ position: "absolute", inset: 0 }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[0, 6, 6]} intensity={90} color="#FFE2A0" />
      <pointLight position={[-6, -1, 4]} intensity={60} color="#D9233D" />
      <pointLight position={[6, 1, 4]} intensity={40} color="#FFB36B" />
      <group position={[0.2, 0.55, 0]}><Globe animate={animate} /></group>
      <Platform />
    </Canvas>
  );
}
