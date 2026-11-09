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

// Built-in Knowledge Base of Science & Chemistry Reactions (SD, SMP, SMA)
export const BUILTIN_REACTIONS: ReactionDetail[] = [
  // 1. SD: Cuka + Baking Soda
  {
    id: "rx_sd_1",
    title: "Reaksi Asam-Basa Menghasilkan Gas CO2",
    equation: "CH₃COOH (Cuka) + NaHCO₃ (Baking Soda) → CH₃COONa + H₂O + CO₂↑",
    substanceA: "CH3COOH",
    substanceB: "NaHCO3",
    resultName: "Natrium Asetat Berbuih",
    resultFormula: "CH₃COONa + CO₂",
    resultColor: "#f8fafc",
    effectType: "bubbles",
    temperatureChange: -4,
    explanation: "Reaksi antara asam cuka dan soda kue menghasilkan gas Karbondioksida (CO₂) yang meluap membentuk gelembung busa tebal dan menyerap kalor.",
    level: "SD",
  },
  // 2. SD: Minyak + Air
  {
    id: "rx_sd_2",
    title: "Heterogenitas Massa Jenis Polar & Non-Polar",
    equation: "H₂O (Air) + Lipid (Minyak) → Emulsi Dua Fase (Tidak Bercampur)",
    substanceA: "H2O",
    substanceB: "LIPID",
    resultName: "Campuran Berlapis (Massa Jenis)",
    resultFormula: "H₂O // Lipid",
    resultColor: "#facc15",
    effectType: "color_change",
    temperatureChange: 0,
    explanation: "Air dan minyak goreng tidak dapat menyatu karena perbedaan kepolaran molekul (air polar, minyak non-polar) dan massa jenis minyak lebih ringan.",
    level: "SD",
  },
  // 3. SMP: Asam Klorida + Natrium Hidroksida (Netralisasi)
  {
    id: "rx_smp_1",
    title: "Reaksi Netralisasi Asam Kuat & Basa Kuat",
    equation: "HCl (Asam Klorida) + NaOH (Soda Api) → NaCl (Garam Dapur) + H₂O + Kalor",
    substanceA: "HCl",
    substanceB: "NaOH",
    resultName: "Larutan Garam Netral",
    resultFormula: "NaCl + H₂O",
    resultColor: "#10b981",
    effectType: "steam",
    temperatureChange: 18,
    explanation: "Ion hidrogen (H+) dari asam dan ion hidroksida (OH-) dari basa bersatu membentuk molekul air netral dan garam dapur dengan pelepasan energi kalor.",
    level: "SMP",
  },
  // 4. SMP: Tembaga Sulfat + Natrium Hidroksida
  {
    id: "rx_smp_2",
    title: "Reaksi Pembentukan Endapan Tembaga(II) Hidroksida",
    equation: "CuSO₄ (Tembaga Sulfat) + 2NaOH → Cu(OH)₂↓ (Endapan Biru Tua) + Na₂SO₄",
    substanceA: "CuSO4",
    substanceB: "NaOH",
    resultName: "Endapan Biru Cu(OH)₂",
    resultFormula: "Cu(OH)₂↓ + Na₂SO₄",
    resultColor: "#1e40af",
    effectType: "precipitate",
    temperatureChange: 4,
    explanation: "Pertukaran ion membentuk tembaga(II) hidroksida yang tidak larut dalam air, menghasilkan endapan seperti gel berwarna biru safir tua.",
    level: "SMP",
  },
  // 5. SMA: Timbal Nitrat + Kalium Iodida (Golden Rain)
  {
    id: "rx_sma_1",
    title: "Fenomena Hujan Emas (Golden Rain Precipitation)",
    equation: "Pb(NO₃)₂ (Timbal Nitrat) + 2KI (Kalium Iodida) → PbI₂↓ (Kristal Emas) + 2KNO₃",
    substanceA: "Pb(NO3)2",
    substanceB: "KI",
    resultName: "Kristal Hujan Emas PbI₂",
    resultFormula: "PbI₂↓ (Golden Rain)",
    resultColor: "#fbbf24",
    effectType: "spark",
    temperatureChange: 2,
    explanation: "Dua larutan tanpa warna bereaksi seketika memicu presipitasi kristal heksagonal timbal iodida yang berpendar kuning keemasan seperti hujan emas.",
    level: "SMA",
  },
  // 6. SMA: Kalium Permanganat + Gliserin
  {
    id: "rx_sma_2",
    title: "Reaksi Redoks Spontan Eksotermik",
    equation: "14KMnO₄ + 4C₃H₅(OH)₃ → 7K₂CO₃ + 7Mn₂O₃ + 5CO₂↑ + 16H₂O + Energi Panas",
    substanceA: "KMnO4",
    substanceB: "GLYCERIN",
    resultName: "Residu Mangan Dioksida & Panas",
    resultFormula: "Mn₂O₃ + K₂CO₃",
    resultColor: "#581c87",
    effectType: "steam",
    temperatureChange: 45,
    explanation: "KMnO4 adalah oksidator sangat kuat yang mengoksidasi senyawa organik gliserin secara spontan, melepaskan uap panas tebal dan nyala eksotermik.",
    level: "SMA",
  },
];

