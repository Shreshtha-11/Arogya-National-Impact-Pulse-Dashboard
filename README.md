 # Arogya National Impact Pulse Dashboard

An interactive, national-scale Monitoring & Evaluation (M&E) dashboard designed for **Arogya Rural Health Alliance (ARHA)**. This dashboard translates raw community health worker (ASHA) field logs into decision-relevant indicators for the Executive Director, Program Managers, and Donors.

Project Deployment: https://clever-eclair-25df77.netlify.app/

---

##  Key M&E Problems Solved

### 1. The Monday Morning Pulse (ED's "One Number")
The dashboard highlights the **ANC-4 Completion Rate** (percentage of pregnant mothers who completed 4+ prenatal checkups) and the **SAM Child Growth Recovery Rate** as the primary weekly indicators. Antenatal compliance is the single most predictive leading indicator of safe deliveries and healthy neonatal outcomes.

### 2. Handling Field Data Quality Issues
Raw ASHA field logs contain data entry errors. The toolkit handles this through:
- **Automated Validation Engine:** Rules that audit ID formats, check date order chronology (ANC-4 must happen after ANC-1), catch biological wasting outliers (WHO growth charts checks), and detect state-district mismatches.
- **Data Quality Lab (Inline Correction):** Lists flagged records in a queue and allows non-technical officers to correct them inline via dropdown menus listing only valid states and districts of India.

### 3. 100% Geographic Curation (All 36 States/UTs)
To prevent empty/zero-metric screens, the data generator seeds clean health and worker records for **every state and district in India** (~900 records, 180 health workers). Selecting any region in the cascading State $\rightarrow$ District $\rightarrow$ Village filters displays populated outcomes.

### 4. Scaled Cost-Per-Impact
Links financial spreadsheets directly to field results. Dynamically scales expenditures to geographic selection size to show:
- **Cost per Institutional Delivery facilitated**
- **Cost per Child Recovered from Malnutrition**
- **Cost per Village Health Camp conducted**

---

##  Repository Directory Structure

```text
impact-dashboard/
│
├── index.html            # Core HTML structure, filters layout, and CDN references
├── styles.css            # Glassmorphic themes, responsive grids, and path rules
├── app.js                # Core controller: tab switching, filters, Chart.js integrations
│
├── data.js               # Dynamic national datastore, dictionary, and seed records
├── validation.js         # Validation engine checks and biological limits
├── kpiTree.js            # Theory of Change configuration rules and nodes
├── guide.js              # Searchable user guides and data dictionaries
│
├── test-validation.js    # Automated Node unit tests suite
├── schema.sql            # PostgreSQL schema script and foreign keys
└── clean_data.py         # Python Pandas data cleaning pipeline script
```

---

##  How to Run and Test

### 1. Run the Dashboard UI
Double-click the **`index.html`** file in your project folder to run it in any web browser. No server compilation or packages are required.
- Click the lightbulb/moon icon in the top right to switch between **Dark Mode** and **Light Mode**.
- Switch to the **Logical KPI Tree** tab and click cards to trace dependencies.
- Go to the **Data Quality Lab**, click **Load Preset with Field Errors**, edit anomalies using the dropdown select options, and click **Save Corrections** to sync charts.

### 2. Run the Automated Unit Tests (Node.js)
Open your terminal in the directory and run:
```bash
node test-validation.js
```
This runs assertions against the validation rules to check if date chronology violations, biological outliers, and state-district mismatches are caught.

### 3. Run the Data Cleaning Pipeline (Python)
Ensure you have `pandas` installed, then run the offline ingestion pipeline:
```bash
python clean_data.py
```
This script reads raw field CSVs, filters out dirty records into `audit_anomalies_report.csv` for field worker feedback, and saves clean files to `cleaned_output/maternal_clean.csv`.

### 4. Deploy the Database Schema (PostgreSQL)
Import **`schema.sql`** into your PostgreSQL database to deploy structured relational tables:
```bash
psql -U username -d dbname -f schema.sql
```

---

##  Technical Stack & CDNs
- **Core Structure:** HTML5 & Vanilla ES6 JavaScript Modules
- **Styles:** Custom Vanilla CSS Grid & Flexbox (Default Dark Theme)
- **Charts:** Chart.js (Loaded via jsDelivr CDN)
- **Icons:** Lucide Icons (Loaded via unpkg CDN)
- **Data Ingestion:** Python 3 & Pandas (Offline pipeline)
- **Database Backend:** PostgreSQL (DDL schemas)
- **Testing:** Node.js Assertions

##Team members    
Shreshtha Shrinivas - 24124046
Yuvraj - 24124046
Vansh Kulria-24124043
Vivek Kumar - 24124044
Himanshu Sejwal-24124016

