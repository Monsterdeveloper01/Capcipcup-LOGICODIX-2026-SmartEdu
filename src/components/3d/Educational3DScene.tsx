"use client";

import { useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { HandTransform } from "@/components/camera/HandGestureTracker";

export type BlockShape = "cube" | "rectangle" | "cylinder" | "pyramid";

export interface SandboxBlock {
  id: string;
  shape: BlockShape;
  position: [number, number, number];
  size: [number, number, number]; // [w, h, d]
  color: string;
  label: string;
  isGrabbed?: boolean;
}

interface SandboxSceneProps {
  handTransform?: HandTransform;
  wireframe?: boolean;
  onBlockCountChange?: (count: number) => void;
  sandboxCommand?: { type: "add" | "reset" | "stack"; shape?: BlockShape } | null;
}

// Initial educational building blocks
const INITIAL_BLOCKS: SandboxBlock[] = [
  { id: "b1", shape: "cube", position: [-1.8, 0.4, 0], size: [0.8, 0.8, 0.8], color: "#ef4444", label: "A" },
  { id: "b2", shape: "cube", position: [-0.6, 0.4, 0], size: [0.8, 0.8, 0.8], color: "#3b82f6", label: "B" },
  { id: "b3", shape: "cube", position: [0.6, 0.4, 0], size: [0.8, 0.8, 0.8], color: "#10b981", label: "C" },
  { id: "b4", shape: "rectangle", position: [1.8, 0.3, 0], size: [1.4, 0.6, 0.8], color: "#f59e0b", label: "123" },
  { id: "b5", shape: "cylinder", position: [0, 0.5, -1.5], size: [0.8, 1.0, 0.8], color: "#8b5cf6", label: "★" },
  { id: "b6", shape: "pyramid", position: [-1.2, 0.5, -1.5], size: [0.9, 0.9, 0.9], color: "#ec4899", label: "▲" },
];

export default function Educational3DScene({
  handTransform,
  wireframe = false,
  onBlockCountChange,
  sandboxCommand,
}: SandboxSceneProps) {
  const [blocks, setBlocks] = useState<SandboxBlock[]>(INITIAL_BLOCKS);
  const grabbedBlockIdRef = useRef<string | null>(null);

  // Synchronize block count
  useEffect(() => {
    onBlockCountChange?.(blocks.length);
  }, [blocks.length, onBlockCountChange]);

  // Handle external sandbox commands (add block, reset, stack tower)
  useEffect(() => {
    if (!sandboxCommand) return;

    if (sandboxCommand.type === "reset") {
      grabbedBlockIdRef.current = null;
      setBlocks(INITIAL_BLOCKS);
    } else if (sandboxCommand.type === "add") {
      const shape = sandboxCommand.shape || "cube";
      const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#06b6d4"];
      const labels = ["1", "2", "3", "4", "5", "★", "▲", "◆", "XYZ"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomLabel = labels[Math.floor(Math.random() * labels.length)];
      const randomX = (Math.random() - 0.5) * 3;
      const randomZ = (Math.random() - 0.5) * 2;

      const newBlock: SandboxBlock = {
        id: `block_${Date.now()}`,
        shape,
        position: [randomX, 2.5, randomZ], // Muncul dari atas lalu jatuh ke meja/tumpukan
        size: shape === "rectangle" ? [1.4, 0.6, 0.8] : [0.8, 0.8, 0.8],
        color: randomColor,
        label: randomLabel,
      };

      setBlocks((prev) => [...prev, newBlock]);
    } else if (sandboxCommand.type === "stack") {
      // Susun otomatis menjadi menara bertingkat
      setBlocks((prev) => {
        let currentY = 0;
        return prev.map((b, idx) => {
          const h = b.size[1];
          const posY = currentY + h / 2;
          currentY += h;
          return {
            ...b,
            position: [0, posY, 0],
          };
        });
      });
    }
  }, [sandboxCommand]);

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [0, 4, 6.5], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[5, 10, 6]} intensity={1.6} castShadow />
        <pointLight position={[-6, 4, -4]} color="#818cf8" intensity={0.8} />

        {/* Orbit Controls (Aktif saat tidak sedang memegang balok dengan tangan) */}
        <OrbitControls
          enableZoom={!grabbedBlockIdRef.current}
          enableRotate={!grabbedBlockIdRef.current && !handTransform?.handDetected}
          maxPolarAngle={Math.PI / 2 - 0.05} // Tidak bisa tembus ke bawah meja
          minDistance={2.5}
          maxDistance={12}
        />

        {/* Meja / Grid Platform Sandbox */}
        <SandboxTable />

        {/* Kumpulan Objek Balok Interaktif */}
        <SandboxSimulation
          blocks={blocks}
          setBlocks={setBlocks}
          handTransform={handTransform}
          grabbedBlockIdRef={grabbedBlockIdRef}
          wireframe={wireframe}
        />
      </Canvas>
    </div>
  );
}

