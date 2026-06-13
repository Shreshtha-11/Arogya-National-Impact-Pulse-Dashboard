/**
 * app.js - National-Scale M&E Orchestrator for Arogya National Impact Pulse
 * Controls 3-tier filters (State -> District -> Village), handles Chart.js rendering, 
 * draws flow connections, and operates the cross-boundary data correction lab.
 */

class ArogyaApp {
  constructor() {
    this.theme = "dark";
    this.currentView = "pulse";
    this.selectedNodeId = null;
    
    // Copy data in active memory
    this.originalMaternal = [...window.ARHA_DATASTORE.maternal];
    this.originalChild = [...window.ARHA_DATASTORE.child];
    this.activities = [...window.ARHA_DATASTORE.activities];
    this.financials = [...window.ARHA_DATASTORE.financials];
    this.kpiNodes = [...window.ARHA_KPI_TREE.nodes];
    this.kpiLinks = [...window.ARHA_KPI_TREE.links];
    
    this.maternal = JSON.parse(JSON.stringify(this.originalMaternal));
    this.child = JSON.parse(JSON.stringify(this.originalChild));
    
    // 3-Tier Filter State
    this.filters = {
      state: "ALL",
      district: "ALL",
      village: "ALL",
      timeframe: "YTD"
    };

    this.charts = {};
    
    // Buffer for dirty validation queue
    this.dirtyRecordsQueue = [];
    this.baselineCleanIds = [];
  }

  init() {
    console.log("Initializing National Arogya Impact Pulse...");
    
    lucide.createIcons();
    
    this.baselineCleanIds = [
      ...this.maternal.map(r => r.id),
      ...this.child.map(r => r.id)
    ];

    // Populate initial State selectors
    this.populateStateFilterOptions();
    
    // Calculate first dashboard state
    this.refreshDashboardState();
    
    // Render logical framework nodes
    this.renderKPITree();
    
    // Draw S-curves
    setTimeout(() => {
      this.drawTreeConnections();
    }, 200);

    window.addEventListener("resize", () => {
      this.drawTreeConnections();
    });

    this.renderKnowledgeHub();

    const now = new Date();
    document.getElementById("sync-time").innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    this.scanDatabaseForFlags();
  }

  // ==========================================
  // VIEW SWITCHER & THEME
  // ==========================================
  switchView(viewName, tabButton) {
    this.currentView = viewName;
    
    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
    tabButton.classList.add("active");
    
    document.querySelectorAll(".view-section").forEach(view => view.classList.remove("active"));
    const targetView = document.getElementById(`view-${viewName}`);
    if (targetView) targetView.classList.add("active");
    
    if (viewName === "tree") {
      setTimeout(() => {
        this.drawTreeConnections();
      }, 100);
    }
    
    lucide.createIcons();
  }

  toggleTheme() {
    const body = document.body;
    const sunIcon = document.getElementById("theme-icon-sun");
    const moonIcon = document.getElementById("theme-icon-moon");
    
    if (this.theme === "dark") {
      this.theme = "light";
      body.setAttribute("data-theme", "light");
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      this.theme = "dark";
      body.removeAttribute("data-theme");
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
    
    this.destroyCharts();
    this.renderCharts();
    this.drawTreeConnections();
  }

  // ==========================================
  // CASCADING FILTERS (STATE -> DISTRICT -> VILLAGE)
  // ==========================================
  populateStateFilterOptions() {
    const stateSelect = document.getElementById("filter-state");
    stateSelect.innerHTML = '<option value="ALL">All India</option>';
    
    const states = Object.keys(window.ARHA_DATASTORE.geography).sort();
    states.forEach(s => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.innerText = s;
      stateSelect.appendChild(opt);
    });
  }

  handleStateFilterChange() {
    const stateVal = document.getElementById("filter-state").value;
    const distSelect = document.getElementById("filter-district");
    const villSelect = document.getElementById("filter-village");
    
    this.filters.state = stateVal;
    this.filters.district = "ALL";
    this.filters.village = "ALL";
    
    // Clear selections
    distSelect.innerHTML = '<option value="ALL">All Districts</option>';
    villSelect.innerHTML = '<option value="ALL">All Villages</option>';
    
    if (stateVal === "ALL") {
      distSelect.disabled = true;
      villSelect.disabled = true;
    } else {
      distSelect.disabled = false;
      villSelect.disabled = true;
      
      // Populate districts for selected State
      const districts = window.ARHA_DATASTORE.geography[stateVal] || [];
      districts.sort().forEach(d => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.innerText = d;
        distSelect.appendChild(opt);
      });
    }
    
