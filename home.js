// home.js — Home page specific logic

document.addEventListener('DOMContentLoaded', () => {

  // === RENDER LEADERBOARD PREVIEW ===
  const previewContainer = document.getElementById('leaderboardPreview');
  if (previewContainer) {
    // Merge mock with any local user score
    const user = Auth.getUser();
    const best = ScoreDB.getBest();
    let lbData = [...mockLeaderboard];

    if (user && best) {
      lbData.push({ rank: '?', name: user.name || 'You', score: best.score, mode: best.mode, emoji: '🎮', isYou: true });
      lbData.sort((a, b) => b.score - a.score);
      lbData = lbData.slice(0, 5).map((e, i) => ({ ...e, rank: i + 1 }));
    }

    lbData.slice(0, 5).forEach((player, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const rankSymbol = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${player.rank}`;

      const row = document.createElement('div');
      row.className = 'lb-preview-row';
      row.style.animationDelay = `${i * 0.1}s`;
      if (player.isYou) row.style.borderColor = 'var(--cyan)';

      row.innerHTML = `
        <div class="lb-rank ${rankClass}">${rankSymbol}</div>
        <div class="lb-avatar">${player.emoji}</div>
        <div>
          <div class="lb-name">${player.name}${player.isYou ? ' <span style="color:var(--cyan);font-size:0.75rem;">(You)</span>' : ''}</div>
          <div class="lb-mode">${player.mode}</div>
        </div>
        <div class="lb-score">${formatNumber(player.score)}</div>
      `;
      previewContainer.appendChild(row);
    });
  }

  // === TYPING EFFECT ON HERO (optional flair) ===
  const heroTitle = document.querySelector('.hero-title');

});
