// ===== الحالة =====
let currentFilters = {};
let shiftsData = [];

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
    loadReports();
  } else if (ev.type === "settings") {
    if (ev.title) applyLabels(ev.labels);
    if (ev.theme) applyTheme(ev.theme);
    if (ev.logos) applyLogos(ev.logos);
  }
}

// ===== التحميل الأولي =====
async function init() {
  try {
    const settings = await api("/api/settings/public");
    applyTheme(settings.theme);
    applyLabels(settings.labels);
    applyLogos(settings.logos);
  } catch (e) {
    applyTheme(null);
    applyLabels(null);
    applyLogos(null);
  }

  await loadShifts();
  setupFilters();
  loadReports();
  connectEvents();
}

async function loadShifts() {
  shiftsData = await api("/api/shifts");
  const filterShift = document.getElementById("filterShift");
  filterShift.innerHTML = "";
  if (shiftsData.length) {
    filterShift.appendChild(el("option", { value: "" }, [L.all_shifts]));
    for (const s of shiftsData) {
      filterShift.appendChild(el("option", { value: s.id }, [s.name]));
    }
  }
}

// ===== قائمة التقارير =====
function setupFilters() {
  document.getElementById("filterBtn").addEventListener("click", () => {
    currentFilters = {
      startDate: document.getElementById("filterStart").value,
      endDate: document.getElementById("filterEnd").value,
      shiftId: document.getElementById("filterShift").value,
      search: document.getElementById("filterSearch").value.trim().toLowerCase(),
    };
    loadReports();
  });
  document.getElementById("filterSearch").addEventListener("input", () => {
    currentFilters = { ...currentFilters, search: document.getElementById("filterSearch").value.trim().toLowerCase() };
    loadReports();
  });
}

function buildQuery() {
  const params = new URLSearchParams();
  if (currentFilters.startDate) params.set("startDate", currentFilters.startDate);
  if (currentFilters.endDate) params.set("endDate", currentFilters.endDate);
  if (currentFilters.shiftId) params.set("shiftId", currentFilters.shiftId);
  const q = params.toString();
  return q ? `?${q}` : "";
}

async function loadReports() {
  const tbody = document.getElementById("reportsTableBody");
  tbody.innerHTML = "";
  try {
    const reports = await api(`/api/reports${buildQuery()}`);
    let visible = 0;
    for (const r of reports) {
      const tr = renderReportRow(r);
      const haystack = `${r.id} ${r.reportDate} ${r.shiftName || ""}`.toLowerCase();
      if (currentFilters.search && !haystack.includes(currentFilters.search)) continue;
      visible++;
      tbody.appendChild(tr);
    }
    document.getElementById("reportsEmpty").style.display = visible ? "none" : "block";
  } catch (e) {
    toast(e.message, "error", "⚠️");
  }
}

function renderReportRow(r) {
  const tr = el("tr", {});
  tr.appendChild(el("td", {}, [r.id]));
  tr.appendChild(el("td", {}, [r.reportDate]));
  tr.appendChild(el("td", {}, [r.shiftName || "-"]));
  tr.appendChild(el("td", {}, [r.totalItems]));
  tr.appendChild(
    el("td", {}, [el("span", { class: "badge badge-success" }, [`${r.passed} ✓`])])
  );
  tr.appendChild(
    el("td", {}, [
      el("span", { class: "badge " + (r.failed ? "badge-danger" : "badge-muted") }, [`${r.failed} ✕`]),
    ])
  );
  tr.appendChild(el("td", {}, [r.penaltiesCount ? `${r.penaltiesCount}` : "—"]));
  const viewBtn = el("button", { class: "btn btn-sm btn-ghost" }, [L.view]);
  viewBtn.addEventListener("click", () => openReportModal(r.id));
  tr.appendChild(el("td", {}, [viewBtn]));
  return tr;
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
            el("span", { class: "item-icon-display" }, [it.itemIcon || "📋"]),
            el("span", { class: "item-text" }, [it.itemName || `${L.item_label} #${it.inspectionItemId}`]),
            el("span", { class: "badge " + (it.status === "pass" ? "badge-success" : "badge-danger") }, [
              it.status === "pass" ? "✓" : "✕",
            ]),
          ]);
          card.appendChild(row);
          if (it.notes) {
            card.appendChild(el("p", { style: "margin:4px 0 8px;color:var(--color-text-muted);font-size:0.9em" }, [`${L.general_notes}: ${it.notes}`]));
          }
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
          p.note ? el("span", {}, [p.note]) : null,
        ]);
        card.appendChild(row);
      }
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

document.addEventListener("click", (e) => {
  if (e.target.classList && e.target.classList.contains("modal-overlay")) {
    closeReportModal();
  }
});

// ===== إعادة العرض عند تغيير اللغة =====
function refreshDynamicContent() {
  loadShifts();
  loadReports();
}

init();
