// ===== الحالة =====
let token = localStorage.getItem("adminToken") || null;
let themeDraft = {};
let sectionsData = [];
let shiftsData = [];
let penaltyTypesData = [];

// ===== أدوات مساعدة =====
async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
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

function setLive(online) {
  document.querySelectorAll(".live-dot").forEach((dot) => dot.classList.toggle("offline", !online));
}

// ===== البث المباشر =====
function connectEvents() {
  const es = new EventSource("/api/events");
  es.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      if (data.type === "report") {
        const msg = L.notification_new.replace("{id}", data.reportId);
        toast(msg, "info", "🔔");
        playBeep();
        const active = document.querySelector(".view.active");
        if (active && active.id === "view-overview") loadOverview();
      } else if (data.type === "settings") {
        applyTheme(data.theme);
        applyLabels(data.labels);
        if (data.logos) applyLogos(data.logos);
        themeDraft = { ...THEME_DEFAULTS, ...(data.theme || {}) };
        renderThemeFields();
        document.getElementById("projectTitleInput").value = L.title;
        renderLabelsEditor();
        renderLogoManager();
      }
    } catch (err) {}
  };
  es.onopen = () => setLive(true);
  es.onerror = () => setLive(false);
}

// ===== الدخول =====
async function login(password) {
  const data = await api("/api/admin/login", {
    method: "POST",
    body: JSON.stringify({ password }),
  });
  token = data.token;
  localStorage.setItem("adminToken", token);
  enterAdmin(data);
}

function enterAdmin(data) {
  themeDraft = { ...THEME_DEFAULTS, ...(data.theme || {}) };
  applyTheme(data.theme);
  applyLabels(data.labels);
  applyLogos(data.logos);

  document.getElementById("loginOverlay").style.display = "none";
  document.querySelector(".app-shell").style.display = "flex";

  document.getElementById("projectTitleInput").value = L.title;
  renderThemeFields();
  renderLabelsEditor();
  renderLogoManager();
  setupTabs();
  loadAll();
  connectEvents();
}

async function init() {
  document.getElementById("passwordInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });
  document.getElementById("loginBtn").addEventListener("click", doLogin);
  document.getElementById("logoutBtn").addEventListener("click", doLogout);

  if (token) {
    try {
      const data = await api("/api/admin/verify");
      enterAdmin(data);
    } catch (e) {
      token = null;
      localStorage.removeItem("adminToken");
      showLogin();
    }
  } else {
    showLogin();
  }
}

async function doLogin() {
  const input = document.getElementById("passwordInput");
  const errEl = document.getElementById("loginError");
  try {
    errEl.style.display = "none";
    await login(input.value);
    input.value = "";
  } catch (e) {
    errEl.textContent = e.message;
    errEl.style.display = "block";
  }
}

async function doLogout() {
  try {
    if (token) await api("/api/admin/logout", { method: "POST" });
  } catch (e) {}
  token = null;
  localStorage.removeItem("adminToken");
  window.location.reload();
}

function showLogin() {
  document.getElementById("loginOverlay").style.display = "flex";
  document.querySelector(".app-shell").style.display = "none";
  document.getElementById("passwordInput").focus();
}

// ===== التنقل =====
function setupTabs() {
  const selectors = [".nav-item[data-tab]", ".tab-strip-btn[data-tab]"];
  document.querySelectorAll(selectors.join(",")).forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(selectors.join(",")).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.dataset.tab;
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
      document.getElementById(`view-${tab}`).classList.add("active");
      if (tab === "overview") loadOverview();
      if (tab === "sections") loadSections();
      if (tab === "shifts") loadShifts();
      if (tab === "penalty-types") loadPenaltyTypes();
    });
  });
}

async function loadAll() {
  await Promise.all([loadOverview(), loadSections(), loadShifts(), loadPenaltyTypes()]);
}

// ===== اللوجوهات =====
function renderLogoManager() {
  const previews = [
    { id: "logoPreviewBrand", url: LOGOS.brand },
    { id: "logoPreviewBg", url: LOGOS.bg },
  ];
  for (const p of previews) {
    const img = document.getElementById(p.id);
    if (!img) continue;
    if (p.url) {
      img.src = p.url;
      img.style.display = "block";
    } else {
      img.src = "";
      img.style.display = "none";
    }
  }
}

