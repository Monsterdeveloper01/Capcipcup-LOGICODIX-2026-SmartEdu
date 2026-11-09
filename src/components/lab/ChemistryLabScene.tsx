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
  liquidLevel: number; // 0.1 to 0.9
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
    temperatureChange: -4, // Endoterm (terasa dingin)
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
    explanation: "Air dan minyak goreng tidak dapat menyatu karena perbedaan kepolaran molekul (air polar, minyak non-polar) dan massa jenis minyak lebih ringan sehingga mengapung di atas.",
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
    resultColor: "#10b981", // Hijau indikator netral
    effectType: "steam",
    temperatureChange: 18, // Eksoterm (hangat/panas)
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
    resultColor: "#1e40af", // Biru tua pekat
    effectType: "precipitate",
    temperatureChange: 5,
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
    resultColor: "#eab308", // Emas berkilau
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
    resultColor: "#581c87", // Ungu tua gelap berasap
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
        <ambientLight intensity={0.8} />
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
  const dragPlaneRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5));
  const planeIntersectionRef = useRef<THREE.Vector3>(new THREE.Vector3());

  // Cooldown to avoid multi-triggering the same reaction
  const reactionCooldownRef = useRef<{ [pairKey: string]: number }>({});

  // 60 FPS Animation & Proximity Loop
  useFrame((state, delta) => {
    const isHandActive = Boolean(handTransform && handTransform.handDetected);
    const handPos = handTransform?.handPosition3D;
    const isGrabbing = Boolean(handTransform?.isGrabbing);

    // 1. Update 3D Hand Cursor
    if (handSphereRef.current) {
      if (isHandActive && handPos) {
        handSphereRef.current.visible = true;
        handSphereRef.current.position.lerp(new THREE.Vector3(handPos.x, handPos.y, handPos.z), 0.35);
        const targetScale = isGrabbing ? 0.26 : 0.18;
        handSphereRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.2);
      } else {
        handSphereRef.current.visible = false;
      }
    }

    // 2. Hand Targeting & Grab Detection
    let closestTargetId: string | null = null;
    if (isHandActive && handPos) {
      let minDist = 1.25;
      vesselsRef.current.forEach((v) => {
        const d = Math.hypot(v.position[0] - handPos.x, v.position[1] - handPos.y, v.position[2] - handPos.z);
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

    // 3. Position Update & Pouring Proximity
    const activeGrabbedId = mouseDraggedId || grabbedIdRef.current;

    if (activeGrabbedId) {
      const activeVessel = vesselsRef.current.find((v) => v.id === activeGrabbedId);
      if (activeVessel) {
        // Find nearest neighboring vessel to check if user is attempting to pour/mix!
        let nearestOtherId: string | null = null;
        let minProximity = 1.35; // Mixing distance threshold

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

        // Check if mixing triggers a chemical reaction!
        if (nearestOtherId) {
          const targetVessel = vesselsRef.current.find((v) => v.id === nearestOtherId);
          if (targetVessel) {
            checkAndTriggerReaction(activeVessel, targetVessel);
          }
        }
      }
    } else {
      setPouringTargetId(null);
    }

    // Move grabbed vessel with hand (or drop gently to table height)
    if (grabbedIdRef.current && handPos) {
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === grabbedIdRef.current) {
            return {
              ...v,
              position: [
                THREE.MathUtils.lerp(v.position[0], handPos.x, 0.25),
                THREE.MathUtils.lerp(v.position[1], Math.max(0.65, handPos.y), 0.25),
                THREE.MathUtils.lerp(v.position[2], handPos.z, 0.25),
              ],
            };
          }
          return v;
        })
      );
    }
  });

  // Reaction Matcher (Local Catalog + Real-Time Gemini AI Fallback)
  const isSimulatingAiRef = useRef<boolean>(false);

  const checkAndTriggerReaction = async (vesselA: ChemicalVessel, vesselB: ChemicalVessel) => {
    const pairKey = [vesselA.formula, vesselB.formula].sort().join("+");
    const now = Date.now();

    // Prevent re-triggering within 4 seconds
    if (reactionCooldownRef.current[pairKey] && now - reactionCooldownRef.current[pairKey] < 4000) {
      return;
    }

    // Step 1: Match in local catalog first if available
    const matched = BUILTIN_REACTIONS.find(
      (rx) =>
        (rx.substanceA === vesselA.formula && rx.substanceB === vesselB.formula) ||
        (rx.substanceA === vesselB.formula && rx.substanceB === vesselA.formula)
    );

    if (matched) {
      reactionCooldownRef.current[pairKey] = now;

      // Transform target vessel B's appearance (color and volume)
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === vesselB.id) {
            return {
              ...v,
              color: matched.resultColor,
              name: matched.resultName,
              formula: matched.resultFormula,
              liquidLevel: Math.min(0.9, v.liquidLevel + 0.15),
              temperatureC: (v.temperatureC || 25) + matched.temperatureChange,
              isReacted: true,
              reactionNote: matched.title,
            };
          }
          return v;
        })
      );

      onReactionDetected?.(matched, vesselA, vesselB);
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
        };

        // Transform target vessel B with AI predicted color and values
        setVessels((prev) =>
          prev.map((v) => {
            if (v.id === vesselB.id) {
              return {
                ...v,
                color: dynamicReaction.resultColor,
                name: dynamicReaction.resultName,
                formula: dynamicReaction.resultFormula,
                liquidLevel: Math.min(0.9, v.liquidLevel + 0.15),
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

  return (
    <group onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      {/* 3D Hand Tracking Cursor */}
      <mesh ref={handSphereRef} visible={false}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color={handTransform?.isGrabbing ? "#f59e0b" : "#38bdf8"}
          emissive={handTransform?.isGrabbing ? "#d97706" : "#0284c7"}
          emissiveIntensity={1.2}
          roughness={0.2}
          transparent
          opacity={0.85}
        />
        {/* Glowing Aura Ring around Hand */}
        <pointLight
          color={handTransform?.isGrabbing ? "#f59e0b" : "#38bdf8"}
          intensity={1.8}
          distance={2.5}
        />
      </mesh>

      {/* Render All Chemical Vessels */}
      {vessels.map((vessel) => {
        const isGrabbed = vessel.id === (mouseDraggedId || grabbedIdRef.current);
        const isTargeted = vessel.id === targetedId;
        const isBeingPouredInto = vessel.id === pouringTargetId;
        const isPouring = isGrabbed && Boolean(pouringTargetId);

        return (
          <ChemicalVesselItem
            key={vessel.id}
            vessel={vessel}
            isGrabbed={isGrabbed}
            isTargeted={isTargeted}
            isBeingPouredInto={isBeingPouredInto}
            isPouring={isPouring}
            onPointerDown={(e) => handlePointerDown(vessel.id, e)}
          />
        );
      })}

      {/* Particle Effect when Active Reaction Occurs */}
      {activeReaction && <ReactionParticles effectType={activeReaction.effectType} />}
    </group>
  );
}

// Individual 3D Chemical Vessel (Glass Cylinder/Beaker with Colored Liquid)
function ChemicalVesselItem({
  vessel,
  isGrabbed,
  isTargeted,
  isBeingPouredInto,
  isPouring,
  onPointerDown,
}: {
  vessel: ChemicalVessel;
  isGrabbed: boolean;
  isTargeted: boolean;
  isBeingPouredInto: boolean;
  isPouring: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const meshGroupRef = useRef<THREE.Group>(null);
  const liquidMeshRef = useRef<THREE.Mesh>(null);

  // Smooth tilt animation when pouring
  useFrame((_, delta) => {
    if (!meshGroupRef.current) return;
    const targetRotZ = isPouring ? -0.75 : 0; // Tilt ~45 degrees when pouring
    meshGroupRef.current.rotation.z = THREE.MathUtils.lerp(meshGroupRef.current.rotation.z, targetRotZ, 0.15);

    // Liquid surface pulse
    if (liquidMeshRef.current) {
      const scaleX = 1 + Math.sin(Date.now() * 0.005) * 0.015;
      liquidMeshRef.current.scale.set(scaleX, 1, scaleX);
    }
  });

  const radius = vessel.type === "test_tube" ? 0.22 : vessel.type === "flask" ? 0.45 : 0.4;
  const height = vessel.type === "test_tube" ? 1.1 : 0.95;
  const liquidHeight = height * vessel.liquidLevel;

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

      {/* 2. Liquid Contents Inside */}
      <mesh ref={liquidMeshRef} position={[0, liquidHeight / 2 + 0.04, 0]}>
        <cylinderGeometry args={[radius * 0.92, radius * 0.88, liquidHeight, 32]} />
        <meshStandardMaterial
          color={vessel.color}
          emissive={vessel.color}
          emissiveIntensity={isBeingPouredInto ? 0.8 : 0.25}
          roughness={0.2}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 3. Pouring Stream Effect (when pouring into another vessel) */}
      {isPouring && (
        <mesh position={[-radius * 1.2, height * 0.6, 0]} rotation={[0, 0, 0.5]}>
          <cylinderGeometry args={[0.03, 0.05, 0.8, 16]} />
          <meshStandardMaterial color={vessel.color} emissive={vessel.color} emissiveIntensity={1} />
        </mesh>
      )}

      {/* 4. Base Glow Ring (Selection Indicator) */}
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
          {/* Formula Text */}
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

          {/* Subtitle Name */}
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

// Particle System for Chemical Reactions (Bubbles, Steam, Precipitate Sparks)
function ReactionParticles({ effectType }: { effectType: string }) {
  const pointsRef = useRef<THREE.Points>(null);

  const particleCount = effectType === "bubbles" ? 80 : 120;
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 1.2;
      pos[i * 3 + 1] = Math.random() * 1.5 + 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 1.2;

      // Color scheme based on reaction effect
      if (effectType === "bubbles") {
        col[i * 3] = 0.9;
        col[i * 3 + 1] = 0.95;
        col[i * 3 + 2] = 1.0;
      } else if (effectType === "steam") {
        col[i * 3] = 0.8;
        col[i * 3 + 1] = 0.8;
        col[i * 3 + 2] = 0.9;
      } else if (effectType === "spark") {
        col[i * 3] = 1.0;
        col[i * 3 + 1] = 0.85;
        col[i * 3 + 2] = 0.2;
      } else {
        col[i * 3] = 0.2;
        col[i * 3 + 1] = 0.6;
        col[i * 3 + 2] = 1.0;
      }
    }
    return [pos, col];
  }, [effectType, particleCount]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      // Rise upwards
      array[i * 3 + 1] += delta * 1.2;
      // Drift slightly
      array[i * 3] += Math.sin(Date.now() * 0.003 + i) * 0.005;

      // Reset when too high
      if (array[i * 3 + 1] > 2.8) {
        array[i * 3 + 1] = 0.5;
        array[i * 3] = (Math.random() - 0.5) * 1.0;
        array[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
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
        size={effectType === "spark" ? 0.08 : 0.06}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
