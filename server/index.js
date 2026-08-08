import "dotenv/config";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import express from "express";
import { and, asc, desc, eq, gte, lte, inArray, max, count } from "drizzle-orm";
import * as schema from "../drizzle/schema.js";
import {
  reports,
  reportItems,
  penalties,
  penaltyTypes,
  sections,
  inspectionItems,
  shifts,
  notifications,
} from "../drizzle/schema.js";
import { getDb, getAppSettings, saveAppSettings, getSetting, setSetting, initSchema, insertReturnId, isPg } from "./db.js";
import { hashPassword, verifyPassword, createToken, isValidToken, revokeToken } from "./auth.js";
import {
  DEFAULT_TITLE,
  mergeTheme,
  ALLOWED_THEME_KEYS,
  mergeLabels,
  ALLOWED_LABEL_KEYS,
  mergeLogos,
  ALLOWED_LOGO_SLOTS,
} from "./defaults.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: "6mb" }));
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;

// ==================== اللوجوهات (ملفات مرفوعة) ====================
const UPLOAD_DIR = path.join(__dirname, "..", "public", "uploads");
const MIME_EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };

async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (e) {}
}

// نسخ اللوجوهات الافتراضية عند أول تشغيل (مجلد الرفع فارغ في Docker)
async function seedLogos() {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    if (files.length > 0) return;
    const seedsDir = path.join(__dirname, "..", "assets", "seeds");
    const seeds = await fs.readdir(seedsDir).catch(() => []);
    for (const file of seeds) {
      await fs.copyFile(path.join(seedsDir, file), path.join(UPLOAD_DIR, file)).catch(() => {});
    }
  } catch (e) {}
}

async function removeLogoFiles(slot) {
  try {
    const files = await fs.readdir(UPLOAD_DIR);
    for (const file of files) {
      if (file.startsWith(slot + ".")) {
        await fs.unlink(path.join(UPLOAD_DIR, file)).catch(() => {});
      }
    }
  } catch (e) {}
}

async function respondWithSettings(res) {
  const current = await getAppSettings();
  res.json({
    ok: true,
    title: current.title || DEFAULT_TITLE,
    theme: mergeTheme(current.theme),
    labels: mergeLabels(current.labels),
    logos: mergeLogos(current.logos),
  });
}

function settingsEventPayload(current) {
  return {
    type: "settings",
    title: current.title || DEFAULT_TITLE,
    theme: mergeTheme(current.theme),
    labels: mergeLabels(current.labels),
    logos: mergeLogos(current.logos),
  };
}

// ==================== البث المباشر (SSE) ====================
const sseClients = new Set();

function broadcast(eventData) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(payload);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

function sseHeartbeat() {
  for (const client of sseClients) {
    try {
      client.write(": ping\n\n");
    } catch (e) {
      sseClients.delete(client);
    }
  }
}
setInterval(sseHeartbeat, 25000);

app.get("/api/events", handle(async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const db = await getDb();
  if (db) {
    const recent = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.id))
      .limit(20);
    for (const n of recent.reverse()) {
      res.write(`data: ${JSON.stringify(n)}\n\n`);
    }
  }

  sseClients.add(res);
  req.on("close", () => sseClients.delete(res));
}));

// ==================== Middleware ====================
function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!isValidToken(token)) {
    return res.status(401).json({ error: "غير مصرح، الرجاء تسجيل الدخول" });
  }
  req.adminToken = token;
  next();
}

function handle(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (error) {
      console.error("[API]", error);
      res.status(500).json({ error: error.message || "خطأ في الخادم" });
    }
  };
}

// ==================== أيقونة التطبيق (PWA) ====================
// تُرجِع الصورة الحالية للأيقونة مهما كان نوع التخزين (dataUrl على Postgres أو ملف على MySQL)
app.get("/app-icon.png", handle(async (req, res) => {
  let icon = "";
  try {
    icon = await getSetting("logo_icon");
  } catch (e) {}
  const fallback = "/icons/icon-192.png";

  if (!icon) return res.redirect(fallback);

  if (icon.startsWith("data:image/")) {
    const m = icon.match(/^data:(image\/(png|jpeg|webp|gif));base64,(.+)$/);
    if (!m) return res.redirect(fallback);
    const buf = Buffer.from(m[3], "base64");
    if (!buf.length) return res.redirect(fallback);
    res.set("Content-Type", m[1]);
    res.set("Cache-Control", "no-store");
    return res.send(buf);
  }

  if (icon.startsWith("/uploads/")) {
    const file = path.join(UPLOAD_DIR, path.basename(icon));
    try {
      const buf = await fs.readFile(file);
      if (!buf.length) return res.redirect(fallback);
      res.set("Content-Type", "image/png");
      res.set("Cache-Control", "no-store");
      return res.send(buf);
    } catch (e) {
      return res.redirect(fallback);
    }
  }

  res.redirect(fallback);
}));

