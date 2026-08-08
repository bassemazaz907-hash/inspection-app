import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  date,
  numeric,
} from "drizzle-orm/pg-core";

// ===== النسخة الخاصة بـ PostgreSQL (تشغيل على Render) =====

// ===== المستخدمون =====
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 128 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  loginMethod: varchar("login_method", { length: 50 }),
  lastSignedIn: timestamp("last_signed_in"),
  role: varchar("role", { length: 20 }).default("user"),
});

// ===== الأقسام =====
export const sections = pgTable("sections", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  order: integer("sort_order").notNull().default(0),
});

// ===== عناصر الفحص =====
export const inspectionItems = pgTable("inspection_items", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id")
    .notNull()
    .references(() => sections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  icon: varchar("icon", { length: 64 }),
  order: integer("sort_order").notNull().default(0),
});

// ===== الورديات =====
export const shifts = pgTable("shifts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  order: integer("sort_order").notNull().default(0),
});

// ===== أنواع الغرامات =====
export const penaltyTypes = pgTable("penalty_types", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
});

// ===== التقارير =====
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportDate: date("report_date").notNull(),
  shiftId: integer("shift_id").references(() => shifts.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ===== بنود التقرير =====
export const reportItems = pgTable("report_items", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  inspectionItemId: integer("inspection_item_id")
    .notNull()
    .references(() => inspectionItems.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull(), // pass | fail
  notes: text("notes"),
});

// ===== الغرامات =====
export const penalties = pgTable("penalties", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  penaltyTypeId: integer("penalty_type_id")
    .notNull()
    .references(() => penaltyTypes.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  note: varchar("note", { length: 500 }),
});

// ===== الإعدادات =====
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
});

// ===== الإشعارات =====
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),
  reportId: integer("report_id").references(() => reports.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
