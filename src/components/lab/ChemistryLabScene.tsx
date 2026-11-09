"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Float } from "@react-three/drei";
import * as THREE from "three";
import { HandTransform } from "@/components/camera/HandGestureTracker";

export type VesselType = "beaker" | "flask" | "test_tube";

export interface ChemicalVessel {
  id: string;
  name: string;
  formula: string;
  type: VesselType;
  color: string;
  initialColor: string;
  position: [number, number, number];
  level: "SD" | "SMP" | "SMA";
  liquidLevel: number; // 0.1 to 0.95
  isReacted?: boolean;
  reactionNote?: string;
  temperatureC?: number;
}

export interface ReactionDetail {
  id: string;
  title: string;
  equation: string;
  substanceA: string;
  substanceB: string;
  resultName: string;
  resultFormula: string;
  resultColor: string;
  effectType: "bubbles" | "steam" | "spark" | "precipitate" | "color_change";
  temperatureChange: number; // + or -
  explanation: string;
  level: "SD" | "SMP" | "SMA";
  reactionPosition?: [number, number, number];
}

// Dynamic reactions loaded from MySQL database / API
export const BUILTIN_REACTIONS: ReactionDetail[] = [];

export const INITIAL_VESSELS: ChemicalVessel[] = [
  {
    id: "v_hcl",
    name: "Asam Klorida (HCl)",
    formula: "HCl",
    type: "beaker",
    color: "#e0f2fe", // Bening transparan jernih khas larutan asam klorida
    initialColor: "#e0f2fe",
    position: [-1.8, 0.5, 0],
    level: "SMP",
    liquidLevel: 0.65,
    temperatureC: 25,
  },
  {
    id: "v_naoh",
    name: "Natrium Hidroksida (NaOH)",
    formula: "NaOH",
    type: "beaker",
    color: "#f8fafc", // Bening transparan jernih khas basa kuat
    initialColor: "#f8fafc",
    position: [-0.6, 0.5, 0],
    level: "SMP",
    liquidLevel: 0.65,
    temperatureC: 25,
  },
  {
    id: "v_cuso4",
    name: "Tembaga Sulfat (CuSO4)",
    formula: "CuSO4",
    type: "flask",
    color: "#0284c7", // Larutan biru safir transparan
    initialColor: "#0284c7",
    position: [0.6, 0.5, 0],
    level: "SMP",
    liquidLevel: 0.7,
    temperatureC: 24,
  },
  {
    id: "v_cuka",
    name: "Cuka Dapur (CH3COOH)",
    formula: "CH3COOH",
    type: "flask",
    color: "#fef9c3", // Bening kekuningan pucat khas cuka asam asetat
    initialColor: "#fef9c3",
    position: [1.8, 0.5, 0],
    level: "SD",
    liquidLevel: 0.75,
    temperatureC: 25,
  },
  {
    id: "v_baking",
    name: "Baking Soda (NaHCO3)",
    formula: "NaHCO3",
    type: "test_tube",
    color: "#f1f5f9", // Putih suspensi halus tembus pandang
    initialColor: "#f1f5f9",
    position: [-1.2, 0.6, -1.5],
    level: "SD",
    liquidLevel: 0.55,
    temperatureC: 25,
  },
  {
    id: "v_ki",
    name: "Kalium Iodida (KI)",
    formula: "KI",
    type: "test_tube",
    color: "#f8fafc", // Larutan bening jernih tanpa warna
    initialColor: "#f8fafc",
    position: [0, 0.6, -1.5],
    level: "SMA",
    liquidLevel: 0.6,
    temperatureC: 25,
  },
  {
    id: "v_pb",
    name: "Timbal Nitrat (Pb(NO3)2)",
    formula: "Pb(NO3)2",
    type: "test_tube",
    color: "#f8fafc", // Larutan bening jernih (menghasilkan Hujan Emas jika bertemu KI!)
    initialColor: "#f8fafc",
    position: [1.2, 0.6, -1.5],
    level: "SMA",
    liquidLevel: 0.6,
    temperatureC: 25,
  },
];

interface ChemistryLabSceneProps {
  handTransform?: HandTransform;
  onReactionDetected?: (reaction: ReactionDetail, vesselA: ChemicalVessel, vesselB: ChemicalVessel) => void;
  vessels: ChemicalVessel[];
  setVessels: React.Dispatch<React.SetStateAction<ChemicalVessel[]>>;
  activeReaction: ReactionDetail | null;
  reactions?: ReactionDetail[];
}

export default function ChemistryLabScene({
  handTransform,
  onReactionDetected,
  vessels,
  setVessels,
  activeReaction,
  reactions,
}: ChemistryLabSceneProps) {
  const grabbedIdRef = useRef<string | null>(null);

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [0, 3.8, 6.2], fov: 46 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        shadows
      >
        {/* Laboratory Illumination */}
        <ambientLight intensity={0.9} />
        <directionalLight position={[6, 12, 8]} intensity={1.8} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-5, 4, -3]} color="#60a5fa" intensity={1.2} />
        <pointLight position={[5, 4, -3]} color="#f472b6" intensity={0.9} />
        <pointLight position={[0, 6, 2]} color="#ffffff" intensity={1.5} />

        {/* Orbit Controls (Disabled when manipulating an object with hand or mouse) */}
        <OrbitControls
          enableZoom={!grabbedIdRef.current}
          enableRotate={!grabbedIdRef.current && !handTransform?.handDetected}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={2.5}
          maxDistance={12}
        />

        {/* Laboratory Workbench & Table Grid */}
        <LabWorkbench />

        {/* Interactive Chemical Vessels Simulation */}
        <VesselsSimulation
          vessels={vessels}
          setVessels={setVessels}
          handTransform={handTransform}
          grabbedIdRef={grabbedIdRef}
          onReactionDetected={onReactionDetected}
          activeReaction={activeReaction}
          reactions={reactions}
        />
      </Canvas>
    </div>
  );
}

// Laboratory Table Surface with Measurement Marks
function LabWorkbench() {
  return (
    <group position={[0, 0, 0]}>
      {/* Matte Black Granite Countertop */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[9, 0.12, 6.5]} />
        <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Laboratory Grid Coordinate Guide */}
      <gridHelper args={[9, 18, "#38bdf8", "#1e293b"]} position={[0, 0.002, 0]} />

      {/* Workbench Cyber Edge Strips */}
      <mesh position={[0, 0.02, -3.25]}>
        <boxGeometry args={[9, 0.05, 0.04]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.02, 3.25]}>
        <boxGeometry args={[9, 0.05, 0.04]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[-4.5, 0.02, 0]}>
        <boxGeometry args={[0.04, 0.05, 6.5]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[4.5, 0.02, 0]}>
        <boxGeometry args={[0.04, 0.05, 6.5]} />
        <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.8} />
      </mesh>

      {/* Safety Splash Mat Area in Center */}
      <mesh position={[0, 0.005, 0]} receiveShadow>
        <planeGeometry args={[6.5, 3.8]} />
        <meshStandardMaterial color="#1e293b" roughness={0.8} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