// ==================== إعدادات عامة (بدون حماية) ====================
app.get("/api/settings/public", handle(async (req, res) => {
  const current = await getAppSettings();
  res.json({
    title: current.title || DEFAULT_TITLE,
    theme: mergeTheme(current.theme),
    labels: mergeLabels(current.labels),
    logos: mergeLogos(current.logos),
  });
}));

app.get("/api/sections", handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const allSections = await db.select().from(sections).orderBy(asc(sections.order));
  const result = [];
  for (const section of allSections) {
    const items = await db
      .select()
      .from(inspectionItems)
      .where(eq(inspectionItems.sectionId, section.id))
      .orderBy(asc(inspectionItems.order));
    result.push({ ...section, items });
  }
  res.json(result);
}));

app.get("/api/shifts", handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  res.json(await db.select().from(shifts).orderBy(asc(shifts.order)));
}));

app.get("/api/penalty-types", handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const rows = await db.select().from(penaltyTypes).orderBy(asc(penaltyTypes.id));
  res.json(rows.map((r) => ({ ...r, amount: Number(r.amount || 0) })));
}));

// ==================== التقارير ====================
async function loadShiftsMap(db) {
  const rows = await db.select().from(shifts).orderBy(asc(shifts.order));
  return new Map(rows.map((s) => [s.id, s]));
}

async function summarizeReport(db, report, shiftMap) {
  const [items, penRows] = await Promise.all([
    db.select().from(reportItems).where(eq(reportItems.reportId, report.id)),
    db.select().from(penalties).where(eq(penalties.reportId, report.id)),
  ]);
  const passed = items.filter((i) => i.status === "pass").length;
  const failed = items.length - passed;
  const penaltyTotal = Math.round(penRows.reduce((sum, p) => sum + Number(p.amount || 0), 0) * 100) / 100;
  return {
    ...report,
    shiftName: report.shiftId ? (shiftMap.get(report.shiftId)?.name ?? null) : null,
    totalItems: items.length,
    passed,
    failed,
    penaltiesCount: penRows.length,
    penaltyTotal,
  };
}

app.post("/api/reports", handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const { reportDate, shiftId, notes, items = [], penalties: penaltyData = [] } = req.body || {};
  if (!reportDate) return res.status(400).json({ error: "التاريخ مطلوب" });

  const id = await db.transaction(async (tx) => {
    const reportId = await insertReturnId(tx, reports, {
      reportDate,
      shiftId: shiftId || null,
      notes: notes || null,
    });

    if (items.length) {
      await tx.insert(reportItems).values(
        items.map((it) => ({
          reportId,
          inspectionItemId: Number(it.inspectionItemId),
          status: it.status === "fail" ? "fail" : "pass",
          notes: it.notes || null,
        }))
      );
    }
    if (penaltyData.length) {
      await tx.insert(penalties).values(
        penaltyData.map((p) => ({
          reportId,
          penaltyTypeId: Number(p.penaltyTypeId),
          amount: String(Number(p.amount || 0)),
          note: p.note || null,
        }))
      );
    }

    await tx.insert(notifications).values({ type: "report", reportId });
    return reportId;
  });

  broadcast({ type: "report", reportId: id, createdAt: new Date().toISOString() });
  res.json({ id });
}));

app.get("/api/reports", handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const conditions = [];
  if (req.query.startDate) conditions.push(gte(reports.reportDate, req.query.startDate));
  if (req.query.endDate) conditions.push(lte(reports.reportDate, req.query.endDate));
  if (req.query.shiftId) conditions.push(eq(reports.shiftId, Number(req.query.shiftId)));

  let query = db.select().from(reports);
  if (conditions.length) query = query.where(and(...conditions));
  const rows = await query.orderBy(desc(reports.createdAt));

  const shiftMap = await loadShiftsMap(db);
  const out = [];
  for (const report of rows) out.push(await summarizeReport(db, report, shiftMap));
  res.json(out);
}));

