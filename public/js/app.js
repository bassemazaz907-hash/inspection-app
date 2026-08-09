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
  if (!res.ok) throw new Error(data.error || "حدث خطأ");
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
  setTimeout(() => el.remove(), 3500);
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
    toast(L.title + " — " + "تم تحديث الإعدادات", "success", "🎨");
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
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().catch(() => {});
  }

  let cached = null;
  try { cached = JSON.parse(localStorage.getItem("settings_cache") || "null"); } catch (e) {}
  applyCachedSettings(cached);

  try {
    const settings = await api("/api/settings/public");
    try { localStorage.setItem("settings_cache", JSON.stringify(settings)); } catch (e) {}
    applyCachedSettings(settings);
  } catch (e) {
    applyTheme(null);
    applyLabels(null);
    applyLogos(null);
  }

  document.getElementById("todayHint").textContent = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  await Promise.all([loadSections(), loadShifts(), loadPenaltyTypes()]);
  document.getElementById("reportDate").value = todayStr();
  renderPenaltyRows();
  setupTabs();
  connectEvents();
  hideSplash();
}

function hideSplash() {
  const splash = document.getElementById("splash");
  if (splash) {
    splash.classList.add("hidden");
    setTimeout(() => splash.remove(), 600);
  }
}

async function loadSections() {
  sectionsData = await api("/api/sections");
  renderChecklist();
}

async function loadShifts() {
  shiftsData = await api("/api/shifts");
  const container = document.getElementById("shiftChips");
  container.innerHTML = "";
  if (!shiftsData.length) {
    container.appendChild(el("div", { class: "chip-group" }, [el("span", { class: "chip disabled" }, [L.no_shifts])]));
    return;
  }
  for (const s of shiftsData) {
    const chip = el("button", { type: "button", class: "chip", onclick: () => selectShift(s.id, chip) }, [s.name]);
    chip.dataset.id = s.id;
    container.appendChild(chip);
  }
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
  for (const t of penaltyTypesData) {
    const chip = el("button", { type: "button", class: "chip", onclick: () => selectPenalty(t.id, chip) }, [
      t.name,
    ]);
    chip.dataset.id = t.id;
    container.appendChild(chip);
  }
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
    container.appendChild(card);
  }
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
  currentPenaltyIds.forEach((id) => addPenaltyRow(id));
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
  if (!reportDate) return toast(L.date_label + " " + L.report_label + " " + "مطلوب", "error");

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

  try {
    await api("/api/reports", {
      method: "POST",
      body: JSON.stringify({ reportDate, shiftId, notes: notes || null, items, penalties }),
    });
    toast(`${L.report_label} ${L.save} ✓`, "success", "✅");
    resetForm();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  } finally {
    btn.disabled = false;
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

init();