function setupLogoPicker(slot, inputId, chooseBtnId, removeBtnId) {
  const input = document.getElementById(inputId);
  const chooseBtn = document.getElementById(chooseBtnId);
  const removeBtn = document.getElementById(removeBtnId);

  chooseBtn.addEventListener("click", () => input.click());

  input.addEventListener("change", () => {
    const file = input.files && input.files[0];
    input.value = "";
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) {
      return toast(L.logo_choose_hint, "error", "⚠️");
    }
    if (file.size > 2 * 1024 * 1024) {
      return toast(L.logo_choose_hint, "error", "⚠️");
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = await api("/api/admin/logo", {
          method: "POST",
          body: JSON.stringify({ slot, dataUrl: reader.result }),
        });
        applyLogos(data.logos);
        renderLogoManager();
        toast(L.logo_uploaded, "success", "🖼️");
      } catch (e) {
        toast(e.message, "error", "⚠️");
      }
    };
    reader.readAsDataURL(file);
  });

  removeBtn.addEventListener("click", async () => {
    if (!confirm(L.logo_remove_confirm)) return;
    try {
      const data = await api(`/api/admin/logo/${slot}`, { method: "DELETE" });
      applyLogos(data.logos);
      renderLogoManager();
      toast(L.logo_removed, "success", "🗑️");
    } catch (e) {
      toast(e.message, "error", "⚠️");
    }
  });
}

