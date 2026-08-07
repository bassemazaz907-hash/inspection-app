import * as pgSchema from "./schema-pg.js";
import * as mysqlSchema from "./schema-mysql.js";

// ===== اختيار محرك قاعدة البيانات تلقائيًا حسب DATABASE_URL =====
// mysql://  → النسخة المحلية (MariaDB)
// postgres:// → النسخة على Render
const active = /^postgres/.test(process.env.DATABASE_URL || "") ? pgSchema : mysqlSchema;

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
