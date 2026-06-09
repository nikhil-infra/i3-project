// auth.js — Authentication logic (local mock → AWS Cognito ready)

// === TAB SWITCHING ===
function switchTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const tabLogin = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const slider = document.getElementById('tabSlider');

  if (tab === 'login') {
    loginForm?.classList.remove('hidden');
    registerForm?.classList.add('hidden');
    tabLogin?.classList.add('active');
    tabRegister?.classList.remove('active');
    if (slider) slider.className = 'auth-tab-slider login-active';
  } else {
    registerForm?.classList.remove('hidden');
    loginForm?.classList.add('hidden');
    tabRegister?.classList.add('active');
    tabLogin?.classList.remove('active');
    if (slider) slider.className = 'auth-tab-slider register-active';
  }
}

// Check URL param for initial tab
const urlTab = new URLSearchParams(window.location.search).get('tab') || 'register';
switchTab(urlTab);

// If already logged in, redirect
if (Auth.isLoggedIn()) {
  showToast('You are already logged in!', 'info');
  setTimeout(() => { window.location.href = 'stats.html'; }, 1500);
}

// === PASSWORD TOGGLE ===
function togglePw(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  input.type = input.type === 'password' ? 'text' : 'password';
  btn.textContent = input.type === 'password' ? '👁' : '🙈';
}

// === PASSWORD STRENGTH ===
document.getElementById('regPassword')?.addEventListener('input', function() {
  const val = this.value;
  const fill = document.getElementById('pwStrengthFill');
  const label = document.getElementById('pwStrengthLabel');
  if (!fill || !label) return;

  let strength = 0;
  if (val.length >= 8) strength++;
  if (/[A-Z]/.test(val)) strength++;
  if (/[0-9]/.test(val)) strength++;
  if (/[^A-Za-z0-9]/.test(val)) strength++;

  const levels = [
    { pct: '25%', color: '#ff3d9a', text: 'Weak' },
    { pct: '50%', color: '#ff6b35', text: 'Fair' },
    { pct: '75%', color: '#ffd700', text: 'Good' },
    { pct: '100%', color: '#10d98b', text: 'Strong 💪' },
  ];

  const level = levels[Math.max(0, strength - 1)] || levels[0];
  fill.style.width = val.length === 0 ? '0%' : level.pct;
  fill.style.background = level.color;
  label.textContent = val.length === 0 ? '' : level.text;
  label.style.color = level.color;
});

// === REGISTER ===
async function handleRegister(e) {
  e.preventDefault();

  const name = document.getElementById('regName')?.value.trim();
  const email = document.getElementById('regEmail')?.value.trim();
  const password = document.getElementById('regPassword')?.value;
  const confirm = document.getElementById('regConfirm')?.value;
  const agree = document.getElementById('agreeTerms')?.checked;

  // Validation
  if (!name || name.length < 2) {
    showToast('Please enter your name (min 2 chars)', 'error'); return;
  }
  if (!email || !/\S+@\S+\.\S+/.test(email)) {
    showToast('Please enter a valid email address', 'error'); return;
  }
  if (!password || password.length < 8) {
    showToast('Password must be at least 8 characters', 'error'); return;
  }
  if (password !== confirm) {
    showToast('Passwords do not match!', 'error');
    document.getElementById('regConfirm')?.classList.add('error');
    return;
  }
  if (!agree) {
    showToast('Please agree to the Terms of Service', 'error'); return;
  }

  // Loading state
  setLoading('register', true);

  // Simulate AWS Cognito call (replace with actual Cognito SDK later)
  await simulateAPICall(1200);

  // Check if email already exists (local simulation)
  const existing = JSON.parse(localStorage.getItem('mb_users') || '[]');
  if (existing.find(u => u.email === email)) {
    setLoading('register', false);
    showToast('An account with this email already exists!', 'error');
    return;
  }

  // Save user
  const newUser = {
    id: 'usr_' + Date.now(),
    name,
    email,
    joinDate: new Date().toISOString(),
    avatar: getRandomEmoji(),
  };

  existing.push({ ...newUser, password: btoa(password) }); // basic encoding for demo
  localStorage.setItem('mb_users', JSON.stringify(existing));
  Auth.setUser(newUser);

  setLoading('register', false);
  showToast(`Welcome to MathBlast, ${name}! 🎉`, 'success');

  setTimeout(() => { window.location.href = 'game.html'; }, 1200);
}

// === LOGIN ===
async function handleLogin(e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail')?.value.trim();
  const password = document.getElementById('loginPassword')?.value;

  if (!email || !password) {
    showToast('Please fill in all fields', 'error'); return;
  }

  setLoading('login', true);
  await simulateAPICall(1000);

  // Check local users
  const users = JSON.parse(localStorage.getItem('mb_users') || '[]');
  const user = users.find(u => u.email === email && u.password === btoa(password));

  if (!user) {
    setLoading('login', false);
    showToast('Invalid email or password', 'error');
    return;
  }

  Auth.setUser({ id: user.id, name: user.name, email: user.email, avatar: user.avatar });
  setLoading('login', false);
  showToast(`Welcome back, ${user.name}! 🎮`, 'success');
  setTimeout(() => { window.location.href = 'stats.html'; }, 1200);
}

// === HELPERS ===
function setLoading(type, loading) {
  if (type === 'register') {
    const btn = document.getElementById('registerSubmitBtn');
    const text = document.getElementById('regBtnText');
    const spinner = document.getElementById('regSpinner');
    if (btn) btn.disabled = loading;
    if (text) text.textContent = loading ? 'Creating Account...' : '🚀 Create Account';
    if (spinner) spinner.classList.toggle('hidden', !loading);
  } else {
    const btn = document.getElementById('loginSubmitBtn');
    const text = document.getElementById('loginBtnText');
    const spinner = document.getElementById('loginSpinner');
    if (btn) btn.disabled = loading;
    if (text) text.textContent = loading ? 'Logging in...' : 'Login to MathBlast';
    if (spinner) spinner.classList.toggle('hidden', !loading);
  }
}

function simulateAPICall(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getRandomEmoji() {
  const emojis = ['🎯', '⚡', '🔥', '🌟', '🎮', '🏆', '🧠', '💎', '🚀', '🌊'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// === CONFIRM PASSWORD REALTIME ===
document.getElementById('regConfirm')?.addEventListener('input', function() {
  const pw = document.getElementById('regPassword')?.value;
  const error = document.getElementById('confirmError');
  if (this.value && this.value !== pw) {
    this.classList.add('error');
    if (error) error.style.display = 'block';
  } else {
    this.classList.remove('error');
    if (error) error.style.display = 'none';
  }
});
