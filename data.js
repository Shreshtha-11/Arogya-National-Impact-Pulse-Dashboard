/**
 * data.js - National Scale Seed Dataset & Data Dictionary for ARHA
 * Programmatically generates a complete national dataset covering all 36 States/UTs
 * and all of their respective districts to ensure no empty dashboard screens.
 */

// All 36 States and Union Territories of India and their primary districts
const GEOGRAPHY = {
  // 28 States
  "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"],
  "Arunachal Pradesh": ["Itanagar", "Tawang", "Changlang", "Tirap", "Kurung Kumey"],
  "Assam": ["Guwahati", "Dibrugarh", "Silchar", "Jorhat", "Nagaon"],
  "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
  "Chhattisgarh": ["Raipur", "Bilaspur", "Durg", "Bastar", "Korba"],
  "Goa": ["North Goa", "South Goa"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Jamnagar", "Gandhinagar"],
  "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Hisar"],
  "Himachal Pradesh": ["Shimla", "Dharamshala", "Solan", "Mandi", "Kullu"],
  "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh"],
  "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kannur"],
  "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain"],
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
  "Manipur": ["Imphal", "Ukhrul", "Churachandpur", "Senapati", "Thoubal"],
  "Meghalaya": ["Shillong", "Tura", "Jowai", "Nongpoh", "Baghmara"],
  "Mizoram": ["Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib"],
  "Nagaland": ["Kohima", "Dimapur", "Mokokchung", "Wokha", "Tuensang"],
  "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Sambalpur", "Puri"],
  "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Banswara", "Dungarpur"],
  "Sikkim": ["Gangtok", "Geyzing", "Namchi", "Mangan"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem", "Tirunelveli"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "Tripura": ["Agartala", "Dharmanagar", "Udaipur", "Kailasahar", "Ambassa"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj"],
  "Uttarakhand": ["Dehradun", "Haridwar", "Haldwani", "Roorkee", "Nainital"],
  "West Bengal": ["Kolkata", "Howrah", "Darjeeling", "Siliguri", "Asansol", "Durgapur"],
  
  // 8 Union Territories
  "Andaman and Nicobar": ["Port Blair", "Car Nicobar"],
  "Chandigarh": ["Chandigarh"],
  "Dadra & Nagar Haveli and Daman & Diu": ["Daman", "Diu", "Silvassa"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla", "Kathua"],
  "Ladakh": ["Leh", "Kargil"],
  "Lakshadeep": ["Kavaratti"],
  "Puducherry": ["Puducherry", "Karaikal", "Mahe", "Yanam"]
};

// Data Dictionary
const DATA_DICTIONARY = {
  maternal: {
    title: "Maternal Health Tracker (ASHA Diary)",
    description: "Tracks prenatal care, delivery locations, and pregnancy outcomes for registered mothers.",
    fields: [
      { name: "id", type: "String", desc: "Unique pregnancy registration ID", constraint: "Format: PREG-XXXX" },
      { name: "motherName", type: "String", desc: "Full name of the pregnant mother", constraint: "Required, letters only" },
      { name: "age", type: "Integer", desc: "Age of mother at registration", constraint: "15 to 49 years" },
      { name: "state", type: "String", desc: "State of operation", constraint: "Must match operational Indian States/UTs" },
      { name: "district", type: "String", desc: "District of operation", constraint: "Must be located inside selected State" },
      { name: "village", type: "String", desc: "Village of residence", constraint: "Must match operational list" },
      { name: "incomeCategory", type: "String", desc: "Socio-economic background", constraint: "BPL (Below Poverty Line) / APL" },
      { name: "regDate", type: "Date", desc: "Registration date", constraint: "Within past 12 months" },
      { name: "anc1", type: "Date", desc: "1st Antenatal Care checkup date", constraint: "Required within 1st trimester" },
      { name: "anc2", type: "Date (Optional)", desc: "2nd Antenatal Care checkup date", constraint: "Must be after ANC-1" },
      { name: "anc3", type: "Date (Optional)", desc: "3rd Antenatal Care checkup date", constraint: "Must be after ANC-2" },
      { name: "anc4", type: "Date (Optional)", desc: "4th Antenatal Care checkup date", constraint: "Must be after ANC-3" },
      { name: "deliveryLocation", type: "String (Optional)", desc: "Place of birth", constraint: "Home / Sub-Center / PHC / CHC / District Hospital" },
      { name: "deliveryOutcome", type: "String (Optional)", desc: "Outcome of the delivery", constraint: "Live Birth / Stillbirth / Complication-Referred" },
      { name: "ashaId", type: "String", desc: "Assigned ASHA Worker ID", constraint: "Must match active ASHA database" }
    ]
  },
  child: {
    title: "Child Nutrition & Growth Tracker",
    description: "Tracks growth parameters (weight/height) for children under 5 years, highlighting malnutrition levels.",
    fields: [
      { name: "id", type: "String", desc: "Unique child registration ID", constraint: "Format: CHLD-XXXX" },
      { name: "childName", type: "String", desc: "Name of the child", constraint: "Required" },
      { name: "motherName", type: "String", desc: "Mother's name", constraint: "Required" },
      { name: "dob", type: "Date", desc: "Date of Birth", constraint: "Must be <= current date" },
      { name: "ageMonths", type: "Integer", desc: "Calculated age in months", constraint: "0 to 60 months" },
      { name: "weightKg", type: "Float", desc: "Weight of the child in kilograms", constraint: "1.0kg to 25.0kg" },
      { name: "heightCm", type: "Float", desc: "Height of the child in centimeters", constraint: "35.0cm to 120.0cm" },
      { name: "nutritionalStatus", type: "String", desc: "Malnutrition status (automatically derived from WHO Z-scores)", constraint: "Normal / MAM (Moderate) / SAM (Severe)" },
      { name: "lastCheckupDate", type: "Date", desc: "Last measurement date", constraint: "Must be after DOB" }
    ]
  }
};