// Physics & Interaction Engine for 3D Chemical Vessels
function VesselsSimulation({
  vessels,
  setVessels,
  handTransform,
  grabbedIdRef,
  onReactionDetected,
  activeReaction,
  reactions: initialReactions,
}: {
  vessels: ChemicalVessel[];
  setVessels: React.Dispatch<React.SetStateAction<ChemicalVessel[]>>;
  handTransform?: HandTransform;
  grabbedIdRef: React.MutableRefObject<string | null>;
  onReactionDetected?: (reaction: ReactionDetail, vesselA: ChemicalVessel, vesselB: ChemicalVessel) => void;
  activeReaction: ReactionDetail | null;
  reactions?: ReactionDetail[];
}) {
  const handSphereRef = useRef<THREE.Mesh>(null);
  const vesselsRef = useRef<ChemicalVessel[]>(vessels);
  vesselsRef.current = vessels;

  const [dbReactions, setDbReactions] = useState<ReactionDetail[]>(initialReactions || []);

  useEffect(() => {
    if (initialReactions && initialReactions.length > 0) {
      setDbReactions(initialReactions);
    }
  }, [initialReactions]);

  useEffect(() => {
    fetch("/api/lab/reactions")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.reactions) && data.reactions.length > 0) {
          setDbReactions(data.reactions);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch chemical reactions from database:", err);
      });
  }, []);

  const [targetedId, setTargetedId] = useState<string | null>(null);
  const [pouringTargetId, setPouringTargetId] = useState<string | null>(null);

  // Mouse Drag Fallback State
  const [mouseDraggedId, setMouseDraggedId] = useState<string | null>(null);

  // Cooldown to avoid multi-triggering the same reaction
  const reactionCooldownRef = useRef<{ [pairKey: string]: number }>({});
  const isSimulatingAiRef = useRef<boolean>(false);

  // 60 FPS Animation & Proximity Loop
  useFrame((state, delta) => {
    const isHandActive = Boolean(handTransform && handTransform.handDetected);
    const handPos = handTransform?.handPosition3D;
    const isGrabbing = Boolean(handTransform?.isGrabbing);
    const wristAngle = handTransform?.wristAngle || 0;

    // 1. Calculate Exact Effective 3D Hand Position from Screen Center (Raycasting onto workbench plane)
    let effectiveHandPos: THREE.Vector3 | null = null;
    if (isHandActive && handTransform?.handScreenPos) {
      const ndcX = handTransform.handScreenPos.x * 2 - 1;
      const ndcY = 1 - handTransform.handScreenPos.y * 2;
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), state.camera);
      const targetPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.75);
      const intersect = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(targetPlane, intersect)) {
        intersect.x = THREE.MathUtils.clamp(intersect.x, -4.5, 4.5);
        intersect.z = THREE.MathUtils.clamp(intersect.z, -3.0, 3.0);
        effectiveHandPos = intersect;
      }
    } else if (isHandActive && handPos) {
      effectiveHandPos = new THREE.Vector3(handPos.x, handPos.y, handPos.z);
    }

    // 2. Update 3D Hand Cursor (Locked directly to palm center)
    if (handSphereRef.current) {
      if (isHandActive && effectiveHandPos) {
        handSphereRef.current.visible = true;
        handSphereRef.current.position.lerp(effectiveHandPos, 0.45);
        const targetScale = isGrabbing ? 0.22 : 0.16;
        handSphereRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.25);
      } else {
        handSphereRef.current.visible = false;
      }
    }

    // 3. Hand Targeting & Grab Detection
    let closestTargetId: string | null = null;
    if (isHandActive && effectiveHandPos) {
      let minDist = 1.65;
      vesselsRef.current.forEach((v) => {
        const d = Math.hypot(v.position[0] - effectiveHandPos.x, v.position[2] - effectiveHandPos.z);
        if (d < minDist) {
          minDist = d;
          closestTargetId = v.id;
        }
      });

      if (isGrabbing) {
        if (!grabbedIdRef.current && closestTargetId) {
          grabbedIdRef.current = closestTargetId;
        }
      } else {
        if (grabbedIdRef.current) {
          grabbedIdRef.current = null;
          setPouringTargetId(null);
        }
      }
    } else {
      if (!mouseDraggedId && grabbedIdRef.current) {
        grabbedIdRef.current = null;
        setPouringTargetId(null);
      }
    }

    setTargetedId(!isGrabbing ? closestTargetId : null);

    // 4. Position Update & Physical Pouring Proximity
    const activeGrabbedId = mouseDraggedId || grabbedIdRef.current;
    const isPhysicallyTilting = isHandActive
      ? Math.abs(wristAngle) > 0.40 // Rotasi pergelangan tangan melebihi ~23 derajat
      : Boolean(mouseDraggedId);

    if (activeGrabbedId) {
      const activeVessel = vesselsRef.current.find((v) => v.id === activeGrabbedId);
      if (activeVessel) {
        let nearestOtherId: string | null = null;
        let minProximity = 2.1; // Jarak jangkauan untuk menuangkan

        vesselsRef.current.forEach((other) => {
          if (other.id === activeGrabbedId) return;
          const dist = Math.hypot(
            activeVessel.position[0] - other.position[0],
            activeVessel.position[2] - other.position[2]
          );
          if (dist < minProximity) {
            minProximity = dist;
            nearestOtherId = other.id;
          }
        });

        setPouringTargetId(nearestOtherId);

        // HANYA memicu reaksi kimia jika pengguna BENAR-BENAR MEMUTAR / MEMIRINGKAN TANGANNYA!
        if (nearestOtherId && isPhysicallyTilting) {
          const targetVessel = vesselsRef.current.find((v) => v.id === nearestOtherId);
          if (targetVessel) {
            checkAndTriggerReaction(activeVessel, targetVessel);
          }
        }
      }
    } else {
      setPouringTargetId(null);
    }

    // Move grabbed vessel with hand palm center
    if (grabbedIdRef.current && effectiveHandPos) {
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === grabbedIdRef.current) {
            return {
              ...v,
              position: [
                THREE.MathUtils.lerp(v.position[0], effectiveHandPos.x, 0.35),
                THREE.MathUtils.lerp(v.position[1], Math.max(0.7, effectiveHandPos.y + 0.35), 0.35),
                THREE.MathUtils.lerp(v.position[2], effectiveHandPos.z, 0.35),
              ],
            };
          }
          return v;
        })
      );
    }
  });

  // Reaction Matcher (Local Catalog + Real-Time Gemini AI Fallback)
  const checkAndTriggerReaction = async (vesselA: ChemicalVessel, vesselB: ChemicalVessel) => {
    const pairKey = [vesselA.formula, vesselB.formula].sort().join("+");
    const now = Date.now();

    // Prevent re-triggering within 3 seconds
    if (reactionCooldownRef.current[pairKey] && now - reactionCooldownRef.current[pairKey] < 3000) {
      return;
    }

    // Target vessel position for localized particles
    const rxPos: [number, number, number] = [
      vesselB.position[0],
      vesselB.position[1] + 0.6,
      vesselB.position[2],
    ];

    // Step 1: Match in dynamic database reactions
    const matched = dbReactions.find(
      (rx) =>
        (rx.substanceA === vesselA.formula && rx.substanceB === vesselB.formula) ||
        (rx.substanceA === vesselB.formula && rx.substanceB === vesselA.formula)
    );

    if (matched) {
      reactionCooldownRef.current[pairKey] = now;

      // Transform target vessel B's appearance (color, volume, note)
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === vesselB.id) {
            return {
              ...v,
              color: matched.resultColor,
              name: matched.resultName,
              formula: matched.resultFormula,
              liquidLevel: Math.min(0.95, v.liquidLevel + 0.2),
              temperatureC: (v.temperatureC || 25) + matched.temperatureChange,
              isReacted: true,
              reactionNote: matched.title,
            };
          }
          return v;
        })
      );

      onReactionDetected?.({ ...matched, reactionPosition: rxPos }, vesselA, vesselB);
      return;
    }

    // Step 2: DYNAMIC AI REACTION PREDICTION (Zero Database Dependency!)
    if (isSimulatingAiRef.current) return;
    isSimulatingAiRef.current = true;
    reactionCooldownRef.current[pairKey] = now;

    try {
      const res = await fetch("/api/lab/simulate-reaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reactantA: { name: vesselA.name, formula: vesselA.formula },
          reactantB: { name: vesselB.name, formula: vesselB.formula },
        }),
      });

      const data = await res.json();
      if (res.ok && data.reaction) {
        const aiRx = data.reaction;

        const dynamicReaction: ReactionDetail = {
          id: `ai_rx_${Date.now()}`,
          title: aiRx.title || `Reaksi ${vesselA.formula} + ${vesselB.formula}`,
          equation: aiRx.equation || `${vesselA.formula} + ${vesselB.formula} → Hasil Reaksi`,
          substanceA: vesselA.formula,
          substanceB: vesselB.formula,
          resultName: aiRx.productName || "Produk Campuran AI",
          resultFormula: aiRx.productFormula || "Hasil Reaksi",
          resultColor: aiRx.productColor || "#06b6d4",
          effectType: aiRx.visualEffect || "bubbles",
          temperatureChange: Number(aiRx.temperatureChangeC) || 0,
          explanation: aiRx.explanation || "Reaksi kimia menghasilkan interaksi molekuler baru.",
          level: aiRx.level || "SMA",
          reactionPosition: rxPos,
        };

        // Cache into local state for future instant lookups
        setDbReactions((prev) => [...prev, dynamicReaction]);

        // Transform target vessel B with AI predicted color and volume
        setVessels((prev) =>
          prev.map((v) => {
            if (v.id === vesselB.id) {
              return {
                ...v,
                color: dynamicReaction.resultColor,
                name: dynamicReaction.resultName,
                formula: dynamicReaction.resultFormula,
                liquidLevel: Math.min(0.95, v.liquidLevel + 0.2),
                temperatureC: (v.temperatureC || 25) + dynamicReaction.temperatureChange,
                isReacted: true,
                reactionNote: dynamicReaction.title,
              };
            }
            return v;
          })
        );

        onReactionDetected?.(dynamicReaction, vesselA, vesselB);
      }
    } catch (err) {
      console.warn("AI dynamic reaction error:", err);
    } finally {
      isSimulatingAiRef.current = false;
    }
  };

  // Mouse Drag Handlers
  const handlePointerDown = (id: string, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setMouseDraggedId(id);
    grabbedIdRef.current = id;
  };

  const handlePointerUp = () => {
    setMouseDraggedId(null);
    grabbedIdRef.current = null;
    setPouringTargetId(null);
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!mouseDraggedId) return;
    const raycaster = e.ray;
    const target = new THREE.Vector3();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);

    if (raycaster.intersectPlane(plane, target)) {
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === mouseDraggedId) {
            return {
              ...v,
              position: [target.x, 0.75, target.z],
            };
          }
          return v;
        })
      );
    }
  };

  const targetVessel = pouringTargetId ? vessels.find((v) => v.id === pouringTargetId) : null;

  return (
    <group onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {/* 3D Hand Tracking Cursor */}
      <mesh ref={handSphereRef} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={handTransform?.isGrabbing ? "#f59e0b" : "#00f5ff"}
          emissive={handTransform?.isGrabbing ? "#d97706" : "#00f5ff"}
          emissiveIntensity={1.5}
          roughness={0.2}
          transparent
          opacity={0.8}
        />
        <pointLight
          color={handTransform?.isGrabbing ? "#f59e0b" : "#00f5ff"}
          intensity={2}
          distance={3}
        />
      </mesh>

      {/* Render All Chemical Vessels */}
      {vessels.map((vessel) => {
        const isGrabbed = vessel.id === (mouseDraggedId || grabbedIdRef.current);
        const isTargeted = vessel.id === targetedId;
        const isBeingPouredInto = vessel.id === pouringTargetId;

        return (
          <ChemicalVesselItem
            key={vessel.id}
            vessel={vessel}
            isGrabbed={isGrabbed}
            isTargeted={isTargeted}
            isBeingPouredInto={isBeingPouredInto}
            wristAngle={isGrabbed ? handTransform?.wristAngle || 0 : 0}
            isHandActive={Boolean(handTransform && handTransform.handDetected)}
            targetPosition={targetVessel?.position}
            onPointerDown={(e) => handlePointerDown(vessel.id, e)}
          />
        );
      })}

      {/* Particle Effect when Active Reaction Occurs */}
      {activeReaction && (
        <ReactionVisualEffects
          effectType={activeReaction.effectType}
          colorHex={activeReaction.resultColor}
          position={activeReaction.reactionPosition || [0, 1.2, 0]}
        />
      )}
    </group>
  );
}

