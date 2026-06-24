/**
 * Utility functions
 */

function uid() {
  return 'e' + Date.now() + Math.random().toString(36).slice(2, 7);
}

function avatarInitials(name) {
  return name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function getCategoryIcon(category) {
  const icons = {
    'bränsle': '⛽',
    'underhall': '🔧',
    'hamn': '⚓',
    'försäkring': '📋',
    'utrustning': '🧰',
    'mat': '🍱',
    'ovrigt': '📦'
  };
  return icons[category] || '📦';
}

function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.textContent = msg;
  container.appendChild(t);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      t.classList.add('show');
    });
  });
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
}
