// leaderboard.js — Leaderboard page logic

const LEADERBOARD_DATA = [
  { rank:1, name:'AlphaQuant',  score:12850, mode:'Speed Round',     streak:18, accuracy:97, emoji:'🔥', country:'🇮🇳' },
  { rank:2, name:'NeonMath',    score:11420, mode:'Survival Mode',   streak:22, accuracy:94, emoji:'⚡', country:'🇺🇸' },
  { rank:3, name:'CloudNine',   score:10900, mode:'Daily Challenge', streak:15, accuracy:91, emoji:'🌟', country:'🇬🇧' },
  { rank:4, name:'BlazeKing',   score:9750,  mode:'Speed Round',     streak:12, accuracy:88, emoji:'👑', country:'🇩🇪' },
  { rank:5, name:'QuizMaster',  score:9200,  mode:'Survival Mode',   streak:10, accuracy:85, emoji:'🎯', country:'🇯🇵' },
  { rank:6, name:'MathWizard',  score:8700,  mode:'Speed Round',     streak:8,  accuracy:83, emoji:'🧙', country:'🇨🇦' },
  { rank:7, name:'QuantumBrain',score:8100,  mode:'Daily Challenge', streak:7,  accuracy:80, emoji:'🧠', country:'🇦🇺' },
  { rank:8, name:'SwiftCalc',   score:7600,  mode:'Speed Round',     streak:6,  accuracy:79, emoji:'⚡', country:'🇫🇷' },
  { rank:9, name:'InfiniteIQ',  score:7100,  mode:'Survival Mode',   streak:5,  accuracy:76, emoji:'♾️', country:'🇧🇷' },
  { rank:10,name:'NumberNinja', score:6500,  mode:'Speed Round',     streak:4,  accuracy:74, emoji:'🥷', country:'🇰🇷' },
  { rank:11,name:'PiCalc',      score:6000,  mode:'Daily Challenge', streak:3,  accuracy:72, emoji:'🥧', country:'🇮🇹' },
  { rank:12,name:'StellarMath', score:5500,  mode:'Speed Round',     streak:4,  accuracy:71, emoji:'⭐', country:'🇪🇸' },
];

const modeMap = {
  speed: 'Speed Round',
  survival: 'Survival Mode',
  challenge: 'Daily Challenge',
  practice: 'Practice Mode',
};

let currentFilter = 'all';
let currentPeriod = 'week';

document.addEventListener('DOMContentLoaded', () => {
  renderPodium(LEADERBOARD_DATA.slice(0, 3));
  renderTable(LEADERBOARD_DATA);
  checkUserRank();

  // Set refresh time
  document.getElementById('lastRefresh').textContent =
    'Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

// === FILTERS ===
document.querySelectorAll('.lb-filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const filterGroup = btn.closest('.lb-filter-group');
    filterGroup.querySelectorAll('.lb-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (btn.dataset.filter !== undefined) {
      currentFilter = btn.dataset.filter;
    } else if (btn.dataset.period !== undefined) {
      currentPeriod = btn.dataset.period;
    }
    applyFilters();
  });
});