// Komponen Platform Meja Belajar (Grid & Boundary)
function SandboxTable() {
  return (
    <group position={[0, 0, 0]}>
      {/* Lantai Meja Kayu/Matte */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[8, 0.1, 6]} />
        <meshStandardMaterial color="#1e1e24" roughness={0.6} metalness={0.2} />
      </mesh>

      {/* Grid Garis Panduan */}
      <gridHelper args={[8, 16, "#6366f1", "#312e81"]} position={[0, 0.005, 0]} />

      {/* Bingkai Neon Pembatas Meja */}
      <mesh position={[0, 0.05, -3]}>
        <boxGeometry args={[8, 0.1, 0.05]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.05, 3]}>
        <boxGeometry args={[8, 0.1, 0.05]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-4, 0.05, 0]}>
        <boxGeometry args={[0.05, 0.1, 6]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[4, 0.05, 0]}>
        <boxGeometry args={[0.05, 0.1, 6]} />
        <meshStandardMaterial color="#6366f1" emissive="#4f46e5" emissiveIntensity={0.6} />
      </mesh>
    </group>
  );
}

// Simulasi Fisika: Memegang, Memindahkan, dan Menumpuk Balok
function SandboxSimulation({
  blocks,
  setBlocks,
  handTransform,
  grabbedBlockIdRef,
  wireframe,
}: {
  blocks: SandboxBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<SandboxBlock[]>>;
  handTransform?: HandTransform;
  grabbedBlockIdRef: React.MutableRefObject<string | null>;
  wireframe: boolean;
}) {
  const handSphereRef = useRef<THREE.Mesh>(null);
  const blocksRef = useRef<SandboxBlock[]>(blocks);
  blocksRef.current = blocks;

  // Track pointer hover/grab for mouse fallback
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Main Physics & Hand Interaction Loop (60 FPS)
  useFrame((_, delta) => {
    const isHandActive = Boolean(handTransform && handTransform.handDetected);
    const handPos = handTransform?.handPosition3D;
    const isGrabbing = Boolean(handTransform?.isGrabbing);

    // Update Virtual Hand Indicator
    if (handSphereRef.current) {
      if (isHandActive && handPos) {
        handSphereRef.current.visible = true;
        handSphereRef.current.position.set(handPos.x, handPos.y, handPos.z);
        // Animate pulse when grabbing
        const s = isGrabbing ? 0.28 : 0.2;
        handSphereRef.current.scale.lerp(new THREE.Vector3(s, s, s), 0.2);
      } else {
        handSphereRef.current.visible = false;
      }
    }

    // ==========================================
    // LOGIKA MEMEGANG & MENUMPUK BALOK DENGAN TANGAN
    // ==========================================
    if (isHandActive && handPos) {
      if (isGrabbing) {
        // Jika belum ada balok yang dipegang, cari balok terdekat dengan tangan
        if (!grabbedBlockIdRef.current) {
          let closestId: string | null = null;
          let minDist = 1.6; // Radius jangkauan tangan meraih balok

          blocksRef.current.forEach((block) => {
            const dist = Math.hypot(
              block.position[0] - handPos.x,
              block.position[1] - handPos.y,
              block.position[2] - handPos.z
            );
            if (dist < minDist) {
              minDist = dist;
              closestId = block.id;
            }
          });

          if (closestId) {
            grabbedBlockIdRef.current = closestId;
          }
        }
      } else {
        // Tangan membuka (lepas cubitan / lepas kepalan) -> Lepaskan balok
        if (grabbedBlockIdRef.current) {
          grabbedBlockIdRef.current = null;
        }
      }
    }

    // Update posisi semua balok (Gravitasi & Stacking)
    setBlocks((prev) => {
      let hasMovement = false;

      const updated = prev.map((block) => {
        const isGrabbed = block.id === grabbedBlockIdRef.current;

        if (isGrabbed && handPos) {
          // Balok yang sedang dipegang bergerak mengikuti tangan secara presisi
          const newX = THREE.MathUtils.lerp(block.position[0], handPos.x, Math.min(delta * 20, 1));
          const newY = THREE.MathUtils.lerp(block.position[1], Math.max(handPos.y, block.size[1] / 2), Math.min(delta * 20, 1));
          const newZ = THREE.MathUtils.lerp(block.position[2], handPos.z, Math.min(delta * 20, 1));

          if (
            Math.abs(newX - block.position[0]) > 0.001 ||
            Math.abs(newY - block.position[1]) > 0.001 ||
            Math.abs(newZ - block.position[2]) > 0.001 ||
            !block.isGrabbed
          ) {
            hasMovement = true;
          }

          return {
            ...block,
            position: [newX, newY, newZ] as [number, number, number],
            isGrabbed: true,
          };
        } else {
          // ==========================================
          // KALKULASI MENUMPUK (STACKING PHYSICS)
          // ==========================================
          // Cari balok lain yang berada tepat di bawah balok ini
          let supportY = block.size[1] / 2; // Posisi dasar meja

          prev.forEach((other) => {
            if (other.id !== block.id) {
              const dx = Math.abs(block.position[0] - other.position[0]);
              const dz = Math.abs(block.position[2] - other.position[2]);
              const overlapX = (block.size[0] + other.size[0]) / 2.2;
              const overlapZ = (block.size[2] + other.size[2]) / 2.2;

              // Jika berada di atas balok lain dalam batas toleransi horizontal
              if (dx < overlapX && dz < overlapZ && other.position[1] < block.position[1]) {
                const surfaceY = other.position[1] + other.size[1] / 2 + block.size[1] / 2;
                if (surfaceY > supportY && surfaceY <= block.position[1] + 0.6) {
                  supportY = surfaceY;
                }
              }
            }
          });

          // Gravitasi: balok turun ke alas / tumpukan di bawahnya
          let currentY = block.position[1];
          if (currentY > supportY + 0.005) {
            currentY = THREE.MathUtils.lerp(currentY, supportY, Math.min(delta * 12, 1));
            hasMovement = true;
          } else if (currentY !== supportY) {
            currentY = supportY;
            hasMovement = true;
          }

          if (block.isGrabbed) {
            hasMovement = true;
          }

          return {
            ...block,
            position: [block.position[0], currentY, block.position[2]] as [number, number, number],
            isGrabbed: false,
          };
        }
      });

      // Optimasi performa: Jika tidak ada pergerakan, skip re-render
      return hasMovement ? updated : prev;
    });
  });

  return (
    <group>
      {/* Bola Hologram Indikator Posisi Tangan Pengguna di Dunia 3D */}
      <mesh ref={handSphereRef} visible={false}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial
          color={handTransform?.isGrabbing ? "#f59e0b" : "#38bdf8"}
          emissive={handTransform?.isGrabbing ? "#f59e0b" : "#0284c7"}
          emissiveIntensity={1.2}
          transparent
          opacity={0.8}
          wireframe
        />
      </mesh>

      {/* Render Setiap Balok */}
      {blocks.map((block) => (
        <BlockMesh
          key={block.id}
          block={block}
          wireframe={wireframe}
          isHovered={hoveredId === block.id}
          onPointerOver={() => setHoveredId(block.id)}
          onPointerOut={() => setHoveredId(null)}
          onPointerDown={() => {
            // Mouse click-drag support
            grabbedBlockIdRef.current = block.id;
          }}
          onPointerUp={() => {
            if (grabbedBlockIdRef.current === block.id) {
              grabbedBlockIdRef.current = null;
            }
          }}
        />
      ))}
    </group>
  );
}

