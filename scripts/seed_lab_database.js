const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');

function parseEnv() {
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf-8');
  const env = {};
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) {
      env[k.trim()] = v.join('=').split('#')[0].trim();
    }
  });
  return env;
}

async function seed() {
  console.log('--- SEEDING CHEMICALS & CHEMICAL REACTIONS TO DATABASE ---');
  const env = parseEnv();
  const host = env.DB_HOST || '127.0.0.1';
  const port = parseInt(env.DB_PORT || '3306', 10);
  const user = env.DB_USER || 'root';
  const password = env.DB_PASSWORD || '';
  const database = env.DB_NAME || 'capcipcup-db';

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  console.log(`[OK] Terhubung ke MySQL ${host}:${port}/${database}`);

  // 1. Ensure columns in chemical_reactions
  try {
    await conn.query(`ALTER TABLE chemical_reactions ADD COLUMN reactant_a_formula VARCHAR(50) AFTER reactant_b_id;`);
  } catch (e) {}
  try {
    await conn.query(`ALTER TABLE chemical_reactions ADD COLUMN reactant_b_formula VARCHAR(50) AFTER reactant_a_formula;`);
  } catch (e) {}

  // 2. Initial Chemicals Catalog
  const chemicals = [
    {
      id: "ch_ch3cooh",
      name: "Cuka Dapur",
      formula: "CH3COOH",
      color: "#f59e0b",
      category: "asam",
      grade_level: "SD",
      description: "Asam asetat encer yang sering dipakai di dapur untuk penambah rasa asam.",
      safety_note: "Aman terkena kulit dalam jumlah wajar, jangan terkena mata.",
      hazard_level: 0,
    },
    {
      id: "ch_nahco3",
      name: "Baking Soda (Soda Kue)",
      formula: "NaHCO3",
      color: "#e2e8f0",
      category: "basa",
      grade_level: "SD",
      description: "Natrium bikarbonat bubuk putih untuk pengembang kue dan pembersih.",
      safety_note: "Sangat aman dan tidak beracun.",
      hazard_level: 0,
    },
    {
      id: "ch_lipid",
      name: "Minyak Goreng",
      formula: "LIPID",
      color: "#eab308",
      category: "organik",
      grade_level: "SD",
      description: "Minyak nabati dengan massa jenis lebih ringan dari air dan bersifat non-polar.",
      safety_note: "Aman, licin jika tumpah.",
      hazard_level: 0,
    },
    {
      id: "ch_h2o",
      name: "Air Murni",
      formula: "H2O",
      color: "#60a5fa",
      category: "pelarut",
      grade_level: "SD",
      description: "Pelarut universal yang bersifat polar dan netral (pH 7).",
      safety_note: "Sangat aman.",
      hazard_level: 0,
    },
    {
      id: "ch_iodine",
      name: "Cairan Iodin (Betadine)",
      formula: "I2/KI",
      color: "#9a3412",
      category: "indikator",
      grade_level: "SD",
      description: "Larutan cokelat kemerahan untuk uji keberadaan amilum/karbohidrat.",
      safety_note: "Dapat menodai pakaian, jangan diminum.",
      hazard_level: 1,
    },
    {
      id: "ch_starch",
      name: "Larutan Amilum (Tepung/Nasi)",
      formula: "(C6H10O5)n",
      color: "#f8fafc",
      category: "organik",
      grade_level: "SD",
      description: "Karbohidrat kompleks yang menjadi sumber energi utama.",
      safety_note: "Sangat aman.",
      hazard_level: 0,
    },
    {
      id: "ch_hcl",
      name: "Asam Klorida",
      formula: "HCl",
      color: "#ef4444",
      category: "asam",
      grade_level: "SMP",
      description: "Asam kuat anorganik yang sangat korosif dan melepaskan ion H+ tinggi.",
      safety_note: "Wajib menggunakan sarung tangan dan pelindung mata di lab nyata.",
      hazard_level: 3,
    },
    {
      id: "ch_naoh",
      name: "Natrium Hidroksida (Soda Api)",
      formula: "NaOH",
      color: "#3b82f6",
      category: "basa",
      grade_level: "SMP",
      description: "Basa kuat kaustik yang licin dan melepaskan ion OH- serta kalor tinggi.",
      safety_note: "Dapat menyebabkan luka bakar kimiawi.",
      hazard_level: 3,
    },
    {
      id: "ch_cuso4",
      name: "Tembaga(II) Sulfat",
      formula: "CuSO4",
      color: "#06b6d4",
      category: "garam",
      grade_level: "SMP",
      description: "Garam tembaga berwarna biru kristal cerah (terusi) untuk uji presipitasi.",
      safety_note: "Beracun jika tertelan, hindari kontak langsung.",
      hazard_level: 2,
    },
    {
      id: "ch_fe",
      name: "Serbuk Besi",
      formula: "Fe",
      color: "#64748b",
      category: "garam",
      grade_level: "SMP",
      description: "Logam transisi aktif yang dapat mendesak ion tembaga dalam larutan.",
      safety_note: "Jauhkan dari percikan api saat berbentuk serbuk halus.",
      hazard_level: 1,
    },
    {
      id: "ch_kmno4",
      name: "Kalium Permanganat",
      formula: "KMnO4",
      color: "#7e22ce",
      category: "oksidator",
      grade_level: "SMA",
      description: "Oksidator kuat kristal ungu tua kehitaman untuk reaksi redoks eksoterm.",
      safety_note: "Oksidator hebat, jauhkan dari zat organik mudah terbakar.",
      hazard_level: 3,
    },
    {
      id: "ch_glycerin",
      name: "Gliserin (Gliserol)",
      formula: "GLYCERIN",
      color: "#f1f5f9",
      category: "organik",
      grade_level: "SMA",
      description: "Alkohol polihidrat kental manis yang mudah dioksidasi spontan.",
      safety_note: "Aman jika terisolasi, reaktif dengan oksidator kuat.",
      hazard_level: 1,
    },
    {
      id: "ch_pbno32",
      name: "Timbal(II) Nitrat",
      formula: "Pb(NO3)2",
      color: "#e0e7ff",
      category: "garam",
      grade_level: "SMA",
      description: "Garam timbal jernih yang digunakan pada uji presipitasi Golden Rain.",
      safety_note: "Logam berat toksik, limbah wajib ditampung khusus.",
      hazard_level: 3,
    },
    {
      id: "ch_ki",
      name: "Kalium Iodida",
      formula: "KI",
      color: "#a855f7",
      category: "garam",
      grade_level: "SMA",
      description: "Sumber ion iodida larut air untuk reaksi pembentukan endapan kuning PbI2.",
      safety_note: "Iritan ringan, jaga wadah tetap kedap udara.",
      hazard_level: 1,
    },
  ];

  console.log(`Menyimpan ${chemicals.length} zat kimia ke database...`);
  for (const c of chemicals) {
    await conn.query(`
      INSERT INTO chemicals (id, name, formula, color, category, grade_level, description, safety_note, hazard_level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        name=VALUES(name), formula=VALUES(formula), color=VALUES(color),
        category=VALUES(category), grade_level=VALUES(grade_level),
        description=VALUES(description), safety_note=VALUES(safety_note), hazard_level=VALUES(hazard_level);
    `, [c.id, c.name, c.formula, c.color, c.category, c.grade_level, c.description, c.safety_note, c.hazard_level]);
  }
  console.log('[V] Katalog zat kimia tersimpan di database MySQL!');

  // 3. Initial Chemical Reactions Catalog
  const reactions = [
    {
      id: "rx_ch3cooh_nahco3",
      reactant_a_id: "ch_ch3cooh",
      reactant_b_id: "ch_nahco3",
      reactant_a_formula: "CH3COOH",
      reactant_b_formula: "NaHCO3",
      title: "Reaksi Asam-Basa Menghasilkan Gas CO2",
      equation: "CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂↑",
      product_name: "Busa Karbon Dioksida Dingin",
      product_formula: "CH₃COONa + CO₂",
      product_color: "#f8fafc",
      visual_effect: "bubbles",
      temperature_change_c: -4,
      explanation: "Reaksi netralisasi cuka (asam) dan soda kue (basa) menghasilkan gas karbondioksida yang meluap cepat dalam bentuk busa gelembung tebal dan menyerap kalor dari sekitar (reaksi endoterm).",
      grade_level: "SD",
    },
    {
      id: "rx_lipid_h2o",
      reactant_a_id: "ch_lipid",
      reactant_b_id: "ch_h2o",
      reactant_a_formula: "LIPID",
      reactant_b_formula: "H2O",
      title: "Heterogenitas Massa Jenis & Polaritas",
      equation: "H₂O + Lipid → Emulsi Terpisah Dua Lapisan",
      product_name: "Campuran Berlapis (Tidak Menyatu)",
      product_formula: "H₂O // Lipid",
      product_color: "#eab308",
      visual_effect: "color_change",
      temperature_change_c: 0,
      explanation: "Molekul air bersifat polar sedangkan minyak goreng non-polar sehingga tolak-menolak. Karena minyak memiliki massa jenis lebih kecil dari air (0.92 g/cm³ vs 1 g/cm³), minyak mengapung di permukaan.",
      grade_level: "SD",
    },
    {
      id: "rx_iodine_starch",
      reactant_a_id: "ch_iodine",
      reactant_b_id: "ch_starch",
      reactant_a_formula: "I2/KI",
      reactant_b_formula: "(C6H10O5)n",
      title: "Uji Amilum / Karbohidrat Kompleks",
      equation: "I₂ + Amilum → Kompleks Iodin-Amilum (Ungu Tua/Biru Kehitaman)",
      product_name: "Kompleks Ungu Tua Amilum",
      product_formula: "I₂•(C₆H₁₀O₅)ₙ",
      product_color: "#1e1b4b",
      visual_effect: "color_change",
      temperature_change_c: 0,
      explanation: "Molekul iodin menyusup masuk ke dalam struktur heliks amilosa pada tepung/nasi, mengubah warna cairan seketika dari cokelat terang menjadi biru kehitaman atau ungu tua pekat.",
      grade_level: "SD",
    },
    {
      id: "rx_hcl_naoh",
      reactant_a_id: "ch_hcl",
      reactant_b_id: "ch_naoh",
      reactant_a_formula: "HCl",
      reactant_b_formula: "NaOH",
      title: "Reaksi Netralisasi Asam Kuat & Basa Kuat",
      equation: "HCl + NaOH → NaCl + H₂O + Kalor",
      product_name: "Larutan Garam Dapur Netral",
      product_formula: "NaCl + H₂O",
      product_color: "#10b981",
      visual_effect: "steam",
      temperature_change_c: 18,
      explanation: "Ion hidrogen (H⁺) dan hidroksida (OH⁻) berikatan membentuk molekul air netral dan garam NaCl, membebaskan energi panas ke lingkungan (reaksi eksotermik) sehingga tabung terasa hangat.",
      grade_level: "SMP",
    },
    {
      id: "rx_cuso4_naoh",
      reactant_a_id: "ch_cuso4",
      reactant_b_id: "ch_naoh",
      reactant_a_formula: "CuSO4",
      reactant_b_formula: "NaOH",
      title: "Reaksi Pengendapan Tembaga(II) Hidroksida",
      equation: "CuSO₄ + 2NaOH → Cu(OH)₂↓ (Endapan Biru) + Na₂SO₄",
      product_name: "Endapan Biru Gel Cu(OH)₂",
      product_formula: "Cu(OH)₂↓",
      product_color: "#1e40af",
      visual_effect: "precipitate",
      temperature_change_c: 4,
      explanation: "Reaksi pengendapan menghasilkan tembaga(II) hidroksida padat yang tidak larut dalam air sehingga membentuk partikel endapan biru safir pekat seperti agar-agar.",
      grade_level: "SMP",
    },
    {
      id: "rx_pbno32_ki",
      reactant_a_id: "ch_pbno32",
      reactant_b_id: "ch_ki",
      reactant_a_formula: "Pb(NO3)2",
      reactant_b_formula: "KI",
      title: "Fenomena Presipitasi Hujan Emas (Golden Rain)",
      equation: "Pb(NO₃)₂ + 2KI → PbI₂↓ (Kristal Emas) + 2KNO₃",
      product_name: "Kristal Kuning Keemasan PbI₂",
      product_formula: "PbI₂↓",
      product_color: "#fbbf24",
      visual_effect: "spark",
      temperature_change_c: 2,
      explanation: "Dua larutan jernih tanpa warna bereaksi membentuk kristal timbal(II) iodida heksagonal yang berkilau keemasan saat terkena cahaya.",
      grade_level: "SMA",
    },
    {
      id: "rx_kmno4_glycerin",
      reactant_a_id: "ch_kmno4",
      reactant_b_id: "ch_glycerin",
      reactant_a_formula: "KMnO4",
      reactant_b_formula: "GLYCERIN",
      title: "Reaksi Redoks Spontan Eksotermik",
      equation: "14KMnO₄ + 4C₃H₅(OH)₃ → 7K₂CO₃ + 7Mn₂O₃ + 5CO₂↑ + 16H₂O + Energi Panas",
      product_name: "Residu Mangan & Asap Pekat",
      product_formula: "Mn₂O₃ + K₂CO₃",
      product_color: "#581c87",
      visual_effect: "steam",
      temperature_change_c: 45,
      explanation: "KMnO4 mengoksidasi senyawa organik gliserol secara cepat dan spontan, menghasilkan asap putih tebal dan lonjakan temperatur drastis.",
      grade_level: "SMA",
    },
  ];

  console.log(`Menyimpan ${reactions.length} reaksi kimia ke database...`);
  for (const r of reactions) {
    await conn.query(`
      INSERT INTO chemical_reactions (
        id, reactant_a_id, reactant_b_id, reactant_a_formula, reactant_b_formula,
        title, equation, product_name, product_formula, product_color,
        visual_effect, temperature_change_c, explanation, grade_level
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        reactant_a_id=VALUES(reactant_a_id), reactant_b_id=VALUES(reactant_b_id),
        reactant_a_formula=VALUES(reactant_a_formula), reactant_b_formula=VALUES(reactant_b_formula),
        title=VALUES(title), equation=VALUES(equation), product_name=VALUES(product_name),
        product_formula=VALUES(product_formula), product_color=VALUES(product_color),
        visual_effect=VALUES(visual_effect), temperature_change_c=VALUES(temperature_change_c),
        explanation=VALUES(explanation), grade_level=VALUES(grade_level);
    `, [
      r.id, r.reactant_a_id, r.reactant_b_id, r.reactant_a_formula, r.reactant_b_formula,
      r.title, r.equation, r.product_name, r.product_formula, r.product_color,
      r.visual_effect, r.temperature_change_c, r.explanation, r.grade_level
    ]);
  }

  console.log('[V] Reaksi kimia tersimpan di database MySQL!');
  await conn.end();
  console.log('--- SELESAI SEEDING DATABASE LAB ---');
}

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});

