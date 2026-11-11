import { ChemicalVessel, ReactionDetail } from "@/components/lab/ChemistryLabScene";
import { REACTION_CATALOG } from "./chemicals-db";
import { ExperimentDetailLog, LabTask } from "./types";

/**
 * Resolves a completed task's reaction details and resulting 3D vessel state
 * from saved experiment details or the reaction catalog.
 */
export function resolveReactionForTask(
  task: LabTask,
  exp?: ExperimentDetailLog | null
): { reaction: ReactionDetail; vessel: ChemicalVessel } {
  const matched = REACTION_CATALOG.find((r) => {
    if (task.expectedReactionId && r.id === task.expectedReactionId) return true;
    if (
      exp?.reactionTitle &&
      exp.reactionTitle !== "Reaksi Kimia Teramati di Meja Lab" &&
      (r.title.toLowerCase() === exp.reactionTitle.toLowerCase() ||
        r.equation === exp?.reactionEquation)
    ) {
      return true;
    }
    if (task.title) {
      const tLower = task.title.toLowerCase();
      const rLower = r.title.toLowerCase();
      if (tLower.includes("redoks") && (rLower.includes("redoks") || r.id.includes("kmno4"))) return true;
      if (tLower.includes("hujan emas") && r.id.includes("pbno32")) return true;
      if (tLower.includes("asam basa") && r.id.includes("hcl_naoh")) return true;
      if (tLower.includes("lava") && r.id.includes("lava")) return true;
      if (tLower.includes("saponifikasi") && r.id.includes("sapon")) return true;
      if (tLower.includes("amilum") && r.id.includes("iodine")) return true;
      if (tLower.includes("cuka") && r.id.includes("cuka")) return true;
    }
    if (
      task.chemicalIds &&
      r.reactantAId &&
      task.chemicalIds.includes(r.reactantAId) &&
      task.chemicalIds.includes(r.reactantBId)
    ) {
      return true;
    }
    return false;
  });

  const prodName = exp?.resultVessel?.name || matched?.productName || "Produk Hasil Reaksi";
  const prodFormula = exp?.resultVessel?.formula || matched?.productFormula || "Senyawa Produk";
  const prodColor = exp?.resultVessel?.color || matched?.productColor || "#10b981";
  const prodTemp =
    exp?.resultVessel?.temperatureC && exp.resultVessel.temperatureC !== 25
      ? exp.resultVessel.temperatureC
      : 25 + (exp?.temperatureChange ?? matched?.temperatureChangeC ?? 0);

  const completedVesselId = `v_product_${task.id}`;
  const vessel: ChemicalVessel = {
    id: completedVesselId,
    name: prodName,
    formula: prodFormula,
    type: "flask",
    color: prodColor,
    initialColor: prodColor,
    position: [0, 0.55, 0.25],
    level: task.level || task.gradeLevel || "SMP",
    liquidLevel: 0.85,
    isReacted: true,
    temperatureC: prodTemp,
    components: [prodFormula],
  };

  const reaction: ReactionDetail = {
    id: matched?.id || task.expectedReactionId || `rx_${task.id}`,
    title:
      exp?.reactionTitle && exp.reactionTitle !== "Reaksi Kimia Teramati di Meja Lab"
        ? exp.reactionTitle
        : matched?.title || task.title,
    equation: exp?.reactionEquation || matched?.equation || "Persamaan Reaksi Kimiawi Seimbang",
    substanceA: matched?.reactantAFormula || "Reaktan A",
    substanceB: matched?.reactantBFormula || "Reaktan B",
    substanceC: matched?.reactantCFormula,
    substances: matched?.reactants,
    resultName: prodName,
    resultFormula: prodFormula,
    resultColor: prodColor,
    effectType: matched?.visualEffect || "bubbles",
    temperatureChange: exp?.temperatureChange ?? matched?.temperatureChangeC ?? 0,
    reasonWhy:
      exp?.reasonWhy ||
      matched?.reasonWhy ||
      "Reaksi terjadi akibat afinitas ikatan antar partikel dan perubahan energi bebas menuju kestabilan molekul.",
    observablePhenomena:
      exp?.observablePhenomena ||
      matched?.observablePhenomena ||
      "Teramati pembentukan fase baru, perubahan warna larutan, dan perubahan temperatur wadah.",
    explanation: exp?.explanation || matched?.explanation || task.instructions,
    level: task.level || task.gradeLevel || matched?.level || "SMP",
    targetVesselId: completedVesselId,
  };

  return { reaction, vessel };
}