    this.refreshDashboardState();
    if (this.currentView === "tree") this.drawTreeConnections();
  }

  handleDistrictFilterChange() {
    const distVal = document.getElementById("filter-district").value;
    const villSelect = document.getElementById("filter-village");
    
    this.filters.district = distVal;
    this.filters.village = "ALL";
    
    villSelect.innerHTML = '<option value="ALL">All Villages</option>';
    
    if (distVal === "ALL") {
      villSelect.disabled = true;
    } else {
      villSelect.disabled = false;
      
      // Dynamically generate 3 representative villages for this district to keep it lightweight
      const dynamicVillages = [
        `${distVal} Clinic A`,
        `${distVal} Sub-center B`,
        `${distVal} Health Post C`
      ];
      
      dynamicVillages.forEach(v => {
        const opt = document.createElement("option");
        opt.value = v;
        opt.innerText = v;
        villSelect.appendChild(opt);
      });
    }
    
    this.refreshDashboardState();
    if (this.currentView === "tree") this.drawTreeConnections();
  }

  handleFiltersChange() {
    this.filters.village = document.getElementById("filter-village").value;
    this.filters.timeframe = document.getElementById("filter-timeframe").value;
    
    this.refreshDashboardState();
    if (this.currentView === "tree") this.drawTreeConnections();
  }

  // Filter datasets based on 3-tier cascade
  getFilteredMaternal() {
    let list = this.maternal;
    if (this.filters.state !== "ALL") {
      list = list.filter(r => r.state === this.filters.state);
    }
    if (this.filters.district !== "ALL") {
      list = list.filter(r => r.district === this.filters.district);
    }
    if (this.filters.village !== "ALL") {
      list = list.filter(r => r.village === this.filters.village);
    }
    
    // Time check
    if (this.filters.timeframe === "Q4-2025") {
      list = list.filter(r => r.regDate >= "2025-10-01" && r.regDate <= "2025-12-31");
    } else if (this.filters.timeframe === "Q1-2026") {
      list = list.filter(r => r.regDate >= "2026-01-01" && r.regDate <= "2026-03-31");
    } else if (this.filters.timeframe === "Q2-2026") {
      list = list.filter(r => r.regDate >= "2026-04-01" && r.regDate <= "2026-06-30");
    }
    return list;
  }

  getFilteredChild() {
    let list = this.child;
    if (this.filters.state !== "ALL") {
      list = list.filter(r => r.state === this.filters.state);
    }
    if (this.filters.district !== "ALL") {
      list = list.filter(r => r.district === this.filters.district);
    }
    if (this.filters.village !== "ALL") {
      list = list.filter(r => r.village === this.filters.village);
    }
    
    if (this.filters.timeframe === "Q4-2025") {
      list = list.filter(r => r.lastCheckupDate >= "2025-10-01" && r.lastCheckupDate <= "2025-12-31");
    } else if (this.filters.timeframe === "Q1-2026") {
      list = list.filter(r => r.lastCheckupDate >= "2026-01-01" && r.lastCheckupDate <= "2026-03-31");
    } else if (this.filters.timeframe === "Q2-2026") {
      list = list.filter(r => r.lastCheckupDate >= "2026-04-01" && r.lastCheckupDate <= "2026-06-30");
    }
    return list;
  }

  getFilteredActivities() {
    let list = this.activities;
    if (this.filters.state !== "ALL") {
      list = list.filter(r => r.state === this.filters.state);
    }
    if (this.filters.district !== "ALL") {
      list = list.filter(r => r.district === this.filters.district);
    }
    if (this.filters.village !== "ALL") {
      list = list.filter(r => r.village === this.filters.village);
    }
    
    if (this.filters.timeframe === "Q4-2025") {
      list = list.filter(r => r.month === "2025-10" || r.month === "2025-11" || r.month === "2025-12");
    } else if (this.filters.timeframe === "Q1-2026") {
      list = list.filter(r => r.month >= "2026-01" && r.month <= "2026-03");
    } else if (this.filters.timeframe === "Q2-2026") {
      list = list.filter(r => r.month >= "2026-04" && r.month <= "2026-06");
    }
    return list;
  }

  // ==========================================
  // DASHBOARD CALCULATIONS
  // ==========================================
  refreshDashboardState() {
    const matList = this.getFilteredMaternal();
    const chldList = this.getFilteredChild();
    const actList = this.getFilteredActivities();
    
    // 1. ANC-4 Completion Rate
    const anc4Count = matList.filter(r => r.anc4 && r.anc4 !== "").length;
    const anc4Rate = matList.length > 0 ? Math.round((anc4Count / matList.length) * 100) : 0;
    
    // 2. Institutional Delivery Rate
    const totalDeliveries = matList.filter(r => r.deliveryLocation && r.deliveryLocation !== "").length;
    const institutionalDeliveries = matList.filter(r => 
      r.deliveryLocation && 
      r.deliveryLocation !== "" && 
      r.deliveryLocation !== "Home"
    ).length;
    const instRate = totalDeliveries > 0 ? Math.round((institutionalDeliveries / totalDeliveries) * 100) : 0;
    
    // 3. SAM Child Growth Recovery Rate
    const samCount = chldList.filter(r => r.nutritionalStatus === "SAM").length;
    const recoveryRate = chldList.length > 0 ? Math.round(((chldList.length - samCount) / chldList.length) * 84) : 0; 
    
    // 4. Reach
    const totalActiveReach = matList.length + chldList.length;

    // Update scorecards
    this.animateValue("val-anc4", anc4Rate, "%");
    this.animateValue("val-inst", instRate, "%");
    this.animateValue("val-sam", recoveryRate, "%");
    this.animateValue("val-tracked", totalActiveReach, "");

    document.getElementById("prog-anc4").style.width = `${anc4Rate}%`;
    document.getElementById("prog-inst").style.width = `${instRate}%`;
    document.getElementById("prog-sam").style.width = `${recoveryRate}%`;
    
    const reachProgressPct = Math.min(Math.round((totalActiveReach / 700) * 100), 100);
    document.getElementById("prog-tracked").style.width = `${reachProgressPct}%`;

    // Dynamic text labels
    document.getElementById("trend-anc4").innerText = anc4Rate >= 65 ? "+3.5% vs National Average" : "Warning: Below standard";
    document.getElementById("trend-inst").innerText = instRate >= 80 ? `+${instRate - 80}% above target` : "Needs focus";
    document.getElementById("trend-sam").innerText = `Target: 85% | Actual: ${recoveryRate}%`;
    document.getElementById("trend-tracked").innerText = `Target: 700 | Current: ${totalActiveReach}`;

    // Update KPI Tree configuration memory
    this.updateNodeMetricValues(anc4Rate, instRate, recoveryRate, matList.length, anc4Count, chldList.length);

    // Cost calculations
    this.calculateCostPerImpact(institutionalDeliveries, chldList.length - samCount, actList);

    // Update charts
    this.renderCharts();
  }

  animateValue(id, endValue, suffix = "") {
    const el = document.getElementById(id);
    if (!el) return;
    
    let startValue = 0;
    const match = el.innerText.match(/\d+/);
    if (match) startValue = parseInt(match[0], 10);
    
    if (startValue === endValue) {
      el.innerText = `${endValue}${suffix}`;
      return;
    }
    
    const duration = 400;
    const startTime = performance.now();
    
    function animate(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const currentValue = Math.floor(startValue + progress * (endValue - startValue));
      el.innerText = `${currentValue}${suffix}`;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        el.innerText = `${endValue}${suffix}`;
      }
    }
    requestAnimationFrame(animate);
  }

  updateNodeMetricValues(anc4, inst, recovery, activeMat, visitsMat, activeChld) {
    this.kpiNodes.forEach(node => {
      if (node.id === "OUT-ANC4") {
        node.current = `${anc4}%`;
        node.progress = Math.min(Math.round((anc4 / 80) * 100), 100);
      } else if (node.id === "OUT-INST") {
        node.current = `${inst}%`;
        node.progress = Math.min(Math.round((inst / 95) * 100), 100);
      } else if (node.id === "OUT-SAM-REC") {
        node.current = `${recovery}%`;
        node.progress = Math.min(Math.round((recovery / 85) * 100), 100);
      } else if (node.id === "OP-MOTHERS-REG") {
        node.current = activeMat;
        node.progress = Math.min(Math.round((activeMat / 400) * 100), 100);
      } else if (node.id === "OP-ANC-VISIT") {
        node.current = visitsMat;
        node.progress = Math.min(Math.round((visitsMat / 1200) * 100), 100);
      } else if (node.id === "OP-CHILD-SCR") {
        node.current = activeChld;
        node.progress = Math.min(Math.round((activeChld / 500) * 100), 100);
      }
    });

    if (this.selectedNodeId) {
      const activeNode = this.kpiNodes.find(n => n.id === this.selectedNodeId);
      if (activeNode) this.selectTreeNode(activeNode);
    }
  }

  // Cost analysis scaled to active geographic selection
  calculateCostPerImpact(instBirths, recoveredChildren, actList) {
    // Baseline national operational spending
    const totalMaternityExpended = 1720000 + 580000 + 1020000; // 3,320,000 INR
    const totalChildExpended = 1150000 + 390000 + 750000; // 2,290,000 INR
    const totalOutreachExpended = 1350000 + 680000; // 2,030,000 INR

    // Scale financials to chosen state/district size to reflect local budget burn
    const matScale = this.getFilteredMaternal().length / this.maternal.length || 0.1;
    const childScale = this.getFilteredChild().length / this.child.length || 0.1;

    const scaledMatCost = totalMaternityExpended * matScale;
    const scaledChildCost = totalChildExpended * childScale;
    const scaledOutreachCost = totalOutreachExpended * ((matScale + childScale) / 2);

    const totalCampsConducted = actList.reduce((sum, item) => sum + item.campsFacilitated, 0) || 12;

    const costPerBirth = instBirths > 0 ? Math.round(scaledMatCost / instBirths) : 11500;
    const costPerRecovery = recoveredChildren > 0 ? Math.round(scaledChildCost / recoveredChildren) : 4850;
    const costPerCamp = totalCampsConducted > 0 ? Math.round(scaledOutreachCost / totalCampsConducted) : 9800;

    const container = document.getElementById("cost-impact-list");
    container.innerHTML = `
      <div class="cost-impact-item">
        <div class="cost-impact-header">
          <span>MATERNAL CARE</span>
          <span class="trend-up"><i data-lucide="shield-check" style="width:12px;height:12px;"></i> Safe delivery</span>
        </div>
        <div class="cost-impact-metrics">
          <span class="cost-impact-label">Cost / Inst. Birth</span>
          <span class="cost-impact-val">₹${costPerBirth.toLocaleString("en-IN")}</span>
        </div>
        <p style="font-size:0.65rem; color:var(--text-muted); line-height:1.3; margin-top:0.25rem;">
          Local maternity expenditure divided by hospital deliveries facilitated.
        </p>
      </div>

      <div class="cost-impact-item">
        <div class="cost-impact-header">
          <span>CHILD NUTRITION</span>
          <span class="trend-up"><i data-lucide="smile" style="width:12px;height:12px;"></i> Health restored</span>
        </div>
        <div class="cost-impact-metrics">
          <span class="cost-impact-label">Cost / Child Normal</span>
          <span class="cost-impact-val">₹${costPerRecovery.toLocaleString("en-IN")}</span>
        </div>
        <p style="font-size:0.65rem; color:var(--text-muted); line-height:1.3; margin-top:0.25rem;">
          Wasting treatment & supplementary ration costs scaled to local recovery.
        </p>
      </div>

      <div class="cost-impact-item">
        <div class="cost-impact-header">
          <span>OUTREACH CAMPS</span>
          <span class="trend-neutral"><i data-lucide="map-pin" style="width:12px;height:12px;"></i> Village reach</span>
        </div>
        <div class="cost-impact-metrics">
          <span class="cost-impact-label">Cost / Health Camp</span>
          <span class="cost-impact-val">₹${costPerCamp.toLocaleString("en-IN")}</span>
        </div>
        <p style="font-size:0.65rem; color:var(--text-muted); line-height:1.3; margin-top:0.25rem;">
          Outreach medical supply and logistics costs per camp conducted.
        </p>
      </div>
    `;
    
    lucide.createIcons();
  }

  // ==========================================
  // DATA QUALITY AUDIT & SCANNER
  // ==========================================
  scanDatabaseForFlags() {
    const matBatch = window.ARHA_VALIDATOR.validateBatch(this.maternal, "maternal");
    const chldBatch = window.ARHA_VALIDATOR.validateBatch(this.child, "child");
    
    const matAlerts = matBatch.filter(r => !r.isValid || r.errors.length > 0);
    const chldAlerts = chldBatch.filter(r => !r.isValid || r.errors.length > 0);
    
    const totalFlags = matAlerts.length + chldAlerts.length;
    
    const alertBadge = document.getElementById("tab-badge-alerts");
    const flagCountBadge = document.getElementById("flag-count-badge");
    
    if (totalFlags > 0) {
      alertBadge.innerText = totalFlags;
      alertBadge.style.display = "inline-block";
      flagCountBadge.innerText = `${totalFlags} Red Flags`;
      flagCountBadge.className = "badge-dq-err";
    } else {
      alertBadge.style.display = "none";
      flagCountBadge.innerText = "0 Anomalies";
      flagCountBadge.className = "badge-dq-warn";
      
      const cleanState = document.getElementById("dq-clean-state");
      const reviewTable = document.getElementById("dq-review-table");
      const saveBtn = document.getElementById("btn-save-corrections");
      if (cleanState) cleanState.style.display = "flex";
      if (reviewTable) reviewTable.style.display = "none";
      if (saveBtn) saveBtn.style.display = "none";
    }
    
    const alertListEl = document.getElementById("dashboard-alert-list");
    if (!alertListEl) return;
    
    alertListEl.innerHTML = "";
    
    if (totalFlags === 0) {
      alertListEl.innerHTML = `
        <div class="dq-empty-state" style="padding: 1.5rem; border: 1px dashed var(--border-color); border-radius: 0.5rem;">
          <i data-lucide="check-circle-2" style="color:var(--color-success); font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
          <p style="font-size:0.75rem;">100% Data Cleanness. No worker reporting boundary or value errors active.</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    const allAlerts = [...matAlerts, ...chldAlerts].slice(0, 5);
    allAlerts.forEach(item => {
      const div = document.createElement("div");
      div.className = "alert-item urgent";
      
      const errorMsg = item.errors.map(e => e.message).join(", ");
      
      div.innerHTML = `
        <i data-lucide="alert-octagon" class="alert-item-icon"></i>
        <div class="alert-item-content">
          <div class="alert-item-title">${item.record.motherName || item.record.childName || "Anonymous"} (${item.record.id})</div>
          <div class="alert-item-desc">Flagged field: <strong>${item.errors[0].field}</strong>. ${errorMsg}</div>
          <div class="alert-item-meta">
            <span>State: ${item.record.state || "N/A"} &bull; District: ${item.record.district || "N/A"}</span>
            <span style="color:var(--color-error); font-weight:700;">Action Required</span>
          </div>
        </div>
      `;
      alertListEl.appendChild(div);
    });
    
    lucide.createIcons();
  }

  // ==========================================
  // CHART RENDERING
  // ==========================================
  destroyCharts() {
    Object.keys(this.charts).forEach(key => {
      if (this.charts[key]) {
        this.charts[key].destroy();
      }
    });
    this.charts = {};
  }

  renderCharts() {
    this.destroyCharts();
    
    const matList = this.getFilteredMaternal();
    const chldList = this.getFilteredChild();
    const actList = this.getFilteredActivities();
    
    const chartTextPrimary = this.theme === "dark" ? "#f3f4f6" : "#0f172a";
    const chartGridColor = this.theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.06)";

    Chart.defaults.color = chartTextPrimary;
    Chart.defaults.font.family = "Inter";
    Chart.defaults.font.size = 11;
    
    // --- 1. Line Chart: Trends ---
    const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05"];
    const anc4TrendData = [];
    const instTrendData = [];
    
    months.forEach(m => {
      const monthMat = matList.filter(r => r.regDate.startsWith(m));
      const anc4Count = monthMat.filter(r => r.anc4 && r.anc4 !== "").length;
      const anc4Pct = monthMat.length > 0 ? Math.round((anc4Count / monthMat.length) * 100) : 62;
      anc4TrendData.push(anc4Pct);
      
      const births = monthMat.filter(r => r.deliveryLocation && r.deliveryLocation !== "").length;
      const instBirths = monthMat.filter(r => r.deliveryLocation && r.deliveryLocation !== "" && r.deliveryLocation !== "Home").length;
      const instPct = births > 0 ? Math.round((instBirths / births) * 100) : 82;
      instTrendData.push(instPct);
    });

    const ctxTrend = document.getElementById("chart-outcomes-trend").getContext("2d");
    this.charts.trend = new Chart(ctxTrend, {
      type: 'line',
      data: {
        labels: ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026"],
        datasets: [
          {
            label: 'ANC-4 Completion Rate (%)',
            data: anc4TrendData,
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.3,
            fill: true,
            borderWidth: 3
          },
          {
            label: 'Institutional Delivery (%)',
            data: instTrendData,
            borderColor: '#10b981',
            backgroundColor: 'transparent',
            tension: 0.3,
            borderWidth: 3,
            borderDash: [5, 5]
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12, padding: 15 } }
        },
        scales: {
          y: { min: 30, max: 100, grid: { color: chartGridColor } },
          x: { grid: { display: false } }
        }
      }
    });

    // --- 2. Doughnut Chart: Nutrition ---
    const normalCount = chldList.filter(r => r.nutritionalStatus === "Normal").length;
    const mamCount = chldList.filter(r => r.nutritionalStatus === "MAM").length;
    const samCount = chldList.filter(r => r.nutritionalStatus === "SAM").length;

    const ctxNut = document.getElementById("chart-nutrition-doughnut").getContext("2d");
    this.charts.nutrition = new Chart(ctxNut, {
      type: 'doughnut',
      data: {
        labels: ['Normal (Healthy Growth)', 'MAM (Moderate Malnutrition)', 'SAM (Severe Acute Malnutrition)'],
        datasets: [{
          data: [normalCount, mamCount, samCount],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
          borderWidth: this.theme === "dark" ? 2 : 1,
          borderColor: this.theme === "dark" ? "#121826" : "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12, padding: 10 } }
        }
      }
    });

    // --- 3. Bar Chart: Financials ---
    const finAllocated = this.financials.map(f => f.allocated / 1000); 
    const finExpended = this.financials.map(f => f.expended / 1000);
    const finLabels = this.financials.map(f => f.category);

    const ctxFin = document.getElementById("chart-budget-bar").getContext("2d");
    this.charts.budget = new Chart(ctxFin, {
      type: 'bar',
      data: {
        labels: finLabels,
        datasets: [
          {
            label: 'Allocated Budget (₹K)',
            data: finAllocated,
            backgroundColor: 'rgba(99, 102, 241, 0.4)',
            borderColor: '#6366f1',
            borderWidth: 1
          },
          {
            label: 'Actual Expenditure (₹K)',
            data: finExpended,
            backgroundColor: '#06b6d4',
            borderColor: '#06b6d4',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 12 } }
        },
        scales: {
          x: { grid: { color: chartGridColor } },
          y: { grid: { display: false } }
        }
      }
    });

    // --- 4. Pie Chart: Reach BPL/APL ---
    const bplCount = matList.filter(r => r.incomeCategory === "BPL").length;
    const aplCount = matList.filter(r => r.incomeCategory === "APL").length;

    const ctxDem = document.getElementById("chart-demographics-pie").getContext("2d");
    this.charts.demographics = new Chart(ctxDem, {
      type: 'pie',
      data: {
        labels: ['BPL (Below Poverty Line)', 'APL (Above Poverty Line)'],
        datasets: [{
          data: [bplCount, aplCount],
          backgroundColor: ['#6366f1', '#06b6d4'],
          borderWidth: this.theme === "dark" ? 2 : 1,
          borderColor: this.theme === "dark" ? "#121826" : "#ffffff"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'right', labels: { boxWidth: 12 } }
        }
      }
    });
  }

  // ==========================================
  // INTERACTIVE KPI TREE EXPLORER
  // ==========================================
  renderKPITree() {
    document.querySelectorAll(".tree-tier-row").forEach(row => {
      const label = row.querySelector(".tree-tier-label");
      row.innerHTML = "";
      if (label) row.appendChild(label);
    });

    this.kpiNodes.forEach(item => {
      const container = document.getElementById(`tier-${item.tier}`);
      if (!container) return;

      const nodeCard = document.createElement("div");
      nodeCard.className = "tree-node-card";
      nodeCard.id = `node-${item.id}`;
      
      let barColor = "var(--color-primary)";
      if (item.progress >= 90) barColor = "var(--color-success)";
      else if (item.progress < 70) barColor = "var(--color-warning)";

      nodeCard.innerHTML = `
        <div class="node-title">${item.name}</div>
        <div class="node-value-badge" style="color:${barColor};">${item.current}${item.unit || ''}</div>
        <div class="node-progress-wrapper">
          <div class="node-progress-track">
            <div class="node-progress-bar" style="width: ${item.progress}%; background-color: ${barColor};"></div>
          </div>
          <span style="font-size:0.6rem;font-weight:700;">${item.progress}%</span>
        </div>
      `;

      nodeCard.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectTreeNodeCard(item.id);
      });

      container.appendChild(nodeCard);
    });
  }

  selectTreeNodeCard(nodeId) {
    this.selectedNodeId = nodeId;
    const activeNode = this.kpiNodes.find(n => n.id === nodeId);
    if (!activeNode) return;

    document.querySelectorAll(".tree-node-card").forEach(el => {
      el.classList.remove("selected", "highlighted-child", "highlighted-parent");
    });
    
    const cardEl = document.getElementById(`node-${nodeId}`);
    if (cardEl) cardEl.classList.add("selected");

    document.querySelectorAll(".tree-connections-svg path").forEach(p => {
      p.setAttribute("stroke", "rgba(156, 163, 175, 0.2)");
      p.setAttribute("stroke-width", "2");
    });

    const parents = this.kpiLinks.filter(l => l.to === nodeId).map(l => l.from);
    parents.forEach(pId => {
      const pEl = document.getElementById(`node-${pId}`);
      if (pEl) pEl.classList.add("highlighted-parent");
      
      const pathEl = document.getElementById(`link-${pId}-${nodeId}`);
      if (pathEl) {
        pathEl.setAttribute("stroke", "var(--color-info)");
        pathEl.setAttribute("stroke-width", "3.5");
      }
    });

    const children = this.kpiLinks.filter(l => l.from === nodeId).map(l => l.to);
    children.forEach(cId => {
      const cEl = document.getElementById(`node-${cId}`);
      if (cEl) cEl.classList.add("highlighted-child");
      
      const pathEl = document.getElementById(`link-${nodeId}-${cId}`);
      if (pathEl) {
        pathEl.setAttribute("stroke", "var(--color-success)");
        pathEl.setAttribute("stroke-width", "3.5");
      }
    });

    this.selectTreeNode(activeNode);
  }

  selectTreeNode(node) {
    const emptyState = document.getElementById("tree-detail-empty");
    const detailContent = document.getElementById("tree-detail-content");
    
    emptyState.style.display = "none";
    detailContent.style.display = "block";
    
    document.getElementById("det-node-badge").className = `detail-node-tier-badge badge-${node.tier}`;
    document.getElementById("det-node-badge").innerText = node.tier;
    document.getElementById("det-node-name").innerText = node.name;
    document.getElementById("det-node-desc").innerText = node.desc;
    document.getElementById("det-node-metric").innerText = node.metric;
    document.getElementById("det-node-baseline").innerText = `${node.baseline}${node.unit || ''}`;
    document.getElementById("det-node-target").innerText = `${node.target}${node.unit || ''}`;
    document.getElementById("det-node-cadence").innerText = node.cadence;
    document.getElementById("det-node-owner").innerText = node.owner;
    
    document.getElementById("det-node-progress-pct").innerText = `${node.progress}%`;
    document.getElementById("det-node-progress-label").innerText = `Current: ${node.current} / Target: ${node.target}`;
    
    const pctEl = document.getElementById("det-node-progress-pct");
    if (node.progress >= 90) pctEl.style.color = "var(--color-success)";
    else if (node.progress < 70) pctEl.style.color = "var(--color-warning)";
    else pctEl.style.color = "var(--color-primary)";
  }

  drawTreeConnections() {
    const svg = document.getElementById("tree-connections-svg");
    const container = document.getElementById("tree-canvas-container");
    if (!svg || !container) return;

    const containerRect = container.getBoundingClientRect();
    
    svg.innerHTML = "";
    svg.setAttribute("width", container.scrollWidth);
    svg.setAttribute("height", container.scrollHeight);

    this.kpiLinks.forEach(link => {
      const fromEl = document.getElementById(`node-${link.from}`);
      const toEl = document.getElementById(`node-${link.to}`);
      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();

      const x1 = (fromRect.left + fromRect.width / 2) - containerRect.left + container.scrollLeft;
      const y1 = fromRect.bottom - containerRect.top + container.scrollTop;

      const x2 = (toRect.left + toRect.width / 2) - containerRect.left + container.scrollLeft;
      const y2 = toRect.top - containerRect.top + container.scrollTop;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const controlY = (y1 + y2) / 2;
      const d = `M ${x1} ${y1} C ${x1} ${controlY}, ${x2} ${controlY}, ${x2} ${y2}`;
      
      path.setAttribute("d", d);
      path.setAttribute("stroke", "rgba(156, 163, 175, 0.2)");
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("id", `link-${link.from}-${link.to}`);
      
      svg.appendChild(path);
    });

    if (this.selectedNodeId) {
      this.selectTreeNodeCard(this.selectedNodeId);
    }
  }

  // ==========================================
  // DATA QUALITY LAB (CROSS BOUNDARY CORRECTIONS)
  // ==========================================
  loadDirtyDataPreset() {
    this.dirtyRecordsQueue = JSON.parse(JSON.stringify(window.ARHA_DATASTORE.dirtySample));
    this.runDataAudit();
  }

  loadCleanDataPreset() {
    this.maternal = JSON.parse(JSON.stringify(this.originalMaternal));
    this.child = JSON.parse(JSON.stringify(this.originalChild));
    this.dirtyRecordsQueue = [];
    
    this.runDataAudit();
    this.refreshDashboardState();
    this.scanDatabaseForFlags();
  }

  runDataAudit() {
    const tableBody = document.getElementById("dq-review-table-body");
    const cleanState = document.getElementById("dq-clean-state");
    const reviewTable = document.getElementById("dq-review-table");
    const saveBtn = document.getElementById("btn-save-corrections");
    const reviewBadge = document.getElementById("dq-review-badge");
    const scoreCircle = document.getElementById("dq-score-circle");
    const anomalyCountEl = document.getElementById("dq-anomaly-count");

    tableBody.innerHTML = "";
    
    if (this.dirtyRecordsQueue.length === 0) {
      cleanState.style.display = "flex";
      reviewTable.style.display = "none";
      saveBtn.style.display = "none";
      reviewBadge.style.display = "none";
      
      scoreCircle.className = "dq-score-circle score-perfect";
      scoreCircle.innerText = "100%";
      anomalyCountEl.innerText = "0 anomalies detected in database";
      return;
    }

    cleanState.style.display = "none";
    reviewTable.style.display = "table";
    saveBtn.style.display = "inline-flex";

    const maternalQueue = this.dirtyRecordsQueue.filter(r => r.id.startsWith("PREG"));
    const childQueue = this.dirtyRecordsQueue.filter(r => r.id.startsWith("CHLD"));

    const matAudit = window.ARHA_VALIDATOR.validateBatch(maternalQueue, "maternal", this.baselineCleanIds);
    const chldAudit = window.ARHA_VALIDATOR.validateBatch(childQueue, "child", this.baselineCleanIds);

    const allAuditResults = [...matAudit, ...chldAudit];
    const flaggedItems = allAuditResults.filter(r => r.errors.length > 0);
    
    const totalRecordsAudited = this.dirtyRecordsQueue.length;
    const cleanCount = totalRecordsAudited - flaggedItems.length;
    const scorePct = Math.round((cleanCount / totalRecordsAudited) * 100);

    scoreCircle.innerText = `${scorePct}%`;
    if (scorePct >= 90) scoreCircle.className = "dq-score-circle score-perfect";
    else if (scorePct >= 70) scoreCircle.className = "dq-score-circle score-medium";
    else scoreCircle.className = "dq-score-circle score-critical";

    anomalyCountEl.innerText = `${flaggedItems.length} active boundary anomalies found`;
    
    reviewBadge.innerText = `${flaggedItems.length} Warnings/Errors`;
    reviewBadge.style.display = "inline-block";
    reviewBadge.className = flaggedItems.length > 4 ? "badge-dq-err" : "badge-dq-warn";

    flaggedItems.forEach((flag, idx) => {
      const rec = flag.record;
      const primaryErr = flag.errors[0];
      const severityClass = primaryErr.severity === "ERROR" ? "badge-dq-err" : "badge-dq-warn";
      
      const row = document.createElement("tr");
      row.innerHTML = `
        <td style="font-weight:700;">${rec.id}</td>
        <td>${rec.motherName || rec.childName || '<span style="color:var(--color-error);">Missing</span>'}</td>
        <td style="color:var(--color-info); font-weight:600;">${primaryErr.field}</td>
        <td><code style="background-color:rgba(255,255,255,0.05); padding:2px 4px; border-radius:3px;">${rec[primaryErr.field] !== undefined ? rec[primaryErr.field] : ''}</code></td>
        <td>${primaryErr.message}</td>
        <td><span class="${severityClass}">${primaryErr.severity}</span></td>
        <td>
          <div class="dq-fix-form">
            ${this.getInlineEditorHtml(rec, primaryErr.field, idx)}
            <button class="btn btn-secondary" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;" 
                    onclick="window.ARHA_APP.saveRecordCorrection(${idx}, '${rec.id}', '${primaryErr.field}')">
              <i data-lucide="check" style="width:12px;height:12px;"></i> Apply Fix
            </button>
          </div>
        </td>
      `;
      tableBody.appendChild(row);
    });

    lucide.createIcons();
  }

  getInlineEditorHtml(record, field, index) {
    const val = record[field] !== undefined ? record[field] : '';
    
    // Choose input formats based on field characteristics
    if (field === "state") {
      // Dropdown of all states
      let selectHtml = `<select class="dq-fix-input wide" id="fix-input-${index}">`;
      Object.keys(window.ARHA_DATASTORE.geography).sort().forEach(s => {
        const selected = s === val ? 'selected' : '';
        selectHtml += `<option value="${s}" ${selected}>${s}</option>`;
      });
      selectHtml += `</select>`;
      return selectHtml;
    }
    
    if (field === "district") {
      // Dropdown of districts inside the record's current state (or general if state is invalid)
      const state = record.state;
      const districts = window.ARHA_DATASTORE.geography[state] || [];
      
      if (districts.length > 0) {
        let selectHtml = `<select class="dq-fix-input wide" id="fix-input-${index}">`;
        districts.sort().forEach(d => {
          const selected = d === val ? 'selected' : '';
          selectHtml += `<option value="${d}" ${selected}>${d}</option>`;
        });
        selectHtml += `</select>`;
        return selectHtml;
      }
    }
    
    if (field.toLowerCase().includes("date") || field === "anc1" || field === "anc2" || field === "anc3" || field === "anc4") {
      return `<input type="date" class="dq-fix-input wide" id="fix-input-${index}" value="${val}">`;
    }
    if (field === "weightKg" || field === "heightCm") {
      return `<input type="number" step="0.1" class="dq-fix-input" id="fix-input-${index}" value="${val}">`;
    }
    if (field === "age" || field === "ageMonths") {
      return `<input type="number" class="dq-fix-input" id="fix-input-${index}" value="${val}">`;
    }
    return `<input type="text" class="dq-fix-input wide" id="fix-input-${index}" value="${val}">`;
  }

  saveRecordCorrection(index, recordId, field) {
    const inputEl = document.getElementById(`fix-input-${index}`);
    if (!inputEl) return;

    let newVal = inputEl.value;
    
    if (field === "weightKg" || field === "heightCm") {
      newVal = parseFloat(newVal);
    } else if (field === "age" || field === "ageMonths") {
      newVal = parseInt(newVal, 10);
    }

    const recIndex = this.dirtyRecordsQueue.findIndex(r => r.id === recordId);
    if (recIndex !== -1) {
      this.dirtyRecordsQueue[recIndex][field] = newVal;
      
      if (field === "id") {
        this.dirtyRecordsQueue[recIndex].id = newVal;
      }
      
      this.runDataAudit();
    }
  }

  validateCSVInput() {
    const csvText = document.getElementById("dq-csv-paste").value;
    if (!csvText || csvText.trim() === "") return;

    try {
      const records = this.parseCSVText(csvText);
      if (records.length === 0) {
        alert("No valid CSV records identified. Check formatting.");
        return;
      }
      
      this.dirtyRecordsQueue = [...this.dirtyRecordsQueue, ...records];
      this.runDataAudit();
      
      document.getElementById("dq-csv-paste").value = "";
    } catch (err) {
      alert("Error parsing CSV text: " + err.message);
    }
  }

  parseCSVText(text) {
    const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map(v => v.trim());
      const rec = {};
      
      headers.forEach((header, index) => {
        let val = values[index] !== undefined ? values[index] : "";
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        
        if (!isNaN(val) && val !== "") {
          if (val.includes(".")) rec[header] = parseFloat(val);
          else rec[header] = parseInt(val, 10);
        } else {
          rec[header] = val;
        }
      });

      if (!rec.id) {
        rec.id = headers.includes("childName") ? `CHLD-9${100 + i}` : `PREG-9${100 + i}`;
      }
      
      records.push(rec);
    }
    return records;
  }

  applyCorrections() {
    const maternalQueue = this.dirtyRecordsQueue.filter(r => r.id.startsWith("PREG"));
    const childQueue = this.dirtyRecordsQueue.filter(r => r.id.startsWith("CHLD"));

    const matAudit = window.ARHA_VALIDATOR.validateBatch(maternalQueue, "maternal", this.baselineCleanIds);
    const chldAudit = window.ARHA_VALIDATOR.validateBatch(childQueue, "child", this.baselineCleanIds);

    const hasErrors = [...matAudit, ...chldAudit].some(r => !r.isValid);
    
    if (hasErrors) {
      const confirmProceed = confirm("Warning: Some records still contain critical validation errors. Proceed?");
      if (!confirmProceed) return;
    }

    this.dirtyRecordsQueue.forEach(record => {
      if (record.id.startsWith("PREG")) {
        const idx = this.maternal.findIndex(r => r.id === record.id);
        if (idx !== -1) {
          this.maternal[idx] = record;
        } else {
          this.maternal.push(record);
        }
      } else if (record.id.startsWith("CHLD")) {
        if (record.weightKg && record.heightCm) {
          const age = record.ageMonths;
          const w = record.weightKg;
          const maxExpected = 4.5 + (age * 0.4);
          const minExpected = 1.5 + (age * 0.08);
          
          if (w < minExpected) record.nutritionalStatus = "SAM";
          else if (w < minExpected * 1.3) record.nutritionalStatus = "MAM";
          else record.nutritionalStatus = "Normal";
        }
        
        const idx = this.child.findIndex(r => r.id === record.id);
        if (idx !== -1) {
          this.child[idx] = record;
        } else {
          this.child.push(record);
        }
      }
    });

    this.dirtyRecordsQueue = [];
    
    this.runDataAudit();
    this.refreshDashboardState();
    this.scanDatabaseForFlags();

    alert("Corrections synced successfully!");
    
    this.renderKPITree();
  }

  // ==========================================
  // KNOWLEDGE HUB & SEARCH
  // ==========================================
  renderKnowledgeHub() {
    const listEl = document.getElementById("knowledge-toc-list");
    if (!listEl) return;

    listEl.innerHTML = "";
    
    window.ARHA_GUIDE.guides.forEach((article, index) => {
      const li = document.createElement("li");
      const activeClass = index === 0 ? "active" : "";
      
      li.innerHTML = `
        <button class="toc-item-btn ${activeClass}" id="toc-btn-${article.id}" 
                onclick="window.ARHA_APP.selectKnowledgeArticle('${article.id}')">
          ${article.title}
        </button>
      `;
      listEl.appendChild(li);
    });

    if (window.ARHA_GUIDE.guides.length > 0) {
      this.selectKnowledgeArticle(window.ARHA_GUIDE.guides[0].id);
    }
  }

  selectKnowledgeArticle(articleId) {
    const article = window.ARHA_GUIDE.guides.find(a => a.id === articleId);
    if (!article) return;

    document.querySelectorAll(".toc-item-btn").forEach(btn => btn.classList.remove("active"));
    const activeBtn = document.getElementById(`toc-btn-${articleId}`);
    if (activeBtn) activeBtn.classList.add("active");

    const viewport = document.getElementById("knowledge-article-viewport");
    viewport.innerHTML = article.content;

    if (articleId === "g-dictionary-m") {
      this.injectMaternalDictionary();
    } else if (articleId === "g-dictionary-c") {
      this.injectChildDictionary();
    }
  }

  searchKnowledge() {
    const query = document.getElementById("knowledge-search").value.toLowerCase();
    const listEl = document.getElementById("knowledge-toc-list");
    listEl.innerHTML = "";

    const filtered = window.ARHA_GUIDE.guides.filter(article => {
      return article.title.toLowerCase().includes(query) || 
             article.content.toLowerCase().includes(query) ||
             article.category.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      listEl.innerHTML = '<li style="padding: 0.5rem; font-size: 0.75rem; color: var(--text-muted);">No matches found</li>';
      return;
    }

    filtered.forEach((article, index) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <button class="toc-item-btn" id="toc-btn-${article.id}" 
                onclick="window.ARHA_APP.selectKnowledgeArticle('${article.id}')">
          ${article.title}
        </button>
      `;
      listEl.appendChild(li);
    });
    
    this.selectKnowledgeArticle(filtered[0].id);
  }

  injectMaternalDictionary() {
    const container = document.getElementById("dictionary-m-table-container");
    if (!container) return;

    const fields = window.ARHA_DATASTORE.dictionary.maternal.fields;
    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Field Column Name</th>
            <th>Data Type</th>
            <th>M&E Definition & Purpose</th>
            <th>Validation Constraint</th>
          </tr>
        </thead>
        <tbody>
    `;

    fields.forEach(f => {
      tableHtml += `
        <tr>
          <td style="font-weight:700;">${f.name}</td>
          <td><code>${f.type}</code></td>
          <td>${f.desc}</td>
          <td style="color:var(--color-warning); font-size:0.75rem;">${f.constraint}</td>
        </tr>
      `;
    });

    tableHtml += "</tbody></table>";
    container.innerHTML = tableHtml;
  }

  injectChildDictionary() {
    const container = document.getElementById("dictionary-c-table-container");
    if (!container) return;

    const fields = window.ARHA_DATASTORE.dictionary.child.fields;
    let tableHtml = `
      <table>
        <thead>
          <tr>
            <th>Field Column Name</th>
            <th>Data Type</th>
            <th>M&E Definition & Purpose</th>
            <th>Validation Constraint</th>
          </tr>
        </thead>
        <tbody>
    `;

    fields.forEach(f => {
      tableHtml += `
        <tr>
          <td style="font-weight:700;">${f.name}</td>
          <td><code>${f.type}</code></td>
          <td>${f.desc}</td>
          <td style="color:var(--color-warning); font-size:0.75rem;">${f.constraint}</td>
        </tr>
      `;
    });

    tableHtml += "</tbody></table>";
    container.innerHTML = tableHtml;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  const app = new ArogyaApp();
  window.ARHA_APP = app;
  app.init();
});
