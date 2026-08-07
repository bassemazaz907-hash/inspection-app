// ===== الإعدادات الافتراضية =====

export const DEFAULT_TITLE = "نظام الفحص اليومي";

export const DEFAULT_LOGOS = {
  brand: "", // لوجو أعلى الصفحة (زر العودة للرئيسية)
  bg: "", // لوجو الخلفية
};

export const ALLOWED_LOGO_SLOTS = new Set(Object.keys(DEFAULT_LOGOS));

export function mergeLogos(savedLogos) {
  const merged = { ...DEFAULT_LOGOS };
  if (savedLogos && typeof savedLogos === "object") {
    for (const [k, v] of Object.entries(savedLogos)) {
      if (ALLOWED_LOGO_SLOTS.has(k) && typeof v === "string" && v.trim() !== "") {
        merged[k] = v;
      }
    }
  }
  return merged;
}

export const DEFAULT_THEME = {
  "--color-primary": "#1d4ed8",
  "--color-secondary": "#0ea5e9",
  "--color-header-bg": "#0f172a",
  "--color-header-text": "#ffffff",
  "--color-bg": "#f1f5f9",
  "--color-card": "#ffffff",
  "--color-card-border": "#e2e8f0",
  "--color-text": "#0f172a",
  "--color-text-muted": "#64748b",
  "--color-success": "#16a34a",
  "--color-danger": "#dc2626",
  "--color-warning": "#d97706",
  "--radius": "12px",
  "--font-size-base": "15px",
};

// قائمة الألوان المعروضة في لوحة التحكم (مفتاح + اسم عربي)
export const THEME_COLOR_FIELDS = [
  { key: "--color-primary", label: "اللون الرئيسي", type: "color" },
  { key: "--color-secondary", label: "اللون الثانوي", type: "color" },
  { key: "--color-header-bg", label: "لون خلفية الرأس", type: "color" },
  { key: "--color-header-text", label: "لون نص الرأس", type: "color" },
  { key: "--color-bg", label: "لون خلفية الصفحة", type: "color" },
  { key: "--color-card", label: "لون البطاقات", type: "color" },
  { key: "--color-card-border", label: "لون حدود البطاقات", type: "color" },
  { key: "--color-text", label: "لون النص", type: "color" },
  { key: "--color-text-muted", label: "لون النص الخافت", type: "color" },
  { key: "--color-success", label: "لون النجاح", type: "color" },
  { key: "--color-danger", label: "لون الخطر / الفشل", type: "color" },
  { key: "--color-warning", label: "لون التنبيه", type: "color" },
  { key: "--radius", label: "نصف قطر الزوايا", type: "size", suffix: "px", min: 0, max: 24 },
  { key: "--font-size-base", label: "حجم الخط الأساسي", type: "size", suffix: "px", min: 12, max: 20 },
];

// المفاتيح المسموح بتغييرها من لوحة التحكم فقط
export const ALLOWED_THEME_KEYS = new Set(Object.keys(DEFAULT_THEME));

export function mergeTheme(savedTheme) {
  const merged = { ...DEFAULT_THEME };
  if (savedTheme && typeof savedTheme === "object") {
    for (const [k, v] of Object.entries(savedTheme)) {
      if (ALLOWED_THEME_KEYS.has(k) && typeof v === "string" && v.trim() !== "") {
        merged[k] = v;
      }
    }
  }
  return merged;
}