// Helper to detect clear / water-like chemical solutions
function checkIsClearLiquid(formula?: string, name?: string, color?: string): boolean {
  const f = (formula || "").toUpperCase().trim();
  const n = (name || "").toLowerCase().trim();
  const c = (color || "").toLowerCase().trim();

  // Clear chemicals: Water, dilute acids, bases, salt solutions
  if (["H2O", "HCL", "NAOH", "CH3COOH", "NACL", "KI", "PB(NO3)2"].includes(f)) return true;
  if (
    n.includes("air") ||
    n.includes("klorida") ||
    n.includes("hidroksida") ||
    n.includes("cuka") ||
    n.includes("bening") ||
    n.includes("iodida") ||
    n.includes("timbal") ||
    n.includes("garam")
  ) {
    return true;
  }
  if (
    ["#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#e0f2fe", "#e0f7fa", "#f0fdf4", "#fef9c3"].includes(c)
  ) {
    return true;
  }
  return false;
}

// Micro-bubbles floating gently inside liquids
function InFluidMicroBubbles({
  radius,
  height,
  count = 25,
}: {
  radius: number;
  height: number;
  count?: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * (radius * 0.75);
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = Math.random() * height;
      pos[i * 3 + 2] = r * Math.sin(theta);
    }
    return [pos];
  }, [radius, height, count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += delta * 0.15;
      if (arr[i * 3 + 1] > height) {
        arr[i * 3 + 1] = 0.02;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.035} color="#ffffff" transparent opacity={0.65} />
    </points>
  );
}

