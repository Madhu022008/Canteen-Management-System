function selectTab(key) {
  document.querySelectorAll('.tab').forEach(btn => {
    const active = btn.dataset.tab === key;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', String(active));
  });
  document.querySelectorAll('.tab-content').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(key);
  if (el) el.classList.add('active');
}

function initTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => selectTab(btn.dataset.tab));
  });
}

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

function initYear() {
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
}

function initAnchorCloseOnNav() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const navToggle = document.getElementById('nav-toggle');
  navLinks.forEach(a => a.addEventListener('click', () => {
    if (navToggle) navToggle.checked = false;
  }));
}

window.showToast = showToast;
window.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initYear();
  initAnchorCloseOnNav();
});
