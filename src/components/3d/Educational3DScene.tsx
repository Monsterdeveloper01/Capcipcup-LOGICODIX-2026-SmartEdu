"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Float, Stars } from "@react-three/drei";
import * as THREE from "three";

export type ModelType = "atom" | "planet" | "geometry";

interface SceneProps {
  modelType: ModelType;
  autoRotate?: boolean;
  wireframe?: boolean;
}

// 1. Model Atom & Orbit Elektron (Kimia/Fisika)
function AtomModel({ wireframe = false }: { wireframe?: boolean }) {
  const electron1Ref = useRef<THREE.Group>(null);
  const electron2Ref = useRef<THREE.Group>(null);
  const electron3Ref = useRef<THREE.Group>(null);
  const nucleusRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (electron1Ref.current) electron1Ref.current.rotation.z += delta * 2.5;
    if (electron2Ref.current) electron2Ref.current.rotation.x += delta * 2;
    if (electron3Ref.current) electron3Ref.current.rotation.y += delta * 1.8;
    if (nucleusRef.current) nucleusRef.current.rotation.y += delta * 0.5;
  });

  return (
    <group>
      {/* Inti Atom (Proton & Neutron) */}
      <group ref={nucleusRef}>
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#b91c1c"
            emissiveIntensity={0.6}
            roughness={0.2}
            wireframe={wireframe}
          />
        </mesh>
        <mesh position={[0.2, 0.2, 0.1]}>
          <sphereGeometry args={[0.35, 24, 24]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.3} wireframe={wireframe} />
        </mesh>
        <mesh position={[-0.2, -0.15, -0.1]}>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial color="#6366f1" roughness={0.3} wireframe={wireframe} />
        </mesh>
      </group>

      {/* Cincin Orbit 1 & Elektron */}
      <group ref={electron1Ref} rotation={[0, 0, Math.PI / 4]}>
        <mesh>
          <torusGeometry args={[1.8, 0.02, 16, 100]} />
          <meshBasicMaterial color="#60a5fa" transparent opacity={0.6} />
        </mesh>
        <mesh position={[1.8, 0, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Cincin Orbit 2 & Elektron */}
      <group ref={electron2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[2.1, 0.02, 16, 100]} />
          <meshBasicMaterial color="#a78bfa" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#10b981" emissive="#059669" emissiveIntensity={1} />
        </mesh>
      </group>

      {/* Cincin Orbit 3 & Elektron */}
      <group ref={electron3Ref} rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[1.95, 0.02, 16, 100]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0.6} />
        </mesh>
        <mesh position={[0, 0, 1.95]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial color="#ec4899" emissive="#db2777" emissiveIntensity={1} />
        </mesh>
      </group>
    </group>
  );
}

// 2. Model Planet & Atmosfer (Geografi/Astronomi)
function PlanetModel({ wireframe = false }: { wireframe?: boolean }) {
  const planetRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.4;
    if (ringRef.current) ringRef.current.rotation.z -= delta * 0.2;
  });

  return (
    <group>
      {/* Planet Sphere */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1.2, 48, 48]} />
        <meshStandardMaterial
          color="#2563eb"
          roughness={0.4}
          metalness={0.1}
          wireframe={wireframe}
        />
      </mesh>

      {/* Cincin Planet (Ring) */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.8, 0, 0]}>
        <ringGeometry args={[1.6, 2.4, 64]} />
        <meshStandardMaterial
          color="#f59e0b"
          side={THREE.DoubleSide}
          transparent
          opacity={0.75}
          roughness={0.5}
          wireframe={wireframe}
        />
      </mesh>

      {/* Atmosfer Glow */}
      <mesh>
        <sphereGeometry args={[1.28, 32, 32]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.15} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

// 3. Model Geometri Matematika (Icosahedron & Wireframe)
function GeometryModel({ wireframe = false }: { wireframe?: boolean }) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.5;
      meshRef.current.rotation.y += delta * 0.7;
    }
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshStandardMaterial
          color="#8b5cf6"
          roughness={0.2}
          metalness={0.4}
          wireframe={wireframe}
        />
      </mesh>
      {/* Outer Wireframe Cage */}
      <mesh scale={1.05}>
        <icosahedronGeometry args={[1.3, 0]} />
        <meshBasicMaterial color="#ec4899" wireframe />
      </mesh>
    </group>
  );
}

export default function Educational3DScene({
  modelType,
  autoRotate = true,
  wireframe = false,
}: SceneProps) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 4.8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        {/* Pencahayaan Studio */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} />
        <pointLight position={[-5, -5, -5]} color="#6366f1" intensity={0.8} />

        {/* Orbit Controls (Puter & Zoom) */}
        <OrbitControls
          enableZoom={true}
          autoRotate={autoRotate}
          autoRotateSpeed={1.5}
          maxDistance={8}
          minDistance={2}
        />

        {/* Floating Animation Wrapper */}
        <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
          {modelType === "atom" && <AtomModel wireframe={wireframe} />}
          {modelType === "planet" && <PlanetModel wireframe={wireframe} />}
          {modelType === "geometry" && <GeometryModel wireframe={wireframe} />}
        </Float>

        {/* Starfield Background */}
        <Stars radius={50} depth={30} count={600} factor={4} fade speed={1} />
      </Canvas>
    </div>
  );
}
