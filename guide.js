/**
 * guide.js - Searchable M&E User Guide Content for Arogya National Impact Pulse
 * Explains Theory of Change, Monday checklists, and national cross-boundary data validation rules.
 */

const USER_GUIDES = [
  {
    id: "g-intro",
    title: "1. The Logical Framework (Theory of Change)",
    category: "M&E Foundations",
    content: `
      <h2>The Logical Framework (Theory of Change)</h2>
      <p>Traditional NGO monitoring tracks <em>activities</em> (what we did, such as training workshops) and <em>outputs</em> (immediate products, like number of people trained). While valuable, these do not prove that lives have actually changed.</p>
      
      <blockquote>
        <strong>Theory of Change:</strong> Activity &rarr; Output &rarr; Outcome &rarr; Impact.
      </blockquote>
      
      <p>Arogya National Impact Pulse uses this 4-tier model to ensure every rupee spent translates into healthier families across the country:</p>
      <ul>
        <li><strong>Activities (What we do):</strong> Conduct Village Health Days (VHNDs), train ASHA workers, and visit homes.</li>
        <li><strong>Outputs (What we deliver):</strong> Mothers registered, child weights screened, and nutritional rations distributed.</li>
        <li><strong>Outcomes (Behavioral & Health shifts):</strong> Increase in prenatal checkups (ANC-4), increase in institutional deliveries, and higher immunization rates.</li>
        <li><strong>Impacts (Societal shifts):</strong> Reduced Maternal Mortality Ratio (MMR) and Infant Mortality Rate (IMR).</li>
      </ul>
      
      <h3>Why this matters for Fundraising</h3>
      <p>Institutional donors (CSR departments, international foundations) no longer fund "number of camps held." They want to see the <strong>cost-per-impact</strong>: how many maternal deaths were averted per million rupees spent, or how much it cost to nurse a child out of Severe Acute Malnutrition (SAM). This dashboard calculates these outcomes dynamically, linking financial expenditures directly to outcome metrics at a national and state level.</p>
    `
  },
  {
    id: "g-pulse",
    title: "2. The Monday Morning Pulse (ED's Checklist)",
    category: "Operations",
    content: `
      <h2>The Monday Morning Pulse</h2>
      <p>As the Executive Director (ED), you do not need to look at 50 indicators every day. M&E experts recommend focusing on <strong>one or two critical leading indicators</strong> that are predictive of long-term success.</p>
      
      <h3>The Key Number: ANC-4 Compliance Rate</h3>
      <p>For maternal health, the single most critical leading indicator is the <strong>ANC-4 Completion Rate</strong> (the percentage of pregnant women receiving at least four Antenatal Care checkups). Here is why:</p>
      <ul>
        <li>It is highly predictive: A woman who completes four checkups is 3x more likely to deliver in a hospital under professional supervision, reducing maternal mortality by over 70%.</li>
        <li>It is actionable: If the ANC-4 rate drops, it indicates that ASHA home visits are slipping or mothers are facing transport barriers, allowing the Program Manager to intervene immediately.</li>
      </ul>
      
      <h3>The Secondary Number: SAM Child Recovery Rate</h3>
      <p>For nutrition, track the <strong>Malnutrition Recovery Rate</strong>. This measures the percentage of screened SAM (Severe Acute Malnutrition) children who return to a healthy weight within 90 days of receiving nutritional support. A dip here indicates logistics supply issues (take-home ration delays) or health worker training gaps.</p>
      
      <h3>Actionable Monday Routine for the ED</h3>
      <p>Every Monday morning, filter the dashboard by the current quarter and look at:
        <br><code>1. National/State ANC-4 Completion Rate (Target: 80%)</code>
        <br><code>2. SAM Child Growth Recovery Rate (Target: 85%)</code>
        <br><code>3. Critical Alerts (Missed appointments or geographic mismatches)</code>
      </p>
      <p>If any state is lagging, use the State selector to filter down to the local districts and trace where the drop is happening.</p>
    `
  },
  {
    id: "g-quality",
    title: "3. Handling Field Data Quality Issues",
    category: "Data Governance",
    content: `
      <h2>Handling Field Data Quality Issues</h2>
      <p>In rural health operations, field data is recorded by ASHA workers on paper registers or entry-level mobile devices. Due to language barriers, heavy workloads, and fat-finger typing, raw datasets contain errors. Rejecting this data shuts down M&E. Instead, we use an <strong>Automated Data Validation Engine</strong>.</p>
      
      <h3>Common Error Patterns in National Data</h3>
      <table>
        <thead>
          <tr>
            <th>Error Type</th>
            <th>Example</th>
            <th>Automated Rule Solution</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>State-District Mismatch</strong></td>
            <td>A record listing District "Patna" (which is in Bihar) under State "Rajasthan".</td>
            <td>Verifies that the selected district matches the state list inside the geography tree database. Flags boundary anomalies.</td>
          </tr>
          <tr>
            <td><strong>Biologically Anomalous Weight</strong></td>
            <td>A 9-month old child registered as weighing 45.0 kg (typo for 4.5 kg).</td>
            <td>Checks weight against WHO growth standards for age. Warns if outside 3 standard deviations.</td>
          </tr>
          <tr>
            <td><strong>Chronology Violations</strong></td>
            <td>ANC-3 checkup date recorded as happening before ANC-1 date.</td>
            <td>Validates that all date values increase sequentially. Mismatches are flagged.</td>
          </tr>
          <tr>
            <td><strong>Missing Critical Fields</strong></td>
            <td>A maternal registration with no name, phone, or village.</td>
            <td>Blocks data import if required identifying columns are empty.</td>
          </tr>
          <tr>
            <td><strong>Duplicate Registration IDs</strong></td>
            <td>Re-registering a child or mother under an existing ID number.</td>
            <td>Identifies duplicate primary keys and flags the second entry.</td>
          </tr>
        </tbody>
      </table>
      
      <h3>Using the Data Quality Lab</h3>
      <p>The dashboard includes a <strong>Data Quality Lab</strong>. To clean data:</p>
      <ol>
        <li>Go to the <em>Data Quality Lab</em> tab.</li>
        <li>Review flagged records highlighted in orange (Warnings) and red (Errors). Mismatched States or Districts are shown in red.</li>
        <li>Correct the fields using the inline editor. The editor provides convenient select dropdowns listing only valid States and Districts of India!</li>
        <li>Click <strong>Apply Fix</strong> and then **Save Corrections**. All dashboard stats and maps will immediately update.</li>
      </ol>
    `
  },
  {
    id: "g-cadence",
    title: "4. Right Cadence: Weekly, Monthly, or Annual?",
    category: "Operations",
    content: `
      <h2>The Right Cadence for M&E Reporting</h2>
      <p>A common pitfall is expecting "real-time" data for all indicators. Trying to monitor macro impact metrics (like MMR) weekly is useless and exhausts field workers. We recommend a <strong>hybrid cadence</strong>:</p>
      
      <h3>1. Weekly Cadence (Operational Course-Correction)</h3>
      <p><strong>What:</strong> ASHA home visits completed, health camps held, nutritional rations distributed, and new high-risk pregnancies identified.</p>
      <p><strong>Why:</strong> These are activity and output metrics. Program managers need to see if targets are being hit week-by-week to adjust travel plans, re-stock rations, or address absenteeism.</p>
      
      <h3>2. Monthly Cadence (Outcome Review)</h3>
      <p><strong>What:</strong> ANC-4 completion percentages, hospital birth rates, child nutrition recovery rates, and immunization series completed.</p>
      <p><strong>Why:</strong> Outcomes require time to manifest. Hospital deliveries and child recovery processes operate on monthly health cycles and require compilation from local public health centers (PHCs).</p>
      
      <h3>3. Annual Cadence (Impact Evaluation)</h3>
      <p><strong>What:</strong> Maternal Mortality Ratio (MMR) and Infant Mortality Rate (IMR).</p>
      <p><strong>Why:</strong> Mortality events are statistical anomalies at a village level. It requires a full year of aggregated district-level data, coupled with national census surveys (like NFHS-5 in India), to measure genuine shifts in mortality.</p>
    `
  },
  {
    id: "g-dictionary-m",
    title: "5. Maternal Data Dictionary",
    category: "Data Reference",
    content: `
      <h2>Maternal Health Tracker Data Dictionary</h2>
      <p>The following table defines the columns, validation parameters, and sources for maternal health indicators used in this dashboard:</p>
      <div id="dictionary-m-table-container"></div>
    `
  },
  {
    id: "g-dictionary-c",
    title: "6. Child Data Dictionary",
    category: "Data Reference",
    content: `
      <h2>Child Nutrition Tracker Data Dictionary</h2>
      <p>The following table defines the columns, validation parameters, and sources for child growth and nutrition indicators used in this dashboard:</p>
      <div id="dictionary-c-table-container"></div>
    `
  }
];

window.ARHA_GUIDE = {
  guides: USER_GUIDES
};
console.log("ARHA National Knowledge Base Loaded.");