// Render Komponen Mesh Balok Individual
function BlockMesh({
  block,
  wireframe,
  isHovered,
  onPointerOver,
  onPointerOut,
  onPointerDown,
  onPointerUp,
}: {
  block: SandboxBlock;
  wireframe: boolean;
  isHovered: boolean;
  onPointerOver: () => void;
  onPointerOut: () => void;
  onPointerDown: () => void;
  onPointerUp: () => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const { shape, position, size, color, label, isGrabbed } = block;

  return (
    <group
      ref={meshRef}
      position={position}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {/* 1. Bentuk Balok Kubus */}
      {shape === "cube" && (
        <RoundedBox args={size} radius={0.06} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial
            color={color}
            roughness={0.3}
            metalness={0.1}
            wireframe={wireframe}
            emissive={isGrabbed ? "#f59e0b" : isHovered ? "#6366f1" : "#000000"}
            emissiveIntensity={isGrabbed ? 0.6 : isHovered ? 0.3 : 0}
          />
        </RoundedBox>
      )}

      {/* 2. Bentuk Balok Persegi Panjang */}
      {shape === "rectangle" && (
        <RoundedBox args={size} radius={0.06} smoothness={4} castShadow receiveShadow>
          <meshStandardMaterial
            color={color}
            roughness={0.3}
            metalness={0.1}
            wireframe={wireframe}
            emissive={isGrabbed ? "#f59e0b" : isHovered ? "#6366f1" : "#000000"}
            emissiveIntensity={isGrabbed ? 0.6 : isHovered ? 0.3 : 0}
          />
        </RoundedBox>
      )}

      {/* 3. Bentuk Silinder */}
      {shape === "cylinder" && (
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 32]} />
          <meshStandardMaterial
            color={color}
            roughness={0.3}
            metalness={0.1}
            wireframe={wireframe}
            emissive={isGrabbed ? "#f59e0b" : isHovered ? "#6366f1" : "#000000"}
            emissiveIntensity={isGrabbed ? 0.6 : isHovered ? 0.3 : 0}
          />
        </mesh>
      )}

      {/* 4. Bentuk Piramida / Atap */}
      {shape === "pyramid" && (
        <mesh castShadow receiveShadow>
          <coneGeometry args={[size[0] / 1.4, size[1], 4]} />
          <meshStandardMaterial
            color={color}
            roughness={0.3}
            metalness={0.1}
            wireframe={wireframe}
            emissive={isGrabbed ? "#f59e0b" : isHovered ? "#6366f1" : "#000000"}
            emissiveIntensity={isGrabbed ? 0.6 : isHovered ? 0.3 : 0}
          />
        </mesh>
      )}

      {/* Label Huruf / Angka Edukasi di Atas Balok */}
      {label && (
        <Text
          position={[0, 0, size[2] / 2 + 0.02]}
          fontSize={size[1] * 0.45}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}

      {/* Efek Garis Outline saat Dipegang */}
      {isGrabbed && (
        <mesh scale={1.08}>
          <boxGeometry args={size} />
          <meshBasicMaterial color="#f59e0b" wireframe transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}
