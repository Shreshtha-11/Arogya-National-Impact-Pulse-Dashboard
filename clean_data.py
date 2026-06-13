#!/usr/bin/env python3
# clean_data.py - Python Pandas Data Cleaning Pipeline for NGO M&E Records
# Validates, cleans, and audits raw field worker spreadsheets for data quality compliance.


import os
import re
import pandas as pd
import numpy as np
from datetime import datetime

# 1. Operational Indian Geography Reference
GEOGRAPHY_DB = {
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Banswara", "Dungarpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad"],
    "Karnataka": ["Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"],
    "Uttar Pradesh": ["Lucknow", "Kanpur", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj"]
}

class NGODataCleaner:
    def __init__(self):
        self.audit_log = []

    def log_anomaly(self, record_id, name, field, value, severity, message):
        """Logs an anomaly to our audit queue."""
        self.audit_log.append({
            "Record ID": record_id,
            "Patient Name": name,
            "Flagged Field": field,
            "Invalid Value": value,
            "Severity": severity,
            "Validation Message": message
        })

    def validate_maternal_records(self, df):
        """Validates maternal health records (ASHA Diary)."""
        clean_rows = []
        
        # Standardize dates
        date_cols = ["regDate", "anc1", "anc2", "anc3", "anc4"]
        for col in date_cols:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce')

        for idx, row in df.iterrows():
            rec_id = row.get("id", f"TEMP-M-{idx}")
            name = row.get("motherName", "")
            has_error = False
            
            # Rule 1: Missing name
            if pd.isna(name) or str(name).strip() == "":
                self.log_anomaly(rec_id, "Unknown", "motherName", name, "ERROR", "Mother name cannot be blank")
                has_error = True
                
            # Rule 2: Age constraints
            age = row.get("age")
            if pd.isna(age) or not (15 <= int(age) <= 49):
                self.log_anomaly(rec_id, name, "age", age, "ERROR", "Mother's age must be between 15 and 49 years")
                has_error = True

            # Rule 3: State validation
            state = row.get("state")
            if pd.isna(state) or state not in GEOGRAPHY_DB:
                self.log_anomaly(rec_id, name, "state", state, "ERROR", f"Invalid State: {state}")
                has_error = True

            # Rule 4: District validation & State boundary alignment
            district = row.get("district")
            if pd.isna(district):
                self.log_anomaly(rec_id, name, "district", district, "ERROR", "District cannot be blank")
                has_error = True
            elif not has_error:  # Only check alignment if state is valid
                districts_in_state = GEOGRAPHY_DB.get(state, [])
                if district not in districts_in_state:
                    self.log_anomaly(
                        rec_id, name, "district", district, "ERROR", 
                        f"Boundary Mismatch: District '{district}' does not belong to State '{state}'"
                    )
                    has_error = True

            # Rule 5: Date order chronology checks
            if not has_error and not pd.isna(row["regDate"]):
                reg_date = row["regDate"]
                
                # Check ANC-1
                if not pd.isna(row["anc1"]):
                    if row["anc1"] < reg_date:
                        self.log_anomaly(rec_id, name, "anc1", row["anc1"], "ERROR", "ANC-1 checkup cannot be before registration date")
                        has_error = True
                
                # Check ANC-2
                if not pd.isna(row["anc2"]) and not pd.isna(row["anc1"]):
                    if row["anc2"] < row["anc1"]:
                        self.log_anomaly(rec_id, name, "anc2", row["anc2"], "ERROR", "ANC-2 checkup cannot be before ANC-1 date")
                        has_error = True
                
                # Check ANC-3
                if not pd.isna(row["anc3"]) and not pd.isna(row["anc2"]):
                    if row["anc3"] < row["anc2"]:
                        self.log_anomaly(rec_id, name, "anc3", row["anc3"], "ERROR", "ANC-3 checkup cannot be before ANC-2 date")
                        has_error = True
                
                # Check ANC-4
                if not pd.isna(row["anc4"]) and not pd.isna(row["anc3"]):
                    if row["anc4"] < row["anc3"]:
                        self.log_anomaly(rec_id, name, "anc4", row["anc4"], "ERROR", "ANC-4 checkup cannot be before ANC-3 date")
                        has_error = True

            if not has_error:
                clean_rows.append(row)
                
        return pd.DataFrame(clean_rows)

    def validate_child_records(self, df):
        """Validates child growth nutrition trackers."""
        clean_rows = []
        
        # Standardize checkup dates
        if "lastCheckupDate" in df.columns:
            df["lastCheckupDate"] = pd.to_datetime(df["lastCheckupDate"], errors='coerce')
        if "dob" in df.columns:
            df["dob"] = pd.to_datetime(df["dob"], errors='coerce')

        for idx, row in df.iterrows():
            rec_id = row.get("id", f"TEMP-C-{idx}")
            name = row.get("childName", "")
            has_error = False

            # Rule 1: Check child name
            if pd.isna(name) or str(name).strip() == "":
                self.log_anomaly(rec_id, "Unknown", "childName", name, "ERROR", "Child name cannot be blank")
                has_error = True

            # Rule 2: Age months range
            age = row.get("ageMonths")
            if pd.isna(age) or not (0 <= int(age) <= 60):
                self.log_anomaly(rec_id, name, "ageMonths", age, "ERROR", "Child age must be between 0 and 60 months")
                has_error = True

            # Rule 3: Physical checks (Weight)
            weight = row.get("weightKg")
            if pd.isna(weight) or float(weight) <= 0:
                self.log_anomaly(rec_id, name, "weightKg", weight, "ERROR", "Weight must be greater than zero")
                has_error = True
            elif not has_error:
                # Biological outlier warning checks based on age
                w = float(weight)
                a_months = int(age)
                max_expected = 4.5 + (a_months * 0.4)
                min_expected = 1.5 + (a_months * 0.08)
                if w < min_expected or w > max_expected:
                    self.log_anomaly(
                        rec_id, name, "weightKg", weight, "WARNING", 
                        f"Biological Outlier: Weight ({weight}kg) is unusual for age ({a_months} months)"
                    )
                    # Warnings do not block record from clean dataset, but get flagged in audits!

            # Rule 4: Geography checks
            state = row.get("state")
            district = row.get("district")
            if pd.isna(state) or state not in GEOGRAPHY_DB:
                self.log_anomaly(rec_id, name, "state", state, "ERROR", f"Invalid State: {state}")
                has_error = True
            elif pd.isna(district) or district not in GEOGRAPHY_DB.get(state, []):
                self.log_anomaly(
                    rec_id, name, "district", district, "ERROR", 
                    f"Boundary Mismatch: District '{district}' is not in State '{state}'"
                )
                has_error = True

            if not has_error:
                clean_rows.append(row)

        return pd.DataFrame(clean_rows)

    def clean_and_audit(self, maternal_csv, child_csv, output_dir="cleaned_output"):
        """Ingests raw CSVs, cleans data, and outputs clean CSVs + audit logs."""
        print(f"Ingesting raw field data...")
        
        # Read files (mocking placeholders if they don't exist yet for demo)
        mat_df = pd.read_csv(maternal_csv) if os.path.exists(maternal_csv) else self.get_mock_raw_maternal()
        chld_df = pd.read_csv(child_csv) if os.path.exists(child_csv) else self.get_mock_raw_child()
        
        # Run validators
        clean_mat_df = self.validate_maternal_records(mat_df)
        clean_chld_df = self.validate_child_records(chld_df)
        
        # Save output
        os.makedirs(output_dir, exist_ok=True)
        
        # Convert date cols back to strings for CSV export
        date_cols = ["regDate", "anc1", "anc2", "anc3", "anc4"]
        for col in date_cols:
            if col in clean_mat_df.columns:
                clean_mat_df[col] = clean_mat_df[col].dt.strftime('%Y-%m-%d')
                
        if "lastCheckupDate" in clean_chld_df.columns:
            clean_chld_df["lastCheckupDate"] = clean_chld_df["lastCheckupDate"].dt.strftime('%Y-%m-%d')
        if "dob" in clean_chld_df.columns:
            clean_chld_df["dob"] = clean_chld_df["dob"].dt.strftime('%Y-%m-%d')

        clean_mat_df.to_csv(os.path.join(output_dir, "maternal_clean.csv"), index=False)
        clean_chld_df.to_csv(os.path.join(output_dir, "child_clean.csv"), index=False)
        
        # Write Audit Log report
        audit_df = pd.DataFrame(self.audit_log)
        audit_df.to_csv(os.path.join(output_dir, "audit_anomalies_report.csv"), index=False)
        
        print("\n==================================================")
        print(f"M&E DATA PIPELINE COMPLETE:")
        print(f"  - Cleaned Maternal Records: {len(clean_mat_df)} rows saved.")
        print(f"  - Cleaned Child Records: {len(clean_chld_df)} rows saved.")
        print(f"  - Anomalies Logged: {len(self.audit_log)} issues written to audit report.")
        print("==================================================")

    def get_mock_raw_maternal(self):
        """Mocks a raw maternal spreadsheet containing typical field worker entry anomalies."""
        return pd.DataFrame([
            {"id": "PREG-9002", "motherName": "Rekha Bai", "age": 26, "state": "Rajasthan", "district": "Patna", "incomeCategory": "BPL", "regDate": "2025-10-01", "anc1": "2025-11-15", "anc2": "2025-12-10", "anc3": "2025-10-20", "anc4": "2026-02-05"},
            {"id": "PREG-9003", "motherName": "Sunita Katara", "age": 12, "state": "Rajasthan", "district": "Dungarpur", "incomeCategory": "BPL", "regDate": "2025-11-10", "anc1": "2025-12-05", "anc2": "2026-01-20", "anc3": "", "anc4": ""},
            {"id": "PREG-1004", "motherName": "Suman Devi", "age": 28, "state": "Uttar Pradesh", "district": "Lucknow", "incomeCategory": "APL", "regDate": "2026-01-10", "anc1": "2026-02-05", "anc2": "2026-03-15", "anc3": "2026-04-20", "anc4": "2026-05-18"}
        ])

    def get_mock_raw_child(self):
        """Mocks a raw child growth spreadsheet containing outliers."""
        return pd.DataFrame([
            {"id": "CHLD-9001", "childName": "Rahul Meena", "motherName": "Sita Devi", "dob": "2025-09-10", "ageMonths": 9, "weightKg": 45.0, "heightCm": 68.0, "state": "Rajasthan", "district": "Udaipur"},
            {"id": "CHLD-9006", "childName": "Gita Damor", "motherName": "Lata Devi", "dob": "2024-02-15", "ageMonths": 28, "weightKg": -7.5, "heightCm": 84.5, "state": "Rajasthan", "district": "Banswara"},
            {"id": "CHLD-2003", "childName": "Vihaan Gowda", "motherName": "Anusuya Gowda", "dob": "2025-03-01", "ageMonths": 15, "weightKg": 10.2, "heightCm": 78.5, "state": "Karnataka", "district": "Bengaluru"}
        ])

if __name__ == "__main__":
    cleaner = NGODataCleaner()
    cleaner.clean_and_audit("raw_maternal.csv", "raw_child.csv")