export const INITIAL_VESSELS: ChemicalVessel[] = [
  {
    id: "v_hcl",
    name: "Asam Klorida",
    formula: "HCl",
    type: "beaker",
    color: "#ef4444",
    initialColor: "#ef4444",
    position: [-1.8, 0.5, 0],
    level: "SMP",
    liquidLevel: 0.65,
    temperatureC: 25,
  },
  {
    id: "v_naoh",
    name: "Natrium Hidroksida",
    formula: "NaOH",
    type: "beaker",
    color: "#3b82f6",
    initialColor: "#3b82f6",
    position: [-0.6, 0.5, 0],
    level: "SMP",
    liquidLevel: 0.65,
    temperatureC: 25,
  },
  {
    id: "v_cuso4",
    name: "Tembaga Sulfat",
    formula: "CuSO4",
    type: "flask",
    color: "#06b6d4",
    initialColor: "#06b6d4",
    position: [0.6, 0.5, 0],
    level: "SMP",
    liquidLevel: 0.7,
    temperatureC: 24,
  },
  {
    id: "v_cuka",
    name: "Cuka Dapur",
    formula: "CH3COOH",
    type: "flask",
    color: "#f59e0b",
    initialColor: "#f59e0b",
    position: [1.8, 0.5, 0],
    level: "SD",
    liquidLevel: 0.75,
    temperatureC: 25,
  },
  {
    id: "v_baking",
    name: "Baking Soda",
    formula: "NaHCO3",
    type: "test_tube",
    color: "#e2e8f0",
    initialColor: "#e2e8f0",
    position: [-1.2, 0.6, -1.5],
    level: "SD",
    liquidLevel: 0.55,
    temperatureC: 25,
  },
  {
    id: "v_ki",
    name: "Kalium Iodida",
    formula: "KI",
    type: "test_tube",
    color: "#a855f7",
    initialColor: "#a855f7",
    position: [0, 0.6, -1.5],
    level: "SMA",
    liquidLevel: 0.6,
    temperatureC: 25,
  },
  {
    id: "v_pb",
    name: "Timbal Nitrat",
    formula: "Pb(NO3)2",
    type: "test_tube",
    color: "#e0e7ff",
    initialColor: "#e0e7ff",
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
}

export default function ChemistryLabScene({
  handTransform,
  onReactionDetected,
  vessels,
  setVessels,
  activeReaction,
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
}: {
  vessels: ChemicalVessel[];
  setVessels: React.Dispatch<React.SetStateAction<ChemicalVessel[]>>;
  handTransform?: HandTransform;
  grabbedIdRef: React.MutableRefObject<string | null>;
  onReactionDetected?: (reaction: ReactionDetail, vesselA: ChemicalVessel, vesselB: ChemicalVessel) => void;
  activeReaction: ReactionDetail | null;
}) {
  const handSphereRef = useRef<THREE.Mesh>(null);
  const vesselsRef = useRef<ChemicalVessel[]>(vessels);
  vesselsRef.current = vessels;

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

    // Step 1: Match in local catalog first if available
    const matched = BUILTIN_REACTIONS.find(
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

// Individual 3D Chemical Vessel with Realistic Glass & Glowing Dynamic Liquid
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
  const liquidMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const liquidMeshRef = useRef<THREE.Mesh>(null);

  // Smooth color morphing & physical wrist pouring tilt!
  useFrame((_, delta) => {
    if (!meshGroupRef.current) return;

    // 1. Physical Wrist Tilt Rotation!
    if (isGrabbed) {
      let targetTilt = 0;
      if (isHandActive) {
        // Direct wrist angle tilt (in radians, -wristAngle tilts the beaker in the direction of hand rotation)
        targetTilt = THREE.MathUtils.clamp(-wristAngle * 1.15, -1.35, 1.35);
      } else if (targetPosition) {
        // Mouse fallback tilt towards target
        const dx = targetPosition[0] - vessel.position[0];
        targetTilt = dx > 0 ? -0.85 : 0.85;
      }
      meshGroupRef.current.rotation.z = THREE.MathUtils.lerp(meshGroupRef.current.rotation.z, targetTilt, 0.25);
    } else {
      meshGroupRef.current.rotation.z = THREE.MathUtils.lerp(meshGroupRef.current.rotation.z, 0, 0.2);
    }

    // 2. Liquid Color Morphing (Lerp smoothly to new color)
    if (liquidMaterialRef.current) {
      const targetColor = new THREE.Color(vessel.color);
      liquidMaterialRef.current.color.lerp(targetColor, 0.08);
      liquidMaterialRef.current.emissive.lerp(targetColor, 0.08);

      // Bubbling boiling pulse if being poured into or recently reacted
      if (isBeingPouredInto || vessel.isReacted) {
        liquidMaterialRef.current.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.008) * 0.3;
      } else {
        liquidMaterialRef.current.emissiveIntensity = 0.25;
      }
    }

    // 3. Liquid level expansion wave
    if (liquidMeshRef.current) {
      const pulse = isBeingPouredInto ? 1 + Math.sin(Date.now() * 0.012) * 0.03 : 1;
      liquidMeshRef.current.scale.set(pulse, 1, pulse);
    }
  });

  const radius = vessel.type === "test_tube" ? 0.22 : vessel.type === "flask" ? 0.45 : 0.4;
  const height = vessel.type === "test_tube" ? 1.15 : 0.98;
  const liquidHeight = Math.max(0.15, height * vessel.liquidLevel);

  // Pouring stream is active when vessel is grabbed and physically tilted > 23 degrees (|tilt| > 0.40)
  const currentTilt = meshGroupRef.current?.rotation.z || 0;
  const isPouring = isGrabbed && Math.abs(currentTilt) > 0.40;
  const isPouringRight = currentTilt < -0.40;

  return (
    <group
      ref={meshGroupRef}
      position={vessel.position}
      onPointerDown={onPointerDown}
      scale={isGrabbed ? [1.12, 1.12, 1.12] : [1, 1, 1]}
    >
      {/* 1. Transparent Glass Vessel Shell */}
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 0.95, height, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.92}
          opacity={1}
          transparent
          roughness={0.08}
          ior={1.5}
          thickness={0.2}
          reflectivity={0.6}
        />
      </mesh>

      {/* Glass Base Bottom */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[radius * 0.95, radius * 0.95, 0.06, 32]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.9} transparent roughness={0.1} />
      </mesh>

      {/* Glass Rim Top */}
      <mesh position={[0, height, 0]}>
        <torusGeometry args={[radius, 0.03, 16, 32]} />
        <meshPhysicalMaterial color="#ffffff" transmission={0.9} transparent roughness={0.1} />
      </mesh>

      {/* 2. Liquid Contents Inside (Morphs Color & Pulses) */}
      <mesh ref={liquidMeshRef} position={[0, liquidHeight / 2 + 0.04, 0]}>
        <cylinderGeometry args={[radius * 0.92, radius * 0.88, liquidHeight, 32]} />
        <meshStandardMaterial
          ref={liquidMaterialRef}
          color={vessel.color}
          emissive={vessel.color}
          emissiveIntensity={0.25}
          roughness={0.15}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 3. Dynamic Pouring Liquid Stream (Falling Stream from Tilted Spout) */}
      {isPouring && (
        <group position={[isPouringRight ? radius * 1.05 : -radius * 1.05, height * 0.75, 0]}>
          {/* Liquid Jet Stream */}
          <mesh rotation={[0, 0, isPouringRight ? -0.45 : 0.45]}>
            <cylinderGeometry args={[0.04, 0.065, 1.25, 16]} />
            <meshStandardMaterial color={vessel.color} emissive={vessel.color} emissiveIntensity={1.0} />
          </mesh>
          {/* Spout Droplets */}
          <PouringDroplets color={vessel.color} />
        </group>
      )}

      {/* 4. Base Glow Ring (Selection & Proximity Indicator) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius * 1.1, radius * 1.35, 32]} />
        <meshBasicMaterial
          color={
            isBeingPouredInto
              ? "#10b981"
              : isGrabbed
              ? "#f59e0b"
              : isTargeted
              ? "#38bdf8"
              : vessel.color
          }
          transparent
          opacity={isGrabbed || isTargeted || isBeingPouredInto ? 0.9 : 0.25}
        />
      </mesh>

      {/* 5. Floating Label: Formula & Name */}
      <Float speed={2} rotationIntensity={0} floatIntensity={0.2}>
        <group position={[0, height + 0.35, 0]}>
          <Text
            fontSize={0.2}
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

// Pouring Stream Falling Droplets
function PouringDroplets({ color }: { color: string }) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 30;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.1;
      pos[i * 3 + 1] = -Math.random() * 0.9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    return [pos];
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] -= delta * 2.5; // Jatuh ke bawah
      if (arr[i * 3 + 1] < -1.1) {
        arr[i * 3 + 1] = 0;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={color} transparent opacity={0.9} />
    </points>
  );
}

