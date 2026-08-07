#!/usr/bin/env bash
set -e

echo "==> 1) التحقق من Docker"
if ! command -v docker >/dev/null 2>&1; then
  echo "Docker غير مثبت. شغّل أولًا:"
  echo "  curl -fsSL https://get.docker.com | sh"
  echo "  sudo usermod -aG docker $USER"
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose غير مثبت."
  exit 1
fi

echo "==> 2) إنشاء ملف .env"
if [ ! -f .env ]; then
  cp .env.deploy.example .env
  echo "تم إنشاء .env — افتحه وعدّل SITE_ADDR و ADMIN_PASSWORD قبل المتابعة."
  exit 1
fi

echo "==> 3) تشغيل التطبيق (البناء قد يستغرق دقائق)"
docker compose up -d --build

echo "==> 4) الحالة"
docker compose ps

echo ""
echo "تم! التطبيق على:"
grep '^SITE_ADDR' .env | cut -d= -f2
echo "لوحة التحكم: نفس الرابط + /admin.html"
