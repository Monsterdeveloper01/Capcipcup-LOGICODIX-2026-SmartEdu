"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Float } from "@react-three/drei";
import * as THREE from "three";
import { HandTransform } from "@/components/camera/HandGestureTracker";
import { REACTION_CATALOG } from "@/lib/lab/chemicals-db";

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
  effectType: "bubbles" | "steam" | "spark" | "precipitate" | "color_change" | "two_phase";
  temperatureChange: number; // + or -
  explanation: string;
  level: "SD" | "SMP" | "SMA";
  reactionPosition?: [number, number, number];
  targetVesselId?: string;
}

// Dynamic reactions loaded from MySQL database / API
export const BUILTIN_REACTIONS: ReactionDetail[] = [];

export const INITIAL_VESSELS: ChemicalVessel[] = [
  {
    id: "v_hcl",
    name: "Asam Klorida (HCl)",
    formula: "HCl",
    type: "beaker",
    color: "#38bdf8", // Luminous glacial cyan
    initialColor: "#38bdf8",
    position: [-2.4, 0.55, 0.25],
    level: "SMP",
    liquidLevel: 0.65,
    temperatureC: 25,
  },
  {
    id: "v_naoh",
    name: "Natrium Hidroksida (NaOH)",
    formula: "NaOH",
    type: "flask", // Flask in center
    color: "#22d3ee", // Luminous crystal turquoise alkali
    initialColor: "#22d3ee",
    position: [0, 0.55, 0.25],
    level: "SMP",
    liquidLevel: 0.65,
    temperatureC: 25,
  },
  {
    id: "v_cuso4",
    name: "Tembaga Sulfat (CuSO4)",
    formula: "CuSO4",
    type: "beaker",
    color: "#0284c7", // Radiant royal azure blue
    initialColor: "#0284c7",
    position: [2.4, 0.55, 0.25],
    level: "SMP",
    liquidLevel: 0.7,
    temperatureC: 24,
  },
  {
    id: "v_cuka",
    name: "Cuka Dapur (CH3COOH)",
    formula: "CH3COOH",
    type: "flask",
    color: "#facc15", // Radiant golden amber
    initialColor: "#facc15",
    position: [-2.4, 0.55, -0.95],
    level: "SD",
    liquidLevel: 0.75,
    temperatureC: 25,
  },
  {
    id: "v_baking",
    name: "Baking Soda (NaHCO3)",
    formula: "NaHCO3",
    type: "test_tube",
    color: "#e2e8f0", // Luminous pearl white suspension
    initialColor: "#e2e8f0",
    position: [-0.8, 0.6, -0.95],
    level: "SD",
    liquidLevel: 0.55,
    temperatureC: 25,
  },
  {
    id: "v_ki",
    name: "Kalium Iodida (KI)",
    formula: "KI",
    type: "test_tube",
    color: "#818cf8", // Luminous crystal periwinkle
    initialColor: "#818cf8",
    position: [0.8, 0.6, -0.95],
    level: "SMA",
    liquidLevel: 0.6,
    temperatureC: 25,
  },
  {
    id: "v_pb",
    name: "Timbal Nitrat (Pb(NO3)2)",
    formula: "Pb(NO3)2",
    type: "test_tube",
    color: "#67e8f9", // Luminous crystal sky
    initialColor: "#67e8f9",
    position: [2.4, 0.6, -0.95],
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
  isLocked?: boolean;
}

export default function ChemistryLabScene({
  handTransform,
  onReactionDetected,
  vessels,
  setVessels,
  activeReaction,
  reactions,
  isLocked = false,
}: ChemistryLabSceneProps) {
  const grabbedIdRef = useRef<string | null>(null);

  // When locked, force release any held vessel
  useEffect(() => {
    if (isLocked) {
      grabbedIdRef.current = null;
    }
  }, [isLocked]);

  return (
    <div className="w-full h-full relative select-none">
      <Canvas
        camera={{ position: [0, 3.8, 6.2], fov: 46 }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        shadows={{ type: THREE.PCFShadowMap }}
      >
        {/* Clean, Bright Laboratory Studio Atmosphere */}
        <color attach="background" args={["#f1f5f9"]} />
        <fog attach="fog" args={["#f1f5f9", 12, 25]} />

        {/* Realistic Modern Laboratory Illumination */}
        <ambientLight intensity={1.35} color="#ffffff" />
        <directionalLight
          position={[2, 10, 4]}
          intensity={1.9}
          castShadow
          color="#ffffff"
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4, 7, 5]} intensity={0.9} color="#f8fafc" />
        <directionalLight position={[4, 7, 5]} intensity={0.9} color="#f8fafc" />
        <directionalLight position={[0, 4, -4]} intensity={0.7} color="#e0f2fe" />
        <pointLight position={[0, 2.5, 0]} color="#ffffff" intensity={1.2} distance={8} />

        {/* Orbit Controls (Disabled when manipulating an object with hand or mouse) */}
        <OrbitControls
          enableZoom={!grabbedIdRef.current}
          enableRotate={!grabbedIdRef.current && !handTransform?.handDetected}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={2.5}
          maxDistance={12}
        />

        {/* Realistic Chemistry Practical Workbench & Lab Room Environment */}
        <LabWorkbench />

        {/* Interactive Chemical Vessels Simulation */}
        <VesselsSimulation
          vessels={vessels}
          setVessels={setVessels}
          handTransform={isLocked ? undefined : handTransform}
          grabbedIdRef={grabbedIdRef}
          onReactionDetected={onReactionDetected}
          activeReaction={activeReaction}
          reactions={reactions}
          isLocked={isLocked}
        />
      </Canvas>
    </div>
  );
}