app.get("/api/reports/:id", handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const reportId = Number(req.params.id);
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) return res.status(404).json({ error: "التقرير غير موجود" });

  const shiftMap = await loadShiftsMap(db);
  const items = await db.select().from(reportItems).where(eq(reportItems.reportId, reportId));
  const penRows = await db.select().from(penalties).where(eq(penalties.reportId, reportId));

  const itemRows = items.length
    ? await db.select().from(inspectionItems).where(inArray(inspectionItems.id, items.map((i) => i.inspectionItemId)))
    : [];
  const sectionRows = itemRows.length
    ? await db.select().from(sections).where(inArray(sections.id, [...new Set(itemRows.map((i) => i.sectionId))]))
    : [];
  const typeRows = penRows.length
    ? await db.select().from(penaltyTypes).where(inArray(penaltyTypes.id, penRows.map((p) => p.penaltyTypeId)))
    : [];

  const itemMap = new Map(itemRows.map((i) => [i.id, i]));
  const sectionMap = new Map(sectionRows.map((s) => [s.id, s]));
  const typeMap = new Map(typeRows.map((t) => [t.id, t]));

  const summary = await summarizeReport(db, report, shiftMap);
  res.json({
    ...summary,
    items: items.map((i) => {
      const item = itemMap.get(i.inspectionItemId);
      return { ...i, itemName: item?.name ?? null, sectionName: item ? (sectionMap.get(item.sectionId)?.name ?? null) : null };
    }),
    penalties: penRows.map((p) => ({ ...p, amount: Number(p.amount || 0), typeName: typeMap.get(p.penaltyTypeId)?.name ?? null })),
  });
}));

// ==================== المصادقة ====================
app.post("/api/admin/login", handle(async (req, res) => {
  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: "كلمة المرور مطلوبة" });

  let stored = await getSetting("admin_password");
  if (!stored) {
    const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
    if (password !== defaultPassword) {
      return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    }
    stored = hashPassword(defaultPassword);
    await setSetting("admin_password", stored);
  } else if (!verifyPassword(password, stored)) {
    return res.status(401).json({ error: "كلمة المرور غير صحيحة" });
  }

  const current = await getAppSettings();
  res.json({
    token: createToken(),
    title: current.title || DEFAULT_TITLE,
    theme: mergeTheme(current.theme),
    labels: mergeLabels(current.labels),
    logos: mergeLogos(current.logos),
  });
}));

app.get("/api/admin/verify", requireAdmin, handle(async (req, res) => {
  const current = await getAppSettings();
  res.json({
    ok: true,
    title: current.title || DEFAULT_TITLE,
    theme: mergeTheme(current.theme),
    labels: mergeLabels(current.labels),
    logos: mergeLogos(current.logos),
  });
}));

app.post("/api/admin/logout", requireAdmin, handle(async (req, res) => {
  revokeToken(req.adminToken);
  res.json({ ok: true });
}));

app.put("/api/admin/settings", requireAdmin, handle(async (req, res) => {
  const { title, theme, labels } = req.body || {};
  const update = {};
  if (typeof title === "string" && title.trim()) update.title = title.trim().slice(0, 200);
  if (theme && typeof theme === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(theme)) {
      if (ALLOWED_THEME_KEYS.has(k) && typeof v === "string") clean[k] = v;
    }
    update.theme = clean;
  }
  if (labels && typeof labels === "object") {
    const clean = {};
    for (const [k, v] of Object.entries(labels)) {
      if (ALLOWED_LABEL_KEYS.has(k) && typeof v === "string") clean[k] = v;
    }
    update.labels = clean;
  }
  if (Object.keys(update).length === 0) return res.status(400).json({ error: "لا توجد بيانات للتحديث" });
  await saveAppSettings(update);
  const current = await getAppSettings();
  broadcast(settingsEventPayload(current));
  await respondWithSettings(res);
}));

