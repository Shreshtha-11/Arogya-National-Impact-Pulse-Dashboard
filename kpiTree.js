/**
 * kpiTree.js - Logical Framework and Theory of Change definition.
 * Structures the KPI Tree data: Activity -> Output -> Outcome -> Impact.
 */

const KPI_TREE_NODES = [
  // --- IMPACT TIER ---
  {
    id: "IMP-MMR",
    name: "Reduce Maternal Mortality Ratio (MMR)",
    tier: "impact",
    metric: "Maternal deaths per 100k births",
    baseline: 113,
    target: 70,
    current: 78,
    unit: "",
    progress: 81, // Percentage of gap closed
    desc: "Long-term goal aligned with UN SDG 3.1. Measured annually via community surveys and government sub-center tracking.",
    dependencies: ["OUT-INST", "OUT-ANC4"],
    owner: "State M&E Lead",
    cadence: "Annual"
  },
  {
    id: "IMP-IMR",
    name: "Reduce Infant Mortality Rate (IMR)",
    tier: "impact",
    metric: "Infant deaths per 1,000 live births",
    baseline: 32,
    target: 20,
    current: 24,
    unit: "",
    progress: 67,
    desc: "Long-term reduction in child deaths under 1 year of age. Heavily influenced by neonatal care and immunization.",
    dependencies: ["OUT-IMM", "OUT-INST"],
    owner: "State M&E Lead",
    cadence: "Annual"
  },
  {
    id: "IMP-SAM",
    name: "Reduce Severe Acute Malnutrition (SAM) Prevalence",
    tier: "impact",
    metric: "% of children under 5 with SAM",
    baseline: "8.5%",
    target: "4.0%",
    current: "5.4%",
    unit: "%",
    progress: 69,
    desc: "Long-term reduction in severe stunting and wasting among children under five years in target villages.",
    dependencies: ["OUT-SAM-REC", "OUT-ANC4"],
    owner: "Nutrition Program Manager",
    cadence: "Quarterly"
  },

  // --- OUTCOME TIER ---
  {
    id: "OUT-ANC4",
    name: "ANC-4 Compliance Rate",
    tier: "outcome",
    metric: "% of pregnant women with 4+ prenatal checkups",
    baseline: "42%",
    target: "80%",
    current: "65%", // Dynamic calculated value in app.js
    unit: "%",
    progress: 61,
    desc: "Critical leading indicator. Women completing four antenatal checkups are 3x more likely to deliver safely in hospitals.",
    dependencies: ["OUT-INST", "OP-ANC-VISIT"],
    owner: "Maternal Care Lead",
    cadence: "Weekly",
    isEDFavorite: true // "The One Number"
  },
  {
    id: "OUT-INST",
    name: "Institutional Delivery Rate",
    tier: "outcome",
    metric: "% of births taking place in healthcare facilities",
    baseline: "65%",
    target: "95%",
    current: "88%", // Dynamic in app.js
    unit: "%",
    progress: 77,
    desc: "Proportion of deliveries conducted at PHCs, CHCs, or district hospitals, minimizing birth-related mortality risk.",
    dependencies: ["IMP-MMR", "IMP-IMR", "OP-MOTHERS-REG"],
    owner: "Maternal Care Lead",
    cadence: "Monthly"
  },
  {
    id: "OUT-SAM-REC",
    name: "Malnutrition Recovery Rate",
    tier: "outcome",
    metric: "% of SAM children recovered within 90 days",
    baseline: "55%",
    target: "85%",
    current: "76%", // Dynamic in app.js
    unit: "%",
    progress: 70,
    desc: "The recovery rate of severe and moderately malnourished children under treatment/ration support programs.",
    dependencies: ["IMP-SAM", "OP-CHILD-SCR"],
    owner: "Nutrition Program Manager",
    cadence: "Weekly",
    isEDFavorite: true // "The One Number"
  },
  {
    id: "OUT-IMM",
    name: "Full Immunization Coverage",
    tier: "outcome",
    metric: "% of children under 2 fully immunized",
    baseline: "58%",
    target: "90%",
    current: "82%",
    unit: "%",
    progress: 75,
    desc: "Children who have completed BCG, OPV, DPT, and Measles vaccination series before their second birthday.",
    dependencies: ["IMP-IMR", "ACT-CAMPS"],
    owner: "Immunization Co-ordinator",
    cadence: "Monthly"
  },

  // --- OUTPUT TIER ---
  {
    id: "OP-MOTHERS-REG",
    name: "Mothers Registered & Tracked",
    tier: "output",
    metric: "Total active pregnancies registered",
    baseline: 0,
    target: 200,
    current: 180, // Dynamic in app.js
    unit: " mothers",
    progress: 90,
    desc: "Total number of pregnant women registered in our systems and under ASHA supervision.",
    dependencies: ["OUT-INST", "ACT-VISITS"],
    owner: "Field Supervisor",
    cadence: "Weekly"
  },
  {
    id: "OP-ANC-VISIT",
    name: "Prenatal Checkups Facilitated",
    tier: "output",
    metric: "Total prenatal checkup visits conducted",
    baseline: 0,
    target: 800,
    current: 512, // Dynamic in app.js
    unit: " visits",
    progress: 64,
    desc: "Cumulative total of individual ANC clinic/hospital visits attended by registered mothers.",
    dependencies: ["OUT-ANC4", "ACT-VISITS"],
    owner: "Field Supervisor",
    cadence: "Weekly"
  },
  {
    id: "OP-CHILD-SCR",
    name: "Malnutrition Screenings Completed",
    tier: "output",
    metric: "Total child growth measurements recorded",
    baseline: 0,
    target: 300,
    current: 220, // Dynamic in app.js
    unit: " children",
    progress: 73,
    desc: "Number of unique children under 5 screened using MUAC (Mid-Upper Arm Circumference) and weight-for-height scales.",
    dependencies: ["OUT-SAM-REC", "ACT-CAMPS"],
    owner: "Nutrition Program Manager",
    cadence: "Weekly"
  },
  {
    id: "OP-RATIONS",
    name: "Nutritional Rations Distributed",
    tier: "output",
    metric: "Packs of Take Home Rations (THR) issued",
    baseline: 0,
    target: 5000,
    current: 4120, // Dynamic in app.js
    unit: " packs",
    progress: 82,
    desc: "Fortified supplementary nutrition packets distributed to lactating mothers and MAM/SAM children.",
    dependencies: ["OUT-SAM-REC", "ACT-VISITS"],
    owner: "Logistics Officer",
    cadence: "Monthly"
  },

  // --- ACTIVITY TIER ---
  {
    id: "ACT-CAMPS",
    name: "Health & Nutrition Camps",
    tier: "activity",
    metric: "Village Nutrition Days (VHND) held",
    baseline: 0,
    target: 100,
    current: 85, // Dynamic in app.js
    unit: " camps",
    progress: 85,
    desc: "Mobile health clinics held in target villages offering immunizations, weight checks, and prenatal medicines.",
    dependencies: ["OP-CHILD-SCR", "OUT-IMM"],
    owner: "Outreach Lead",
    cadence: "Weekly"
  },
  {
    id: "ACT-VISITS",
    name: "Home Visits by ASHA Workers",
    tier: "activity",
    metric: "ASHA home visits completed",
    baseline: 0,
    target: 30000,
    current: 24200, // Dynamic in app.js
    unit: " visits",
    progress: 81,
    desc: "One-on-one visits by trained ASHA health workers to counsel mothers on breastfeeding, sanitation, and nutrition.",
    dependencies: ["OP-MOTHERS-REG", "OP-ANC-VISIT", "OP-RATIONS"],
    owner: "Field Supervisor",
    cadence: "Weekly"
  },
  {
    id: "ACT-TRAIN",
    name: "ASHA Workers Trained",
    tier: "activity",
    metric: "ASHA workers trained in modules",
    baseline: 0,
    target: 150,
    current: 135,
    unit: " workers",
    progress: 90,
    desc: "Capacity-building training programs run for community workers on nutrition grading and early signs of pregnancy danger.",
    dependencies: ["ACT-VISITS"],
    owner: "Training Manager",
    cadence: "Monthly"
  }
];

