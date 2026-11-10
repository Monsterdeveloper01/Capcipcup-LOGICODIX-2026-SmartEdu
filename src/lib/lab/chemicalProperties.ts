import { ChemicalVessel } from "@/components/lab/ChemistryLabScene";
import { CHEMICAL_CATALOG } from "./chemicals-db";

export interface ChemicalMeasurement {
  vesselId: string;
  vesselName: string;
  formula: string;
  temperatureC: number;
  pH: number;
  category: "Asam Kuat" | "Asam Lemah" | "Netral" | "Basa Lemah" | "Basa Kuat";
  litmusRed: {
    initialColor: string;
    finalColor: string;
    isChanged: boolean;
    resultText: string;
  };
  litmusBlue: {
    initialColor: string;
    finalColor: string;
    isChanged: boolean;
    resultText: string;
  };
  universalColor: string;
  thermalCategory: "Endotermik (Dingin)" | "Suhu Ruang Normal" | "Hangat" | "Eksotermik Panas" | "Eksotermik Ekstrem";
  explanation: string;
}

/**
 * Normalisasi dan evaluasi akurat sifat fisikokimia larutan pada bejana
 * untuk Termometer Celup, Kertas Lakmus, dan Indikator pH Universal.
 */
export function evaluateChemicalProperties(vessel: ChemicalVessel): ChemicalMeasurement {
  const f = (vessel.formula || "").toUpperCase().trim();
  const n = (vessel.name || "").toLowerCase().trim();
  const temp = vessel.temperatureC || 25;

  let pH = 7.0;
  let category: ChemicalMeasurement["category"] = "Netral";
  let explanation = "Larutan bersifat netral tanpa kelebihan ion hidronium (H+) atau hidroksida (OH-).";

  // 1. ASAM KUAT (pH 0.5 - 2.0)
  if (f.includes("HCL") || f.includes("H2SO4") || f.includes("HNO3") || n.includes("asam klorida") || n.includes("asam sulfat")) {
    pH = 1.0;
    category = "Asam Kuat";
    explanation = "Asam kuat anorganik yang terionisasi sempurna 100% di dalam air, menghasilkan konsentrasi ion hidronium [H3O+] sangat tinggi (pH ~1.0).";
  }
  // 2. ASAM LEMAH (pH 2.5 - 5.5)
  else if (f.includes("CH3COOH") || f.includes("CUKA") || f.includes("ASAM SITRAT") || n.includes("cuka") || n.includes("asam asetat")) {
    pH = 2.8;
    category = "Asam Lemah";
    explanation = "Asam organik karboksilat yang hanya terionisasi sebagian (< 5%) di dalam air. Memiliki rasa asam dengan derajat keasaman sedang (pH ~2.8).";
  }
  else if (f.includes("FECL2") || f.includes("CUSO4") || n.includes("tembaga(ii) sulfat") || n.includes("besi(ii) klorida")) {
    pH = 4.5;
    category = "Asam Lemah";
    explanation = "Garam yang terbentuk dari asam kuat dan basa lemah mengalami hidrolisis sebagian, menghasilkan larutan dengan sifat sedikit asam (pH ~4.5).";
  }
  // 3. BASA KUAT (pH 12.5 - 14.0)
  else if (f.includes("NAOH") || f.includes("KOH") || f.includes("CA(OH)2") || n.includes("soda api") || n.includes("natrium hidroksida") || n.includes("kalium hidroksida")) {
    pH = 13.5;
    category = "Basa Kuat";
    explanation = "Basa kuat kaustik yang terdisosiasi sempurna di dalam air melepaskan ion hidroksida [OH-] berlimpah, menghasilkan pH sangat basa (pH ~13.5).";
  }
  // 4. BASA LEMAH (pH 8.0 - 10.5)
  else if (f.includes("NAHCO3") || f.includes("NH3") || f.includes("NH4OH") || n.includes("soda kue") || n.includes("baking soda") || n.includes("amonia")) {
    pH = 8.4;
    category = "Basa Lemah";
    explanation = "Garam basa/senyawa alkali lemah yang melepaskan sedikit ion OH- melalui kesetimbangan hidrolisis, menghasilkan suasana basa lembut (pH ~8.4).";
  }
  else if (f.includes("SABUN") || n.includes("sabun") || n.includes("saponifikasi")) {
    pH = 9.2;
    category = "Basa Lemah";
    explanation = "Garam karboksilat rantai panjang hasil reaksi saponifikasi bersifat basa ringan khas produk pembersih (pH ~9.2).";
  }
  // 5. NETRAL (pH 6.5 - 7.5)
  else if (f.includes("H2O") || f.includes("NACL") || f.includes("GLISERIN") || f.includes("LIPID") || f.includes("AMILUM") || n.includes("air") || n.includes("garam dapur")) {
    pH = 7.0;
    category = "Netral";
    explanation = "Senyawa netral dengan konsentrasi ion H+ seimbang sempurna dengan ion OH- (Kw = 10^-14 pada 25°C), tidak mengubah kesetimbangan asam-basa.";
  }
  // 6. DEFAULT LOOKUP DARI KATALOG CHEMICALS
  else {
    const matchedChem = CHEMICAL_CATALOG.find((c) => c.formula.toUpperCase() === f || c.name.toLowerCase() === n);
    if (matchedChem) {
      if (matchedChem.category === "asam") {
        pH = 2.0;
        category = "Asam Kuat";
        explanation = "Senyawa dalam kategori asam melepaskan ion hidrogen ke dalam larutan.";
      } else if (matchedChem.category === "basa") {
        pH = 12.0;
        category = "Basa Kuat";
        explanation = "Senyawa dalam kategori basa melepaskan ion hidroksida ke dalam larutan.";
      }
    }
  }

  // Evaluasi Perubahan Warna Kertas Lakmus Merah & Biru
  // Lakmus Merah: di Asam tetap merah (#ef4444), di Netral tetap merah, di Basa BERUBAH jadi biru (#2563eb)
  const isBase = pH > 7.5;
  const isAcid = pH < 6.5;

  const litmusRedFinal = isBase ? "#2563eb" : "#ef4444";
  const litmusRedChanged = isBase;
  const litmusRedText = isBase
    ? "Merah → Biru (Mendeteksi Basa)"
    : "Tetap Merah (Asam / Netral)";

  // Lakmus Biru: di Basa tetap biru (#2563eb), di Netral tetap biru, di Asam BERUBAH jadi merah (#ef4444)
  const litmusBlueFinal = isAcid ? "#ef4444" : "#2563eb";
  const litmusBlueChanged = isAcid;
  const litmusBlueText = isAcid
    ? "Biru → Merah (Mendeteksi Asam)"
    : "Tetap Biru (Basa / Netral)";

  // Warna Indikator Spektrum Universal pH (0 - 14)
  let universalColor = "#22c55e"; // pH 7 Hijau
  if (pH < 2) universalColor = "#dc2626"; // Merah tua
  else if (pH < 4) universalColor = "#f97316"; // Oranye
  else if (pH < 6) universalColor = "#eab308"; // Kuning
  else if (pH <= 7.5) universalColor = "#22c55e"; // Hijau netral
  else if (pH < 9.5) universalColor = "#06b6d4"; // Sian / Biru muda
  else if (pH < 12) universalColor = "#2563eb"; // Biru pekat
  else universalColor = "#7c3aed"; // Ungu / Violet alkali kuat

  // Kategori Suhu Termometer Termokimia
  let thermalCategory: ChemicalMeasurement["thermalCategory"] = "Suhu Ruang Normal";
  if (temp < 20) thermalCategory = "Endotermik (Dingin)";
  else if (temp <= 28) thermalCategory = "Suhu Ruang Normal";
  else if (temp <= 40) thermalCategory = "Hangat";
  else if (temp <= 65) thermalCategory = "Eksotermik Panas";
  else thermalCategory = "Eksotermik Ekstrem";

  return {
    vesselId: vessel.id,
    vesselName: vessel.name,
    formula: vessel.formula,
    temperatureC: temp,
    pH,
    category,
    litmusRed: {
      initialColor: "#ef4444",
      finalColor: litmusRedFinal,
      isChanged: litmusRedChanged,
      resultText: litmusRedText,
    },
    litmusBlue: {
      initialColor: "#2563eb",
      finalColor: litmusBlueFinal,
      isChanged: litmusBlueChanged,
      resultText: litmusBlueText,
    },
    universalColor,
    thermalCategory,
    explanation,
  };
}

