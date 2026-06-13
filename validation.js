/**
 * validation.js - National-Scale Data Quality & Validation Engine
 * Checks formatting, dates, biological growth parameters, and state-district boundaries.
 */

const VALIDATION_RULES = {
  maternal: [
    {
      code: "M-ID-FORMAT",
      field: "id",
      severity: "ERROR",
      message: "ID must follow the pattern PREG-XXXX (e.g., PREG-1051)",
      test: (val) => /^PREG-\d{4}$/.test(val)
    },
    {
      code: "M-NAME-MISSING",
      field: "motherName",
      severity: "ERROR",
      message: "Mother name cannot be blank",
      test: (val) => typeof val === "string" && val.trim().length > 0
    },
    {
      code: "M-AGE-RANGE",
      field: "age",
      severity: "ERROR",
      message: "Mother's age must be between 15 and 49 years",
      test: (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num >= 15 && num <= 49;
      }
    },
    {
      code: "M-GEOGRAPHY-STATE",
      field: "state",
      severity: "ERROR",
      message: "State/UT must be a valid Indian administrative state or Union Territory",
      test: (val) => {
        const geo = window.ARHA_DATASTORE ? window.ARHA_DATASTORE.geography : null;
        if (!geo) return false;
        return Object.keys(geo).includes(val);
      }
    },
    {
      code: "M-GEOGRAPHY-DISTRICT",
      field: "district",
      severity: "ERROR",
      message: "District must be operational",
      test: (val) => {
        const geo = window.ARHA_DATASTORE ? window.ARHA_DATASTORE.geography : null;
        if (!geo) return false;
        // Search if district is registered in ANY state list
        return Object.values(geo).some(districts => districts.includes(val));
      }
    },
    {
      code: "M-GEOGRAPHY-ALIGNMENT",
      field: "district",
      severity: "ERROR",
      message: "Boundary Mismatch: The selected district does not belong to the selected state",
      test: (val, record) => {
        const state = record.state;
        const geo = window.ARHA_DATASTORE ? window.ARHA_DATASTORE.geography : null;
        if (!geo || !geo[state]) return false;
        return geo[state].includes(val);
      }
    },
    {
      code: "M-DATE-REG-FUTURE",
      field: "regDate",
      severity: "ERROR",
      message: "Registration date cannot be in the future",
      test: (val) => {
        if (!val) return false;
        const d = new Date(val);
        return !isNaN(d.getTime()) && d.getTime() <= Date.now();
      }
    },
    {
      code: "M-DATE-CHRONOLOGY",
      field: "anc_timeline",
      severity: "ERROR",
      message: "ANC checkup dates must follow chronological order (Reg -> ANC1 -> ANC2 -> ANC3 -> ANC4)",
      test: (_, record) => {
        const dates = [record.regDate, record.anc1, record.anc2, record.anc3, record.anc4]
          .filter(d => d && d.trim() !== "")
          .map(d => new Date(d).getTime());
        
        for (let i = 1; i < dates.length; i++) {
          if (dates[i] < dates[i - 1]) return false;
        }
        return true;
      }
    }
  ],
  child: [
    {
      code: "C-ID-FORMAT",
      field: "id",
      severity: "ERROR",
      message: "ID must follow the pattern CHLD-XXXX (e.g., CHLD-2045)",
      test: (val) => /^CHLD-\d{4}$/.test(val)
    },
    {
      code: "C-NAME-MISSING",
      field: "childName",
      severity: "ERROR",
      message: "Child name cannot be blank",
      test: (val) => typeof val === "string" && val.trim().length > 0
    },
    {
      code: "C-AGE-RANGE",
      field: "ageMonths",
      severity: "ERROR",
      message: "Child age must be between 0 and 60 months",
      test: (val) => {
        const num = parseInt(val, 10);
        return !isNaN(num) && num >= 0 && num <= 60;
      }
    },
    {
      code: "C-GEOGRAPHY-STATE",
      field: "state",
      severity: "ERROR",
      message: "State/UT must be a valid Indian state or Union Territory",
      test: (val) => {
        const geo = window.ARHA_DATASTORE ? window.ARHA_DATASTORE.geography : null;
        if (!geo) return false;
        return Object.keys(geo).includes(val);
      }
    },
    {
      code: "C-GEOGRAPHY-DISTRICT",
      field: "district",
      severity: "ERROR",
      message: "District must be operational",
      test: (val) => {
        const geo = window.ARHA_DATASTORE ? window.ARHA_DATASTORE.geography : null;
        if (!geo) return false;
        return Object.values(geo).some(districts => districts.includes(val));
      }
    },
    {
      code: "C-GEOGRAPHY-ALIGNMENT",
      field: "district",
      severity: "ERROR",
      message: "Boundary Mismatch: The selected district does not belong to the selected state",
      test: (val, record) => {
        const state = record.state;
        const geo = window.ARHA_DATASTORE ? window.ARHA_DATASTORE.geography : null;
        if (!geo || !geo[state]) return false;
        return geo[state].includes(val);
      }
    },
    {
      code: "C-WEIGHT-POSITIVE",
      field: "weightKg",
      severity: "ERROR",
      message: "Weight must be greater than zero",
      test: (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
      }
    },
    {
      code: "C-WEIGHT-BIOLOGICAL",
      field: "weightKg",
      severity: "WARNING",
      message: "Weight is biologically anomalous for child's age (unusual growth curve)",
      test: (val, record) => {
        const w = parseFloat(val);
        const age = parseInt(record.ageMonths, 10);
        if (isNaN(w) || isNaN(age)) return false;
        
        const maxExpected = 4.5 + (age * 0.4); 
        const minExpected = 1.5 + (age * 0.08); 
        
        return w >= minExpected && w <= maxExpected;
      }
    },
    {
      code: "C-HEIGHT-RANGE",
      field: "heightCm",
      severity: "ERROR",
      message: "Height must be within 30cm and 130cm",
      test: (val) => {
        const h = parseFloat(val);
        return !isNaN(h) && h >= 30 && h <= 130;
      }
    },
    {
      code: "C-DATE-CHECKUP",
      field: "lastCheckupDate",
      severity: "ERROR",
      message: "Checkup date must be a valid date, after DOB, and not in the future",
      test: (val, record) => {
        if (!val || !record.dob) return false;
        const checkup = new Date(val).getTime();
        const dob = new Date(record.dob).getTime();
        const now = Date.now();
        return !isNaN(checkup) && !isNaN(dob) && checkup >= dob && checkup <= now;
      }
    }
  ]
};