// Individual 3D Chemical Vessel with Scientist Glassware & Clear / Saturated Fluids
function ChemicalVesselItem({
  vessel,
  isGrabbed,
  isTargeted,
  isBeingPouredInto,
  wristAngle,
  isHandActive,
  targetPosition,
  onPointerDown,
}: {
  vessel: ChemicalVessel;
  isGrabbed: boolean;
  isTargeted: boolean;
  isBeingPouredInto: boolean;
  wristAngle: number;
  isHandActive: boolean;
  targetPosition?: [number, number, number];
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const meshGroupRef = useRef<THREE.Group>(null);
  const liquidMeshRef = useRef<THREE.Mesh>(null);
  const liquidMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const isClear = checkIsClearLiquid(vessel.formula, vessel.name, vessel.color);

  // Smooth color morphing & physical wrist pouring tilt
  useFrame((_, delta) => {
    if (!meshGroupRef.current) return;

    // 1. Physical Wrist Tilt Rotation
    if (isGrabbed) {
      let targetTilt = 0;
      if (isHandActive) {
        targetTilt = THREE.MathUtils.clamp(-wristAngle * 1.15, -1.35, 1.35);
      } else if (targetPosition) {
        const dx = targetPosition[0] - vessel.position[0];
        targetTilt = dx > 0 ? -0.85 : 0.85;
      }
      meshGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        meshGroupRef.current.rotation.z,
        targetTilt,
        0.25
      );
    } else {
      meshGroupRef.current.rotation.z = THREE.MathUtils.lerp(
        meshGroupRef.current.rotation.z,
        0,
        0.2
      );
    }

    // 2. Dynamic Liquid Color Transition
    if (liquidMaterialRef.current) {
      const targetColor = new THREE.Color(isClear ? "#e0f7fa" : vessel.color);
      liquidMaterialRef.current.color.lerp(targetColor, 0.08);

      if (isBeingPouredInto || vessel.isReacted) {
        liquidMaterialRef.current.emissiveIntensity =
          (isClear ? 0.15 : 0.45) + Math.sin(Date.now() * 0.008) * 0.25;
      } else {
        liquidMaterialRef.current.emissiveIntensity = isClear ? 0.08 : 0.28;
      }
    }

    // 3. Fluid agitation ripple
    if (liquidMeshRef.current) {
      const pulse = isBeingPouredInto ? 1 + Math.sin(Date.now() * 0.012) * 0.025 : 1;
      liquidMeshRef.current.scale.set(pulse, 1, pulse);
    }
  });

  const currentTilt = meshGroupRef.current?.rotation.z || 0;
  const isPouring = isGrabbed && Math.abs(currentTilt) > 0.4;
  const isPouringRight = currentTilt < -0.4;

  return (
    <group
      ref={meshGroupRef}
      position={vessel.position}
      onPointerDown={onPointerDown}
      scale={isGrabbed ? [1.1, 1.1, 1.1] : [1, 1, 1]}
    >
      {/* RENDER DEDICATED SCIENTIST GLASSWARE */}
      {vessel.type === "flask" ? (
        <ErlenmeyerFlaskModel
          vessel={vessel}
          liquidMeshRef={liquidMeshRef}
          liquidMaterialRef={liquidMaterialRef}
          isClear={isClear}
          isBeingPouredInto={isBeingPouredInto}
        />
      ) : vessel.type === "test_tube" ? (
        <TestTubeModel
          vessel={vessel}
          liquidMeshRef={liquidMeshRef}
          liquidMaterialRef={liquidMaterialRef}
          isClear={isClear}
          isBeingPouredInto={isBeingPouredInto}
        />
      ) : (
        <BeakerModel
          vessel={vessel}
          liquidMeshRef={liquidMeshRef}
          liquidMaterialRef={liquidMaterialRef}
          isClear={isClear}
          isBeingPouredInto={isBeingPouredInto}
        />
      )}

      {/* Dynamic Liquid Jet Stream during Physical Pouring */}
      {isPouring && (
        <PouringLiquidJet
          isPouringRight={isPouringRight}
          color={isClear ? "#e0f7fa" : vessel.color}
          vesselType={vessel.type}
        />
      )}

      {/* Base Proximity & Grab Ring */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.62, 32]} />
        <meshBasicMaterial
          color={
            isBeingPouredInto
              ? "#10b981"
              : isGrabbed
              ? "#f59e0b"
              : isTargeted
              ? "#38bdf8"
              : isClear
              ? "#38bdf8"
              : vessel.color
          }
          transparent
          opacity={isGrabbed || isTargeted || isBeingPouredInto ? 0.95 : 0.25}
        />
      </mesh>

      {/* Floating Formula & Name Tag */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <group position={[0, 1.35, 0]}>
          <Text
            fontSize={0.19}
            color="#ffffff"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {vessel.formula}
          </Text>
          <Text
            position={[0, -0.16, 0]}
            fontSize={0.09}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000000"
          >
            {vessel.name}
          </Text>
        </group>
      </Float>
    </group>
  );
}

