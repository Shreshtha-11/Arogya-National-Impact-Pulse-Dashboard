-- =====================================================================
-- schema.sql - PostgreSQL Database Schema for NGO M&E Backend
-- Translates ASHA field diary records and financials into relational tables.
-- =====================================================================

-- 1. GEOGRAPHY REFERENCE
CREATE TABLE geography_hierarchy (
    id SERIAL PRIMARY KEY,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    UNIQUE(state_name, district_name)
);

-- 2. ASHA WORKERS REGISTER
CREATE TABLE asha_registry (
    asha_id VARCHAR(20) PRIMARY KEY,
    asha_name VARCHAR(150) NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    village_center VARCHAR(150) NOT NULL,
    FOREIGN KEY (state_name, district_name) 
        REFERENCES geography_hierarchy(state_name, district_name) ON UPDATE CASCADE
);

-- 3. MATERNAL HEALTH CASES (ASHA DIARY)
CREATE TABLE maternal_cases (
    case_id VARCHAR(20) PRIMARY KEY,
    mother_name VARCHAR(150) NOT NULL,
    age_at_reg INTEGER CHECK (age_at_reg >= 15 AND age_at_reg <= 49),
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    village_center VARCHAR(150) NOT NULL,
    income_category VARCHAR(10) CHECK (income_category IN ('BPL', 'APL')),
    registration_date DATE NOT NULL,
    anc1_date DATE NOT NULL,
    anc2_date DATE,
    anc3_date DATE,
    anc4_date DATE,
    delivery_location VARCHAR(100), -- PHC, CHC, Home, District Hospital, Sub-Center
    delivery_outcome VARCHAR(100), -- Live Birth, Stillbirth, Complication-Referred
    asha_id VARCHAR(20) REFERENCES asha_registry(asha_id),
    
    -- Date order integrity constraints
    CONSTRAINT check_anc1_date CHECK (anc1_date >= registration_date),
    CONSTRAINT check_anc2_date CHECK (anc2_date IS NULL OR anc2_date >= anc1_date),
    CONSTRAINT check_anc3_date CHECK (anc3_date IS NULL OR anc3_date >= anc2_date),
    CONSTRAINT check_anc4_date CHECK (anc4_date IS NULL OR anc4_date >= anc3_date),
    
    -- Cross boundary consistency constraint
    FOREIGN KEY (state_name, district_name) 
        REFERENCES geography_hierarchy(state_name, district_name) ON UPDATE CASCADE
);

-- 4. CHILD NUTRITION & GROWTH SCREENING
CREATE TABLE child_cases (
    case_id VARCHAR(20) PRIMARY KEY,
    child_name VARCHAR(150) NOT NULL,
    mother_name VARCHAR(150) NOT NULL,
    date_of_birth DATE NOT NULL,
    age_months INTEGER CHECK (age_months >= 0 AND age_months <= 60),
    weight_kg NUMERIC(4,2) CHECK (weight_kg > 0.0),
    height_cm NUMERIC(5,2) CHECK (height_cm >= 30.0 AND height_cm <= 130.0),
    nutritional_status VARCHAR(15) CHECK (nutritional_status IN ('Normal', 'MAM', 'SAM')),
    last_checkup_date DATE NOT NULL,
    state_name VARCHAR(100) NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    village_center VARCHAR(150) NOT NULL,
    
    CONSTRAINT check_checkup_date CHECK (last_checkup_date >= date_of_birth),
    FOREIGN KEY (state_name, district_name) 
        REFERENCES geography_hierarchy(state_name, district_name) ON UPDATE CASCADE
);

-- 5. ASHA MONTHLY PERFORMANCE LOGS
CREATE TABLE asha_activity_logs (
    log_id SERIAL PRIMARY KEY,
    asha_id VARCHAR(20) REFERENCES asha_registry(asha_id),
    month_period VARCHAR(7) NOT NULL, -- Format: YYYY-MM
    visits_conducted INTEGER CHECK (visits_conducted >= 0),
    camps_facilitated INTEGER CHECK (camps_facilitated >= 0),
    supplements_distributed INTEGER CHECK (supplements_distributed >= 0),
    immunizations_assisted INTEGER CHECK (immunizations_assisted >= 0),
    hours_worked INTEGER CHECK (hours_worked >= 0),
    incentives_earned_inr NUMERIC(10,2) CHECK (incentives_earned_inr >= 0)
);

-- 6. PROGRAM OVERHEAD FINANCIALS
CREATE TABLE program_financials (
    financial_id SERIAL PRIMARY KEY,
    program_name VARCHAR(150) NOT NULL,
    category_name VARCHAR(150) NOT NULL,
    allocated_budget_inr NUMERIC(12,2) NOT NULL CHECK (allocated_budget_inr >= 0),
    actual_expended_inr NUMERIC(12,2) NOT NULL CHECK (actual_expended_inr >= 0)
);

-- =====================================================================
-- DUMMY SEED SAMPLES FOR SQL BACKEND INITIALIZATION
-- =====================================================================
INSERT INTO geography_hierarchy (state_name, district_name) VALUES
('Rajasthan', 'Udaipur'),
('Rajasthan', 'Banswara'),
('Rajasthan', 'Dungarpur'),
('Bihar', 'Patna'),
('Bihar', 'Gaya'),
('Uttar Pradesh', 'Lucknow'),
('Karnataka', 'Bengaluru'),
('Maharashtra', 'Pune');

INSERT INTO asha_registry (asha_id, asha_name, state_name, district_name, village_center) VALUES
('ASH-001', 'Kamla Devi', 'Rajasthan', 'Udaipur', 'Udaipur Clinic A'),
('ASH-002', 'Meena Bai', 'Rajasthan', 'Udaipur', 'Udaipur Sub-center B'),
('ASH-005', 'Priyanka Mishra', 'Uttar Pradesh', 'Lucknow', 'Lucknow Clinic A'),
('ASH-007', 'Sunita Manjhi', 'Bihar', 'Patna', 'Patna Clinic A');
