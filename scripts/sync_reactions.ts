import { query } from "../src/lib/db";
import { REACTION_CATALOG } from "../src/lib/lab/chemicals-db";

async function main() {
  console.log(`Syncing ${REACTION_CATALOG.length} reactions to MySQL...`);

  for (const r of REACTION_CATALOG) {
    await query(
      `
      INSERT INTO chemical_reactions (
        id, reactant_a_id, reactant_b_id, reactant_c_id, reactant_a_formula, reactant_b_formula, reactant_c_formula,
        title, equation, product_name, product_formula, product_color,
        visual_effect, temperature_change_c, explanation, reason_why, observable_phenomena, grade_level
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        reactant_a_formula=VALUES(reactant_a_formula), reactant_b_formula=VALUES(reactant_b_formula),
        reactant_c_id=VALUES(reactant_c_id), reactant_c_formula=VALUES(reactant_c_formula),
        title=VALUES(title), equation=VALUES(equation), product_name=VALUES(product_name),
        product_formula=VALUES(product_formula), product_color=VALUES(product_color),
        visual_effect=VALUES(visual_effect), temperature_change_c=VALUES(temperature_change_c),
        explanation=VALUES(explanation), reason_why=VALUES(reason_why),
        observable_phenomena=VALUES(observable_phenomena), grade_level=VALUES(grade_level)
    `,
      [
        r.id,
        r.reactantAId,
        r.reactantBId,
        r.reactantCId || null,
        r.reactantAFormula,
        r.reactantBFormula,
        r.reactantCFormula || null,
        r.title,
        r.equation,
        r.productName,
        r.productFormula,
        r.productColor,
        r.visualEffect,
        r.temperatureChangeC,
        r.explanation,
        r.reasonWhy || "",
        r.observablePhenomena || "",
        r.level,
      ]
    );
  }

  console.log(`Successfully synced all ${REACTION_CATALOG.length} reactions!`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});

