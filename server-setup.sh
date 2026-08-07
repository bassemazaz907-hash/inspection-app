#!/usr/bin/env bash
set -e

# تهيئة سيرفر Oracle Cloud المجاني (Ubuntu)
echo "==> تحديث الحزم..."
sudo apt-get update -y

if command -v docker >/dev/null 2>&1; then
  echo "Docker مثبت بالفعل"
else
  echo "==> تثبيت Docker..."
  curl -fsSL https://get.docker.com | sh
  sudo systemctl enable --now docker
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "==> تثبيت Docker Compose plugin..."
  sudo apt-get install -y docker-compose-plugin
fi

sudo usermod -aG docker "$USER"

echo "==> تم! أعد تسجيل الدخول (logout/login) ثم نفّذ ./deploy.sh"