// ===== نظرة عامة =====
async function loadOverview() {
  try {
    const d = await api("/api/admin/overview");
    document.getElementById("adminWelcome").textContent = new Date().toLocaleDateString("ar-EG", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const stats = [
      { key: "stat_total_reports", value: d.totalReports, icon: "📊" },
      { key: "stat_today_reports", value: d.todayReports, icon: "📅" },
      { key: "stat_failed_items", value: d.failedTotal, icon: "✕" },
      { key: "stat_penalty_total", value: d.penaltyAmount, icon: "💰" },
      { key: "stat_sections", value: d.totalSections, icon: "🗂️" },
      { key: "stat_items", value: "-", icon: "🧾" },
      { key: "stat_shifts", value: d.totalShifts, icon: "🕐" },
      { key: "stat_penalty_types", value: d.totalPenaltyTypes, icon: "🏷️" },
    ];
    const grid = document.getElementById("statsGrid");
    grid.innerHTML = "";
    for (const s of stats) {
      const card = el("div", { class: "stat-card card-hover" });
      card.appendChild(el("div", { class: "stat-icon" }, [s.icon]));
      const body = el("div", { class: "stat-body" });
      body.appendChild(el("div", { class: "stat-value" }, [s.value]));
      body.appendChild(el("div", { class: "stat-label" }, [L[s.key] || s.key]));
      card.appendChild(body);
      grid.appendChild(card);
    }

    const tbody = document.getElementById("latestTableBody");
    tbody.innerHTML = "";
    document.getElementById("latestEmpty").style.display = d.latestReports.length ? "none" : "block";
    for (const r of d.latestReports) {
      const tr = el("tr", {});
      tr.appendChild(el("td", {}, [r.id]));
      tr.appendChild(el("td", {}, [r.reportDate]));
      tr.appendChild(el("td", {}, [r.shiftName || "-"]));
      tr.appendChild(el("td", {}, [r.totalItems]));
      const actions = el("td", { class: "actions" });
      const viewBtn = el("button", { class: "btn btn-sm btn-ghost" }, [L.view]);
      viewBtn.addEventListener("click", () => openReportModal(r.id));
      const delBtn = el("button", { class: "btn btn-sm btn-danger-ghost" }, ["✕"]);
      delBtn.addEventListener("click", () => deleteReport(r.id));
      actions.appendChild(viewBtn);
      actions.appendChild(delBtn);
      tr.appendChild(actions);
      tbody.appendChild(tr);
    }
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function deleteReport(id) {
  const msg = L.delete_report_confirm.replace("{id}", id);
  if (!confirm(msg)) return;
  try {
    await api(`/api/admin/reports/${id}`, { method: "DELETE" });
    toast(`${L.report_label} #${id} ${L.delete}`, "success", "🗑️");
    loadOverview();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

// ===== المظهر =====
function renderThemeFields() {
  const container = document.getElementById("themeFields");
  container.innerHTML = "";
  for (const field of THEME_COLOR_FIELDS) {
    const wrap = el("div", { class: "theme-field" });
    wrap.appendChild(el("label", { class: "theme-label" }, [field.label]));
    const value = themeDraft[field.key] ?? THEME_DEFAULTS[field.key];
    if (field.type === "color") {
      const input = el("input", {
        type: "color",
        value: value,
        oninput: (e) => {
          themeDraft[field.key] = e.target.value;
          applyTheme(themeDraft);
          input.title = e.target.value;
        },
      });
      const hex = el("code", { class: "theme-hex" }, [value]);
      input.addEventListener("input", () => (hex.textContent = themeDraft[field.key]));
      wrap.appendChild(input);
      wrap.appendChild(hex);
    } else {
      const input = el("input", {
        type: "range",
        min: field.min ?? 0,
        max: field.max ?? 40,
        value: parseInt(value, 10),
        oninput: (e) => {
          themeDraft[field.key] = `${e.target.value}px`;
          applyTheme(themeDraft);
          out.textContent = `${e.target.value}${field.suffix || "px"}`;
        },
      });
      const out = el("code", { class: "theme-hex" }, [`${parseInt(value, 10)}${field.suffix || "px"}`]);
      wrap.appendChild(input);
      wrap.appendChild(out);
    }
    container.appendChild(wrap);
  }
}

async function saveSettings(payload) {
  const data = await api("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  applyTheme(data.theme);
  applyLabels(data.labels);
  themeDraft = { ...THEME_DEFAULTS, ...(data.theme || {}) };
  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("saveTitleBtn").addEventListener("click", async () => {
    const value = document.getElementById("projectTitleInput").value.trim();
    if (!value) return toast(L.project_title_label + " " + "مطلوب", "error");
    try {
      const data = await saveSettings({ title: value });
      document.getElementById("projectTitleInput").value = data.title;
      toast(`${L.save_title} ✓`, "success", "✅");
    } catch (e) {
      toast(e.message, "error", "⚠️");
    }
  });

  document.getElementById("saveColorsBtn").addEventListener("click", async () => {
    try {
      await saveSettings({ theme: themeDraft });
      toast(`${L.save_colors} ✓`, "success", "🎨");
    } catch (e) {
      toast(e.message, "error", "⚠️");
    }
  });

  document.getElementById("resetColorsBtn").addEventListener("click", async () => {
    if (!confirm(L.reset_colors_confirm)) return;
    themeDraft = { ...THEME_DEFAULTS };
    applyTheme(themeDraft);
    renderThemeFields();
    try {
      await saveSettings({ theme: themeDraft });
      toast(`${L.reset_colors} ✓`, "success", "🎨");
    } catch (e) {
      toast(e.message, "error", "⚠️");
    }
  });

  document.getElementById("addSectionBtn").addEventListener("click", addSection);
  document.getElementById("addShiftBtn").addEventListener("click", addShift);
  document.getElementById("addPenaltyTypeBtn").addEventListener("click", addPenaltyType);
  document.getElementById("saveLabelsBtn").addEventListener("click", saveLabels);
  document.getElementById("changePwBtn").addEventListener("click", changePassword);

  setupLogoPicker("brand", "logoFileBrand", "logoChooseBrand", "logoRemoveBrand");
  setupLogoPicker("bg", "logoFileBg", "logoChooseBg", "logoRemoveBg");
});

// ===== الأقسام والعناصر =====
async function loadSections() {
  sectionsData = await api("/api/sections");
  const container = document.getElementById("sectionsList");
  container.innerHTML = "";
  if (!sectionsData.length) {
    container.appendChild(el("div", { class: "empty card" }, [L.no_sections]));
    return;
  }
  for (const section of sectionsData) {
    container.appendChild(renderSectionCard(section));
  }
}

function renderSectionCard(section) {
  const card = el("div", { class: "card card-hover" });
  const header = el("div", { class: "manage-header" });
  const titleWrap = el("div", { class: "manage-title" });
  titleWrap.appendChild(el("span", { class: "title-icon" }, ["🗂️"]));
  titleWrap.appendChild(el("span", {}, [section.name]));
  titleWrap.appendChild(el("span", { class: "badge badge-muted" }, [`${section.items.length}`]));
  header.appendChild(titleWrap);

  const headerActions = el("div", { class: "actions" });
  const editBtn = el("button", { class: "btn btn-sm btn-ghost" }, [L.edit]);
  editBtn.addEventListener("click", () => editSection(section));
  const delBtn = el("button", { class: "btn btn-sm btn-danger-ghost" }, ["✕"]);
  delBtn.addEventListener("click", () => deleteSection(section));
  headerActions.appendChild(editBtn);
  headerActions.appendChild(delBtn);
  header.appendChild(headerActions);
  card.appendChild(header);

  const itemsWrap = el("div", { class: "item-list" });
  for (const item of section.items) {
    const row = el("div", { class: "manage-item" });
    row.appendChild(el("span", { class: "item-text" }, [item.name]));
    const actions = el("div", { class: "actions" });
    const editItemBtn = el("button", { class: "btn btn-sm btn-ghost" }, [L.edit]);
    editItemBtn.addEventListener("click", () => editItem(section, item));
    const delItemBtn = el("button", { class: "btn btn-sm btn-danger-ghost" }, ["✕"]);
    delItemBtn.addEventListener("click", () => deleteItem(section, item));
    actions.appendChild(editItemBtn);
    actions.appendChild(delItemBtn);
    row.appendChild(actions);
    itemsWrap.appendChild(row);
  }
  card.appendChild(itemsWrap);

  const addRow = el("div", { class: "inline-add" });
  const input = el("input", { type: "text", placeholder: L.item_name_placeholder || L.item_label });
  const btn = el("button", { class: "btn btn-success btn-sm" }, [L.add]);
  btn.addEventListener("click", () => addItem(section, input));
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addItem(section, input);
  });
  addRow.appendChild(input);
  addRow.appendChild(btn);
  card.appendChild(addRow);

  return card;
}

async function addSection() {
  const input = document.getElementById("sectionNameInput");
  const name = input.value.trim();
  if (!name) return toast(L.section_label + " " + "مطلوب", "error");
  try {
    await api("/api/admin/sections", { method: "POST", body: JSON.stringify({ name }) });
    input.value = "";
    toast(`${L.add} ✓`, "success", "✅");
    loadSections();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function editSection(section) {
  const name = prompt(L.section_label, section.name);
  if (!name || name.trim() === section.name) return;
  try {
    await api(`/api/admin/sections/${section.id}`, { method: "PUT", body: JSON.stringify({ name: name.trim() }) });
    loadSections();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function deleteSection(section) {
  if (!confirm(L.delete_section_confirm.replace("{name}", section.name))) return;
  try {
    await api(`/api/admin/sections/${section.id}`, { method: "DELETE" });
    toast(`${L.delete} ✓`, "success", "🗑️");
    loadSections();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function addItem(section, input) {
  const name = input.value.trim();
  if (!name) return;
  try {
    await api("/api/admin/items", { method: "POST", body: JSON.stringify({ sectionId: section.id, name }) });
    toast(`${L.add} ✓`, "success", "✅");
    loadSections();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function editItem(section, item) {
  const name = prompt(L.item_label, item.name);
  if (!name || name.trim() === item.name) return;
  try {
    await api(`/api/admin/items/${item.id}`, { method: "PUT", body: JSON.stringify({ name: name.trim() }) });
    loadSections();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function deleteItem(section, item) {
  if (!confirm(L.delete_item_confirm.replace("{name}", item.name))) return;
  try {
    await api(`/api/admin/items/${item.id}`, { method: "DELETE" });
    toast(`${L.delete} ✓`, "success", "🗑️");
    loadSections();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

// ===== الورديات =====
async function loadShifts() {
  shiftsData = await api("/api/shifts");
  const container = document.getElementById("shiftsList");
  container.innerHTML = "";
  if (!shiftsData.length) {
    container.appendChild(el("div", { class: "empty card" }, [L.no_shifts]));
    return;
  }
  const card = el("div", { class: "card" });
  for (const shift of shiftsData) {
    const row = el("div", { class: "manage-item" });
    row.appendChild(el("span", { class: "item-text" }, [shift.name]));
    const actions = el("div", { class: "actions" });
    const editBtn = el("button", { class: "btn btn-sm btn-ghost" }, [L.edit]);
    editBtn.addEventListener("click", () => editShift(shift));
    const delBtn = el("button", { class: "btn btn-sm btn-danger-ghost" }, ["✕"]);
    delBtn.addEventListener("click", () => deleteShift(shift));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    row.appendChild(actions);
    card.appendChild(row);
  }
  container.appendChild(card);
}

async function addShift() {
  const input = document.getElementById("shiftNameInput");
  const name = input.value.trim();
  if (!name) return toast(L.shift_label + " " + "مطلوب", "error");
  try {
    await api("/api/admin/shifts", { method: "POST", body: JSON.stringify({ name }) });
    input.value = "";
    toast(`${L.add} ✓`, "success", "✅");
    loadShifts();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function editShift(shift) {
  const name = prompt(L.shift_label, shift.name);
  if (!name || name.trim() === shift.name) return;
  try {
    await api(`/api/admin/shifts/${shift.id}`, { method: "PUT", body: JSON.stringify({ name: name.trim() }) });
    loadShifts();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function deleteShift(shift) {
  if (!confirm(L.delete_shift_confirm.replace("{name}", shift.name))) return;
  try {
    await api(`/api/admin/shifts/${shift.id}`, { method: "DELETE" });
    toast(`${L.delete} ✓`, "success", "🗑️");
    loadShifts();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

// ===== أنواع الغرامات =====
async function loadPenaltyTypes() {
  penaltyTypesData = await api("/api/penalty-types");
  const container = document.getElementById("penaltyTypesList");
  container.innerHTML = "";
  if (!penaltyTypesData.length) {
    container.appendChild(el("div", { class: "empty card" }, [L.no_penalty_types]));
    return;
  }
  const card = el("div", { class: "card" });
  for (const type of penaltyTypesData) {
    const row = el("div", { class: "manage-item" });
    row.appendChild(el("span", { class: "item-text" }, [type.name]));
    row.appendChild(el("span", { class: "badge badge-muted" }, [`${type.amount}`]));
    const actions = el("div", { class: "actions" });
    const editBtn = el("button", { class: "btn btn-sm btn-ghost" }, [L.edit]);
    editBtn.addEventListener("click", () => editPenaltyType(type));
    const delBtn = el("button", { class: "btn btn-sm btn-danger-ghost" }, ["✕"]);
    delBtn.addEventListener("click", () => deletePenaltyType(type));
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);
    row.appendChild(actions);
    card.appendChild(row);
  }
  container.appendChild(card);
}

async function addPenaltyType() {
  const nameInput = document.getElementById("penaltyNameInput");
  const amountInput = document.getElementById("penaltyAmountInput");
  const name = nameInput.value.trim();
  if (!name) return toast(L.penalty_label + " " + "مطلوب", "error");
  try {
    await api("/api/admin/penalty-types", {
      method: "POST",
      body: JSON.stringify({ name, amount: Number(amountInput.value || 0) }),
    });
    nameInput.value = "";
    amountInput.value = "";
    toast(`${L.add} ✓`, "success", "✅");
    loadPenaltyTypes();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function editPenaltyType(type) {
  const name = prompt(L.penalty_label, type.name);
  if (!name || name.trim() === type.name) return;
  const amount = prompt(L.amount, type.amount);
  if (amount === null) return;
  try {
    await api(`/api/admin/penalty-types/${type.id}`, {
      method: "PUT",
      body: JSON.stringify({ name: name.trim(), amount: Number(amount || 0) }),
    });
    loadPenaltyTypes();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

async function deletePenaltyType(type) {
  if (!confirm(L.delete_penalty_confirm.replace("{name}", type.name))) return;
  try {
    await api(`/api/admin/penalty-types/${type.id}`, { method: "DELETE" });
    toast(`${L.delete} ✓`, "success", "🗑️");
    loadPenaltyTypes();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

// ===== المسميات =====
function renderLabelsEditor() {
  const container = document.getElementById("labelsContainer");
  container.innerHTML = "";
  for (const group of LABEL_FIELDS) {
    const groupWrap = el("div", { class: "label-group" });
    groupWrap.appendChild(el("h3", { class: "label-group-title" }, [group.group]));
    const grid = el("div", { class: "label-grid" });
    for (const field of group.fields) {
      const item = el("div", { class: "label-field" });
      item.appendChild(el("label", { class: "theme-label" }, [field.label]));
      const input = el("input", { type: "text", value: L[field.key] || "", "data-label-key": field.key });
      item.appendChild(input);
      grid.appendChild(item);
    }
    groupWrap.appendChild(grid);
    container.appendChild(groupWrap);
  }
}

async function saveLabels() {
  const labels = {};
  document.querySelectorAll("#labelsContainer input[data-label-key]").forEach((input) => {
    const key = input.dataset.labelKey;
    const value = input.value.trim();
    if (value) labels[key] = value;
  });
  try {
    const data = await saveSettings({ labels });
    toast(`${L.save_labels} ✓`, "success", "🏷️");
    renderLabelsEditor();
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

// ===== تغيير كلمة المرور =====
async function changePassword() {
  const current = document.getElementById("currentPwInput").value;
  const next = document.getElementById("newPwInput").value;
  const confirm = document.getElementById("confirmPwInput").value;
  if (!next) return toast(L.new_password + " " + "مطلوب", "error");
  if (next !== confirm) return toast(L.confirm_password + " " + "غير متطابقة", "error");
  try {
    await api("/api/admin/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    document.getElementById("currentPwInput").value = "";
    document.getElementById("newPwInput").value = "";
    document.getElementById("confirmPwInput").value = "";
    toast(`${L.change_password_btn} ✓`, "success", "🔐");
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

// ===== تفاصيل التقرير =====
async function openReportModal(id) {
  const overlay = document.getElementById("reportModal");
  const body = document.getElementById("modalBody");
  body.innerHTML = "";
  overlay.classList.add("open");
  try {
    const r = await api(`/api/reports/${id}`);
    document.getElementById("modalTitle").textContent = `${L.report_label} #${r.id}`;
    const meta = el("div", { class: "card", style: "margin-bottom:12px" }, [
      el("p", { style: "margin-bottom:6px" }, [`${L.date_label}: ${r.reportDate}`]),
      el("p", { style: "margin-bottom:6px" }, [`${L.shift_label}: ${r.shiftName || "-"}`]),
      r.notes ? el("p", {}, [`${L.general_notes}: ${r.notes}`]) : null,
    ].filter(Boolean));
    body.appendChild(meta);

    if (r.items.length) {
      const bySection = {};
      for (const it of r.items) {
        const key = it.sectionName || L.section_label;
        (bySection[key] = bySection[key] || []).push(it);
      }
      for (const [section, list] of Object.entries(bySection)) {
        const card = el("div", { class: "card", style: "margin-bottom:12px" });
        card.appendChild(el("div", { class: "card-title" }, [section]));
        for (const it of list) {
          const row = el("div", { class: "manage-item" }, [
            el("span", { class: "item-text" }, [it.itemName || `${L.item_label} #${it.inspectionItemId}`]),
            el("span", {}, [
              el("span", { class: "badge " + (it.status === "pass" ? "badge-success" : "badge-danger") }, [
                it.status === "pass" ? L.pass_label : L.fail_label,
              ]),
              it.notes ? el("span", { class: "badge badge-muted", style: "margin-inline-start:6px" }, [it.notes]) : null,
            ]),
          ]);
          card.appendChild(row);
        }
        body.appendChild(card);
      }
    }

    if (r.penalties.length) {
      const card = el("div", { class: "card", style: "margin-bottom:12px" });
      card.appendChild(el("div", { class: "card-title" }, [L.penalties_label]));
      for (const p of r.penalties) {
        const row = el("div", { class: "manage-item" }, [
          el("span", { class: "item-text" }, [p.typeName || `${L.penalty_label} #${p.penaltyTypeId}`]),
          el("span", {}, [`${p.amount} ${p.note ? `— ${p.note}` : ""}`]),
        ]);
        card.appendChild(row);
      }
      card.appendChild(
        el("div", { style: "font-weight:800;margin-top:12px;color:var(--color-danger)" }, [`${L.total}: ${r.penaltyTotal}`])
      );
      body.appendChild(card);
    }

    if (!r.items.length && !r.penalties.length) {
      body.appendChild(el("div", { class: "empty" }, [L.no_reports]));
    }
  } catch (e) {
    body.appendChild(el("div", { class: "empty" }, [e.message]));
  }
}

function closeReportModal() {
  document.getElementById("reportModal").classList.remove("open");
}
document.getElementById("reportModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("reportModal")) closeReportModal();
});

init();
