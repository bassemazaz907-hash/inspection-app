// ===== الحالة =====
let sectionsData = [];
let shiftsData = [];
let penaltyTypesData = [];
let currentShiftId = null;
let currentPenaltyIds = new Set();

// ===== أدوات مساعدة =====
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || L.generic_error);
  return data;
}

function toast(message, type = "success", icon) {
  const wrap = document.getElementById("toastWrap");
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  if (icon) {
    const ic = document.createElement("span");
    ic.className = "toast-icon";
    ic.textContent = icon;
    el.appendChild(ic);
  }
  const txt = document.createElement("span");
  txt.textContent = message;
  el.appendChild(txt);
  wrap.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateX(0)"; });
  setTimeout(() => { el.style.opacity = "0"; el.style.transform = "translateX(-20px)"; setTimeout(() => el.remove(), 300); }, 3000);
}

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v);
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    if (typeof child === "string") node.appendChild(document.createTextNode(child));
    else node.appendChild(child);
  }
  return node;
}

function todayStr() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

// ===== الإشعارات الفورية =====
function connectEvents() {
  const es = new EventSource("/api/events");
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      handleEvent(data);
    } catch (err) {}
  };
  es.onopen = () => setLive(true);
  es.onerror = () => setLive(false);
}

function setLive(online) {
  document.querySelectorAll(".live-dot").forEach((dot) => dot.classList.toggle("offline", !online));
}

function handleEvent(ev) {
  if (!ev || !ev.type) return;
  if (ev.type === "report") {
    const msg = L.notification_new.replace("{id}", ev.reportId);
    toast(msg, "info", "🔔");
    playBeep();
    showBrowserNotification(msg);
  } else if (ev.type === "settings") {
    if (ev.title) applyLabels(ev.labels);
    if (ev.theme) applyTheme(ev.theme);
    if (ev.logos) applyLogos(ev.logos);
    toast(L.title + " — " + L.settings_updated, "success", "🎨");
  }
}

function showBrowserNotification(body) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(L.title, { body, icon: undefined });
    }
  } catch (e) {}
}

// ===== التحميل الأولي =====
function applyCachedSettings(settings) {
  try {
    if (!settings) return;
    applyTheme(settings.theme);
    applyLabels(settings.labels);
    applyLogos(settings.logos);
  } catch (e) {}
}