// 1. BEAKER MODEL (Scientist Beaker with Spout & Milliliter Graduations)
function BeakerModel({
  vessel,
  liquidMeshRef,
  liquidMaterialRef,
  isClear,
  isBeingPouredInto,
}: {
  vessel: ChemicalVessel;
  liquidMeshRef: React.RefObject<THREE.Mesh | null>;
  liquidMaterialRef: React.RefObject<THREE.MeshPhysicalMaterial | null>;
  isClear: boolean;
  isBeingPouredInto: boolean;
}) {
  const radius = 0.42;
  const height = 0.95;
  const liquidHeight = Math.max(0.12, height * (vessel.liquidLevel || 0.65));

  return (
    <group>
      {/* Borosilicate Glass Cylinder Body */}
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 0.96, height, 36, 1, true]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transmission={0.96}
          opacity={1}
          transparent
          roughness={0.03}
          ior={1.52}
          thickness={0.28}
          reflectivity={0.75}
          clearcoat={1.0}
          clearcoatRoughness={0.02}
        />
      </mesh>

      {/* Glass Base Bottom */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[radius * 0.96, radius * 0.96, 0.05, 36]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.94} transparent roughness={0.05} />
      </mesh>

      {/* Rolled Beaker Glass Lip Rim */}
      <mesh position={[0, height, 0]}>
        <torusGeometry args={[radius, 0.024, 16, 36]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.94} transparent roughness={0.04} />
      </mesh>

      {/* Pouring Spout Notch at Top Lip */}
      <mesh position={[-radius * 0.95, height - 0.01, 0]} rotation={[0, 0, 0.45]}>
        <coneGeometry args={[0.07, 0.12, 16, 1, true]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.92} transparent roughness={0.05} />
      </mesh>

      {/* Graduation Marks: 50, 100, 150, 200 ml */}
      <group position={[0, 0, radius * 0.98]}>
        {[
          { y: 0.24, label: "50ml" },
          { y: 0.46, label: "100ml" },
          { y: 0.68, label: "150ml" },
          { y: 0.86, label: "200ml" },
        ].map((mark) => (
          <group key={mark.label} position={[0, mark.y, 0]}>
            <mesh position={[-0.12, 0, 0]}>
              <boxGeometry args={[0.12, 0.008, 0.01]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
            </mesh>
            <Text
              position={[0.04, 0, 0]}
              fontSize={0.055}
              color="#ffffff"
              anchorX="left"
              anchorY="middle"
            >
              {mark.label}
            </Text>
          </group>
        ))}
        {/* Lab Glassware Brand Stamp */}
        <Text
          position={[0, 0.12, 0]}
          fontSize={0.045}
          color="#94a3b8"
          anchorX="center"
          anchorY="middle"
        >
          BORO 3.3 • 250ml
        </Text>
      </group>

      {/* Dynamic Liquid Body */}
      <mesh
        ref={liquidMeshRef as any}
        position={[0, liquidHeight / 2 + 0.035, 0]}
      >
        <cylinderGeometry
          args={[radius * 0.93, radius * 0.90, liquidHeight, 32]}
        />
        <meshPhysicalMaterial
          ref={liquidMaterialRef}
          color={isClear ? "#e0f7fa" : vessel.color}
          emissive={isClear ? "#bae6fd" : vessel.color}
          emissiveIntensity={isClear ? 0.08 : 0.3}
          transmission={isClear ? 0.95 : 0.65}
          opacity={isClear ? 0.4 : 0.85}
          transparent
          roughness={isClear ? 0.02 : 0.08}
          ior={isClear ? 1.333 : 1.44}
          reflectivity={isClear ? 0.85 : 0.6}
          clearcoat={1.0}
        />
      </mesh>

      {/* Liquid Top Meniscus Gloss Surface */}
      <mesh position={[0, liquidHeight + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.92, 32]} />
        <meshPhysicalMaterial
          color={isClear ? "#e0f7fa" : vessel.color}
          transmission={isClear ? 0.9 : 0.55}
          opacity={isClear ? 0.55 : 0.9}
          transparent
          roughness={0.02}
          reflectivity={0.9}
          clearcoat={1.0}
        />
      </mesh>

      {/* Internal Micro-Bubbles */}
      <InFluidMicroBubbles radius={radius * 0.88} height={liquidHeight} />
    </group>
  );
}

