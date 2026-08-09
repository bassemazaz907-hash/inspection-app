// ===== إعدادات الثيم والمسميات (مشاركة بين الموقع ولوحة التحكم) =====
const THEME_DEFAULTS = {
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

const THEME_DARK_DEFAULTS = {
  "--color-primary": "#3b82f6",
  "--color-secondary": "#38bdf8",
  "--color-header-bg": "#0b1220",
  "--color-header-text": "#f1f5f9",
  "--color-bg": "#0f172a",
  "--color-card": "#1e293b",
  "--color-card-border": "#334155",
  "--color-text": "#e2e8f0",
  "--color-text-muted": "#94a3b8",
  "--color-success": "#22c55e",
  "--color-danger": "#f87171",
  "--color-warning": "#fbbf24",
};

const THEME_COLOR_FIELDS = [
  { key: "--color-primary", label: "اللون الرئيسي", type: "color" },
  { key: "--color-secondary", label: "اللون الثانوي", type: "color" },
  { key: "--color-header-bg", label: "لون خلفية الشريط الجانبي", type: "color" },
  { key: "--color-header-text", label: "لون نص الشريط الجانبي", type: "color" },
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

const DEFAULT_LABELS = {
  title: "ELDGAGA APP",
  date_label: "التاريخ",
  section_label: "القسم",
  shift_label: "الوردية",
  item_label: "عنصر الفحص",
  report_label: "تقرير",
  penalty_label: "جزاء",
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
  penalties_label: "الجزاءات",
  add_penalty: "+ إضافة جزاء",
  no_sections: "لا توجد أقسام بعد — أضفها من لوحة التحكم",
  no_items_in_section: "لا توجد عناصر في هذا القسم",
  no_shifts: "لا توجد ورديات",
  no_penalty_types: "لا توجد أنواع جزاءات — أضفها من لوحة التحكم",
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
  col_penalty_total: "عدد الجزاءات",
  no_reports: "لا توجد تقارير مطابقة",
  report_details: "تفاصيل التقرير",
  notification_new: "تم إضافة تقرير جديد رقم {id}",
  login_title: "لوحة التحكم",
  login_password: "كلمة المرور",
  login_btn: "دخول",
  login_hint: "",
  logout_btn: "تسجيل الخروج",
  preview_site: "معاينة الموقع",
  overview: "نظرة عامة",
  theme_tab: "المظهر والألوان",
  sections_tab: "الأقسام والعناصر",
  shifts_tab: "الورديات",
  penalty_types_tab: "أنواع الجزاءات",
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
  stat_penalty_total: "عدد الجزاءات",
  stat_sections: "الأقسام",
  stat_shifts: "الورديات",
  stat_penalty_types: "أنواع الجزاءات",
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
  delete_penalty_confirm: 'حذف الجزاء "{name}"؟',
  reset_colors_confirm: "استعادة الألوان الافتراضية؟",
  welcome_admin: "لوحة التحكم —",
  items_label: "البنود",
  back_home: "الشاشة الرئيسية",
  logos_title: "اللوجوهات",
  logo_brand_label: "لوجو أعلى الصفحة (الزر)",
  logo_bg_label: "لوجو الخلفية",
  logo_icon_label: "أيقونة التطبيق (شاشة الهاتف)",
  logo_icon_hint: "تُستخدم أيقونة التطبيق بعد تثبيته على الهاتف — يُفضل صورة مربعة PNG بحجم 512×512. يرجى حذف التطبيق وإعادة تثبيته بعد تغيير الأيقونة حتى تُحدَّث على بعض الهواتف.",
  logo_choose: "اختر صورة",
  logo_upload: "رفع",
  logo_remove: "إزالة",
  logo_uploaded: "تم رفع اللوجو ✓",
  logo_removed: "تمت إزالة اللوجو",
  logo_remove_confirm: "إزالة هذا اللوجو؟",
  logo_hint: "اضغط على اللوجو أعلى الصفحة للعودة إلى الشاشة الرئيسية من أي مكان. لوجو الخلفية يظهر خلف محتوى الشاشة الرئيسية.",
  logo_choose_hint: "PNG أو JPG أو WebP — حتى 2 ميجا",
  required: "مطلوب",
  passwords_mismatch: "غير متطابقة",
  settings_updated: "تم تحديث الإعدادات",
  generic_error: "حدث خطأ",
  search_label: "بحث بالاسم",
  search_placeholder: "اكتب اسم الوردية أو رقم التقرير أو التاريخ...",
};

const DEFAULT_LABELS_EN = {
  title: "ELDGAGA APP",
  date_label: "Date",
  section_label: "Section",
  shift_label: "Shift",
  item_label: "Inspection Item",
  report_label: "Report",
  penalty_label: "Penalty",
  pass_label: "Pass",
  fail_label: "Fail",
  note_placeholder: "Note...",
  general_notes: "General Notes",
  notes_placeholder: "Notes on the report...",
  save_report: "Save Report",
  add: "Add",
  save: "Save",
  cancel: "Cancel",
  edit: "Edit",
  delete: "Delete",
  view: "View",
  total: "Total",
  amount: "Amount",
  name: "Name",
  nav_new: "New Report",
  nav_reports: "Reports",
  nav_admin: "Admin Panel",
  new_report: "New Inspection Report",
  penalties_label: "Penalties",
  add_penalty: "+ Add Penalty",
  no_sections: "No sections yet — add them from the admin panel",
  no_items_in_section: "No items in this section",
  no_shifts: "No shifts",
  no_penalty_types: "No penalty types — add them from the admin panel",
  reports_title: "Reports",
  from_date: "From Date",
  to_date: "To Date",
  all_shifts: "All Shifts",
  filter_btn: "Filter",
  col_number: "#",
  col_date: "Date",
  col_shift: "Shift",
  col_items: "Items",
  col_pass: "Pass",
  col_fail: "Fail",
  col_penalty_total: "Penalties",
  no_reports: "No matching reports",
  report_details: "Report Details",
  notification_new: "New report #{id} added",
  login_title: "Admin Panel",
  login_password: "Password",
  login_btn: "Login",
  login_hint: "",
  logout_btn: "Logout",
  preview_site: "View Site",
  overview: "Overview",
  theme_tab: "Appearance & Colors",
  sections_tab: "Sections & Items",
  shifts_tab: "Shifts",
  penalty_types_tab: "Penalty Types",
  labels_tab: "Labels",
  settings_tab: "Settings",
  add_section: "+ New Section",
  add_item: "+ Item",
  add_shift: "+ New Shift",
  add_penalty_type: "+ New Type",
  theme_title: "Site Colors",
  theme_desc: "Change any color and it will apply immediately. Press save to keep changes.",
  save_colors: "Save Colors",
  reset_colors: "Reset to Default",
  labels_title: "App Labels",
  labels_desc: "Change any text in the app — buttons, sections, statuses and more.",
  save_labels: "Save Labels",
  project_title_label: "Project Title",
  project_title_placeholder: "Title shown at the top of the site",
  save_title: "Save Title",
  change_password: "Change Password",
  current_password: "Current Password",
  new_password: "New Password",
  confirm_password: "Confirm Password",
  change_password_btn: "Change Password",
  stat_total_reports: "Total Reports",
  stat_today_reports: "Today's Reports",
  stat_failed_items: "Failed Items",
  stat_penalty_total: "Penalties",
  stat_sections: "Sections",
  stat_shifts: "Shifts",
  stat_penalty_types: "Penalty Types",
  latest_reports: "Latest Reports",
  live_status: "Live connection",
  section_name_placeholder: "Example: Production Equipment",
  item_name_placeholder: "Example: Cover Safety",
  shift_name_placeholder: "Example: Morning Shift",
  penalty_type_name_placeholder: "Example: Late Violation",
  delete_report_confirm: "Delete report #{id} permanently?",
  delete_section_confirm: 'Delete section "{name}" and all its items?',
  delete_item_confirm: 'Delete item "{name}"?',
  delete_shift_confirm: 'Delete shift "{name}"?',
  delete_penalty_confirm: 'Delete penalty "{name}"?',
  reset_colors_confirm: "Reset colors to default?",
  welcome_admin: "Admin Panel —",
  items_label: "Items",
  back_home: "Home",
  logos_title: "Logos",
  logo_brand_label: "Top bar logo (button)",
  logo_bg_label: "Background logo",
  logo_icon_label: "App icon (phone screen)",
  logo_icon_hint: "Used as the app icon after installation — prefer a square PNG 512×512. Delete and reinstall the app after changing the icon so it updates on some phones.",
  logo_choose: "Choose Image",
  logo_upload: "Upload",
  logo_remove: "Remove",
  logo_uploaded: "Logo uploaded ✓",
  logo_removed: "Logo removed",
  logo_remove_confirm: "Remove this logo?",
  logo_hint: "Tap the top logo to return home from anywhere. The background logo appears behind the home screen content.",
  logo_choose_hint: "PNG or JPG or WebP — up to 2 MB",
  required: "required",
  passwords_mismatch: "do not match",
  settings_updated: "Settings updated",
  generic_error: "An error occurred",
  search_label: "Search by name",
  search_placeholder: "Type shift name, report number or date...",
};

const LABEL_FIELDS = [
  {
    group: "معلومات أساسية",
    fields: [
      { key: "title", label: "عنوان المشروع" },
      { key: "report_label", label: "التقرير" },
      { key: "shift_label", label: "الوردية" },
      { key: "section_label", label: "القسم" },
      { key: "item_label", label: "عنصر الفحص" },
      { key: "penalty_label", label: "الجزاء" },
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
      { key: "general_notes", label: "الحقل: ملاحظات عامة" },
      { key: "penalties_label", label: "قسم: الجزاءات" },
      { key: "add_penalty", label: "زر: إضافة جزاء" },
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
      { key: "col_penalty_total", label: "العمود: عدد الجزاءات" },
    ],
  },
  {
    group: "الإشعارات",
    fields: [{ key: "notification_new", label: "نص الإشعار (ضع {id} مكان رقم التقرير)" }],
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
      { key: "penalty_types_tab", label: "تبويب: أنواع الجزاءات" },
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
      { key: "logo_icon_label", label: "اللوجو: أيقونة التطبيق" },
      { key: "logo_icon_hint", label: "نص إرشادي: أيقونة التطبيق" },
      { key: "logo_choose", label: "زر: اختيار صورة" },
      { key: "logo_upload", label: "زر: رفع" },
      { key: "logo_remove", label: "زر: إزالة" },
      { key: "logo_hint", label: "نص إرشادي: اللوجوهات" },
      { key: "back_home", label: "تلميح: زر العودة للرئيسية" },
    ],
  },
];

let L = { ...DEFAULT_LABELS };

// ===== اللغة =====
let langMode = "ar";
try {
  langMode = localStorage.getItem("lang_mode") === "en" ? "en" : "ar";
} catch (e) {}

let lastServerLabels = null;

function getLangMode() {
  return langMode;
}

function setLangMode(mode) {
  langMode = mode === "en" ? "en" : "ar";
  try {
    localStorage.setItem("lang_mode", langMode);
  } catch (e) {}
  applyLabels(lastServerLabels);
  document.documentElement.lang = langMode === "en" ? "en" : "ar";
  document.documentElement.dir = langMode === "en" ? "ltr" : "rtl";
  updateLangBtn();
  if (typeof refreshDynamicContent === "function") {
    try { refreshDynamicContent(); } catch (e) {}
  }
}

function toggleLang() {
  setLangMode(langMode === "en" ? "ar" : "en");
}

function updateLangBtn() {
  const btns = document.querySelectorAll("#langToggle, #langToggleLogin");
  btns.forEach((btn) => {
    btn.textContent = langMode === "en" ? "ع" : "EN";
    btn.title = langMode === "en" ? "العربية" : "English";
  });
}

function getLocaleStr() {
  return langMode === "en" ? "en-GB" : "ar-EG";
}

// ===== اللوجوهات =====
const DEFAULT_LOGOS = { brand: "", bg: "", icon: "" };
let LOGOS = { ...DEFAULT_LOGOS };

// ===== قائمة الأيقونات الجاهزة للعناصر (المشتقات) =====
const ITEM_ICONS = [
  "⚙️", "🔧", "🛠️", "🔩", "⚡", "🔋", "💡", "🔌",
  "🚿", "💧", "🛢️", "🔥", "🌡️", "🧯", "🧰", "🪛",
  "🚗", "🚚", "🚜", "🏗️", "🏭", "🧱", "🪵", "🪚",
  "🧪", "🧫", "🩺", "💉", "🧯", "🦺", "⛑️", "👷",
  "📦", "📋", "🖊️", "📄", "🖥️", "⌨️", "🖨️", "📞",
  "🚪", "🪟", "🔦", "🔑", "🔒", "🚦", "🪫", "🧲",
];

function applyLogos(logos) {
  LOGOS = { ...DEFAULT_LOGOS, ...(logos || {}) };

  const applyBrand = (imgId, iconId) => {
    const img = document.getElementById(imgId);
    const icon = document.getElementById(iconId);
    if (!img) return;
    if (LOGOS.brand) {
      img.src = LOGOS.brand;
      img.style.display = "block";
      if (icon) icon.style.display = "none";
    } else {
      img.style.display = "none";
      if (icon) icon.style.display = "flex";
    }
  };
  applyBrand("brandLogoAppBar", "brandIconAppBar");
  applyBrand("brandLogoImgSide", "brandIconSide");
  applyBrand("brandLogoImgSide", "brandIconDefault");

  const bg = document.getElementById("bgLogo");
  if (bg) {
    if (LOGOS.bg) {
      bg.style.backgroundImage = `url("${LOGOS.bg}")`;
      bg.style.display = "block";
    } else {
      bg.style.backgroundImage = "none";
      bg.style.display = "none";
    }
  }

  const favicon = document.querySelector('link[rel="icon"]');
  const appleTouch = document.querySelector('link[rel="apple-touch-icon"]');
  if (favicon) favicon.href = "/app-icon.png";
  if (appleTouch) appleTouch.href = "/app-icon.png";

  const splashLogo = document.getElementById("splashLogo");
  if (splashLogo) {
    if (LOGOS.brand) {
      splashLogo.innerHTML = "";
      const img = document.createElement("img");
      img.src = LOGOS.brand;
      img.alt = "";
      splashLogo.appendChild(img);
    } else if (LOGOS.icon) {
      splashLogo.innerHTML = "";
      const img = document.createElement("img");
      img.src = LOGOS.icon;
      img.alt = "";
      splashLogo.appendChild(img);
    } else {
      splashLogo.innerHTML = "✓";
    }
  }
}

// ===== الوضع الليلي =====
let customTheme = {};
let themeMode = localStorage.getItem("theme_mode");
if (!themeMode) {
  try {
    themeMode = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch (e) {
    themeMode = "light";
  }
}

function getThemeMode() {
  return themeMode;
}

function getThemeBase() {
  return themeMode === "dark" ? THEME_DARK_DEFAULTS : THEME_DEFAULTS;
}

function renderTheme() {
  const root = document.documentElement;
  document.documentElement.dataset.theme = themeMode;
  if (themeMode === "dark") {
    for (const key of Object.keys(THEME_DEFAULTS)) root.style.removeProperty(key);
  } else {
    const merged = { ...THEME_DEFAULTS, ...customTheme };
    for (const [key, value] of Object.entries(merged)) root.style.setProperty(key, value);
  }
  updateThemeBtn();
}

function applyTheme(theme) {
  customTheme = {};
  for (const [key, value] of Object.entries(theme || {})) {
    if (Object.prototype.hasOwnProperty.call(THEME_DEFAULTS, key) && typeof value === "string") {
      customTheme[key] = value;
    }
  }
  renderTheme();
}

function setThemeMode(mode) {
  themeMode = mode === "dark" ? "dark" : "light";
  try {
    localStorage.setItem("theme_mode", themeMode);
  } catch (e) {}
  renderTheme();
}

function toggleTheme() {
  setThemeMode(themeMode === "dark" ? "light" : "dark");
}

function updateThemeBtn() {
  const btn = document.getElementById("themeToggle");
  if (btn) btn.textContent = themeMode === "dark" ? "☀️" : "🌙";
}

document.addEventListener("DOMContentLoaded", () => {
  updateThemeBtn();
  const btn = document.getElementById("themeToggle");
  if (btn) btn.addEventListener("click", toggleTheme);
  document.documentElement.lang = langMode === "en" ? "en" : "ar";
  document.documentElement.dir = langMode === "en" ? "ltr" : "rtl";
  updateLangBtn();
  document.querySelectorAll("#langToggle, #langToggleLogin").forEach((btn) => {
    btn.addEventListener("click", toggleLang);
  });
});

function translateServerLabels(labels) {
  const out = {};
  for (const [key, value] of Object.entries(labels || {})) {
    if (!value) continue;
    if (DEFAULT_LABELS[key] !== undefined && value === DEFAULT_LABELS[key] && DEFAULT_LABELS_EN[key]) {
      out[key] = DEFAULT_LABELS_EN[key];
    } else {
      out[key] = value;
    }
  }
  return out;
}

function applyLabels(labels) {
  lastServerLabels = labels;
  const base = langMode === "en" ? DEFAULT_LABELS_EN : DEFAULT_LABELS;
  const custom = langMode === "ar" ? (labels || {}) : translateServerLabels(labels);
  L = { ...base, ...custom };
  document.querySelectorAll("[data-label]").forEach((el) => {
    const key = el.getAttribute("data-label");
    if (key && L[key]) el.textContent = L[key];
  });
  document.querySelectorAll("[data-label-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-label-placeholder");
    if (key && L[key]) el.placeholder = L[key];
  });
  document.querySelectorAll("[data-label-title]").forEach((el) => {
    const key = el.getAttribute("data-label-title");
    if (key && L[key]) {
      el.title = L[key];
      el.setAttribute("aria-label", L[key]);
    }
  });
  if (L.title) document.title = L.title;
}

function playBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const play = () => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.setValueAtTime(740, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.18);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
      o.start();
      o.stop(ctx.currentTime + 0.55);
    };
    play();
  } catch (e) {}
}