async function init() {
  // Apply cached settings INSTANTLY (no await)
  let cached = null;
  try { cached = JSON.parse(localStorage.getItem("settings_cache") || "null"); } catch (e) {}
  applyCachedSettings(cached);

  // Hide splash INSTANTLY — content is visible from cache
  hideSplash();

  // Fire all data loads in parallel — don't block UI
  const settingsP = api("/api/settings/public").then((settings) => {
    try { localStorage.setItem("settings_cache", JSON.stringify(settings)); } catch (e) {}
    applyCachedSettings(settings);
  }).catch(() => {});

  const sectionsP = api("/api/sections").then((data) => { sectionsData = data; renderChecklist(); }).catch(() => {});
  const shiftsP = api("/api/shifts").then((data) => { shiftsData = data; loadShiftsRender(); }).catch(() => {});
  const penaltyP = api("/api/penalty-types").then((data) => { penaltyTypesData = data; renderPenaltyRows(); }).catch(() => {});

  document.getElementById("todayHint").textContent = new Date().toLocaleDateString(getLocaleStr(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  document.getElementById("reportDate").value = todayStr();

  setupTabs();
  connectEvents();
  setupAnalytics();

  // Notification permission (lazy, non-blocking)
  if ("Notification" in window && Notification.permission === "default") {
    requestAnimationFrame(() => Notification.requestPermission().catch(() => {}));
  }

  await Promise.allSettled([settingsP, sectionsP, shiftsP, penaltyP]);
}

function hideSplash() {
  const splash = document.getElementById("splash");
  if (splash) {
    splash.classList.add("hidden");
    requestAnimationFrame(() => setTimeout(() => splash.remove(), 300));
  }
}

function loadShiftsRender() {
  const container = document.getElementById("shiftChips");
  container.innerHTML = "";
  if (!shiftsData.length) {
    container.appendChild(el("div", { class: "chip-group" }, [el("span", { class: "chip disabled" }, [L.no_shifts])]));
    return;
  }
  const frag = document.createDocumentFragment();
  for (const s of shiftsData) {
    const chip = el("button", { type: "button", class: "chip", onclick: () => selectShift(s.id, chip) }, [s.name]);
    chip.dataset.id = s.id;
    frag.appendChild(chip);
  }
  container.appendChild(frag);
}

async function loadShifts() {
  shiftsData = await api("/api/shifts");
  loadShiftsRender();
}

function selectShift(id, chip) {
  if (currentShiftId === id) {
    currentShiftId = null;
    chip.classList.remove("active");
    return;
  }
  currentShiftId = id;
  document.querySelectorAll("#shiftChips .chip").forEach((c) => c.classList.remove("active"));
  chip.classList.add("active");
}

function selectPenalty(id, chip) {
  chip.classList.toggle("active");
  if (currentPenaltyIds.has(id)) {
    currentPenaltyIds.delete(id);
    const row = document.querySelector(`.penalty-row[data-penalty-id="${id}"]`);
    if (row) row.remove();
  } else {
    currentPenaltyIds.add(id);
    addPenaltyRow(id);
  }
}

async function loadPenaltyTypes() {
  penaltyTypesData = await api("/api/penalty-types");
  const container = document.getElementById("penaltyChips");
  container.innerHTML = "";
  if (!penaltyTypesData.length) {
    container.appendChild(el("div", { class: "chip-group" }, [el("span", { class: "chip disabled" }, [L.no_penalty_types])]));
    return;
  }
  const frag = document.createDocumentFragment();
  for (const t of penaltyTypesData) {
    const chip = el("button", { type: "button", class: "chip", onclick: () => selectPenalty(t.id, chip) }, [t.name]);
    chip.dataset.id = t.id;
    frag.appendChild(chip);
  }
  container.appendChild(frag);
}

// ===== عرض قائمة الفحص =====
function renderChecklist() {
  const container = document.getElementById("checklistContainer");
  container.innerHTML = "";
  if (!sectionsData.length) {
    container.appendChild(
      el("div", { class: "card empty" }, [
        el("div", { class: "empty-icon" }, ["📋"]),
        el("div", { class: "empty-text" }, [L.no_sections]),
      ])
    );
    return;
  }

  const frag = document.createDocumentFragment();
  for (const section of sectionsData) {
    const card = el("div", { class: "card card-hover" });
    const header = el("div", { class: "card-title" });
    header.appendChild(
      el("span", {}, [
        el("span", { class: "title-icon" }, ["🗂️"]),
        document.createTextNode(section.name),
      ])
    );
    card.appendChild(header);
    if (!section.items.length) {
      card.appendChild(el("div", { class: "empty", style: "padding:16px" }, [L.no_items_in_section]));
    }
    const grid = el("div", { class: "item-grid" });
    for (const item of section.items) {
      grid.appendChild(renderItemRow(item));
    }
    card.appendChild(grid);
    frag.appendChild(card);
  }
  container.appendChild(frag);
}

function renderItemRow(item) {
  const card = el("div", { class: "item-card" });
  card.dataset.itemId = item.id;

  const seg = el("div", { class: "segmented item-status" });
  const passBtn = el("button", { class: "pass active", type: "button" }, [L.pass_label]);
  const failBtn = el("button", { class: "fail", type: "button" }, [L.fail_label]);
  passBtn.addEventListener("click", () => setStatus(card, "pass"));
  failBtn.addEventListener("click", () => setStatus(card, "fail"));
  seg.appendChild(passBtn);
  seg.appendChild(failBtn);

  const iconWrap = el("button", { class: "item-icon-btn", type: "button", title: item.name });
  iconWrap.appendChild(el("span", { class: "item-icon" }, [item.icon || "📋"]));
  iconWrap.appendChild(el("span", { class: "item-name" }, [item.name]));

  const notes = el("div", { class: "item-notes" });
  const noteInput = el("input", {
    type: "text",
    placeholder: L.note_placeholder,
    "data-item": item.id,
  });
  notes.appendChild(noteInput);

  card.appendChild(iconWrap);
  card.appendChild(seg);
  card.appendChild(notes);

  return card;
}

function setStatus(row, status) {
  const buttons = row.querySelectorAll(".segmented button");
  buttons.forEach((b) => b.classList.remove("active"));
  row.querySelector(`.segmented button.${status}`).classList.add("active");
  row.dataset.status = status;
}

// ===== الجزاءات =====
function renderPenaltyRows() {
  const container = document.getElementById("penaltyRows");
  container.innerHTML = "";
  if (currentPenaltyIds.size === 0) return;
  const frag = document.createDocumentFragment();
  currentPenaltyIds.forEach((id) => {
    const type = penaltyTypesData.find((t) => t.id === id);
    if (!type) return;
    const row = el("div", { class: "penalty-row", "data-penalty-id": type.id });
    const name = el("span", { class: "penalty-name" }, [type.name]);
    const noteInput = el("input", { type: "text", placeholder: L.note_placeholder, class: "penalty-note" });
    const removeBtn = el("button", { class: "remove-btn", type: "button" }, ["✕"]);
    removeBtn.addEventListener("click", () => {
      currentPenaltyIds.delete(type.id);
      const chip = document.querySelector(`#penaltyChips .chip[data-id="${type.id}"]`);
      if (chip) chip.classList.remove("active");
      row.remove();
    });
    row.appendChild(name);
    row.appendChild(noteInput);
    row.appendChild(removeBtn);
    frag.appendChild(row);
  });
  container.appendChild(frag);
}

function addPenaltyRow(penaltyId) {
  const container = document.getElementById("penaltyRows");
  const type = penaltyTypesData.find((t) => t.id === penaltyId);
  if (!type) return;

  const row = el("div", { class: "penalty-row", "data-penalty-id": type.id });
  const name = el("span", { class: "penalty-name" }, [type.name]);
  const noteInput = el("input", { type: "text", placeholder: L.note_placeholder, class: "penalty-note" });
  const removeBtn = el("button", { class: "remove-btn", type: "button" }, ["✕"]);
  removeBtn.addEventListener("click", () => {
    currentPenaltyIds.delete(type.id);
    const chip = document.querySelector(`#penaltyChips .chip[data-id="${type.id}"]`);
    if (chip) chip.classList.remove("active");
    row.remove();
  });

  row.appendChild(name);
  row.appendChild(noteInput);
  row.appendChild(removeBtn);
  container.appendChild(row);
}

// ===== حفظ التقرير =====
document.getElementById("saveReportBtn").addEventListener("click", async () => {
  const reportDate = document.getElementById("reportDate").value;
  if (!reportDate) return toast(L.date_label + " " + L.report_label + " " + L.required, "error");

  const shiftId = currentShiftId;

  const items = [];
  document.querySelectorAll(".item-card").forEach((row) => {
    const itemId = Number(row.querySelector(".item-notes input").dataset.item);
    const status = row.dataset.status || "pass";
    const notes = row.querySelector(".item-notes input").value.trim();
    items.push({ inspectionItemId: itemId, status, notes: notes || null });
  });
  if (!items.length) return toast(L.no_items_in_section, "error");

  const penalties = [];
  document.querySelectorAll(".penalty-row").forEach((row) => {
    const typeId = Number(row.dataset.penaltyId);
    const note = row.querySelector(".penalty-note").value.trim();
    if (typeId) {
      penalties.push({ penaltyTypeId: typeId, amount: 0, note: note || null });
    }
  });

  const notes = document.getElementById("reportNotes").value.trim();
  const btn = document.getElementById("saveReportBtn");
  btn.disabled = true;

  // Optimistic UI: show success instantly
  toast(`${L.report_label} ${L.save} ✓`, "success", "✅");
  resetForm();
  btn.disabled = false;

  try {
    await api("/api/reports", {
      method: "POST",
      body: JSON.stringify({ reportDate, shiftId, notes: notes || null, items, penalties }),
    });
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
});

function resetForm() {
  document.querySelectorAll(".item-card").forEach((row) => {
    setStatus(row, "pass");
    row.querySelector(".item-notes input").value = "";
  });
  currentShiftId = null;
  document.querySelectorAll("#shiftChips .chip").forEach((c) => c.classList.remove("active"));
  currentPenaltyIds.clear();
  document.querySelectorAll("#penaltyChips .chip").forEach((c) => c.classList.remove("active"));
  document.getElementById("penaltyRows").innerHTML = "";
  document.getElementById("reportNotes").value = "";
}

// ===== التنقل =====
function setupTabs() {
  const selectors = [".nav-item[data-view]", ".bottom-nav-item[data-view]"];
  document.querySelectorAll(selectors.join(",")).forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(selectors.join(",")).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const view = btn.dataset.view;
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      document.getElementById(`view-${view}`).classList.add("active");
    });
  });
}