// Realistic School & University Chemistry Practical Workbench & Lab Room Environment
function LabWorkbench() {
  return (
    <group position={[0, 0, 0]}>
      {/* =========================================================================
          1. REALISTIC LABORATORY ROOM (WALLS, TILES, CEILING LIGHTS)
          ========================================================================= */}
      {/* Light Grey Laboratory Vinyl Floor */}
      <mesh position={[0, -1.2, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.05} />
      </mesh>
      {/* Subtle Floor Tile Grout Lines */}
      <gridHelper args={[24, 24, "#cbd5e1", "#e2e8f0"]} position={[0, -1.19, 0]} />

      {/* Clean White Laboratory Back Wall */}
      <mesh position={[0, 3.2, -3.2]} receiveShadow>
        <planeGeometry args={[22, 9]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.02} />
      </mesh>

      {/* Ceramic Tile Grid on Wall */}
      <gridHelper args={[20, 20, "#e2e8f0", "#f1f5f9"]} position={[0, 3.2, -3.18]} rotation={[Math.PI / 2, 0, 0]} />

      {/* Laboratory Blue Dado Stripe on Back Wall */}
      <mesh position={[0, 1.45, -3.16]}>
        <boxGeometry args={[22, 0.08, 0.02]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} />
      </mesh>

      {/* Lab Safety & Room Banner Header */}
      <group position={[0, 2.7, -3.15]}>
        <mesh>
          <planeGeometry args={[6.2, 0.55]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.05} />
        </mesh>
        <mesh position={[0, -0.26, 0]}>
          <planeGeometry args={[6.2, 0.03]} />
          <meshBasicMaterial color="#0284c7" />
        </mesh>
        <Text
          position={[0, 0.06, 0.01]}
          fontSize={0.16}
          color="#0f172a"
          anchorX="center"
          anchorY="middle"
        >
          LABORATORIUM KIMIA PRAKTIKUM
        </Text>
        <Text
          position={[0, -0.12, 0.01]}
          fontSize={0.09}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          MEJA PRAKTIK SISWA • KESELAMATAN KERJA UTAMA
        </Text>
      </group>

      {/* Overhead Fluorescent Ceiling Light Panels */}
      <group position={[0, 5.2, 0]}>
        <mesh position={[-2.4, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 3.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
        <mesh position={[2.4, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 3.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* =========================================================================
          2. THE PRACTICAL LAB BENCH (MEJA PRAKTIK LABORATORIUM)
          ========================================================================= */}
      {/* Solid Chemical-Resistant White Epoxy Resin Countertop */}
      <mesh position={[0, -0.06, 0]} receiveShadow castShadow>
        <boxGeometry args={[8.6, 0.12, 4.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.18} metalness={0.05} />
      </mesh>

      {/* Countertop Edge Trim Band (Lab Cyan Accent) */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[8.64, 0.03, 4.24]} />
        <meshStandardMaterial color="#0284c7" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Heavy-Duty Industrial Powder-Coated Steel Frame & Legs */}
      {[
        [-3.9, -0.63, -1.8],
        [3.9, -0.63, -1.8],
        [-3.9, -0.63, 1.8],
        [3.9, -0.63, 1.8],
      ].map(([x, y, z], idx) => (
        <group key={`leg_${idx}`} position={[x, y, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.12, 1.02, 0.12]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Adjustable Leveling Foot */}
          <mesh position={[0, -0.52, 0]}>
            <cylinderGeometry args={[0.09, 0.09, 0.05, 16]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {/* Horizontal Steel Support Beams under Tabletop */}
      <mesh position={[0, -0.16, -1.8]}>
        <boxGeometry args={[7.7, 0.06, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, -0.16, 1.8]}>
        <boxGeometry args={[7.7, 0.06, 0.06]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[-3.9, -0.16, 0]}>
        <boxGeometry args={[0.06, 0.06, 3.6]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[3.9, -0.16, 0]}>
        <boxGeometry args={[0.06, 0.06, 3.6]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Practical Observation Area Mat on Center Tabletop */}
      <mesh position={[0, 0.002, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.2, 2.4]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.25}
          metalness={0.02}
        />
      </mesh>

      {/* Delicate Measurement Grid on Practical Mat */}
      <gridHelper args={[7.2, 18, "#0284c7", "#cbd5e1"]} position={[0, 0.004, 0]} />

      {/* =========================================================================
          3. REAGENT SERVICE RACK & AUTHENTIC EQUIPMENT (RAK ALAT PRAKTIK)
          ========================================================================= */}
      {/* Service Spine Riser at back of bench */}
      <mesh position={[0, 0.42, -1.8]} receiveShadow castShadow>
        <boxGeometry args={[8.6, 0.84, 0.22]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.25} metalness={0.05} />
      </mesh>

      {/* Dual-Tier Reagent Shelf */}
      <group position={[0, 0.85, -1.65]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[7.8, 0.04, 0.38]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Shelf Front Guard Rail */}
        <mesh position={[0, 0.04, 0.18]}>
          <boxGeometry args={[7.8, 0.05, 0.02]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Equipment Props on the Reagent Shelf: */}
      {/* A. Chrome Goose-Neck Laboratory Water Tap (Kran Leher Angsa) */}
      <group position={[2.8, 0.88, -1.65]}>
        {/* Tap Base */}
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.08, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Vertical Stem */}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.38, 16]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.08} />
        </mesh>
        {/* Curved Goose-Neck Arch */}
        <mesh position={[-0.1, 0.45, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.12, 0.028, 16, 24, Math.PI]} />
          <meshStandardMaterial color="#f8fafc" metalness={0.95} roughness={0.08} />
        </mesh>
        {/* Faucet Dual Handles */}
        <mesh position={[0.08, 0.12, 0]}>
          <boxGeometry args={[0.08, 0.025, 0.025]} />
          <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* B. Laboratory Wash Bottles (Aquades Spray Bottles) */}
      <group position={[-2.8, 0.88, -1.65]}>
        {/* Polyethylene Bottle Body */}
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.28, 20]} />
          <meshPhysicalMaterial color="#ffffff" transparent opacity={0.7} roughness={0.15} />
        </mesh>
        {/* Screw Cap */}
        <mesh position={[0, 0.30, 0]}>
          <cylinderGeometry args={[0.045, 0.045, 0.05, 16]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>
        {/* Angled Dispensing Nozzle */}
        <mesh position={[-0.04, 0.36, 0]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.012, 0.012, 0.12, 12]} />
          <meshStandardMaterial color="#0284c7" roughness={0.3} />
        </mesh>
        <Text position={[0, 0.14, 0.095]} fontSize={0.04} color="#0284c7" anchorX="center" anchorY="middle">
          AQUADES
        </Text>
      </group>

      {/* C. Secondary Reagent Stock Bottles on Shelf */}
      {[
        { x: -1.6, label: "Etanol 96%", color: "#f8fafc", capColor: "#dc2626" },
        { x: -0.9, label: "H2O Murni", color: "#e0f2fe", capColor: "#0284c7" },
        { x: -0.2, label: "Indikator PP", color: "#fce7f3", capColor: "#db2777" },
        { x: 0.6, label: "Buffer pH 7", color: "#fef3c7", capColor: "#d97706" },
        { x: 1.4, label: "Garam NaCl", color: "#f8fafc", capColor: "#16a34a" },
      ].map((bottle) => (
        <group key={bottle.x} position={[bottle.x, 0.88, -1.65]}>
          {/* Amber or Clear Reagent Bottle */}
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.075, 0.075, 0.24, 20]} />
            <meshPhysicalMaterial color={bottle.color} transparent opacity={0.65} roughness={0.08} />
          </mesh>
          {/* Cap */}
          <mesh position={[0, 0.26, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.045, 16]} />
            <meshStandardMaterial color={bottle.capColor} roughness={0.3} />
          </mesh>
          {/* Label Card */}
          <Text
            position={[0, 0.12, 0.08]}
            fontSize={0.038}
            color="#0f172a"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.005}
            outlineColor="#ffffff"
          >
            {bottle.label}
          </Text>
        </group>
      ))}

      {/* D. Electrical Power Socket Box on Service Spine */}
      <group position={[3.6, 0.25, -1.68]}>
        <mesh>
          <boxGeometry args={[0.35, 0.22, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.2} />
        </mesh>
        <mesh position={[-0.08, 0, 0.03]}>
          <circleGeometry args={[0.045, 16]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
        <mesh position={[0.08, 0, 0.03]}>
          <circleGeometry args={[0.045, 16]} />
          <meshBasicMaterial color="#334155" />
        </mesh>
      </group>
    </group>
  );
}

// Clean and sanitize chemical symbols for 3D Text rendering (avoids missing glyph box [X] from Unicode subscripts)
export function sanitizeChemicalText(text?: string, maxLen = 42): string {
  if (!text) return "";
  let clean = text
    .replace(/₂/g, "2")
    .replace(/₃/g, "3")
    .replace(/₄/g, "4")
    .replace(/₅/g, "5")
    .replace(/₆/g, "6")
    .replace(/₇/g, "7")
    .replace(/₈/g, "8")
    .replace(/₉/g, "9")
    .replace(/₀/g, "0")
    .replace(/⁺/g, "+")
    .replace(/⁻/g, "-")
    .replace(/•/g, "·")
    .replace(/R-COO-R'/gi, "Minyak (Lipid)")
    .replace(/R-COO-R/gi, "Minyak (Lipid)")
    .trim();

  if (maxLen && clean.length > maxLen) {
    clean = clean.substring(0, maxLen - 1) + "…";
  }
  return clean;
}

// Strip phase notations like (aq), (s), (l), (g) and non-alphanumeric chars for robust chemistry matching
export function normChemical(s?: string): string {
  if (!s) return "";
  return sanitizeChemicalText(s, 100)
    .replace(/\s*\((aq|s|l|g|padat|cair|gas|larutan)\)/gi, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();
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
  isLocked = false,
}: {
  vessels: ChemicalVessel[];
  setVessels: React.Dispatch<React.SetStateAction<ChemicalVessel[]>>;
  handTransform?: HandTransform;
  grabbedIdRef: React.MutableRefObject<string | null>;
  onReactionDetected?: (reaction: ReactionDetail, vesselA: ChemicalVessel, vesselB: ChemicalVessel) => void;
  activeReaction: ReactionDetail | null;
  reactions?: ReactionDetail[];
  isLocked?: boolean;
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
  const grabbedTiltRef = useRef<number>(0);

  // 60 FPS Animation & Proximity Loop
  useFrame((state, delta) => {
    if (isLocked) {
      if (grabbedIdRef.current) grabbedIdRef.current = null;
      if (mouseDraggedId) setMouseDraggedId(null);
      if (pouringTargetId) setPouringTargetId(null);
      setTargetedId(null);
      grabbedTiltRef.current = THREE.MathUtils.lerp(grabbedTiltRef.current, 0, 0.2);
      if (handSphereRef.current) handSphereRef.current.visible = false;
      return;
    }

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
        handSphereRef.current.position.lerp(effectiveHandPos, 0.75);
        const targetScale = isGrabbing ? 0.22 : 0.16;
        handSphereRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.45);
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
      ? Math.abs(wristAngle) > 0.35 // Rotasi pergelangan tangan melebihi ~20 derajat
      : Boolean(mouseDraggedId);

    if (activeGrabbedId) {
      const activeVessel = vesselsRef.current.find((v) => v.id === activeGrabbedId);
      if (activeVessel) {
        let nearestOtherId: string | null = null;
        let minProximity = 2.8; // Jarak jangkauan nyaman untuk menuangkan

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

        // Update physical tilt angle of grabbed vessel
        let targetTilt = 0;
        if (isHandActive) {
          targetTilt = THREE.MathUtils.clamp(-wristAngle * 1.15, -1.35, 1.35);
        } else if (nearestOtherId) {
          const targetV = vesselsRef.current.find((v) => v.id === nearestOtherId);
          if (targetV) {
            const dx = targetV.position[0] - activeVessel.position[0];
            targetTilt = dx > 0 ? -0.85 : 0.85;
          }
        }
        grabbedTiltRef.current = THREE.MathUtils.lerp(grabbedTiltRef.current, targetTilt, 0.25);

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
      grabbedTiltRef.current = THREE.MathUtils.lerp(grabbedTiltRef.current, 0, 0.2);
    }

    // Move grabbed vessel with hand palm center
    if (grabbedIdRef.current && effectiveHandPos) {
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === grabbedIdRef.current) {
            return {
              ...v,
              position: [
                THREE.MathUtils.lerp(v.position[0], effectiveHandPos.x, 0.70),
                THREE.MathUtils.lerp(v.position[1], Math.max(0.7, effectiveHandPos.y + 0.35), 0.70),
                THREE.MathUtils.lerp(v.position[2], effectiveHandPos.z, 0.70),
              ],
            };
          }
          return v;
        })
      );
    }
  });

  // Reaction Matcher (Deterministic DB / Catalog Rules + Safe Fallback Physical Mixture)
  const checkAndTriggerReaction = async (vesselA: ChemicalVessel, vesselB: ChemicalVessel) => {
    // Unique key identifying this specific pair of beakers/flasks by ID (prevents re-trigger loops)
    const vesselPairKey = [vesselA.id, vesselB.id].sort().join("::");
    const now = Date.now();

    // Prevent re-triggering within 3.5 seconds for this specific vessel pair
    if (reactionCooldownRef.current[vesselPairKey] && now - reactionCooldownRef.current[vesselPairKey] < 3500) {
      return;
    }

    const fA = normChemical(vesselA.formula);
    const fB = normChemical(vesselB.formula);

    // 1. GUARD: Self-pouring or pouring identical chemicals (e.g. NaOH into NaOH, H2O into H2O)
    // NEVER trigger reaction or concatenate formulas for identical substances!
    if (
      fA === fB ||
      (fA.length > 1 && fB.length > 1 && (fA === fB || (fA.includes(fB) && fB.includes(fA))))
    ) {
      reactionCooldownRef.current[vesselPairKey] = now;
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === vesselB.id) {
            return {
              ...v,
              liquidLevel: Math.min(0.85, v.liquidLevel + 0.1),
            };
          }
          return v;
        })
      );
      return;
    }

    // 2. GUARD: Dilution (pouring water into an already aqueous solution)
    if (fA === "H2O" && (vesselB.formula.toLowerCase().includes("aq") || vesselB.formula.toLowerCase().includes("h2o"))) {
      reactionCooldownRef.current[vesselPairKey] = now;
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === vesselB.id) {
            return {
              ...v,
              liquidLevel: Math.min(0.85, v.liquidLevel + 0.1),
            };
          }
          return v;
        })
      );
      return;
    }

    // 3. GUARD: Target vessel already contains this reactant or already underwent this mixture
    // (Prevents recursive A + B + A + B... loops)
    if (fB.includes(fA) || (vesselB.formula && vesselB.formula.includes(sanitizeChemicalText(vesselA.formula, 20)))) {
      reactionCooldownRef.current[vesselPairKey] = now;
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === vesselB.id) {
            return {
              ...v,
              liquidLevel: Math.min(0.85, v.liquidLevel + 0.08),
            };
          }
          return v;
        })
      );
      return;
    }

    // Target vessel position for localized particles
    const rxPos: [number, number, number] = [
      vesselB.position[0],
      vesselB.position[1] + 0.6,
      vesselB.position[2],
    ];

    // Step 1: Match in dynamic database reactions or reliable local catalog
    const dbMatch = dbReactions.find((rx) => {
      const rxA = normChemical(rx.substanceA);
      const rxB = normChemical(rx.substanceB);
      return (rxA === fA && rxB === fB) || (rxA === fB && rxB === fA);
    });

    const catalogMatch = !dbMatch
      ? REACTION_CATALOG.find((rx) => {
          const rxA = normChemical(rx.reactantAFormula);
          const rxB = normChemical(rx.reactantBFormula);
          return (rxA === fA && rxB === fB) || (rxA === fB && rxB === fA);
        })
      : null;

    const matched: ReactionDetail | null = dbMatch
      ? dbMatch
      : catalogMatch
      ? {
          id: catalogMatch.id,
          title: catalogMatch.title,
          equation: catalogMatch.equation,
          substanceA: catalogMatch.reactantAFormula,
          substanceB: catalogMatch.reactantBFormula,
          resultName: catalogMatch.productName,
          resultFormula: catalogMatch.productFormula,
          resultColor: catalogMatch.productColor,
          effectType: catalogMatch.visualEffect,
          temperatureChange: catalogMatch.temperatureChangeC,
          explanation: catalogMatch.explanation,
          level: catalogMatch.level,
        }
      : null;

    if (matched) {
      // If target vessel already underwent this exact reaction, just top up volume
      if (
        vesselB.isReacted &&
        (vesselB.reactionNote === matched.title || normChemical(vesselB.formula) === normChemical(matched.resultFormula))
      ) {
        reactionCooldownRef.current[vesselPairKey] = now;
        setVessels((prev) =>
          prev.map((v) => (v.id === vesselB.id ? { ...v, liquidLevel: Math.min(0.85, v.liquidLevel + 0.1) } : v))
        );
        return;
      }

      reactionCooldownRef.current[vesselPairKey] = now;

      // Transform target vessel B's appearance (color, volume, note)
      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === vesselB.id) {
            return {
              ...v,
              color: matched.resultColor,
              name: matched.resultName,
              formula: matched.resultFormula,
              liquidLevel: Math.min(0.85, v.liquidLevel + 0.15),
              temperatureC: (v.temperatureC || 25) + matched.temperatureChange,
              isReacted: true,
              reactionNote: matched.title,
            };
          }
          return v;
        })
      );

      onReactionDetected?.({ ...matched, reactionPosition: rxPos, targetVesselId: vesselB.id }, vesselA, vesselB);
      return;
    }

    // Step 2: DETERMINISTIC SCIENTIFIC PHYSICAL MIXTURE (Zero Token Dependency, 100% Reliable & Fast)
    reactionCooldownRef.current[vesselPairKey] = now;

    // Check if this is an Oil & Water Immiscible Emulsion System
    const isOilWater =
      (fA.includes("LIPID") || fA.includes("MINYAK") || fB.includes("LIPID") || fB.includes("MINYAK")) &&
      (fA.includes("H2O") || fA.includes("AIR") || fB.includes("H2O") || fB.includes("AIR"));

    if (isOilWater) {
      const physicalReaction: ReactionDetail = {
        id: `rx_lipid_water_${Date.now()}`,
        title: "Pemisahan Dua Fasa (Minyak & Air Tidak Menyatu)",
        equation: "H2O (Air) + Minyak -> Sistem Dua Fasa (Emulsi Tidak Stabil)",
        substanceA: vesselA.formula,
        substanceB: vesselB.formula,
        resultName: "Air & Minyak (Dua Lapisan Terpisah)",
        resultFormula: "H2O // Lipid",
        resultColor: "#eab308",
        effectType: "two_phase",
        temperatureChange: 0,
        explanation: "Minyak bersifat nonpolar sedangkan air bersifat polar. Keduanya memiliki tegangan antarmuka tinggi dan densitas berbeda sehingga minyak mengapung di atas air tanpa bercampur secara molekuler.",
        level: "SMP",
        reactionPosition: rxPos,
        targetVesselId: vesselB.id,
      };

      setVessels((prev) =>
        prev.map((v) => {
          if (v.id === vesselB.id) {
            return {
              ...v,
              color: physicalReaction.resultColor,
              name: physicalReaction.resultName,
              formula: physicalReaction.resultFormula,
              liquidLevel: Math.min(0.85, v.liquidLevel + 0.15),
              temperatureC: v.temperatureC || 25,
              isReacted: true,
              reactionNote: physicalReaction.title,
            };
          }
          return v;
        })
      );

      onReactionDetected?.(physicalReaction, vesselA, vesselB);
      return;
    }

    // General Physical Solution Mixture: Clean, concise and capped formatting
    const colA = new THREE.Color(vesselA.color || "#38bdf8");
    const colB = new THREE.Color(vesselB.color || "#38bdf8");
    const blendedColor = "#" + colA.lerp(colB, 0.5).getHexString();

    const cleanFormA = sanitizeChemicalText(vesselA.formula, 14);
    const cleanFormB = sanitizeChemicalText(vesselB.formula, 14);
    const cleanNameA = sanitizeChemicalText(vesselA.name, 18).replace(/Campuran\s*/gi, "");
    const cleanNameB = sanitizeChemicalText(vesselB.name, 18).replace(/Campuran\s*/gi, "");

    const compactFormula = `${cleanFormA} + ${cleanFormB}`;
    const compactName = `Campuran ${cleanNameA} & ${cleanNameB}`;

    const physicalReaction: ReactionDetail = {
      id: `mix_${fA}_${fB}_${Date.now()}`,
      title: `Campuran Larutan ${cleanFormA} & ${cleanFormB}`,
      equation: `${cleanFormA} + ${cleanFormB} -> Campuran Fisik Homogen`,
      substanceA: vesselA.formula,
      substanceB: vesselB.formula,
      resultName: compactName,
      resultFormula: compactFormula,
      resultColor: blendedColor,
      effectType: "color_change",
      temperatureChange: 0,
      explanation: "Kedua zat berbaur membentuk campuran larutan homogen tanpa reaksi kimia khusus. Suhu bejana tetap stabil pada suhu ruang.",
      level: "SMP",
      reactionPosition: rxPos,
      targetVesselId: vesselB.id,
    };

    setVessels((prev) =>
      prev.map((v) => {
        if (v.id === vesselB.id) {
          return {
            ...v,
            color: physicalReaction.resultColor,
            name: physicalReaction.resultName,
            formula: physicalReaction.resultFormula,
            liquidLevel: Math.min(0.85, v.liquidLevel + 0.15),
            temperatureC: v.temperatureC || 25,
            isReacted: true,
            reactionNote: physicalReaction.title,
          };
        }
        return v;
      })
    );

    onReactionDetected?.(physicalReaction, vesselA, vesselB);
  };

  // Mouse Drag Handlers
  const handlePointerDown = (id: string, e: ThreeEvent<PointerEvent>) => {
    if (isLocked) return;
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
  const activeGrabbedId = mouseDraggedId || grabbedIdRef.current;

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
        const isReacting =
          activeReaction?.targetVesselId === vessel.id ||
          (Boolean(activeReaction && !activeReaction.targetVesselId) && Boolean(vessel.isReacted));

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
            activeReactionEffect={isReacting ? activeReaction : null}
            onPointerDown={(e) => handlePointerDown(vessel.id, e)}
          />
        );
      })}

      {/* World-Space Smooth Gravitational Pouring Stream */}
      {activeGrabbedId && (
        <RealisticFluidPouringStream
          sourceId={activeGrabbedId}
          targetId={pouringTargetId}
          vesselsRef={vesselsRef}
          grabbedTiltRef={grabbedTiltRef}
        />
      )}
    </group>
  );
}