// ==================== رفع / حذف اللوجوهات ====================
app.post("/api/admin/logo", requireAdmin, handle(async (req, res) => {
  const { slot, dataUrl } = req.body || {};
  if (!slot || !ALLOWED_LOGO_SLOTS.has(slot)) {
    return res.status(400).json({ error: "نوع اللوجو غير صحيح" });
  }
  if (!dataUrl || typeof dataUrl !== "string") {
    return res.status(400).json({ error: "الملف مطلوب" });
  }
  const match = dataUrl.match(/^data:image\/(png|jpeg|webp|gif);base64,(.+)$/);
  if (!match) {
    return res.status(400).json({ error: "صيغة الملف غير مدعومة (PNG / JPG / WebP / GIF)" });
  }
  const ext = MIME_EXT["image/" + match[1]];
  const buffer = Buffer.from(match[2], "base64");
  if (!buffer.length) return res.status(400).json({ error: "الملف فارغ" });

  if (isPg) {
    // على PostgreSQL نُخزّن الصورة داخل قاعدة البيانات (الملفات تتمسح على Render)
    await setSetting(`logo_${slot}`, dataUrl);
  } else {
    await ensureUploadsDir();
    await removeLogoFiles(slot);
    const fileName = `${slot}.${ext}`;
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);
    await setSetting(`logo_${slot}`, `/uploads/${fileName}`);
  }

  const current = await getAppSettings();
  broadcast(settingsEventPayload(current));
  await respondWithSettings(res);
}));

app.delete("/api/admin/logo/:slot", requireAdmin, handle(async (req, res) => {
  const slot = req.params.slot;
  if (!ALLOWED_LOGO_SLOTS.has(slot)) {
    return res.status(400).json({ error: "نوع اللوجو غير صحيح" });
  }
  if (!isPg) await removeLogoFiles(slot);
  await setSetting(`logo_${slot}`, "");
  const current = await getAppSettings();
  broadcast(settingsEventPayload(current));
  await respondWithSettings(res);
}));

app.post("/api/admin/change-password", requireAdmin, handle(async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 4) {
    return res.status(400).json({ error: "كلمة المرور الجديدة قصيرة جداً (4 أحرف على الأقل)" });
  }
  const stored = await getSetting("admin_password");
  const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
  const ok = stored ? verifyPassword(currentPassword || "", stored) : (currentPassword || "") === defaultPassword;
  if (!ok) return res.status(400).json({ error: "كلمة المرور الحالية غير صحيحة" });
  await setSetting("admin_password", hashPassword(newPassword));
  res.json({ ok: true });
}));

// ==================== نظرة عامة (لوحة التحكم) ====================
app.get("/api/admin/overview", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });

  const today = new Date().toISOString().slice(0, 10);
  const [totalReports, todayReports, allItems, allPenalties, countSections, countShifts, countTypes] = await Promise.all([
    db.select().from(reports),
    db.select().from(reports).where(eq(reports.reportDate, today)),
    db.select().from(reportItems),
    db.select().from(penalties),
    db.select({ n: count() }).from(sections),
    db.select({ n: count() }).from(shifts),
    db.select({ n: count() }).from(penaltyTypes),
  ]);

  const failedTotal = allItems.filter((i) => i.status === "fail").length;
  const penaltyAmount = Math.round(allPenalties.reduce((s, p) => s + Number(p.amount || 0), 0) * 100) / 100;

  const shiftMap = await loadShiftsMap(db);
  const latest = [];
  for (const report of totalReports.slice(0, 5)) {
    latest.push(await summarizeReport(db, report, shiftMap));
  }

  res.json({
    totalReports: totalReports.length,
    todayReports: todayReports.length,
    failedTotal,
    penaltyAmount,
    totalSections: countSections[0]?.n || 0,
    totalShifts: countShifts[0]?.n || 0,
    totalPenaltyTypes: countTypes[0]?.n || 0,
    latestReports: latest,
  });
}));

// ==================== إدارة الأقسام ====================
app.post("/api/admin/sections", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "اسم القسم مطلوب" });
  const rows = await db.select({ n: max(sections.order) }).from(sections);
  const id = await insertReturnId(db, sections, { name: name.trim(), order: (rows[0]?.n || 0) + 1 });
  res.json({ id });
}));