// Multi-Disciplinary Reaction Visual Effects: Effervescence Bubbles, Steam Clouds, Sparks, Precipitate Clouds
function ReactionVisualEffects({
  effectType,
  colorHex,
  position,
}: {
  effectType: string;
  colorHex: string;
  position: [number, number, number];
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = effectType === "spark" ? 180 : 140;

  const [positions, scales] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const scl = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.8;
      pos[i * 3 + 1] = Math.random() * 1.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.8;
      scl[i] = Math.random() * 0.08 + 0.04;
    }
    return [pos, scl];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      // 1. Upward rising velocity
      const speed = effectType === "spark" ? 2.5 : effectType === "steam" ? 1.6 : 1.2;
      array[i * 3 + 1] += delta * speed;

      // 2. Swirling / billowing turbulence
      const angle = Date.now() * 0.003 + i;
      array[i * 3] += Math.sin(angle) * 0.008;
      array[i * 3 + 2] += Math.cos(angle) * 0.008;

      // 3. Reset loop
      if (array[i * 3 + 1] > 2.8) {
        array[i * 3 + 1] = 0.1;
        array[i * 3] = (Math.random() - 0.5) * 0.4;
        array[i * 3 + 2] = (Math.random() - 0.5) * 0.4;
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <group position={position}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={effectType === "spark" ? 0.09 : 0.08}
          color={colorHex}
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Point Light Glow Burst at reaction center */}
      <pointLight color={colorHex} intensity={2.5} distance={3.5} />
    </group>
  );
}