// 2. ERLENMEYER FLASK MODEL (Iconic Conical Scientist Lab Flask)
function ErlenmeyerFlaskModel({
  vessel,
  liquidMeshRef,
  liquidMaterialRef,
  isClear,
  isBeingPouredInto,
}: {
  vessel: ChemicalVessel;
  liquidMeshRef: React.RefObject<THREE.Mesh | null>;
  liquidMaterialRef: React.RefObject<THREE.MeshPhysicalMaterial | null>;
  isClear: boolean;
  isBeingPouredInto: boolean;
}) {
  const coneHeight = 0.65;
  const neckHeight = 0.38;
  const baseRadius = 0.49;
  const neckRadius = 0.22;
  const totalHeight = coneHeight + neckHeight;
  const liquidHeight = Math.max(0.12, totalHeight * (vessel.liquidLevel || 0.65));

  return (
    <group>
      {/* Conical Lower Body */}
      <mesh castShadow position={[0, coneHeight / 2 + 0.03, 0]}>
        <cylinderGeometry
          args={[neckRadius, baseRadius, coneHeight, 36, 1, true]}
        />
        <meshPhysicalMaterial
          color="#f8fafc"
          transmission={0.96}
          opacity={1}
          transparent
          roughness={0.03}
          ior={1.52}
          thickness={0.28}
          reflectivity={0.75}
          clearcoat={1.0}
        />
      </mesh>

      {/* Cylindrical Neck */}
      <mesh castShadow position={[0, coneHeight + neckHeight / 2 + 0.03, 0]}>
        <cylinderGeometry
          args={[neckRadius, neckRadius, neckHeight, 36, 1, true]}
        />
        <meshPhysicalMaterial
          color="#f8fafc"
          transmission={0.96}
          opacity={1}
          transparent
          roughness={0.03}
          ior={1.52}
          thickness={0.28}
          reflectivity={0.75}
          clearcoat={1.0}
        />
      </mesh>

      {/* Flared Rim Lip */}
      <mesh position={[0, totalHeight + 0.03, 0]}>
        <torusGeometry args={[neckRadius * 1.15, 0.022, 16, 36]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.94} transparent roughness={0.04} />
      </mesh>

      {/* Base Bottom */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[baseRadius * 0.98, baseRadius * 0.98, 0.05, 36]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.94} transparent roughness={0.05} />
      </mesh>

      {/* Erlenmeyer Graduation Marks */}
      <group position={[0, 0, baseRadius * 0.72]}>
        {[
          { y: 0.22, label: "100ml" },
          { y: 0.42, label: "200ml" },
          { y: 0.58, label: "300ml" },
        ].map((m) => (
          <group key={m.label} position={[0, m.y, 0]}>
            <mesh position={[-0.1, 0, 0]}>
              <boxGeometry args={[0.1, 0.007, 0.01]} />
              <meshBasicMaterial color="#ffffff" transparent opacity={0.75} />
            </mesh>
            <Text
              position={[0.04, 0, 0]}
              fontSize={0.05}
              color="#ffffff"
              anchorX="left"
              anchorY="middle"
            >
              {m.label}
            </Text>
          </group>
        ))}
      </group>

      {/* Conical Liquid Inside */}
      {liquidHeight <= coneHeight ? (
        <mesh
          ref={liquidMeshRef as any}
          position={[0, liquidHeight / 2 + 0.035, 0]}
        >
          <cylinderGeometry
            args={[
              baseRadius * 0.94 -
                (baseRadius * 0.94 - neckRadius * 0.92) * (liquidHeight / coneHeight),
              baseRadius * 0.94,
              liquidHeight,
              32,
            ]}
          />
          <meshPhysicalMaterial
            ref={liquidMaterialRef}
            color={isClear ? "#e0f7fa" : vessel.color}
            emissive={isClear ? "#bae6fd" : vessel.color}
            emissiveIntensity={isClear ? 0.08 : 0.3}
            transmission={isClear ? 0.95 : 0.65}
            opacity={isClear ? 0.4 : 0.85}
            transparent
            roughness={isClear ? 0.02 : 0.08}
            ior={isClear ? 1.333 : 1.44}
            clearcoat={1.0}
          />
        </mesh>
      ) : (
        <group>
          {/* Full Cone Base */}
          <mesh position={[0, coneHeight / 2 + 0.035, 0]}>
            <cylinderGeometry
              args={[neckRadius * 0.92, baseRadius * 0.94, coneHeight, 32]}
            />
            <meshPhysicalMaterial
              ref={liquidMaterialRef}
              color={isClear ? "#e0f7fa" : vessel.color}
              emissive={isClear ? "#bae6fd" : vessel.color}
              emissiveIntensity={isClear ? 0.08 : 0.3}
              transmission={isClear ? 0.95 : 0.65}
              opacity={isClear ? 0.4 : 0.85}
              transparent
              roughness={isClear ? 0.02 : 0.08}
              ior={isClear ? 1.333 : 1.44}
              clearcoat={1.0}
            />
          </mesh>
          {/* Neck Liquid Portion */}
          <mesh
            ref={liquidMeshRef as any}
            position={[0, coneHeight + (liquidHeight - coneHeight) / 2 + 0.035, 0]}
          >
            <cylinderGeometry
              args={[
                neckRadius * 0.92,
                neckRadius * 0.92,
                liquidHeight - coneHeight,
                32,
              ]}
            />
            <meshPhysicalMaterial
              color={isClear ? "#e0f7fa" : vessel.color}
              emissive={isClear ? "#bae6fd" : vessel.color}
              emissiveIntensity={isClear ? 0.08 : 0.3}
              transmission={isClear ? 0.95 : 0.65}
              opacity={isClear ? 0.4 : 0.85}
              transparent
              roughness={isClear ? 0.02 : 0.08}
              ior={isClear ? 1.333 : 1.44}
              clearcoat={1.0}
            />
          </mesh>
        </group>
      )}

      {/* Top Meniscus Gloss Surface */}
      <mesh position={[0, liquidHeight + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry
          args={[
            liquidHeight <= coneHeight
              ? baseRadius * 0.94 -
                (baseRadius * 0.94 - neckRadius * 0.92) * (liquidHeight / coneHeight)
              : neckRadius * 0.92,
            32,
          ]}
        />
        <meshPhysicalMaterial
          color={isClear ? "#e0f7fa" : vessel.color}
          transmission={isClear ? 0.9 : 0.55}
          opacity={isClear ? 0.55 : 0.9}
          transparent
          roughness={0.02}
          reflectivity={0.9}
        />
      </mesh>

      <InFluidMicroBubbles radius={baseRadius * 0.8} height={liquidHeight} />
    </group>
  );
}

// 3. TEST TUBE MODEL (Seamless Hemispherical Round Bottom Tube & Stand)
function TestTubeModel({
  vessel,
  liquidMeshRef,
  liquidMaterialRef,
  isClear,
  isBeingPouredInto,
}: {
  vessel: ChemicalVessel;
  liquidMeshRef: React.RefObject<THREE.Mesh | null>;
  liquidMaterialRef: React.RefObject<THREE.MeshPhysicalMaterial | null>;
  isClear: boolean;
  isBeingPouredInto: boolean;
}) {
  const radius = 0.18;
  const tubeHeight = 1.0;
  const liquidHeight = Math.max(0.12, tubeHeight * (vessel.liquidLevel || 0.6));

  return (
    <group>
      {/* Cylindrical Tube Wall */}
      <mesh castShadow position={[0, tubeHeight / 2 + radius, 0]}>
        <cylinderGeometry args={[radius, radius, tubeHeight, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#f8fafc"
          transmission={0.96}
          opacity={1}
          transparent
          roughness={0.03}
          ior={1.52}
          thickness={0.25}
          reflectivity={0.8}
          clearcoat={1.0}
        />
      </mesh>

      {/* Hemispherical Round Bottom Dome */}
      <mesh position={[0, radius, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry
          args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshPhysicalMaterial
          color="#f8fafc"
          transmission={0.96}
          opacity={1}
          transparent
          roughness={0.03}
          ior={1.52}
        />
      </mesh>

      {/* Flared Glass Top Lip Rim */}
      <mesh position={[0, tubeHeight + radius, 0]}>
        <torusGeometry args={[radius * 1.08, 0.018, 16, 32]} />
        <meshPhysicalMaterial color="#f8fafc" transmission={0.94} transparent roughness={0.04} />
      </mesh>

      {/* Laboratory Acrylic Stabilizer Stand Collar */}
      <mesh position={[0, 0.04, 0]}>
        <cylinderGeometry args={[0.34, 0.38, 0.08, 32]} />
        <meshStandardMaterial
          color="#1e293b"
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.03, 32]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Test Tube Fluid Cylinder */}
      <mesh
        ref={liquidMeshRef as any}
        position={[0, liquidHeight / 2 + radius, 0]}
      >
        <cylinderGeometry
          args={[radius * 0.92, radius * 0.92, liquidHeight, 32]}
        />
        <meshPhysicalMaterial
          ref={liquidMaterialRef}
          color={isClear ? "#e0f7fa" : vessel.color}
          emissive={isClear ? "#bae6fd" : vessel.color}
          emissiveIntensity={isClear ? 0.08 : 0.3}
          transmission={isClear ? 0.95 : 0.65}
          opacity={isClear ? 0.4 : 0.85}
          transparent
          roughness={isClear ? 0.02 : 0.08}
          ior={isClear ? 1.333 : 1.44}
          clearcoat={1.0}
        />
      </mesh>

      {/* Fluid Hemispherical Bottom Dome */}
      <mesh position={[0, radius, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry
          args={[radius * 0.92, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshPhysicalMaterial
          color={isClear ? "#e0f7fa" : vessel.color}
          emissive={isClear ? "#bae6fd" : vessel.color}
          emissiveIntensity={isClear ? 0.08 : 0.3}
          transmission={isClear ? 0.95 : 0.65}
          opacity={isClear ? 0.4 : 0.85}
          transparent
          roughness={isClear ? 0.02 : 0.08}
        />
      </mesh>

      {/* Top Meniscus Disk */}
      <mesh position={[0, liquidHeight + radius, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 0.92, 32]} />
        <meshPhysicalMaterial
          color={isClear ? "#e0f7fa" : vessel.color}
          transmission={isClear ? 0.9 : 0.55}
          opacity={isClear ? 0.55 : 0.9}
          transparent
          roughness={0.02}
        />
      </mesh>

      <InFluidMicroBubbles radius={radius * 0.85} height={liquidHeight} count={14} />
    </group>
  );
}

// 4. DYNAMIC POURING JET STREAM WITH IMPACT DROPLETS
function PouringLiquidJet({
  isPouringRight,
  color,
  vesselType,
}: {
  isPouringRight: boolean;
  color: string;
  vesselType: VesselType;
}) {
  const originX =
    (vesselType === "flask" ? 0.25 : vesselType === "test_tube" ? 0.2 : 0.44) *
    (isPouringRight ? 1 : -1);
  const originY = vesselType === "test_tube" ? 1.15 : 0.94;

  const pointsRef = useRef<THREE.Points>(null);
  const count = 35;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 1] = -Math.random() * 1.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }
    return [pos];
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= delta * 3.2;
      if (arr[i * 3 + 1] < -1.4) {
        arr[i * 3 + 1] = 0;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <group position={[originX, originY, 0]}>
      {/* Curved Liquid Jet */}
      <mesh
        position={[isPouringRight ? 0.18 : -0.18, -0.65, 0]}
        rotation={[0, 0, isPouringRight ? -0.42 : 0.42]}
      >
        <cylinderGeometry args={[0.035, 0.055, 1.4, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Sputtering Splash Droplets */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} color={color} transparent opacity={0.85} />
      </points>
    </group>
  );
}

// 5. MULTI-LAYERED REAL-WORLD SCIENTIFIC REACTION VISUAL EFFECTS
function ReactionVisualEffects({
  effectType,
  colorHex,
  position,
}: {
  effectType: string;
  colorHex: string;
  position: [number, number, number];
}) {
  return (
    <group position={position}>
      {/* 1. Dynamic Exothermic Reaction Luminescence Core */}
      <ReactionCoreLight effectType={effectType} colorHex={colorHex} />

      {/* 2. Specific Physical Reaction Phenomenon */}
      {effectType === "bubbles" ? (
        <EffervescenceBubbles colorHex={colorHex} />
      ) : effectType === "steam" ? (
        <TurbulentThermalSteam colorHex={colorHex} />
      ) : effectType === "spark" ? (
        <GoldenRainSparkles colorHex={colorHex} />
      ) : effectType === "precipitate" ? (
        <ColloidalPrecipitateSwirl colorHex={colorHex} />
      ) : (
        <ColorDiffusionSwirl colorHex={colorHex} />
      )}
    </group>
  );
}

// 5A. Reaction Core Light (Flickers & Illuminates the Lab)
function ReactionCoreLight({
  effectType,
  colorHex,
}: {
  effectType: string;
  colorHex: string;
}) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    const flicker = Math.sin(Date.now() * 0.02) * 1.2;
    lightRef.current.intensity = 3.6 + flicker;
  });

  const isWarmExothermic = effectType === "steam" || effectType === "spark";
  const lightColor = isWarmExothermic ? "#f59e0b" : colorHex || "#38bdf8";

  return (
    <pointLight
      ref={lightRef}
      color={lightColor}
      intensity={3.8}
      distance={4.5}
      decay={2}
    />
  );
}

// 5B. Effervescence: Internal Bubbles, Surface Froth Cap & Sputtering Droplets (e.g. Cuka + Soda Kue)
function EffervescenceBubbles({ colorHex }: { colorHex: string }) {
  const bubblesRef = useRef<THREE.Points>(null);
  const dropletsRef = useRef<THREE.Points>(null);
  const foamRef = useRef<THREE.Group>(null);

  const bubbleCount = 140;
  const dropletCount = 45;

  const [bubblePos, bubbleVel] = useMemo(() => {
    const pos = new Float32Array(bubbleCount * 3);
    const vel = new Float32Array(bubbleCount);
    for (let i = 0; i < bubbleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.45;
      pos[i * 3 + 1] = Math.random() * 0.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.45;
      vel[i] = 0.8 + Math.random() * 1.4;
    }
    return [pos, vel];
  }, [bubbleCount]);

  const [dropletPos, dropletVel] = useMemo(() => {
    const pos = new Float32Array(dropletCount * 3);
    const vel = new Float32Array(dropletCount * 3);
    for (let i = 0; i < dropletCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.35;
      pos[i * 3 + 1] = 0.85;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
      vel[i * 3] = (Math.random() - 0.5) * 0.9;
      vel[i * 3 + 1] = 1.2 + Math.random() * 1.5;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.9;
    }
    return [pos, vel];
  }, [dropletCount]);

  useFrame((_, delta) => {
    // 1. Rising in-fluid bubbles
    if (bubblesRef.current) {
      const posAttr = bubblesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < bubbleCount; i++) {
        arr[i * 3 + 1] += delta * bubbleVel[i];
        arr[i * 3] += Math.sin(Date.now() * 0.005 + i) * 0.004;
        if (arr[i * 3 + 1] > 0.88) {
          arr[i * 3 + 1] = 0.05;
          arr[i * 3] = (Math.random() - 0.5) * 0.4;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 2. Sputtering bursting droplets (ballistic trajectory with gravity)
    if (dropletsRef.current) {
      const posAttr = dropletsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < dropletCount; i++) {
        arr[i * 3] += dropletVel[i * 3] * delta;
        arr[i * 3 + 1] += dropletVel[i * 3 + 1] * delta;
        arr[i * 3 + 2] += dropletVel[i * 3 + 2] * delta;
        dropletVel[i * 3 + 1] -= delta * 4.2; // Gravity pull

        if (arr[i * 3 + 1] < 0.6) {
          arr[i * 3] = (Math.random() - 0.5) * 0.3;
          arr[i * 3 + 1] = 0.85;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
          dropletVel[i * 3 + 1] = 1.2 + Math.random() * 1.4;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 3. Surface foam cap organic pulsation
    if (foamRef.current) {
      const wobble = 1 + Math.sin(Date.now() * 0.01) * 0.08;
      foamRef.current.scale.set(wobble, wobble * 0.9, wobble);
    }
  });

  return (
    <group>
      {/* Accelerating Rising Bubbles */}
      <points ref={bubblesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bubblePos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.065} color="#ffffff" transparent opacity={0.9} />
      </points>

      {/* Surface Froth / Foam Cap Dome */}
      <group ref={foamRef} position={[0, 0.86, 0]}>
        <mesh>
          <sphereGeometry args={[0.38, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshPhysicalMaterial
            color="#ffffff"
            transmission={0.75}
            roughness={0.2}
            opacity={0.88}
            transparent
          />
        </mesh>
      </group>

      {/* Ballistic Sputtering Droplets */}
      <points ref={dropletsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dropletPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} color={colorHex || "#ffffff"} transparent opacity={0.9} />
      </points>
    </group>
  );
}

// 5C. Convective Turbulent Steam Clouds (e.g. Asam Klorida + Soda Api Eksotermik)
function TurbulentThermalSteam({ colorHex }: { colorHex: string }) {
  const innerSteamRef = useRef<THREE.Points>(null);
  const outerSteamRef = useRef<THREE.Points>(null);

  const innerCount = 80;
  const outerCount = 120;

  const [innerPos] = useMemo(() => {
    const pos = new Float32Array(innerCount * 3);
    for (let i = 0; i < innerCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.25;
      pos[i * 3 + 1] = 0.2 + Math.random() * 1.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    return [pos];
  }, [innerCount]);

  const [outerPos] = useMemo(() => {
    const pos = new Float32Array(outerCount * 3);
    for (let i = 0; i < outerCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.6;
      pos[i * 3 + 1] = 0.5 + Math.random() * 1.8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }
    return [pos];
  }, [outerCount]);

  useFrame((_, delta) => {
    // 1. Fast rising thermal core
    if (innerSteamRef.current) {
      const posAttr = innerSteamRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < innerCount; i++) {
        arr[i * 3 + 1] += delta * 1.6;
        arr[i * 3] += Math.sin(Date.now() * 0.003 + i) * 0.006;
        if (arr[i * 3 + 1] > 2.4) {
          arr[i * 3 + 1] = 0.2;
          arr[i * 3] = (Math.random() - 0.5) * 0.2;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 2. Billowing atmospheric vapor wisps
    if (outerSteamRef.current) {
      const posAttr = outerSteamRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < outerCount; i++) {
        arr[i * 3 + 1] += delta * 1.1;
        const angle = Date.now() * 0.0015 + i;
        arr[i * 3] += Math.cos(angle) * 0.008;
        arr[i * 3 + 2] += Math.sin(angle) * 0.008;
        if (arr[i * 3 + 1] > 3.2) {
          arr[i * 3 + 1] = 0.5;
          arr[i * 3] = (Math.random() - 0.5) * 0.35;
          arr[i * 3 + 2] = (Math.random() - 0.5) * 0.35;
        }
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Warm Tinted Thermal Core Vapor */}
      <points ref={innerSteamRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[innerPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.14}
          color="#fef3c7"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Billowing Atmospheric Steam Cloud */}
      <points ref={outerSteamRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[outerPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.22}
          color="#f8fafc"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// 5D. Golden Rain & Incandescent Chemical Sparks (e.g. PbI2 Golden Rain & Redox Flare)
function GoldenRainSparkles({ colorHex }: { colorHex: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 180;

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const baseColor = new THREE.Color(colorHex || "#fbbf24");
    const goldColor = new THREE.Color("#f59e0b");

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = 0.2 + Math.random() * 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      vel[i * 3] = (Math.random() - 0.5) * 0.6;
      vel[i * 3 + 1] = -0.4 - Math.random() * 0.8; // Fluttering downward
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.6;

      const c = i % 2 === 0 ? baseColor : goldColor;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, [count, colorHex]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      // Gentle flutter oscillation (like falling gold leaf flakes)
      arr[i * 3] += Math.sin(Date.now() * 0.008 + i) * 0.006;
      arr[i * 3 + 2] += Math.cos(Date.now() * 0.008 + i) * 0.006;

      if (arr[i * 3 + 1] < 0.05) {
        arr[i * 3 + 1] = 1.8;
        arr[i * 3] = (Math.random() - 0.5) * 0.5;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.075}
        vertexColors
        transparent
        opacity={0.92}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 5E. Swirling Insoluble Precipitate Cloud (e.g. CuSO4 + NaOH Endapan Gel Biru Cu(OH)2)
function ColloidalPrecipitateSwirl({ colorHex }: { colorHex: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 150;

  const [positions, targetY] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ty = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * 0.35;
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = radius * Math.cos(theta);
      pos[i * 3 + 1] = 0.2 + Math.random() * 0.65;
      pos[i * 3 + 2] = radius * Math.sin(theta);
      ty[i] = 0.05 + Math.random() * 0.25; // Sinks to bottom
    }
    return [pos, ty];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // Swirling vortex rotation inside fluid
      const x = arr[i * 3];
      const z = arr[i * 3 + 2];
      const r = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x) + delta * 2.2;
      arr[i * 3] = r * Math.cos(angle);
      arr[i * 3 + 2] = r * Math.sin(angle);

      // Gradual settling of sediment
      if (arr[i * 3 + 1] > targetY[i]) {
        arr[i * 3 + 1] -= delta * 0.18;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.09}
        color={colorHex || "#1e40af"}
        transparent
        opacity={0.85}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

// 5F. Color Diffusion Swirl (Gradual Fluid Blending Waves)
function ColorDiffusionSwirl({ colorHex }: { colorHex: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 90;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 0.38;
      const th = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(th);
      pos[i * 3 + 1] = 0.15 + Math.random() * 0.55;
      pos[i * 3 + 2] = r * Math.sin(th);
    }
    return [pos];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const x = arr[i * 3];
      const z = arr[i * 3 + 2];
      const r = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x) + delta * 1.5;
      arr[i * 3] = r * Math.cos(angle);
      arr[i * 3 + 2] = r * Math.sin(angle);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.065} color={colorHex} transparent opacity={0.78} />
    </points>
  );
}
