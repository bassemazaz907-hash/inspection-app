// ===== PWA: تسجيل الخدمة + زر التثبيت =====
let deferredPrompt = null;

function showInstallBtn() {
  const btn = document.getElementById("installBtn");
  if (btn) btn.style.display = "inline-flex";
}

function hideInstallBtn() {
  const btn = document.getElementById("installBtn");
  if (btn) btn.style.display = "none";
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBtn();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  hideInstallBtn();
});

async function installApp() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice;
  deferredPrompt = null;
  hideInstallBtn();
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("installBtn");
  if (btn) btn.addEventListener("click", installApp);
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