// ===== مسميات الواجهة الافتراضية =====
export const DEFAULT_LABELS = {
  title: "نظام الفحص اليومي",
  date_label: "التاريخ",
  section_label: "القسم",
  shift_label: "الوردية",
  item_label: "عنصر الفحص",
  report_label: "تقرير",
  penalty_label: "غرامة",
  pass_label: "ناجح",
  fail_label: "فاشل",
  note_placeholder: "ملاحظة...",
  general_notes: "ملاحظات عامة",
  notes_placeholder: "ملاحظات على التقرير ككل...",
  save_report: "حفظ التقرير",
  add: "إضافة",
  save: "حفظ",
  cancel: "إلغاء",
  edit: "تعديل",
  delete: "حذف",
  view: "عرض",
  total: "الإجمالي",
  amount: "المبلغ",
  name: "الاسم",
  nav_new: "تقرير جديد",
  nav_reports: "التقارير",
  nav_admin: "لوحة التحكم",
  new_report: "تقرير فحص جديد",
  penalties_label: "الغرامات",
  add_penalty: "+ إضافة غرامة",
  no_sections: "لا توجد أقسام بعد — أضفها من لوحة التحكم",
  no_items_in_section: "لا توجد عناصر في هذا القسم",
  no_shifts: "لا توجد ورديات",
  no_penalty_types: "لا توجد أنواع غرامات — أضفها من لوحة التحكم",
  reports_title: "التقارير",
  from_date: "من تاريخ",
  to_date: "إلى تاريخ",
  all_shifts: "كل الورديات",
  filter_btn: "تصفية",
  col_number: "#",
  col_date: "التاريخ",
  col_shift: "الوردية",
  col_items: "البنود",
  col_pass: "النجاح",
  col_fail: "الفشل",
  col_penalty_total: "إجمالي الغرامات",
  no_reports: "لا توجد تقارير مطابقة",
  report_details: "تفاصيل التقرير",
  notification_new: "تم إضافة تقرير جديد رقم {id}",
  login_title: "لوحة التحكم",
  login_password: "كلمة المرور",
  login_btn: "دخول",
  login_hint: "كلمة المرور الافتراضية: admin123 (غيّرها بعد الدخول من الإعدادات)",
  logout_btn: "تسجيل الخروج",
  preview_site: "معاينة الموقع",
  overview: "نظرة عامة",
  theme_tab: "المظهر والألوان",
  sections_tab: "الأقسام والعناصر",
  shifts_tab: "الورديات",
  penalty_types_tab: "أنواع الغرامات",
  labels_tab: "المسميات",
  settings_tab: "الإعدادات",
  add_section: "+ قسم جديد",
  add_item: "+ عنصر",
  add_shift: "+ وردية جديدة",
  add_penalty_type: "+ نوع جديد",
  theme_title: "ألوان الموقع",
  theme_desc: "غيّر أي لون وسيتم تطبيقه فوراً على كل الموقع. اضغط حفظ لتثبيت التغييرات.",
  save_colors: "حفظ الألوان",
  reset_colors: "استعادة الافتراضي",
  labels_title: "مسميات التطبيق",
  labels_desc: "غيّر أسماء أي شيء في التطبيق — الأزرار والأقسام والحالات والمزيد.",
  save_labels: "حفظ المسميات",
  project_title_label: "عنوان المشروع",
  project_title_placeholder: "العنوان الذي يظهر أعلى الموقع",
  save_title: "حفظ العنوان",
  change_password: "تغيير كلمة المرور",
  current_password: "كلمة المرور الحالية",
  new_password: "كلمة المرور الجديدة",
  confirm_password: "تأكيد كلمة المرور",
  change_password_btn: "تغيير كلمة المرور",
  stat_total_reports: "إجمالي التقارير",
  stat_today_reports: "تقارير اليوم",
  stat_failed_items: "بنود فاشلة",
  stat_penalty_total: "إجمالي الغرامات",
  stat_sections: "الأقسام",
  stat_shifts: "الورديات",
  stat_penalty_types: "أنواع الغرامات",
  latest_reports: "أحدث التقارير",
  live_status: "متصل بالبث المباشر",
  section_name_placeholder: "مثال: معدات الإنتاج",
  item_name_placeholder: "مثال: سلامة الأغطية",
  shift_name_placeholder: "مثال: الوردية الصباحية",
  penalty_type_name_placeholder: "مثال: مخالفة تأخير",
  delete_report_confirm: "حذف التقرير رقم {id} نهائياً؟",
  delete_section_confirm: 'حذف القسم "{name}" وكل عناصره؟',
  delete_item_confirm: 'حذف العنصر "{name}"؟',
  delete_shift_confirm: 'حذف الوردية "{name}"؟',
  delete_penalty_confirm: 'حذف الغرامة "{name}"؟',
  reset_colors_confirm: "استعادة الألوان الافتراضية؟",
  welcome_admin: "لوحة التحكم —",
  items_label: "البنود",
  back_home: "الشاشة الرئيسية",
  logos_title: "اللوجوهات",
  logo_brand_label: "لوجو أعلى الصفحة (الزر)",
  logo_bg_label: "لوجو الخلفية",
  logo_choose: "اختر صورة",
  logo_upload: "رفع",
  logo_remove: "إزالة",
  logo_uploaded: "تم رفع اللوجو ✓",
  logo_removed: "تمت إزالة اللوجو",
  logo_remove_confirm: "إزالة هذا اللوجو؟",
  logo_hint: "اضغط على اللوجو أعلى الصفحة (يمين الشريط العلوي) للعودة إلى الشاشة الرئيسية من أي مكان. لوجو الخلفية يظهر خلف محتوى الشاشة الرئيسية.",
  logo_choose_hint: "PNG أو JPG أو WebP — حتى 2 ميجا",
};

export const ALLOWED_LABEL_KEYS = new Set(Object.keys(DEFAULT_LABELS));

export function mergeLabels(savedLabels) {
  const merged = { ...DEFAULT_LABELS };
  if (savedLabels && typeof savedLabels === "object") {
    for (const [k, v] of Object.entries(savedLabels)) {
      if (ALLOWED_LABEL_KEYS.has(k) && typeof v === "string" && v.trim() !== "") {
        merged[k] = v;
      }
    }
  }
  return merged;
}