// Structural mapping showing what arrows go where (TOC Ladder)
const KPI_TREE_LINKS = [
  // Activity -> Output
  { from: "ACT-TRAIN", to: "ACT-VISITS" },
  { from: "ACT-VISITS", to: "OP-MOTHERS-REG" },
  { from: "ACT-VISITS", to: "OP-ANC-VISIT" },
  { from: "ACT-VISITS", to: "OP-RATIONS" },
  { from: "ACT-CAMPS", to: "OP-CHILD-SCR" },
  { from: "ACT-CAMPS", to: "OUT-IMM" },
  
  // Output -> Outcome
  { from: "OP-MOTHERS-REG", to: "OUT-INST" },
  { from: "OP-ANC-VISIT", to: "OUT-ANC4" },
  { from: "OP-RATIONS", to: "OUT-SAM-REC" },
  { from: "OP-CHILD-SCR", to: "OUT-SAM-REC" },
  
  // Outcome -> Impact
  { from: "OUT-ANC4", to: "IMP-MMR" },
  { from: "OUT-INST", to: "IMP-MMR" },
  { from: "OUT-INST", to: "IMP-IMR" },
  { from: "OUT-IMM", to: "IMP-IMR" },
  { from: "OUT-SAM-REC", to: "IMP-SAM" }
];

window.ARHA_KPI_TREE = {
  nodes: KPI_TREE_NODES,
  links: KPI_TREE_LINKS
};
console.log("ARHA KPI Tree Configuration Loaded.");