// Helper to detect clear / water-like chemical solutions
// IMPORTANT: Only returns true for UNREACTED pure clear chemicals.
// Reaction products with specific colors (e.g. #eab308 yellow oil) must NOT be flagged clear.
function checkIsClearLiquid(formula?: string, name?: string, color?: string, isReacted?: boolean): boolean {
  // If this vessel already reacted and has a non-clear product color, it is NOT clear
  const c = (color || "").toLowerCase().trim();
  if (isReacted) {
    // Only a very narrow set of product colors remain clear after reacting
    const clearProductColors = ["#ffffff", "#f8fafc", "#f1f5f9", "#e2e8f0", "#e0f2fe", "#e0f7fa", "#f0fdf4"];
    return clearProductColors.includes(c);
  }

  const f = (formula || "").toUpperCase().trim();
  const n = (name || "").toLowerCase().trim();

  // Clear chemicals: Water, dilute acids, bases, salt solutions (unreacted originals only)
  if (["H2O", "HCL", "NAOH", "CH3COOH", "NACL", "KI", "PB(NO3)2"].includes(f)) return true;
  if (
    n.includes("air murni") ||
    n.includes("asam klorida") ||
    n.includes("natrium hidroksida") ||
    n.includes("cuka") ||
    n.includes("bening") ||
    n.includes("kalium iodida") ||
    n.includes("timbal") ||
    n.includes("garam dapur")
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

// Helper to check if a reaction product is an immiscible two-phase system (oil/water separation)
function checkIsTwoPhaseSystem(formula?: string, name?: string): boolean {
  const f = (formula || "").toUpperCase();
  const n = (name || "").toLowerCase();
  return (
    f.includes("//") ||
    f.includes("R-COO-R") ||
    n.includes("berlapis") ||
    n.includes("dua fasa") ||
    n.includes("dua lapisan") ||
    n.includes("tidak menyatu") ||
    (n.includes("minyak") && n.includes("air"))
  );
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
  activeReactionEffect,
  onPointerDown,
}: {
  vessel: ChemicalVessel;
  isGrabbed: boolean;
  isTargeted: boolean;
  isBeingPouredInto: boolean;
  wristAngle: number;
  isHandActive: boolean;
  targetPosition?: [number, number, number];
  activeReactionEffect?: ReactionDetail | null;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
}) {
  const meshGroupRef = useRef<THREE.Group>(null);
  const liquidMeshRef = useRef<THREE.Mesh>(null);
  const liquidMaterialRef = useRef<THREE.MeshPhysicalMaterial>(null);

  const isClear = checkIsClearLiquid(vessel.formula, vessel.name, vessel.color, vessel.isReacted);
  const isTwoPhase = checkIsTwoPhaseSystem(vessel.formula, vessel.name);

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
      // Fast color lerp: reacted products show their color vividly and quickly
      const lerpSpeed = vessel.isReacted ? 0.35 : 0.08;
      liquidMaterialRef.current.color.lerp(targetColor, lerpSpeed);

      // Reacted products get stronger emissive glow so they're visible against white lab
      if (isBeingPouredInto || vessel.isReacted) {
        const baseEmissive = isClear ? 0.15 : (vessel.isReacted ? 0.65 : 0.45);
        liquidMaterialRef.current.emissiveIntensity =
          baseEmissive + Math.sin(Date.now() * 0.008) * 0.25;
      } else {
        liquidMaterialRef.current.emissiveIntensity = isClear ? 0.08 : 0.28;
      }

      // Reacted product liquid should be more opaque (less transparent) for visibility
      if (vessel.isReacted && !isClear) {
        liquidMaterialRef.current.opacity = THREE.MathUtils.lerp(
          liquidMaterialRef.current.opacity,
          0.92,
          0.1
        );
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
          isTwoPhase={isTwoPhase}
        />
      ) : vessel.type === "test_tube" ? (
        <TestTubeModel
          vessel={vessel}
          liquidMeshRef={liquidMeshRef}
          liquidMaterialRef={liquidMaterialRef}
          isClear={isClear}
          isBeingPouredInto={isBeingPouredInto}
          isTwoPhase={isTwoPhase}
        />
      ) : (
        <BeakerModel
          vessel={vessel}
          liquidMeshRef={liquidMeshRef}
          liquidMaterialRef={liquidMaterialRef}
          isClear={isClear}
          isBeingPouredInto={isBeingPouredInto}
          isTwoPhase={isTwoPhase}
        />
      )}

      {/* Synchronized Reaction Visual Effects (Anchored directly inside vessel group!) */}
      {activeReactionEffect && (
        <ReactionVisualEffects
          effectType={activeReactionEffect.effectType}
          colorHex={activeReactionEffect.resultColor}
          vesselType={vessel.type}
          liquidLevel={vessel.liquidLevel || 0.65}
          isTwoPhase={isTwoPhase}
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
            maxWidth={1.8}
            textAlign="center"
          >
            {sanitizeChemicalText(vessel.formula, 24)}
          </Text>
          <Text
            position={[0, -0.16, 0]}
            fontSize={0.09}
            color="#94a3b8"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.015}
            outlineColor="#000000"
            maxWidth={2.2}
            textAlign="center"
          >
            {sanitizeChemicalText(vessel.name, 32)}
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
  isTwoPhase = false,
}: {
  vessel: ChemicalVessel;
  liquidMeshRef: React.RefObject<THREE.Mesh | null>;
  liquidMaterialRef: React.RefObject<any>;
  isClear: boolean;
  isBeingPouredInto: boolean;
  isTwoPhase?: boolean;
}) {
  const radius = 0.42;
  const height = 0.95;
  const liquidHeight = Math.max(0.12, height * (vessel.liquidLevel || 0.65));

  return (
    <group>
      {/* 0. Illuminated Laboratory Observation Pod (Provides bright backlight through the liquid!) */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[radius * 1.15, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Upward Liquid Illumination */}
      <pointLight position={[0, 0.28, 0]} color={vessel.color} intensity={2.2} distance={2.5} />

      {/* 1. Crystal Clear Borosilicate Glass Cylinder Body */}
      <mesh castShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 0.96, height, 36, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.35}
          roughness={0.04}
          metalness={0.1}
          reflectivity={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.03}
        />
      </mesh>

      {/* Glass Base Bottom */}
      <mesh position={[0, 0.025, 0]}>
        <cylinderGeometry args={[radius * 0.96, radius * 0.96, 0.05, 36]} />
        <meshPhysicalMaterial color="#f8fafc" transparent opacity={0.65} roughness={0.08} metalness={0.1} />
      </mesh>

      {/* Rolled Beaker Glass Lip Rim (Lies flat horizontally on top rim) */}
      <mesh position={[0, height, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius, 0.024, 16, 36]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.7} roughness={0.05} metalness={0.1} />
      </mesh>

      {/* Pouring Spout Notch at Top Lip */}
      <mesh position={[-radius * 0.95, height - 0.01, 0]} rotation={[0, 0, 0.45]}>
        <coneGeometry args={[0.07, 0.12, 16, 1, true]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.65} roughness={0.05} />
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
              <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
            </mesh>
            <Text
              position={[0.04, 0, 0]}
              fontSize={0.055}
              color="#0f172a"
              anchorX="left"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#ffffff"
            >
              {mark.label}
            </Text>
          </group>
        ))}
        {/* Lab Glassware Brand Stamp */}
        <Text
          position={[0, 0.12, 0]}
          fontSize={0.045}
          color="#334155"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.006}
          outlineColor="#ffffff"
        >
          BORO 3.3 • 250ml
        </Text>
      </group>

      {/* 2. Luminous Radiant Liquid Body (Vibrantly Visible!) */}
      {isTwoPhase ? (
        /* TWO-PHASE IMMISCIBLE LIQUID: Lower Water Layer + Upper Oil Layer */
        <group>
          {/* Bottom Layer: Water (clear blue, lower 60%) */}
          <mesh position={[0, (liquidHeight * 0.6) / 2 + 0.035, 0]}>
            <cylinderGeometry
              args={[radius * 0.93, radius * 0.90, liquidHeight * 0.6, 32]}
            />
            <meshStandardMaterial
              color="#60a5fa"
              emissive="#60a5fa"
              emissiveIntensity={0.35}
              roughness={0.12}
              metalness={0.1}
              transparent
              opacity={0.82}
            />
          </mesh>

          {/* Separation Boundary Line (Visible meniscus between oil and water) */}
          <mesh position={[0, liquidHeight * 0.6 + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 0.80, radius * 0.93, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
          </mesh>

          {/* Top Layer: Oil (yellow, upper 40% — floats because density < water) */}
          <mesh
            ref={liquidMeshRef as any}
            position={[0, liquidHeight * 0.6 + (liquidHeight * 0.4) / 2 + 0.035, 0]}
          >
            <cylinderGeometry
              args={[radius * 0.93, radius * 0.93, liquidHeight * 0.4, 32]}
            />
            <meshStandardMaterial
              ref={liquidMaterialRef}
              color={vessel.color}
              emissive={vessel.color}
              emissiveIntensity={0.65}
              roughness={0.15}
              metalness={0.05}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Oil Surface Gloss */}
          <mesh position={[0, liquidHeight + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius * 0.92, 32]} />
            <meshStandardMaterial
              color={vessel.color}
              emissive={vessel.color}
              emissiveIntensity={0.7}
              roughness={0.06}
              metalness={0.15}
              transparent
              opacity={0.92}
            />
          </mesh>
        </group>
      ) : (
        /* SINGLE-PHASE UNIFORM LIQUID */
        <group>
          <mesh
            ref={liquidMeshRef as any}
            position={[0, liquidHeight / 2 + 0.035, 0]}
          >
            <cylinderGeometry
              args={[radius * 0.93, radius * 0.90, liquidHeight, 32]}
            />
            <meshStandardMaterial
              ref={liquidMaterialRef}
              color={vessel.color}
              emissive={vessel.color}
              emissiveIntensity={vessel.isReacted ? 0.65 : 0.55}
              roughness={0.12}
              metalness={0.1}
              transparent
              opacity={vessel.isReacted && !isClear ? 0.92 : 0.88}
            />
          </mesh>
        </group>
      )}

      {/* Liquid Top Meniscus Gloss Surface (only for single-phase) */}
      {!isTwoPhase && (
        <mesh position={[0, liquidHeight + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.92, 32]} />
          <meshStandardMaterial
            color={vessel.color}
            emissive={vessel.color}
            emissiveIntensity={vessel.isReacted ? 0.7 : 0.65}
            roughness={0.04}
            metalness={0.2}
            transparent
            opacity={0.95}
          />
        </mesh>
      )}

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
  isTwoPhase = false,
}: {
  vessel: ChemicalVessel;
  liquidMeshRef: React.RefObject<THREE.Mesh | null>;
  liquidMaterialRef: React.RefObject<any>;
  isClear: boolean;
  isBeingPouredInto: boolean;
  isTwoPhase?: boolean;
}) {
  const coneHeight = 0.65;
  const neckHeight = 0.38;
  const baseRadius = 0.49;
  const neckRadius = 0.22;
  const totalHeight = coneHeight + neckHeight;

  // Realistic lab practice: Liquid stays cleanly inside conical flask body (below 300ml graduation mark)
  const effectiveLiquidH = Math.min(
    coneHeight * 0.88,
    Math.max(0.18, coneHeight * (vessel.liquidLevel || 0.65))
  );

  return (
    <group>
      {/* 0. Illuminated Laboratory Observation Pod */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[baseRadius * 1.15, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Upward Liquid Illumination */}
      <pointLight
        position={[0, 0.28, 0]}
        color={isTwoPhase ? "#f59e0b" : vessel.color}
        intensity={2.2}
        distance={2.5}
      />

      {/* 1. Conical Lower Body Glass */}
      <mesh castShadow position={[0, coneHeight / 2 + 0.03, 0]}>
        <cylinderGeometry
          args={[neckRadius, baseRadius, coneHeight, 36, 1, true]}
        />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.35}
          roughness={0.04}
          metalness={0.1}
          reflectivity={0.9}
          clearcoat={1.0}
        />
      </mesh>

      {/* Cylindrical Neck Glass */}
      <mesh castShadow position={[0, coneHeight + neckHeight / 2 + 0.03, 0]}>
        <cylinderGeometry
          args={[neckRadius, neckRadius, neckHeight, 36, 1, true]}
        />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.35}
          roughness={0.04}
          metalness={0.1}
          reflectivity={0.9}
          clearcoat={1.0}
        />
      </mesh>

      {/* Flared Rim Lip (Lies flat horizontally on top rim) */}
      <mesh position={[0, totalHeight + 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[neckRadius * 1.15, 0.022, 16, 36]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.7} roughness={0.05} metalness={0.1} />
      </mesh>

      {/* Base Bottom */}
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[baseRadius * 0.98, baseRadius * 0.98, 0.05, 36]} />
        <meshPhysicalMaterial color="#f8fafc" transparent opacity={0.65} roughness={0.08} metalness={0.1} />
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
              <meshBasicMaterial color="#0f172a" transparent opacity={0.85} />
            </mesh>
            <Text
              position={[0.04, 0, 0]}
              fontSize={0.05}
              color="#0f172a"
              anchorX="left"
              anchorY="middle"
              outlineWidth={0.008}
              outlineColor="#ffffff"
            >
              {m.label}
            </Text>
          </group>
        ))}
      </group>

      {/* Conical Liquid Inside */}
      {isTwoPhase ? (
        /* =========================================================================
           TWO-PHASE IMMISCIBLE FLUID: ERLENMEYER FLASK
           Lower Layer: Water (H2O, Blue/Clear) | Upper Layer: Oil (Lipid, Golden Yellow)
           Confined cleanly inside the conical body!
           ========================================================================= */
        <group>
          {/* 1. LOWER LAYER: Water (H2O, 55% of volume, bottom of cone) */}
          {(() => {
            const waterH = effectiveLiquidH * 0.54;
            const rWaterBottom = baseRadius * 0.94;
            const rBoundary =
              baseRadius * 0.94 -
              (baseRadius * 0.94 - neckRadius * 0.92) * (waterH / coneHeight);

            return (
              <group>
                <mesh position={[0, waterH / 2 + 0.035, 0]}>
                  <cylinderGeometry
                    args={[rBoundary, rWaterBottom, waterH, 32]}
                  />
                  <meshStandardMaterial
                    color="#38bdf8"
                    emissive="#0284c7"
                    emissiveIntensity={0.50}
                    roughness={0.08}
                    metalness={0.1}
                    transparent
                    opacity={0.82}
                  />
                </mesh>

                {/* Phase Boundary Disc (Meniscus line separating water and oil) */}
                <mesh position={[0, waterH + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[rBoundary * 0.99, 32]} />
                  <meshStandardMaterial
                    color="#fef08a"
                    emissive="#ca8a04"
                    emissiveIntensity={0.6}
                    roughness={0.05}
                    transparent
                    opacity={0.65}
                  />
                </mesh>
              </group>
            );
          })()}

          {/* 2. UPPER LAYER: Oil (Lipid, 46% of volume, sits on top of water) */}
          {(() => {
            const waterH = effectiveLiquidH * 0.54;
            const oilH = effectiveLiquidH * 0.46;
            const rBoundary =
              baseRadius * 0.94 -
              (baseRadius * 0.94 - neckRadius * 0.92) * (waterH / coneHeight);
            const rOilTop =
              baseRadius * 0.94 -
              (baseRadius * 0.94 - neckRadius * 0.92) * (effectiveLiquidH / coneHeight);

            return (
              <mesh
                ref={liquidMeshRef as any}
                position={[0, waterH + oilH / 2 + 0.035, 0]}
              >
                <cylinderGeometry
                  args={[rOilTop, rBoundary, oilH, 32]}
                />
                <meshStandardMaterial
                  color="#eab308"
                  emissive="#ca8a04"
                  emissiveIntensity={0.80}
                  roughness={0.12}
                  metalness={0.08}
                  transparent
                  opacity={0.92}
                />
              </mesh>
            );
          })()}

          {/* Top Oil Meniscus Gloss Surface */}
          {(() => {
            const rOilTop =
              baseRadius * 0.94 -
              (baseRadius * 0.94 - neckRadius * 0.92) * (effectiveLiquidH / coneHeight);

            return (
              <mesh position={[0, effectiveLiquidH + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[rOilTop, 32]} />
                <meshStandardMaterial
                  color="#fbbf24"
                  emissive="#d97706"
                  emissiveIntensity={0.85}
                  roughness={0.04}
                  metalness={0.2}
                  transparent
                  opacity={0.95}
                />
              </mesh>
            );
          })()}
        </group>
      ) : (
        /* SINGLE-PHASE UNIFORM CONICAL LIQUID */
        <group>
          {(() => {
            const rTop =
              baseRadius * 0.94 -
              (baseRadius * 0.94 - neckRadius * 0.92) * (effectiveLiquidH / coneHeight);

            return (
              <group>
                <mesh
                  ref={liquidMeshRef as any}
                  position={[0, effectiveLiquidH / 2 + 0.035, 0]}
                >
                  <cylinderGeometry
                    args={[rTop, baseRadius * 0.94, effectiveLiquidH, 32]}
                  />
                  <meshStandardMaterial
                    ref={liquidMaterialRef}
                    color={vessel.color}
                    emissive={vessel.color}
                    emissiveIntensity={vessel.isReacted ? 0.65 : 0.55}
                    roughness={0.12}
                    metalness={0.1}
                    transparent
                    opacity={vessel.isReacted && !isClear ? 0.92 : 0.88}
                  />
                </mesh>

                {/* Top Meniscus Gloss Surface */}
                <mesh position={[0, effectiveLiquidH + 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[rTop, 32]} />
                  <meshStandardMaterial
                    color={vessel.color}
                    emissive={vessel.color}
                    emissiveIntensity={0.65}
                    roughness={0.04}
                    metalness={0.2}
                    transparent
                    opacity={0.95}
                  />
                </mesh>
              </group>
            );
          })()}
        </group>
      )}

      <InFluidMicroBubbles radius={baseRadius * 0.75} height={effectiveLiquidH} />
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
  isTwoPhase = false,
}: {
  vessel: ChemicalVessel;
  liquidMeshRef: React.RefObject<THREE.Mesh | null>;
  liquidMaterialRef: React.RefObject<any>;
  isClear: boolean;
  isBeingPouredInto: boolean;
  isTwoPhase?: boolean;
}) {
  const radius = 0.18;
  const tubeHeight = 1.0;
  const liquidHeight = Math.max(0.12, tubeHeight * (vessel.liquidLevel || 0.6));

  return (
    <group>
      {/* 0. Illuminated Laboratory Observation Pod */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.38, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
      {/* Upward Liquid Illumination */}
      <pointLight position={[0, 0.28, 0]} color={vessel.color} intensity={2.0} distance={2.5} />

      {/* 1. Cylindrical Tube Wall Glass */}
      <mesh castShadow position={[0, tubeHeight / 2 + radius, 0]}>
        <cylinderGeometry args={[radius, radius, tubeHeight, 32, 1, true]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.35}
          roughness={0.04}
          metalness={0.1}
          reflectivity={0.9}
          clearcoat={1.0}
        />
      </mesh>

      {/* Hemispherical Round Bottom Dome Glass */}
      <mesh position={[0, radius, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry
          args={[radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
        />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.35}
          roughness={0.04}
          metalness={0.1}
          reflectivity={0.9}
        />
      </mesh>

      {/* Flared Glass Top Lip Rim (Lies flat horizontally on top rim) */}
      <mesh position={[0, tubeHeight + radius, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[radius * 1.08, 0.018, 16, 32]} />
        <meshPhysicalMaterial color="#ffffff" transparent opacity={0.7} roughness={0.05} metalness={0.1} />
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

      {/* 2. Luminous Radiant Liquid Inside */}
      {isTwoPhase ? (
        <group>
          {/* Lower Water Layer */}
          <mesh position={[0, (liquidHeight * 0.55) / 2 + radius, 0]}>
            <cylinderGeometry args={[radius * 0.92, radius * 0.92, liquidHeight * 0.55, 32]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={0.45}
              roughness={0.08}
              transparent
              opacity={0.82}
            />
          </mesh>
          {/* Boundary Ring */}
          <mesh position={[0, liquidHeight * 0.55 + radius, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius * 0.90, 32]} />
            <meshStandardMaterial color="#ffffff" emissive="#38bdf8" transparent opacity={0.55} />
          </mesh>
          {/* Upper Oil Layer */}
          <mesh
            ref={liquidMeshRef as any}
            position={[0, liquidHeight * 0.55 + (liquidHeight * 0.45) / 2 + radius, 0]}
          >
            <cylinderGeometry args={[radius * 0.92, radius * 0.92, liquidHeight * 0.45, 32]} />
            <meshStandardMaterial
              ref={liquidMaterialRef}
              color="#eab308"
              emissive="#ca8a04"
              emissiveIntensity={0.75}
              roughness={0.15}
              transparent
              opacity={0.92}
            />
          </mesh>
          {/* Bottom Water Dome */}
          <mesh position={[0, radius, 0]} rotation={[Math.PI, 0, 0]}>
            <sphereGeometry args={[radius * 0.92, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={0.45} transparent opacity={0.82} />
          </mesh>
          {/* Top Meniscus */}
          <mesh position={[0, liquidHeight + radius, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius * 0.92, 32]} />
            <meshStandardMaterial color="#fbbf24" emissive="#d97706" emissiveIntensity={0.85} transparent opacity={0.95} />
          </mesh>
        </group>
      ) : (
        <group>
          <mesh
            ref={liquidMeshRef as any}
            position={[0, liquidHeight / 2 + radius, 0]}
          >
            <cylinderGeometry
              args={[radius * 0.92, radius * 0.92, liquidHeight, 32]}
            />
            <meshStandardMaterial
              ref={liquidMaterialRef}
              color={vessel.color}
              emissive={vessel.color}
              emissiveIntensity={0.55}
              roughness={0.12}
              metalness={0.1}
              transparent
              opacity={0.88}
            />
          </mesh>

          {/* Fluid Hemispherical Bottom Dome */}
          <mesh position={[0, radius, 0]} rotation={[Math.PI, 0, 0]}>
            <sphereGeometry
              args={[radius * 0.92, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
            />
            <meshStandardMaterial
              color={vessel.color}
              emissive={vessel.color}
              emissiveIntensity={0.55}
              roughness={0.12}
              metalness={0.1}
              transparent
              opacity={0.88}
            />
          </mesh>

          {/* Top Meniscus Disk */}
          <mesh position={[0, liquidHeight + radius, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[radius * 0.92, 32]} />
            <meshStandardMaterial
              color={vessel.color}
              emissive={vessel.color}
              emissiveIntensity={0.65}
              roughness={0.04}
              metalness={0.2}
              transparent
              opacity={0.95}
            />
          </mesh>
        </group>
      )}

      <InFluidMicroBubbles radius={radius * 0.85} height={liquidHeight} count={14} />
    </group>
  );
}

// 4. REALISTIC GRAVITATIONAL FLUID POURING STREAM & SPLASH DYNAMICS
function RealisticFluidPouringStream({
  sourceId,
  targetId,
  vesselsRef,
  grabbedTiltRef,
}: {
  sourceId: string;
  targetId: string | null;
  vesselsRef: React.MutableRefObject<ChemicalVessel[]>;
  grabbedTiltRef: React.MutableRefObject<number>;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const splashRef = useRef<THREE.Points>(null);
  const rippleRef = useRef<THREE.Mesh>(null);
  const streamMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const splashCount = 32;
  const [splashPositions, splashVelocities] = useMemo(() => {
    const pos = new Float32Array(splashCount * 3);
    const vel = new Float32Array(splashCount * 3);
    for (let i = 0; i < splashCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.25 + Math.random() * 0.65;
      vel[i * 3] = Math.cos(angle) * speed;
      vel[i * 3 + 1] = 0.8 + Math.random() * 1.2;
      vel[i * 3 + 2] = Math.sin(angle) * speed;
    }
    return [pos, vel];
  }, [splashCount]);

  useFrame((_, delta) => {
    const source = vesselsRef.current.find((v) => v.id === sourceId);
    const tilt = grabbedTiltRef.current;

    // Only render fluid stream when beaker is physically tilted > ~18 degrees
    const isActivelyPouring = Boolean(source && Math.abs(tilt) > 0.32);

    if (meshRef.current) {
      meshRef.current.visible = isActivelyPouring;
    }
    if (splashRef.current) {
      splashRef.current.visible = isActivelyPouring && Boolean(targetId);
    }
    if (rippleRef.current) {
      rippleRef.current.visible = isActivelyPouring && Boolean(targetId);
    }

    if (!isActivelyPouring || !source) return;

    const isPouringRight = tilt < 0;
    const dir = isPouringRight ? 1 : -1;
    const mouthR = source.type === "flask" ? 0.22 : source.type === "test_tube" ? 0.20 : 0.42;
    const mouthH = source.type === "flask" ? 1.03 : source.type === "test_tube" ? 1.32 : 0.95;

    // 1. Spout departure origin in world-space
    const localSpout = new THREE.Vector3(dir * mouthR * 0.92, mouthH, 0);
    localSpout.applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt);
    const startPos = new THREE.Vector3(...source.position).add(localSpout);

    // 2. Target mouth entrance in world-space
    const target = targetId ? vesselsRef.current.find((v) => v.id === targetId) : null;
    let endPos: THREE.Vector3;
    let targetRadius = 0.3;

    if (target) {
      const targetH = target.type === "flask" ? 1.03 : target.type === "test_tube" ? 1.32 : 0.95;
      targetRadius = target.type === "flask" ? 0.22 : target.type === "test_tube" ? 0.20 : 0.40;
      endPos = new THREE.Vector3(
        target.position[0],
        target.position[1] + targetH - 0.04,
        target.position[2]
      );
    } else {
      endPos = new THREE.Vector3(startPos.x + dir * 0.45, 0.02, startPos.z);
    }

    // 3. Smooth gravitational catenary curve
    const dist = Math.hypot(startPos.x - endPos.x, startPos.z - endPos.z);
    const midX = THREE.MathUtils.lerp(startPos.x, endPos.x, 0.45);
    const midZ = THREE.MathUtils.lerp(startPos.z, endPos.z, 0.45);
    // Gravity pulls stream down naturally
    const midY = Math.max(endPos.y + 0.08, THREE.MathUtils.lerp(startPos.y, endPos.y, 0.4) - Math.min(0.2, dist * 0.12));

    const p1 = new THREE.Vector3(startPos.x + dir * 0.10, startPos.y - 0.03, startPos.z);
    const p2 = new THREE.Vector3(midX, midY, midZ);
    const p3 = new THREE.Vector3(endPos.x, endPos.y + 0.06, endPos.z);

    const curve = new THREE.CatmullRomCurve3([startPos, p1, p2, p3, endPos]);
    const geom = new THREE.TubeGeometry(curve, 16, 0.032, 10, false);

    if (meshRef.current) {
      meshRef.current.geometry.dispose();
      meshRef.current.geometry = geom;
    }

    // Update stream fluid color
    if (streamMatRef.current) {
      const isClear = checkIsClearLiquid(source.formula, source.name, source.color);
      const fluidCol = new THREE.Color(isClear ? "#e0f7fa" : source.color);
      streamMatRef.current.color.copy(fluidCol);
      streamMatRef.current.emissive.copy(fluidCol);
    }

    // 4. Ballistic splashing droplets at landing point
    if (splashRef.current && splashRef.current.visible) {
      splashRef.current.position.copy(endPos);
      const posAttr = splashRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < splashCount; i++) {
        arr[i * 3] += splashVelocities[i * 3] * delta;
        arr[i * 3 + 1] += splashVelocities[i * 3 + 1] * delta;
        arr[i * 3 + 2] += splashVelocities[i * 3 + 2] * delta;
        splashVelocities[i * 3 + 1] -= delta * 4.8; // Gravity

        if (arr[i * 3 + 1] < 0) {
          arr[i * 3] = (Math.random() - 0.5) * (targetRadius * 0.4);
          arr[i * 3 + 1] = 0.02;
          arr[i * 3 + 2] = (Math.random() - 0.5) * (targetRadius * 0.4);
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.25 + Math.random() * 0.65;
          splashVelocities[i * 3] = Math.cos(angle) * speed;
          splashVelocities[i * 3 + 1] = 0.6 + Math.random() * 1.1;
          splashVelocities[i * 3 + 2] = Math.sin(angle) * speed;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 5. Pulsing impact ripple on receiver liquid surface
    if (rippleRef.current && rippleRef.current.visible) {
      rippleRef.current.position.set(endPos.x, endPos.y + 0.01, endPos.z);
      const scale = 1 + Math.sin(Date.now() * 0.018) * 0.25;
      rippleRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group>
      {/* Curved Fluid Tube Mesh */}
      <mesh ref={meshRef}>
        <tubeGeometry args={[new THREE.LineCurve3(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)), 4, 0.02, 8, false]} />
        <meshStandardMaterial
          ref={streamMatRef}
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={0.65}
          roughness={0.08}
          metalness={0.15}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* Impact Splash Droplets */}
      <points ref={splashRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[splashPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#38bdf8" transparent opacity={0.85} />
      </points>

      {/* Impact Meniscus Ripple */}
      <mesh ref={rippleRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.14, 24]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

// 5. MULTI-LAYERED REAL-WORLD SCIENTIFIC REACTION VISUAL EFFECTS
// (Firmly anchored inside the vessel group - 100% moves and follows the glassware!)
function ReactionVisualEffects({
  effectType,
  colorHex,
  vesselType = "beaker",
  liquidLevel = 0.65,
  isTwoPhase = false,
}: {
  effectType: string;
  colorHex: string;
  vesselType?: VesselType;
  liquidLevel?: number;
  isTwoPhase?: boolean;
}) {
  const rimHeight = vesselType === "test_tube" ? 1.32 : vesselType === "flask" ? 1.03 : 0.95;
  const liquidSurfaceY =
    vesselType === "test_tube"
      ? 1.1 * liquidLevel + 0.22
      : vesselType === "flask"
      ? 1.03 * liquidLevel
      : 0.95 * liquidLevel + 0.035;
  const openingRadius = vesselType === "flask" ? 0.22 : vesselType === "test_tube" ? 0.20 : 0.40;
  const bodyRadius = vesselType === "flask" ? 0.45 : vesselType === "test_tube" ? 0.20 : 0.40;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Dynamic Exothermic Reaction Luminescence Core (Deep inside fluid) */}
      <ReactionCoreLight
        effectType={effectType}
        colorHex={isTwoPhase ? "#eab308" : colorHex}
        position={[0, Math.max(0.15, liquidSurfaceY * 0.5), 0]}
      />

      {/* 2. Specific Physical Reaction Phenomenon */}
      {isTwoPhase ? (
        <TwoPhaseSeparationEmulsion
          colorHex={colorHex || "#eab308"}
          liquidSurfaceY={liquidSurfaceY}
          bodyRadius={bodyRadius}
          vesselType={vesselType}
        />
      ) : effectType === "bubbles" ? (
        <EffervescenceBubbles
          colorHex={colorHex}
          rimHeight={rimHeight}
          liquidSurfaceY={liquidSurfaceY}
          openingRadius={openingRadius}
          bodyRadius={bodyRadius}
          vesselType={vesselType}
        />
      ) : effectType === "steam" ? (
        <TurbulentThermalSteam
          colorHex={colorHex}
          rimHeight={rimHeight}
          openingRadius={openingRadius}
        />
      ) : effectType === "spark" ? (
        <GoldenRainSparkles
          colorHex={colorHex}
          liquidSurfaceY={liquidSurfaceY}
          bodyRadius={bodyRadius}
        />
      ) : effectType === "precipitate" ? (
        <ColloidalPrecipitateSwirl
          colorHex={colorHex}
          liquidSurfaceY={liquidSurfaceY}
          bodyRadius={bodyRadius}
        />
      ) : (
        <ColorDiffusionSwirl
          colorHex={colorHex}
          liquidSurfaceY={liquidSurfaceY}
          bodyRadius={bodyRadius}
        />
      )}
    </group>
  );
}

// 5A. Reaction Core Light (Flickers & Illuminates the Glassware from Inside)
function ReactionCoreLight({
  effectType,
  colorHex,
  position = [0, 0.4, 0],
}: {
  effectType: string;
  colorHex: string;
  position?: [number, number, number];
}) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(() => {
    if (!lightRef.current) return;
    const flicker = Math.sin(Date.now() * 0.02) * 0.8;
    lightRef.current.intensity = 2.8 + flicker;
  });

  const isWarmExothermic = effectType === "steam" || effectType === "spark";
  const lightColor = isWarmExothermic ? "#f59e0b" : colorHex || "#38bdf8";

  return (
    <pointLight
      ref={lightRef}
      position={position}
      color={lightColor}
      intensity={3.0}
      distance={3.5}
      decay={2}
    />
  );
}

// 5B. Effervescence: Internal Bubbles, Surface Froth Cap & Sputtering Droplets (e.g. Cuka + Soda Kue)
function EffervescenceBubbles({
  colorHex,
  rimHeight,
  liquidSurfaceY,
  openingRadius,
  bodyRadius,
  vesselType,
}: {
  colorHex: string;
  rimHeight: number;
  liquidSurfaceY: number;
  openingRadius: number;
  bodyRadius: number;
  vesselType: VesselType;
}) {
  const bubblesRef = useRef<THREE.Points>(null);
  const dropletsRef = useRef<THREE.Points>(null);
  const foamRef = useRef<THREE.Group>(null);

  const bubbleCount = 120;
  const dropletCount = 45;

  const [bubblePos, bubbleVel] = useMemo(() => {
    const pos = new Float32Array(bubbleCount * 3);
    const vel = new Float32Array(bubbleCount);
    for (let i = 0; i < bubbleCount; i++) {
      const r = Math.random() * (bodyRadius * 0.82);
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = 0.08 + Math.random() * Math.max(0.1, liquidSurfaceY - 0.08);
      pos[i * 3 + 2] = r * Math.sin(theta);
      vel[i] = 0.6 + Math.random() * 1.2;
    }
    return [pos, vel];
  }, [bubbleCount, bodyRadius, liquidSurfaceY]);

  const [dropletPos, dropletVel] = useMemo(() => {
    const pos = new Float32Array(dropletCount * 3);
    const vel = new Float32Array(dropletCount * 3);
    for (let i = 0; i < dropletCount; i++) {
      const r = Math.random() * (openingRadius * 0.8);
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = liquidSurfaceY + 0.02;
      pos[i * 3 + 2] = r * Math.sin(theta);
      vel[i * 3] = (Math.random() - 0.5) * 0.6;
      vel[i * 3 + 1] = 1.0 + Math.random() * 1.6;
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
    }
    return [pos, vel];
  }, [dropletCount, openingRadius, liquidSurfaceY]);

  useFrame((_, delta) => {
    // 1. Rising in-fluid bubbles
    if (bubblesRef.current) {
      const posAttr = bubblesRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < bubbleCount; i++) {
        arr[i * 3 + 1] += delta * bubbleVel[i];
        arr[i * 3] += Math.sin(Date.now() * 0.005 + i) * 0.003;
        if (arr[i * 3 + 1] > liquidSurfaceY) {
          arr[i * 3 + 1] = 0.08;
          const r = Math.random() * (bodyRadius * 0.8);
          const theta = Math.random() * Math.PI * 2;
          arr[i * 3] = r * Math.cos(theta);
          arr[i * 3 + 2] = r * Math.sin(theta);
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
        dropletVel[i * 3 + 1] -= delta * 4.5; // Gravity pull

        if (arr[i * 3 + 1] < liquidSurfaceY) {
          const r = Math.random() * (openingRadius * 0.8);
          const theta = Math.random() * Math.PI * 2;
          arr[i * 3] = r * Math.cos(theta);
          arr[i * 3 + 1] = liquidSurfaceY + 0.02;
          arr[i * 3 + 2] = r * Math.sin(theta);
          dropletVel[i * 3] = (Math.random() - 0.5) * 0.6;
          dropletVel[i * 3 + 1] = 1.0 + Math.random() * 1.5;
          dropletVel[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
        }
      }
      posAttr.needsUpdate = true;
    }

    // 3. Surface foam cap organic pulsation
    if (foamRef.current) {
      const wobble = 1 + Math.sin(Date.now() * 0.008) * 0.06;
      foamRef.current.scale.set(wobble, wobble * 0.85, wobble);
    }
  });

  // Foam sits right at the liquid meniscus or rim opening
  const foamY = Math.min(rimHeight - 0.02, liquidSurfaceY);
  const foamRadius = openingRadius * 1.02;

  return (
    <group>
      {/* Accelerating Rising Bubbles inside fluid */}
      <points ref={bubblesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[bubblePos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} color="#ffffff" transparent opacity={0.88} />
      </points>

      {/* Surface Froth / Foam Cap Dome - Perched directly on the fluid meniscus/rim */}
      <group ref={foamRef} position={[0, foamY, 0]}>
        <mesh>
          <sphereGeometry args={[foamRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={0.25}
            roughness={0.4}
            metalness={0.05}
            opacity={0.88}
            transparent
          />
        </mesh>
      </group>

      {/* Ballistic Sputtering Droplets popping out of the foam */}
      <points ref={dropletsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dropletPos, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.038} color={colorHex || "#ffffff"} transparent opacity={0.9} />
      </points>
    </group>
  );
}

// 5C. Convective Turbulent Steam Clouds (e.g. Asam Klorida + Soda Api Eksotermik)
function TurbulentThermalSteam({
  colorHex,
  rimHeight,
  openingRadius,
}: {
  colorHex: string;
  rimHeight: number;
  openingRadius: number;
}) {
  const innerSteamRef = useRef<THREE.Points>(null);
  const outerSteamRef = useRef<THREE.Points>(null);

  const innerCount = 70;
  const outerCount = 110;

  const [innerPos] = useMemo(() => {
    const pos = new Float32Array(innerCount * 3);
    for (let i = 0; i < innerCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * (openingRadius * 0.9);
      pos[i * 3 + 1] = rimHeight + Math.random() * 1.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * (openingRadius * 0.9);
    }
    return [pos];
  }, [innerCount, rimHeight, openingRadius]);

  const [outerPos] = useMemo(() => {
    const pos = new Float32Array(outerCount * 3);
    for (let i = 0; i < outerCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * (openingRadius * 1.5);
      pos[i * 3 + 1] = rimHeight + 0.3 + Math.random() * 1.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * (openingRadius * 1.5);
    }
    return [pos];
  }, [outerCount, rimHeight, openingRadius]);

  useFrame((_, delta) => {
    // 1. Fast rising thermal core straight from vessel rim
    if (innerSteamRef.current) {
      const posAttr = innerSteamRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < innerCount; i++) {
        arr[i * 3 + 1] += delta * 1.5;
        arr[i * 3] += Math.sin(Date.now() * 0.003 + i) * 0.004;
        if (arr[i * 3 + 1] > rimHeight + 1.8) {
          arr[i * 3 + 1] = rimHeight;
          arr[i * 3] = (Math.random() - 0.5) * (openingRadius * 0.8);
          arr[i * 3 + 2] = (Math.random() - 0.5) * (openingRadius * 0.8);
        }
      }
      posAttr.needsUpdate = true;
    }

    // 2. Billowing atmospheric vapor wisps expanding outwards as they rise
    if (outerSteamRef.current) {
      const posAttr = outerSteamRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      for (let i = 0; i < outerCount; i++) {
        arr[i * 3 + 1] += delta * 1.0;
        const angle = Date.now() * 0.0015 + i;
        arr[i * 3] += Math.cos(angle) * 0.006;
        arr[i * 3 + 2] += Math.sin(angle) * 0.006;
        if (arr[i * 3 + 1] > rimHeight + 2.5) {
          arr[i * 3 + 1] = rimHeight + 0.2;
          arr[i * 3] = (Math.random() - 0.5) * (openingRadius * 1.1);
          arr[i * 3 + 2] = (Math.random() - 0.5) * (openingRadius * 1.1);
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
          size={0.12}
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
          size={0.18}
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
function GoldenRainSparkles({
  colorHex,
  liquidSurfaceY,
  bodyRadius,
}: {
  colorHex: string;
  liquidSurfaceY: number;
  bodyRadius: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 160;

  const [positions, velocities, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const baseColor = new THREE.Color(colorHex || "#fbbf24");
    const goldColor = new THREE.Color("#f59e0b");

    for (let i = 0; i < count; i++) {
      const r = Math.random() * (bodyRadius * 0.85);
      const th = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(th);
      pos[i * 3 + 1] = 0.08 + Math.random() * Math.max(0.1, liquidSurfaceY - 0.05);
      pos[i * 3 + 2] = r * Math.sin(th);

      vel[i * 3] = (Math.random() - 0.5) * 0.4;
      vel[i * 3 + 1] = -0.15 - Math.random() * 0.45; // Fluttering downward
      vel[i * 3 + 2] = (Math.random() - 0.5) * 0.4;

      const c = i % 2 === 0 ? baseColor : goldColor;
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return [pos, vel, col];
  }, [count, colorHex, liquidSurfaceY, bodyRadius]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      arr[i * 3] += Math.sin(Date.now() * 0.008 + i) * 0.004;
      arr[i * 3 + 2] += Math.cos(Date.now() * 0.008 + i) * 0.004;

      if (arr[i * 3 + 1] < 0.06) {
        arr[i * 3 + 1] = liquidSurfaceY;
        const r = Math.random() * (bodyRadius * 0.85);
        const th = Math.random() * Math.PI * 2;
        arr[i * 3] = r * Math.cos(th);
        arr[i * 3 + 2] = r * Math.sin(th);
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
        size={0.06}
        vertexColors
        transparent
        opacity={0.92}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 5E. Swirling Insoluble Precipitate Cloud (e.g. CuSO4 + NaOH Endapan Gel Biru Cu(OH)2)
function ColloidalPrecipitateSwirl({
  colorHex,
  liquidSurfaceY,
  bodyRadius,
}: {
  colorHex: string;
  liquidSurfaceY: number;
  bodyRadius: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 140;

  const [positions, targetY] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const ty = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const radius = Math.random() * (bodyRadius * 0.8);
      const theta = Math.random() * Math.PI * 2;
      pos[i * 3] = radius * Math.cos(theta);
      pos[i * 3 + 1] = 0.08 + Math.random() * Math.max(0.1, liquidSurfaceY - 0.08);
      pos[i * 3 + 2] = radius * Math.sin(theta);
      ty[i] = 0.05 + Math.random() * 0.20; // Sinks to bottom
    }
    return [pos, ty];
  }, [count, bodyRadius, liquidSurfaceY]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const x = arr[i * 3];
      const z = arr[i * 3 + 2];
      const r = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x) + delta * 2.0;
      arr[i * 3] = r * Math.cos(angle);
      arr[i * 3 + 2] = r * Math.sin(angle);

      if (arr[i * 3 + 1] > targetY[i]) {
        arr[i * 3 + 1] -= delta * 0.15;
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
        size={0.075}
        color={colorHex || "#1e40af"}
        transparent
        opacity={0.85}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

// 5F. Color Diffusion Swirl (Gradual Fluid Blending Waves)
function ColorDiffusionSwirl({
  colorHex,
  liquidSurfaceY,
  bodyRadius,
}: {
  colorHex: string;
  liquidSurfaceY: number;
  bodyRadius: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 90;

  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * (bodyRadius * 0.85);
      const th = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(th);
      pos[i * 3 + 1] = 0.08 + Math.random() * Math.max(0.1, liquidSurfaceY - 0.08);
      pos[i * 3 + 2] = r * Math.sin(th);
    }
    return [pos];
  }, [count, bodyRadius, liquidSurfaceY]);

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
      <pointsMaterial size={0.06} color={colorHex} transparent opacity={0.78} />
    </points>
  );
}

// 5G. Two-Phase Separation Emulsion (Oil-Water Immiscible Droplet Buoyancy Dynamics)
function TwoPhaseSeparationEmulsion({
  colorHex,
  liquidSurfaceY,
  bodyRadius,
  vesselType = "beaker",
}: {
  colorHex: string;
  liquidSurfaceY: number;
  bodyRadius: number;
  vesselType?: VesselType;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const boundaryRingRef = useRef<THREE.Mesh>(null);
  const count = 120;

  // Mid-level boundary between water and oil (approx 55% water height)
  const boundaryY = liquidSurfaceY * 0.55;

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * (bodyRadius * 0.82);
      const th = Math.random() * Math.PI * 2;
      pos[i * 3] = r * Math.cos(th);
      // Droplets distributed through water and accumulating in upper oil phase
      pos[i * 3 + 1] = 0.05 + Math.random() * liquidSurfaceY;
      pos[i * 3 + 2] = r * Math.sin(th);
      spd[i] = 0.08 + Math.random() * 0.22; // Buoyant upward float speed
    }
    return [pos, spd];
  }, [count, bodyRadius, liquidSurfaceY]);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;

      for (let i = 0; i < count; i++) {
        // Oil droplets float up due to lower density (0.92 g/cm3 vs 1.0 g/cm3)
        arr[i * 3 + 1] += speeds[i] * delta;

        // When reaching the top oil layer, they settle near boundary or top
        if (arr[i * 3 + 1] > liquidSurfaceY - 0.02) {
          arr[i * 3 + 1] = 0.05 + Math.random() * 0.15; // Reset near bottom to simulate continuous phase separation
          const r = Math.random() * (bodyRadius * 0.80);
          const th = Math.random() * Math.PI * 2;
          arr[i * 3] = r * Math.cos(th);
          arr[i * 3 + 2] = r * Math.sin(th);
        }
      }
      posAttr.needsUpdate = true;
    }

    // Oscillating fluid boundary wave
    if (boundaryRingRef.current) {
      const wave = Math.sin(Date.now() * 0.005) * 0.04;
      boundaryRingRef.current.rotation.z = wave;
    }
  });

  return (
    <group>
      {/* Golden buoyant oil droplets floating upwards to separate from polar water */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#fbbf24"
          transparent
          opacity={0.88}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Luminous immiscible meniscus separation disc */}
      <mesh
        ref={boundaryRingRef}
        position={[0, boundaryY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.02, bodyRadius * 0.92, 32]} />
        <meshBasicMaterial
          color="#fef08a"
          transparent
          opacity={0.65}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
