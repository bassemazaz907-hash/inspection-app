import * as pgSchema from "./schema-pg.js";
import * as mysqlSchema from "./schema-mysql.js";
import * as sqliteSchema from "./schema-sqlite.js";

// ===== اختيار محرك قاعدة البيانات تلقائيًا حسب DATABASE_URL =====
// postgres:// → Render
// mysql://    → MariaDB محلي
// (لا شيء)    → SQLite محلي
const dbUrl = process.env.DATABASE_URL || "";
const active = /^postgres/.test(dbUrl) ? pgSchema : /^mysql/.test(dbUrl) ? mysqlSchema : sqliteSchema;

export const users = active.users;
export const sections = active.sections;
export const inspectionItems = active.inspectionItems;
export const shifts = active.shifts;
export const penaltyTypes = active.penaltyTypes;
export const reports = active.reports;
export const reportItems = active.reportItems;
export const penalties = active.penalties;
export const settings = active.settings;
export const notifications = active.notifications;