/**
 * Validates a single record (maternal or child)
 */
function validateRecord(record, type, existingIds = []) {
  const rules = VALIDATION_RULES[type];
  const errors = [];
  
  if (!rules) {
    return { isValid: true, errors: [] };
  }
  
  // Check for duplicate ID
  if (record.id && existingIds.includes(record.id)) {
    errors.push({
      code: `${type === "maternal" ? "M" : "C"}-ID-DUPLICATE`,
      field: "id",
      severity: "ERROR",
      message: `Duplicate ID: ${record.id} already exists in database`
    });
  }
  
  rules.forEach(rule => {
    try {
      const val = record[rule.field];
      const isPassed = rule.test(val, record);
      if (!isPassed) {
        errors.push({
          code: rule.code,
          field: rule.field,
          severity: rule.severity,
          message: rule.message
        });
      }
    } catch (err) {
      errors.push({
        code: `${rule.code}-EXCEPTION`,
        field: rule.field,
        severity: "ERROR",
        message: `Validation exception: ${err.message}`
      });
    }
  });
  
  return {
    isValid: errors.filter(e => e.severity === "ERROR").length === 0,
    errors: errors
  };
}

/**
 * Runs validation on a list of records
 */
function validateBatch(records, type, baselineCleanIds = []) {
  const results = [];
  const trackedIds = [...baselineCleanIds];
  
  records.forEach((record, index) => {
    const recordId = record.id;
    const isDuplicate = trackedIds.includes(recordId);
    
    const result = validateRecord(record, type, isDuplicate ? [recordId] : []);
    
    if (recordId && !isDuplicate) {
      trackedIds.push(recordId);
    }
    
    results.push({
      index: index,
      record: record,
      errors: result.errors,
      isValid: result.isValid
    });
  });
  
  return results;
}

window.ARHA_VALIDATOR = {
  rules: VALIDATION_RULES,
  validateRecord: validateRecord,
  validateBatch: validateBatch
};
console.log("ARHA National Validation Engine Loaded.");
