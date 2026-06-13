/**
 * test-validation.js - National Scale Test Suite
 * Asserts cross-boundary checks and data quality rules for the Indian geography expansion.
 */

const fs = require('fs');
const path = require('path');

console.log("--------------------------------------------------");
console.log("RUNNING AUTOMATED CHECKS FOR VALIDATION ENGINE...");
console.log("--------------------------------------------------");

// Mock the expanded geography
global.window = {
  ARHA_DATASTORE: {
    geography: {
      "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Banswara", "Dungarpur"],
      "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
      "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
      "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"]
    }
  }
};

const validationCode = fs.readFileSync(path.join(__dirname, 'validation.js'), 'utf8');
eval(validationCode); 

const validator = global.window.ARHA_VALIDATOR;

const testCases = [
  // Case 1: Child Weight biological warning
  {
    type: "child",
    record: {
      id: "CHLD-9001",
      childName: "Rahul Meena",
      motherName: "Sita Devi",
      dob: "2025-09-10",
      ageMonths: 9,
      weightKg: 45.0, // Weight anomaly
      heightCm: 68.0,
      nutritionalStatus: "Normal",
      lastCheckupDate: "2026-06-05",
      state: "Rajasthan",
      district: "Udaipur",
      village: "Udaipur Clinic A"
    },
    expectedErrors: ["C-WEIGHT-BIOLOGICAL"]
  },
  // Case 2: State-District Mismatch (Patna is in Bihar, not Rajasthan)
  {
    type: "maternal",
    record: {
      id: "PREG-9002",
      motherName: "Rekha Bai",
      age: 26,
      state: "Rajasthan", 
      district: "Patna", // Mismatch!
      village: "Patna Clinic A",
      incomeCategory: "BPL",
      regDate: "2025-10-01",
      anc1: "2025-11-15",
      anc2: "2025-12-10",
      anc3: "2025-12-20",
      anc4: "2026-02-05",
      deliveryLocation: "PHC",
      deliveryOutcome: "Live Birth",
      ashaId: "ASH-07"
    },
    expectedErrors: ["M-GEOGRAPHY-ALIGNMENT"]
  },
  // Case 3: Mother Age constraint
  {
    type: "maternal",
    record: {
      id: "PREG-9003",
      motherName: "Sunita Katara",
      age: 12, // Maternal registration age check
      state: "Rajasthan",
      district: "Dungarpur",
      village: "Dungarpur Clinic A",
      incomeCategory: "BPL",
      regDate: "2025-11-10",
      anc1: "2025-12-05",
      anc2: "2026-01-20",
      anc3: "",
      anc4: "",
      deliveryLocation: "Home",
      deliveryOutcome: "Live Birth",
      ashaId: "ASH-03"
    },
    expectedErrors: ["M-AGE-RANGE"]
  },
  // Case 4: Missing mother name and District alignment error (Jaipur is in Rajasthan, not Bihar)
  {
    type: "maternal",
    record: {
      id: "PREG-9004",
      motherName: "", // Missing name
      age: 28,
      state: "Bihar",
      district: "Jaipur", // Mismatch!
      village: "Jaipur Sub-center A",
      incomeCategory: "APL",
      regDate: "2025-08-15",
      anc1: "2025-09-10",
      anc2: "",
      anc3: "",
      anc4: "",
      deliveryLocation: "",
      deliveryOutcome: "",
      ashaId: "ASH-07"
    },
    expectedErrors: ["M-NAME-MISSING", "M-GEOGRAPHY-ALIGNMENT"]
  },
  // Case 5: Negative weight child error
  {
    type: "child",
    record: {
      id: "CHLD-9006",
      childName: "Gita Damor",
      motherName: "Lata Devi",
      dob: "2024-02-15",
      ageMonths: 28,
      weightKg: -7.5, // Negative
      heightCm: 84.5,
      nutritionalStatus: "SAM",
      lastCheckupDate: "2026-06-08",
      state: "Rajasthan",
      district: "Banswara",
      village: "Banswara Sub-center A"
    },
    expectedErrors: ["C-WEIGHT-POSITIVE", "C-WEIGHT-BIOLOGICAL"]
  },
  // Case 6: Child State-District Mismatch (Pune is in Maharashtra, not Karnataka)
  {
    type: "child",
    record: {
      id: "CHLD-9007",
      childName: "Karan Jadhav",
      motherName: "Savita Jadhav",
      dob: "2024-11-20",
      ageMonths: 18,
      weightKg: 9.8,
      heightCm: 80.0,
      nutritionalStatus: "Normal",
      lastCheckupDate: "2026-06-03",
      state: "Karnataka", 
      district: "Pune", // Mismatch!
      village: "Pune Clinic A"
    },
    expectedErrors: ["C-GEOGRAPHY-ALIGNMENT"]
  }
];

let failures = 0;

testCases.forEach((test, index) => {
  const result = validator.validateRecord(test.record, test.type);
  const detectedCodes = result.errors.map(e => e.code);
  
  console.log(`\nTest Case #${index + 1} [ID: ${test.record.id} - ${test.type.toUpperCase()}]`);
  console.log(`  Flagged Field: ${test.record.childName || test.record.motherName || 'Missing'}`);
  console.log(`  Detected Codes: ${JSON.stringify(detectedCodes)}`);
  console.log(`  Expected Codes: ${JSON.stringify(test.expectedErrors)}`);
  
  const allExpectedDetected = test.expectedErrors.every(code => detectedCodes.includes(code));
  
  if (allExpectedDetected) {
    console.log(`  Result: PASS \u2705`);
  } else {
    console.log(`  Result: FAIL \u274C (Expected rule not flagged)`);
    failures++;
  }
});

// Test deduplication check
console.log("\nTest Case #7 [DEDUPLICATION]");
const cleanBaseline = ["PREG-1002"];
const duplicateRecord = {
  id: "PREG-1002",
  motherName: "Maya Bai",
  age: 22,
  state: "Rajasthan",
  district: "Banswara",
  regDate: "2025-12-05",
  anc1: "2026-01-02"
};

const dupResult = validator.validateRecord(duplicateRecord, "maternal", cleanBaseline);
const dupCodes = dupResult.errors.map(e => e.code);
console.log(`  Detected Codes: ${JSON.stringify(dupCodes)}`);
if (dupCodes.includes("M-ID-DUPLICATE")) {
  console.log(`  Result: PASS \u2705`);
} else {
  console.log(`  Result: FAIL \u274C`);
  failures++;
}

console.log("\n--------------------------------------------------");
if (failures === 0) {
  console.log("ALL AUTOMATED TESTS PASSED SUCCESSFULLY! \u2705");
  process.exit(0);
} else {
  console.log(`TEST SUITE FAILED WITH ${failures} ERRORS. \u274C`);
  process.exit(1);
}
