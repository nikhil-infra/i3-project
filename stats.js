// stats.js — Personal stats page

const ACHIEVEMENTS = [
  { id:'first_game',   icon:'🎮', name:'First Game!',   desc:'Play your first game', req: s => s.gamesPlayed >= 1 },
  { id:'score_500',    icon:'💫', name:'Half-Kilo',     desc:'Score 500+ in one game', req: s => s.bestScore >= 500 },
  { id:'score_1000',   icon:'⭐', name:'Thousand Club', desc:'Score 1,000+ in one game', req: s => s.bestScore >= 1000 },
  { id:'score_5000',   icon:'🌟', name:'Star Player',   desc:'Score 5,000+ in one game', req: s => s.bestScore >= 5000 },
  { id:'streak_5',     icon:'🔥', name:'On Fire!',      desc:'Get a 5x streak', req: s => s.bestStreak >= 5 },
  { id:'streak_10',    icon:'💥', name:'Unstoppable!',  desc:'Get a 10x streak', req: s => s.bestStreak >= 10 },
  { id:'accuracy_90',  icon:'🎯', name:'Sharpshooter',  desc:'90%+ accuracy in a game', req: s => s.bestAccuracy >= 90 },
  { id:'games_10',     icon:'👑', name:'Veteran',       desc:'Play 10 games', req: s => s.gamesPlayed >= 10 },
];

document.addEventListener('DOMContentLoaded', () => {
  const user = Auth.getUser();
  const notLoggedIn = document.getElementById('notLoggedIn');
  const statsContent = document.getElementById('statsContent');

  if (!user) {
    notLoggedIn.style.display = 'block';
    statsContent.style.display = 'none';
    return;
  }

  // Load data
  const scores = ScoreDB.getAll();

  // Compute aggregates
  const gamesPlayed = scores.length;
  const bestScore = scores.reduce((m, s) => Math.max(m, s.score || 0), 0);
  const totalScore = scores.reduce((t, s) => t + (s.score || 0), 0);
  const bestStreak = scores.reduce((m, s) => Math.max(m, s.streak || 0), 0);
  const totalCorrect = scores.reduce((t, s) => t + (s.correct || 0), 0);
  const totalWrong = scores.reduce((t, s) => t + (s.wrong || 0), 0);
  const avgAccuracy = totalCorrect + totalWrong > 0
    ? Math.round(totalCorrect / (totalCorrect + totalWrong) * 100) : 0;
  const bestAccuracy = scores.reduce((m, s) => {
    const t = (s.correct || 0) + (s.wrong || 0);
    return t > 0 ? Math.max(m, Math.round(s.correct / t * 100)) : m;
  }, 0);

  const aggStats = { gamesPlayed, bestScore, bestStreak, bestAccuracy };

  // === PROFILE ===
  document.getElementById('profileAvatar').textContent = user.avatar || '🎮';
  document.getElementById('profileName').textContent = user.name;
  document.getElementById('profileEmail').textContent = user.email;
  document.getElementById('profileRank').textContent = gamesPlayed > 0
    ? `#${Math.max(1, Math.floor(1000 - bestScore / 10) + 10)}` : '#—';

  // Badges on profile
  const badgesEl = document.getElementById('profileBadges');
  if (gamesPlayed > 0) badgesEl.innerHTML += '<span class="badge badge-cyan">Active Player</span>';
  if (bestScore >= 1000) badgesEl.innerHTML += '<span class="badge badge-purple">Elite</span>';
  if (bestStreak >= 10) badgesEl.innerHTML += '<span class="badge badge-orange">Streak King</span>';

  // === KEY STATS ===
  animateStatCard('statBestScore', formatNumber(bestScore));
  animateStatCard('statGamesPlayed', gamesPlayed);
  animateStatCard('statAccuracy', avgAccuracy + '%');
  animateStatCard('statBestStreak', '🔥 ' + bestStreak);
  animateStatCard('statCorrect', formatNumber(totalCorrect));
  animateStatCard('statTotalScore', formatNumber(totalScore));

  // === CHART ===
  renderChart(scores.slice(0, 10).reverse());

  // === ACHIEVEMENTS ===
  renderAchievements(aggStats);

  // === HISTORY ===
  renderHistory(scores);
});

function animateStatCard(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.style.animation = 'none';
    requestAnimationFrame(() => {
      el.style.animation = 'countUp 0.5s ease';
      el.textContent = val;
    });
  }
}

function renderChart(scores) {
  const chart = document.getElementById('scoreChart');
  if (!chart || scores.length === 0) {
    chart.innerHTML = '<div style="margin:auto;color:var(--text-muted);font-size:0.85rem;">Play some games to see your chart!</div>';
    return;
  }

  const max = Math.max(...scores.map(s => s.score || 0), 1);

  scores.forEach((s, i) => {
    const pct = ((s.score || 0) / max) * 120;
    const date = new Date(s.timestamp || Date.now()).toLocaleDateString('en', { month:'short', day:'numeric' });
    const modeIcon = s.mode?.includes('Speed') ? '⚡' : s.mode?.includes('Survival') ? '❤️' : s.mode?.includes('Daily') ? '🏆' : '📚';

    const wrap = document.createElement('div');
    wrap.className = 'chart-bar-wrap';
    wrap.innerHTML = `
      <div class="chart-bar" style="height:${Math.max(pct, 8)}px" data-score="${formatNumber(s.score || 0)}" title="${modeIcon} ${formatNumber(s.score || 0)} pts"></div>
      <div class="chart-label">${date}</div>
    `;
    chart.appendChild(wrap);
  });
}

function renderAchievements(stats) {
  const grid = document.getElementById('achievementsGrid');
  if (!grid) return;

  ACHIEVEMENTS.forEach(ach => {
    const unlocked = ach.req(stats);
    const card = document.createElement('div');
    card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
    card.innerHTML = `
      <div class="achievement-icon">${unlocked ? ach.icon : '🔒'}</div>
      <div class="achievement-name">${ach.name}</div>
      <div class="achievement-desc">${ach.desc}</div>
    `;
    grid.appendChild(card);
  });
}

function renderHistory(scores) {
  const list = document.getElementById('historyList');
  if (!list) return;

  if (scores.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🎮</div>
        <h3>No games yet!</h3>
        <p>Play your first game to see your history here.</p>
      </div>
    `;
    return;
  }

  const modeIcons = { 'Speed Round': '⚡', 'Survival Mode': '❤️', 'Daily Challenge': '🏆', 'Practice Mode': '📚' };

  scores.slice(0, 15).forEach((s, i) => {
    const accuracy = (s.correct || 0) + (s.wrong || 0) > 0
      ? Math.round((s.correct || 0) / ((s.correct || 0) + (s.wrong || 0)) * 100) : 0;
    const date = new Date(s.timestamp || Date.now()).toLocaleDateString('en', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
    const icon = modeIcons[s.mode] || '🎮';

    const row = document.createElement('div');
    row.className = 'history-row';
    row.style.animationDelay = `${i * 0.05}s`;
    row.innerHTML = `
      <div class="history-mode-icon">${icon}</div>
      <div class="history-info">
        <div class="history-mode">${s.mode || 'Quick Game'}</div>
        <div class="history-meta">🔥 Streak: ${s.streak || 0} · ${s.difficulty || 'easy'} · ${date}</div>
      </div>
      <div>
        <div class="history-score">${formatNumber(s.score || 0)}</div>
        <div class="history-accuracy">${accuracy}% acc</div>
      </div>
    `;
    list.appendChild(row);
  });
}
