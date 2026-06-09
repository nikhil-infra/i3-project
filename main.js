// main.js — Shared utilities, navbar, toast, auth state

// === NAVBAR SCROLL ===
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// === MOBILE MENU ===
function toggleMenu() {
  const navLinks = document.getElementById('navLinks');
  if (navLinks) navLinks.classList.toggle('open');
}

// === TOAST NOTIFICATIONS ===
function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span>${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// === AUTH STATE ===
const Auth = {
  getUser() {
    try { return JSON.parse(localStorage.getItem('mb_user')); }
    catch { return null; }
  },
  setUser(user) { localStorage.setItem('mb_user', JSON.stringify(user)); },
  logout() {
    localStorage.removeItem('mb_user');
    window.location.href = 'index.html';
  },
  isLoggedIn() { return !!this.getUser(); }
};

// === UPDATE NAV BASED ON AUTH ===
function updateNavAuth() {
  const user = Auth.getUser();
  const loginBtn = document.getElementById('loginBtn');
  const registerBtn = document.getElementById('registerBtn');

  if (user && loginBtn && registerBtn) {
    loginBtn.textContent = user.name?.split(' ')[0] || 'Profile';
    loginBtn.href = 'stats.html';
    loginBtn.style.color = 'var(--cyan)';
    registerBtn.textContent = 'Logout';
    registerBtn.className = 'btn btn-secondary btn-sm';
    registerBtn.href = '#';
    registerBtn.onclick = (e) => { e.preventDefault(); Auth.logout(); };
  }
}
updateNavAuth();

// === SET ACTIVE NAV LINK ===
function setActiveNav() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', href === currentPage || (currentPage === '' && href === 'index.html'));
  });
}
setActiveNav();

// === ANIMATE ON SCROLL (Intersection Observer) ===
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-fadeInUp').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// === NUMBER COUNTER ANIMATION ===
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'));
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;

  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString();
    if (current >= target) clearInterval(timer);
  }, 16);
}

// Observe stat counters
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.animated) {
      entry.target.dataset.animated = '1';
      animateCounter(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

// === MODAL HELPERS ===
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.style.display = 'none';
  });
});

// === UTILS ===
function formatNumber(n) { return Number(n).toLocaleString(); }
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// === LOCAL SCORES STORAGE ===
const ScoreDB = {
  getAll() {
    try { return JSON.parse(localStorage.getItem('mb_scores')) || []; }
    catch { return []; }
  },
  add(entry) {
    const scores = this.getAll();
    scores.unshift({ ...entry, id: Date.now(), timestamp: new Date().toISOString() });
    localStorage.setItem('mb_scores', JSON.stringify(scores.slice(0, 100)));
  },
  getBest() {
    const scores = this.getAll();
    if (!scores.length) return null;
    return scores.reduce((best, s) => s.score > best.score ? s : best, scores[0]);
  }
};

// === MOCK LEADERBOARD DATA ===
const mockLeaderboard = [
  { rank: 1, name: 'AlphaQuant', score: 9850, mode: 'Speed Round', emoji: '🔥' },
  { rank: 2, name: 'NeonMath', score: 9420, mode: 'Survival', emoji: '⚡' },
  { rank: 3, name: 'CloudNine', score: 8900, mode: 'Daily Challenge', emoji: '🌟' },
  { rank: 4, name: 'BlazeKing', score: 8750, mode: 'Speed Round', emoji: '👑' },
  { rank: 5, name: 'QuizMaster', score: 8200, mode: 'Survival', emoji: '🎯' },
];
