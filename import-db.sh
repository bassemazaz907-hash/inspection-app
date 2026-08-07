#!/usr/bin/env bash
set -e

# استيراد البيانات من ملف db-export.sql (منسوخ من جهازك) إلى قاعدة بيانات السيرفر
# الاستخدام: ضع الملف db-export.sql بجانب هذا السكربت ثم نفّذه
if [ ! -f db-export.sql ]; then
  echo "ملف db-export.sql غير موجود — انسخه أولًا من جهازك"
  exit 1
fi

echo "==> استيراد البيانات..."
docker compose exec -T db mysql -u inspection -pinspection123 < db-export.sql

echo "==> تم الاستيراد. إعادة تشغيل التطبيق..."
docker compose restart app

echo "تم!"