// ===== تحليلات الأداء الشهرية =====
let analyticsDate = new Date();

function getAnalyticsYear() { return analyticsDate.getFullYear(); }
function getAnalyticsMonth() { return analyticsDate.getMonth() + 1; }

function updateMonthLabel() {
  const months = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  const monthsEn = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const m = getAnalyticsMonth();
  const y = getAnalyticsYear();
  const label = document.getElementById("monthLabel");
  if (label) label.textContent = (langMode === "en" ? monthsEn[m-1] : months[m-1]) + " " + y;
}

function prevMonth() {
  analyticsDate.setMonth(analyticsDate.getMonth() - 1);
  loadAnalytics();
}

function nextMonth() {
  analyticsDate.setMonth(analyticsDate.getMonth() + 1);
  loadAnalytics();
}

async function loadAnalytics() {
  updateMonthLabel();
  const year = getAnalyticsYear();
  const month = getAnalyticsMonth();
  try {
    const data = await api(`/api/monthly-analytics?year=${year}&month=${month}`);
    renderAnalytics(data);
  } catch (e) {
    renderAnalytics(null);
  }
}

function renderAnalytics(data) {
  const empty = document.getElementById("analyticsEmpty");
  const kpiGrid = document.getElementById("kpiGrid");
  const lbGrid = document.querySelector(".leaderboard-grid");
  const tableWrap = document.querySelector("#sectionTable").closest(".card");

  if (!data || data.overallStats.totalReports === 0) {
    if (empty) empty.style.display = "";
    if (kpiGrid) kpiGrid.style.display = "none";
    if (lbGrid) lbGrid.style.display = "none";
    if (tableWrap) tableWrap.style.display = "none";
    return;
  }

  if (empty) empty.style.display = "none";
  if (kpiGrid) kpiGrid.style.display = "";
  if (lbGrid) lbGrid.style.display = "";
  if (tableWrap) tableWrap.style.display = "";

  const s = data.overallStats;
  document.getElementById("kpiTotalReports").textContent = s.totalReports;
  document.getElementById("kpiTotalItems").textContent = s.totalItems;
  document.getElementById("kpiTotalFailed").textContent = s.totalFailed;

  const circumference = 2 * Math.PI * 52;
  const gauge = document.getElementById("gaugePassRate");
  const gaugeVal = document.getElementById("gaugePassValue");
  if (gauge) {
    const offset = circumference - (s.passRate / 100) * circumference;
    gauge.style.strokeDashoffset = offset;
  }
  if (gaugeVal) gaugeVal.textContent = s.passRate + "%";

  renderLeaderboard("topPerformers", data.bestPerformers, true);
  renderLeaderboard("worstPerformers", data.worstPerformers, false);
  renderSectionTable(data.sectionPerformance);
}

