import {
  mysqlTable,
  int,
  varchar,
  text,
  datetime,
  date,
  decimal,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

// ===== المستخدمون =====
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("open_id", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  loginMethod: varchar("login_method", { length: 50 }),
  lastSignedIn: datetime("last_signed_in"),
  role: varchar("role", { length: 20 }).default("user"),
});

// ===== الأقسام =====
export const sections = mysqlTable("sections", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  order: int("sort_order").notNull().default(0),
});

// ===== عناصر الفحص =====
export const inspectionItems = mysqlTable("inspection_items", {
  id: int("id").autoincrement().primaryKey(),
  sectionId: int("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 64 }),
  order: int("sort_order").notNull().default(0),
});

// ===== الورديات =====
export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  order: int("sort_order").notNull().default(0),
});

// ===== أنواع الغرامات =====
export const penaltyTypes = mysqlTable("penalty_types", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
});

// ===== التقارير =====
export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  reportDate: date("report_date").notNull(),
  shiftId: int("shift_id").references(() => shifts.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: datetime("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

// ===== بنود التقرير =====
export const reportItems = mysqlTable("report_items", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  inspectionItemId: int("inspection_item_id")
    .notNull()
    .references(() => inspectionItems.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull(), // pass | fail
  notes: text("notes"),
});

// ===== الغرامات =====
export const penalties = mysqlTable("penalties", {
  id: int("id").autoincrement().primaryKey(),
  reportId: int("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  penaltyTypeId: int("penalty_type_id")
    .notNull()
    .references(() => penaltyTypes.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  note: varchar("note", { length: 500 }),
});

// ===== الإعدادات (العنوان / الثيم / المسميات / كلمة السر) =====
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
});

// ===== الإشعارات =====
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  reportId: int("report_id").references(() => reports.id, { onDelete: "cascade" }),
  createdAt: datetime("created_at").notNull().default(sql`(CURRENT_TIMESTAMP)`),
});