// قائمة المسميات القابلة للتعديل من لوحة التحكم (مجموعات)
export const LABEL_FIELDS = [
  {
    group: "معلومات أساسية",
    fields: [
      { key: "title", label: "عنوان المشروع" },
      { key: "report_label", label: "التقرير" },
      { key: "shift_label", label: "الوردية" },
      { key: "section_label", label: "القسم" },
      { key: "item_label", label: "عنصر الفحص" },
      { key: "penalty_label", label: "الغرامة" },
      { key: "pass_label", label: "حالة النجاح" },
      { key: "fail_label", label: "حالة الفشل" },
    ],
  },
  {
    group: "الموقع الرئيسي",
    fields: [
      { key: "nav_new", label: "زر: تقرير جديد" },
      { key: "nav_reports", label: "زر: التقارير" },
      { key: "nav_admin", label: "زر: لوحة التحكم" },
      { key: "new_report", label: "عنوان: تقرير فحص جديد" },
      { key: "reports_title", label: "عنوان: التقارير" },
      { key: "date_label", label: "الحقل: التاريخ" },
      { key: "shift_label", label: "الحقل: الوردية" },
      { key: "general_notes", label: "الحقل: ملاحظات عامة" },
      { key: "penalties_label", label: "قسم: الغرامات" },
      { key: "add_penalty", label: "زر: إضافة غرامة" },
      { key: "save_report", label: "زر: حفظ التقرير" },
      { key: "from_date", label: "فلتر: من تاريخ" },
      { key: "to_date", label: "فلتر: إلى تاريخ" },
      { key: "all_shifts", label: "فلتر: كل الورديات" },
      { key: "filter_btn", label: "زر: تصفية" },
      { key: "view", label: "زر: عرض" },
      { key: "no_sections", label: "رسالة: لا توجد أقسام" },
      { key: "no_reports", label: "رسالة: لا توجد تقارير" },
    ],
  },
  {
    group: "أعمدة الجدول",
    fields: [
      { key: "col_number", label: "العمود: #" },
      { key: "col_date", label: "العمود: التاريخ" },
      { key: "col_shift", label: "العمود: الوردية" },
      { key: "col_items", label: "العمود: البنود" },
      { key: "col_pass", label: "العمود: النجاح" },
      { key: "col_fail", label: "العمود: الفشل" },
      { key: "col_penalty_total", label: "العمود: إجمالي الغرامات" },
    ],
  },
  {
    group: "الإشعارات",
    fields: [
      { key: "notification_new", label: "نص الإشعار (ضع {id} مكان رقم التقرير)" },
    ],
  },
  {
    group: "لوحة التحكم",
    fields: [
      { key: "login_password", label: "حقل: كلمة المرور" },
      { key: "login_btn", label: "زر: دخول" },
      { key: "logout_btn", label: "زر: تسجيل الخروج" },
      { key: "preview_site", label: "زر: معاينة الموقع" },
      { key: "overview", label: "تبويب: نظرة عامة" },
      { key: "theme_tab", label: "تبويب: المظهر والألوان" },
      { key: "sections_tab", label: "تبويب: الأقسام والعناصر" },
      { key: "shifts_tab", label: "تبويب: الورديات" },
      { key: "penalty_types_tab", label: "تبويب: أنواع الغرامات" },
      { key: "labels_tab", label: "تبويب: المسميات" },
      { key: "settings_tab", label: "تبويب: الإعدادات" },
      { key: "add", label: "زر: إضافة" },
      { key: "save", label: "زر: حفظ" },
      { key: "cancel", label: "زر: إلغاء" },
      { key: "edit", label: "زر: تعديل" },
      { key: "delete", label: "زر: حذف" },
      { key: "total", label: "الإجمالي" },
      { key: "amount", label: "المبلغ" },
      { key: "save_colors", label: "زر: حفظ الألوان" },
      { key: "reset_colors", label: "زر: استعادة الافتراضي" },
      { key: "save_labels", label: "زر: حفظ المسميات" },
      { key: "project_title_label", label: "عنوان: عنوان المشروع" },
      { key: "save_title", label: "زر: حفظ العنوان" },
      { key: "change_password", label: "عنوان: تغيير كلمة المرور" },
      { key: "current_password", label: "حقل: كلمة المرور الحالية" },
      { key: "new_password", label: "حقل: كلمة المرور الجديدة" },
      { key: "confirm_password", label: "حقل: تأكيد كلمة المرور" },
      { key: "change_password_btn", label: "زر: تغيير كلمة المرور" },
      { key: "logos_title", label: "عنوان: اللوجوهات" },
      { key: "logo_brand_label", label: "اللوجو: أعلى الصفحة" },
      { key: "logo_bg_label", label: "اللوجو: الخلفية" },
      { key: "logo_choose", label: "زر: اختيار صورة" },
      { key: "logo_upload", label: "زر: رفع" },
      { key: "logo_remove", label: "زر: إزالة" },
      { key: "logo_hint", label: "نص إرشادي: اللوجوهات" },
      { key: "back_home", label: "تلميح: زر العودة للرئيسية" },
    ],
  },
];