function renderLeaderboard(containerId, items, isTop) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = "";
  if (!items || items.length === 0) {
    container.innerHTML = `<div class="leaderboard-empty">${langMode === "en" ? "No data available" : "لا توجد بيانات"}</div>`;
    return;
  }
  items.forEach((item, i) => {
    const rankClass = isTop
      ? (i === 0 ? "rank-gold" : i === 1 ? "rank-silver" : "rank-bronze")
      : "rank-danger";
    const rateClass = item.passRate >= 80 ? "rate-high" : item.passRate >= 50 ? "rate-mid" : "rate-low";
    const div = document.createElement("div");
    div.className = "leaderboard-item";
    div.innerHTML = `
      <div class="leaderboard-rank ${rankClass}">${i + 1}</div>
      <div class="leaderboard-info">
        <div class="leaderboard-name">${item.sectionName || "—"}</div>
        <div class="leaderboard-meta">${item.passed}✓ ${item.failed}✗ / ${item.totalItems}</div>
      </div>
      <div class="leaderboard-rate ${rateClass}">${item.passRate}%</div>
    `;
    container.appendChild(div);
  });
}

function renderSectionTable(sections) {
  const tbody = document.getElementById("sectionTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (!sections || sections.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--color-text-muted)">${langMode === "en" ? "No data" : "لا توجد بيانات"}</td></tr>`;
    return;
  }
  sections.forEach((s, i) => {
    const rateClass = s.passRate >= 80 ? "rate-high" : s.passRate >= 50 ? "rate-mid" : "rate-low";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${s.sectionName || "—"}</td>
      <td>${s.totalItems}</td>
      <td>${s.passed}</td>
      <td>${s.failed}</td>
      <td>
        <span class="${rateClass}" style="font-weight:700">${s.passRate}%</span>
        <div class="progress-bar"><div class="progress-fill" style="width:${s.passRate}%"></div></div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function exportCSV() {
  const rows = [["#", langMode === "en" ? "Section" : "القسم", langMode === "en" ? "Items" : "البنود", langMode === "en" ? "Pass" : "نجاح", langMode === "en" ? "Fail" : "فشل", langMode === "en" ? "Pass Rate" : "نسبة النجاح"]];
  document.querySelectorAll("#sectionTableBody tr").forEach((tr) => {
    const cells = tr.querySelectorAll("td");
    if (cells.length >= 6) rows.push(Array.from(cells).map((c) => c.textContent.trim()));
  });
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `analytics_${getAnalyticsYear()}_${getAnalyticsMonth()}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function exportPDF() {
  window.print();
}

function setupAnalytics() {
  const prev = document.getElementById("monthPrev");
  const next = document.getElementById("monthNext");
  if (prev) prev.addEventListener("click", prevMonth);
  if (next) next.addEventListener("click", nextMonth);
  const csvBtn = document.getElementById("exportCSV");
  const pdfBtn = document.getElementById("exportPDF");
  if (csvBtn) csvBtn.addEventListener("click", exportCSV);
  if (pdfBtn) pdfBtn.addEventListener("click", exportPDF);

  document.querySelectorAll("[data-view='analytics']").forEach((btn) => {
    btn.addEventListener("click", () => {
      loadAnalytics();
    });
  });
}

// ===== إعادة العرض عند تغيير اللغة =====
function refreshDynamicContent() {
  document.getElementById("todayHint").textContent = new Date().toLocaleDateString(getLocaleStr(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  renderChecklist();
  renderPenaltyRows();
  document.querySelectorAll("#shiftChips .chip").forEach((c) => c.classList.remove("active"));
  document.querySelectorAll("#penaltyChips .chip").forEach((c) => c.classList.remove("active"));
  document.getElementById("penaltyRows").innerHTML = "";
  currentPenaltyIds.clear();
  loadShifts();
  if (document.getElementById("view-analytics") && document.getElementById("view-analytics").classList.contains("active")) {
    loadAnalytics();
  }
}

init();