function applyFilters() {
  let filtered = [...LEADERBOARD_DATA];

  if (currentFilter !== 'all') {
    const modeLabel = modeMap[currentFilter];
    filtered = filtered.filter(p => p.mode === modeLabel);
  }

  try {
    const response = await fetch(`${AWS_CONFIG.apiUrl}/leaderboard`);
    const data = await response.json();
    filtered = data.scores || [];
  } catch (error) {
    console.error('Failed to fetch leaderboard from AWS:', error);
  }

  // Simulate period by multiplying/adjusting scores
  if (currentPeriod === 'all') {
    filtered = filtered.map(p => ({ ...p, score: p.score + Math.floor(Math.random() * 5000) }));
    filtered.sort((a, b) => b.score - a.score).forEach((p, i) => p.rank = i + 1);
  } else if (currentPeriod === 'month') {
    filtered = filtered.map(p => ({ ...p, score: Math.floor(p.score * 1.5) }));
  }

  // Merge with user score
  const user = Auth.getUser();
  const best = ScoreDB.getBest();
  if (user && best && (currentFilter === 'all' || modeMap[currentFilter] === best.mode)) {
    const userEntry = {
      rank: 999,
      name: user.name || 'You',
      score: best.score,
      mode: best.mode,
      streak: best.streak || 0,
      accuracy: best.correct ? Math.round(best.correct / (best.correct + best.wrong || 1) * 100) : 0,
      emoji: '🎮',
      country: '🌍',
      isYou: true,
    };
    filtered.push(userEntry);
    filtered.sort((a, b) => b.score - a.score).forEach((p, i) => p.rank = i + 1);
  }

  renderPodium(filtered.slice(0, 3));
  renderTable(filtered);
}

// === PODIUM ===
function renderPodium(top3) {
  const podium = document.getElementById('podium');
  if (!podium) return;

  const emojis = ['🥇', '🥈', '🥉'];
  const heights = [90, 65, 50];

  podium.innerHTML = top3.map((p, i) => `
    <div class="podium-place">
      <div class="podium-avatar">
        ${i === 0 ? '<div class="podium-crown">👑</div>' : ''}
        ${p.emoji}
      </div>
      <div class="podium-name">${p.country} ${p.name}${p.isYou ? ' (You)' : ''}</div>
      <div class="podium-score">${formatNumber(p.score)}</div>
      <div class="podium-base" style="height:${heights[i]}px">${emojis[i]}</div>
    </div>
  `).join('');
}

// === TABLE ===
function renderTable(data) {
  const body = document.getElementById('lbTableBody');
  if (!body) return;

  body.innerHTML = '';

  data.forEach((p, i) => {
    const rankClass = p.rank === 1 ? 'r1' : p.rank === 2 ? 'r2' : p.rank === 3 ? 'r3' : '';
    const rankSymbol = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`;

    const row = document.createElement('div');
    row.className = `lb-row${p.isYou ? ' you-row' : ''}`;
    row.style.animationDelay = `${Math.min(i * 0.05, 0.5)}s`;

    row.innerHTML = `
      <div class="lb-row-rank ${rankClass}">${rankSymbol}</div>
      <div class="lb-row-player">
        <div class="lb-row-avatar">${p.emoji}</div>
        <div>
          <div class="lb-row-name">${p.country} ${p.name}${p.isYou ? ' <span style="color:var(--cyan);font-size:0.75rem;">(You)</span>' : ''}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">${p.mode}</div>
        </div>
      </div>
      <div class="lb-row-score">${formatNumber(p.score)}</div>
      <div class="lb-row-mode">${p.mode}</div>
      <div class="lb-row-streak">🔥 ${p.streak}</div>
      <div class="lb-row-accuracy">${p.accuracy}%</div>
    `;
    body.appendChild(row);
  });
}

// === USER RANK ===
function checkUserRank() {
  const user = Auth.getUser();
  const best = ScoreDB.getBest();
  const card = document.getElementById('yourRankCard');

  if (user && best && card) {
    card.style.display = 'block';
    const rank = Math.max(1, Math.floor(1000 - best.score / 10) + 10);
    document.getElementById('yourRankContent').innerHTML = `
      <div class="lb-row" style="border:none;padding:0;grid-template-columns:70px 1fr 120px;">
        <div class="lb-row-rank">#${rank}</div>
        <div class="lb-row-player">
          <div class="lb-row-avatar">🎮</div>
          <div>
            <div class="lb-row-name">${user.name}</div>
            <div style="font-size:0.72rem;color:var(--text-muted)">${best.mode}</div>
          </div>
        </div>
        <div class="lb-row-score">${formatNumber(best.score)}</div>
      </div>
    `;
  }
}