// Seeded Random Helper
function seededRandom(seed) {
  let x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Regional name helpers for realistic national reach
function getIndianFemaleName(seed) {
  const firstNames = ["Sunita", "Anita", "Geeta", "Rekha", "Babita", "Kiran", "Suman", "Radha", "Meera", "Champa", "Urmila", "Priyanka", "Pooja", "Lata", "Seema", "Kamlesh", "Kanta", "Sharda", "Maya", "Asha", "Lakshmi", "Kavita", "Saraswati", "Anjali", "Ritu", "Neha", "Preeti", "Sita", "Komal", "Jyoti", "Priti", "Deepa", "Shalini", "Aarti", "Poonam", "Rani", "Mamta", "Manju", "Vidya", "Sudha", "Rajni", "Savitri", "Nirmala"];
  const lastNames = ["Devi", "Bai", "Kanwar", "Sharma", "Meena", "Katara", "Damor", "Maida", "Gurjar", "Patil", "Yadav", "Mishra", "Shinde", "Jadhav", "Gowda", "Manjhi", "Reddy", "Nair", "Das", "Choudhury", "Singh", "Banerjee", "Chatterjee", "Sen", "Joshi", "Bhatt", "Rao", "Naidu", "Chawla", "Kaur", "Gill", "Mehta", "Patel", "Shah", "Sangma", "Talukdar"];
  const f = firstNames[Math.floor(seededRandom(seed) * firstNames.length)];
  const l = lastNames[Math.floor(seededRandom(seed + 5) * lastNames.length)];
  return `${f} ${l}`;
}

function getIndianChildName(seed) {
  const names = ["Aarav", "Ananya", "Rahul", "Pari", "Vihaan", "Aditi", "Karan", "Kavya", "Arjun", "Riya", "Shiv", "Gouri", "Dev", "Jyoti", "Laksh", "Khushi", "Amit", "Mamta", "Rajesh", "Pooja", "Vikram", "Siddharth", "Aisha", "Aditya", "Neha", "Rohan", "Sanjay", "Anil", "Deepak", "Chirag"];
  return names[Math.floor(seededRandom(seed) * names.length)];
}

// Generate ASHA Workers list dynamically: 1 ASHA per operational district in India!
function generateAshaWorkers() {
  const ashaList = [];
  let index = 1;
  
  Object.keys(GEOGRAPHY).forEach(state => {
    const districts = GEOGRAPHY[state];
    districts.forEach(dist => {
      const seed = index + 5000;
      ashaList.push({
        id: `ASH-${index.toString().padStart(3, '0')}`,
        name: getIndianFemaleName(seed),
        state: state,
        district: dist,
        village: `${dist} Clinic A`
      });
      index++;
    });
  });
  
  return ashaList;
}

const ASHAS = generateAshaWorkers();

// Generate Maternal Care Clean Dataset: Seed 2 maternal records for EVERY district in India
function generateMaternalDataset() {
  const dataset = [];
  let i = 1;
  
  Object.keys(GEOGRAPHY).forEach(state => {
    const districts = GEOGRAPHY[state];
    districts.forEach(district => {
      // Seed exactly 2 maternal cases per district
      for (let count = 1; count <= 2; count++) {
        const seed = i + 1000;
        
        // Find assigned ASHA for this district
        const matchedAsha = ASHAS.find(a => a.state === state && a.district === district) || ASHAS[0];
        const village = `${district} Clinic ${String.fromCharCode(65 + count - 1)}`; // Clinic A or B
        
        const age = Math.floor(seededRandom(seed + 1) * 20) + 18; // Age 18-37
        const incomeCategory = seededRandom(seed + 2) > 0.4 ? "BPL" : "APL";
        
        // Registration Date (between June 2025 and May 2026)
        const startMs = new Date("2025-06-01").getTime();
        const endMs = new Date("2026-05-31").getTime();
        const regTime = startMs + seededRandom(seed + 3) * (endMs - startMs);
        const regDate = new Date(regTime);
        
        // ANC checkups timelines
        const anc1Time = regTime + (15 + seededRandom(seed + 4) * 15) * 24 * 60 * 60 * 1000;
        const anc1 = new Date(anc1Time);
        
        let anc2 = null;
        let anc3 = null;
        let anc4 = null;
        
        const rAnc = seededRandom(seed + 5);
        if (rAnc > 0.08) {
          anc2 = new Date(anc1Time + (45 + seededRandom(seed + 6) * 20) * 24 * 60 * 60 * 1000);
        }
        if (anc2 && rAnc > 0.18) {
          anc3 = new Date(anc2.getTime() + (45 + seededRandom(seed + 7) * 20) * 24 * 60 * 60 * 1000);
        }
        if (anc3 && rAnc > 0.32) {
          anc4 = new Date(anc3.getTime() + (45 + seededRandom(seed + 8) * 20) * 24 * 60 * 60 * 1000);
        }
        
        let deliveryLocation = null;
        let deliveryOutcome = null;
        
        const monthsSinceReg = (new Date("2026-06-10").getTime() - regTime) / (30 * 24 * 60 * 60 * 1000);
        if (monthsSinceReg > 7.5) {
          const rDeliv = seededRandom(seed + 9);
          if (rDeliv > 0.12) {
            const instLocs = ["PHC", "CHC", "District Hospital", "Sub-Center"];
            deliveryLocation = instLocs[Math.floor(seededRandom(seed + 10) * instLocs.length)];
          } else {
            deliveryLocation = "Home";
          }
          
          const rOutcome = seededRandom(seed + 11);
          if (rOutcome > 0.04) {
            deliveryOutcome = "Live Birth";
          } else if (rOutcome > 0.015) {
            deliveryOutcome = "Stillbirth";
          } else {
            deliveryOutcome = "Complication-Referred";
          }
        }
        
        dataset.push({
          id: `PREG-${1000 + i}`,
          motherName: getIndianFemaleName(seed),
          age: age,
          state: state,
          district: district,
          village: village,
          incomeCategory: incomeCategory,
          regDate: regDate.toISOString().split('T')[0],
          anc1: anc1.toISOString().split('T')[0],
          anc2: anc2 ? anc2.toISOString().split('T')[0] : "",
          anc3: anc3 ? anc3.toISOString().split('T')[0] : "",
          anc4: anc4 ? anc4.toISOString().split('T')[0] : "",
          deliveryLocation: deliveryLocation || "",
          deliveryOutcome: deliveryOutcome || "",
          ashaId: matchedAsha.id
        });
        i++;
      }
    });
  });
  return dataset;
}

// Generate Child Growth Clean Dataset: Seed 3 child records for EVERY district in India
function generateChildDataset() {
  const dataset = [];
  let i = 1;

  Object.keys(GEOGRAPHY).forEach(state => {
    const districts = GEOGRAPHY[state];
    districts.forEach(district => {
      // Seed exactly 3 child records per district
      for (let count = 1; count <= 3; count++) {
        const seed = i + 2000;
        const village = `${district} Clinic ${String.fromCharCode(65 + count - 1)}`;

        const motherName = getIndianFemaleName(seed + 1);
        const childName = getIndianChildName(seed + 2);
        
        const ageMonths = Math.floor(seededRandom(seed + 3) * 58) + 2; 
        const dob = new Date();
        dob.setMonth(dob.getMonth() - ageMonths);
        
        const baseWeight = 3.2 + (ageMonths * 0.28) - (ageMonths * ageMonths * 0.0015);
        const baseHeight = 50 + (ageMonths * 1.1) - (ageMonths * ageMonths * 0.006);
        
        const variance = seededRandom(seed + 4);
        let nutrition = "Normal";
        let wFactor = 1.0;
        
        if (variance < 0.07) {
          nutrition = "SAM";
          wFactor = 0.70 - seededRandom(seed + 5) * 0.05;
        } else if (variance < 0.22) {
          nutrition = "MAM";
          wFactor = 0.82 - seededRandom(seed + 5) * 0.05;
        } else {
          wFactor = 0.95 + seededRandom(seed + 5) * 0.15;
        }
        
        const weight = Math.round((baseWeight * wFactor) * 10) / 10;
        const height = Math.round((baseHeight * (0.95 + seededRandom(seed + 6) * 0.08)) * 10) / 10;
        
        const checkupDate = new Date();
        checkupDate.setDate(checkupDate.getDate() - Math.floor(seededRandom(seed + 7) * 20));
        
        dataset.push({
          id: `CHLD-${2000 + i}`,
          childName: childName,
          motherName: motherName,
          dob: dob.toISOString().split('T')[0],
          ageMonths: ageMonths,
          weightKg: weight,
          heightCm: height,
          nutritionalStatus: nutrition,
          lastCheckupDate: checkupDate.toISOString().split('T')[0],
          state: state,
          district: district,
          village: village
        });
        i++;
      }
    });
  });
  return dataset;
}

// Generate ASHA Monthly Performance Summaries (Jan-May 2026) for all operational ASHAs
function generateAshaActivityLogs() {
  const logs = [];
  const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05"];
  
  // Select a subset of ASHA workers to keep file logs within reasonable size (e.g. 1 ASHA per state)
  const reportingAshas = ASHAS.filter((_, idx) => idx % 5 === 0); // ~36 ASHAs representing one per State/UT
  
  reportingAshas.forEach((asha, index) => {
    months.forEach((month, mIdx) => {
      const seed = index * 10 + mIdx + 3000;
      
      const visits = Math.floor(seededRandom(seed) * 40) + 120; 
      const camps = Math.floor(seededRandom(seed + 1) * 3) + 1; 
      const supps = Math.floor(seededRandom(seed + 2) * 50) + 100; 
      const immunizations = Math.floor(seededRandom(seed + 3) * 15) + 25; 
      const hours = Math.floor(seededRandom(seed + 4) * 20) + 80; 
      const incentives = (visits * 20) + (camps * 500) + (immunizations * 100); 
      
      logs.push({
        ashaId: asha.id,
        ashaName: asha.name,
        state: asha.state,
        district: asha.district,
        village: asha.village,
        month: month,
        visitsConducted: visits,
        campsFacilitated: camps,
        supplementsDistributed: supps,
        immunizationsAssisted: immunizations,
        hoursWorked: hours,
        incentivesEarned: incentives
      });
    });
  });
  
  return logs;
}

const FINANCIALS = [
  { program: "Maternal Health Care", category: "Nutritional Take-Home Rations (THR)", allocated: 4800000, expended: 4620000 },
  { program: "Maternal Health Care", category: "Iron-Folic Acid & Calcium Distribution", allocated: 1500000, expended: 1480000 },
  { program: "Maternal Health Care", category: "ASHA Institutional Birth Incentives", allocated: 2600000, expended: 2580000 },
  { program: "Child Nutrition & SAM Care", category: "Malnutrition Treatment Center (MTC) Referrals", allocated: 3200000, expended: 3150000 },
  { program: "Child Nutrition & SAM Care", category: "Infant Growth Monitoring Equipment", allocated: 1000000, expended: 990000 },
  { program: "Child Nutrition & SAM Care", category: "ASHA Malnutrition Recovery Incentives", allocated: 2200000, expended: 2150000 },
  { program: "Community Outreach & Camps", category: "Village Health & Nutrition Day (VHND) Camps", allocated: 3600000, expended: 3520000 },
  { program: "Community Outreach & Camps", category: "ASHA Worker Monthly Skills Training", allocated: 1800000, expended: 1740000 },
  { program: "Administration", category: "Field Supervisors & Monitoring Overhead", allocated: 2500000, expended: 2480000 }
];

// Dirty Field Data representing national validation challenges (includes cross-boundary errors)
const DIRTY_FIELD_DATA = [
  // Issue 1: Severe weight typo (45kg for 9m child)
  {
    id: "CHLD-9001",
    childName: "Rahul Meena",
    motherName: "Sita Devi",
    dob: "2025-09-10",
    ageMonths: 9,
    weightKg: 45.0, 
    heightCm: 68.0,
    nutritionalStatus: "Normal",
    lastCheckupDate: "2026-06-05",
    state: "Rajasthan",
    district: "Udaipur",
    village: "Udaipur Clinic A"
  },
  // Issue 2: Cross-boundary alignment error (State: Rajasthan, District: Patna - Patna is actually in Bihar!)
  {
    id: "PREG-9002",
    motherName: "Rekha Bai",
    age: 26,
    state: "Rajasthan", 
    district: "Patna", 
    village: "Patna Clinic A",
    incomeCategory: "BPL",
    regDate: "2025-10-01",
    anc1: "2025-11-15",
    anc2: "2025-12-10",
    anc3: "2025-12-20",
    anc4: "2026-02-05",
    deliveryLocation: "PHC",
    deliveryOutcome: "Live Birth",
    ashaId: "ASH-001"
  },
  // Issue 3: Age constraint violation (12yo mother)
  {
    id: "PREG-9003",
    motherName: "Sunita Katara",
    age: 12, 
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
    ashaId: "ASH-002"
  },
  // Issue 4: Missing critical fields and non-existent district
  {
    id: "PREG-9004",
    motherName: "", 
    age: 28,
    state: "Bihar",
    district: "Jaipur", // Jaipur is in Rajasthan
    village: "Jaipur Sub-center A",
    incomeCategory: "APL",
    regDate: "2025-08-15",
    anc1: "2025-09-10",
    anc2: "",
    anc3: "",
    anc4: "",
    deliveryLocation: "",
    deliveryOutcome: "",
    ashaId: "ASH-003"
  },
  // Issue 5: Duplicate registration ID check
  {
    id: "PREG-1002", 
    motherName: "Maya Bai",
    age: 22,
    state: "Rajasthan",
    district: "Banswara",
    village: "Banswara Sub-center A",
    incomeCategory: "BPL",
    regDate: "2025-12-05",
    anc1: "2026-01-02",
    anc2: "",
    anc3: "",
    anc4: "",
    deliveryLocation: "",
    deliveryOutcome: "",
    ashaId: "ASH-004"
  },
  // Issue 6: Negative weight measurement
  {
    id: "CHLD-9006",
    childName: "Gita Damor",
    motherName: "Lata Devi",
    dob: "2024-02-15",
    ageMonths: 28,
    weightKg: -7.5, 
    heightCm: 84.5,
    nutritionalStatus: "SAM",
    lastCheckupDate: "2026-06-08",
    state: "Rajasthan",
    district: "Banswara",
    village: "Banswara Sub-center A"
  },
  // Issue 7: Another Cross-boundary error (State: Karnataka, District: Pune - Pune is in Maharashtra!)
  {
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
    district: "Pune", 
    village: "Pune Clinic A"
  }
];

const ARHA_DATASTORE = {
  maternal: generateMaternalDataset(),
  child: generateChildDataset(),
  activities: generateAshaActivityLogs(),
  financials: FINANCIALS,
  dirtySample: DIRTY_FIELD_DATA,
  geography: GEOGRAPHY,
  ashas: ASHAS,
  dictionary: DATA_DICTIONARY
};

window.ARHA_DATASTORE = ARHA_DATASTORE;
console.log("ARHA National Dynamic Database Loaded. Maternal:", ARHA_DATASTORE.maternal.length, "Child:", ARHA_DATASTORE.child.length, "ASHAs:", ARHA_DATASTORE.ashas.length);