app.put("/api/admin/sections/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const data = {};
  if (typeof req.body?.name === "string" && req.body.name.trim()) data.name = req.body.name.trim();
  if (req.body?.order !== undefined) data.order = Number(req.body.order);
  await db.update(sections).set(data).where(eq(sections.id, Number(req.params.id)));
  res.json({ ok: true });
}));

app.delete("/api/admin/sections/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  await db.delete(sections).where(eq(sections.id, Number(req.params.id)));
  res.json({ ok: true });
}));

// ==================== إدارة عناصر الفحص ====================
app.post("/api/admin/items", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const { sectionId, name } = req.body || {};
  if (!sectionId || !name || !name.trim()) return res.status(400).json({ error: "اسم العنصر ورقم القسم مطلوبان" });
  const rows = await db.select({ n: max(inspectionItems.order) }).from(inspectionItems).where(eq(inspectionItems.sectionId, Number(sectionId)));
  const id = await insertReturnId(db, inspectionItems, {
    sectionId: Number(sectionId),
    name: name.trim(),
    order: (rows[0]?.n || 0) + 1,
  });
  res.json({ id });
}));

app.put("/api/admin/items/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const data = {};
  if (typeof req.body?.name === "string" && req.body.name.trim()) data.name = req.body.name.trim();
  if (req.body?.order !== undefined) data.order = Number(req.body.order);
  if (req.body?.sectionId !== undefined) data.sectionId = Number(req.body.sectionId);
  await db.update(inspectionItems).set(data).where(eq(inspectionItems.id, Number(req.params.id)));
  res.json({ ok: true });
}));

app.delete("/api/admin/items/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  await db.delete(inspectionItems).where(eq(inspectionItems.id, Number(req.params.id)));
  res.json({ ok: true });
}));

// ==================== إدارة الورديات ====================
app.post("/api/admin/shifts", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const { name } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "اسم الوردية مطلوب" });
  const rows = await db.select({ n: max(shifts.order) }).from(shifts);
  const id = await insertReturnId(db, shifts, { name: name.trim(), order: (rows[0]?.n || 0) + 1 });
  res.json({ id });
}));

app.put("/api/admin/shifts/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const data = {};
  if (typeof req.body?.name === "string" && req.body.name.trim()) data.name = req.body.name.trim();
  if (req.body?.order !== undefined) data.order = Number(req.body.order);
  await db.update(shifts).set(data).where(eq(shifts.id, Number(req.params.id)));
  res.json({ ok: true });
}));

app.delete("/api/admin/shifts/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  await db.delete(shifts).where(eq(shifts.id, Number(req.params.id)));
  res.json({ ok: true });
}));

// ==================== إدارة أنواع الغرامات ====================
app.post("/api/admin/penalty-types", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const { name, amount } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: "اسم الغرامة مطلوب" });
  const id = await insertReturnId(db, penaltyTypes, { name: name.trim(), amount: String(Number(amount || 0)) });
  res.json({ id });
}));

app.put("/api/admin/penalty-types/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  const data = {};
  if (typeof req.body?.name === "string" && req.body.name.trim()) data.name = req.body.name.trim();
  if (req.body?.amount !== undefined) data.amount = String(Number(req.body.amount));
  await db.update(penaltyTypes).set(data).where(eq(penaltyTypes.id, Number(req.params.id)));
  res.json({ ok: true });
}));

app.delete("/api/admin/penalty-types/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  await db.delete(penaltyTypes).where(eq(penaltyTypes.id, Number(req.params.id)));
  res.json({ ok: true });
}));

// ==================== حذف التقرير ====================
app.delete("/api/admin/reports/:id", requireAdmin, handle(async (req, res) => {
  const db = await getDb();
  if (!db) return res.status(500).json({ error: "قاعدة البيانات غير متاحة" });
  await db.delete(reports).where(eq(reports.id, Number(req.params.id)));
  res.json({ ok: true });
}));

// ==================== تشغيل ====================
app.get("/admin", (req, res) => res.redirect("/admin.html"));

app.listen(PORT, async () => {
  try {
    await initSchema();
    console.log("[Database] الجداول جاهزة");
  } catch (error) {
    console.warn("[Database] تعذر إنشاء الجداول:", error.message);
  }
  await ensureUploadsDir();
  await seedLogos();
  console.log(`[Server] يعمل على: http://localhost:${PORT}`);
  console.log(`[Server] لوحة التحكم: http://localhost:${PORT}/admin`);
});
