let round = 1;
const maxRounds = 5;
let times = [];
let state = 'waiting'; // waiting, ready, clicked, too-soon
let startTime = 0;
let timeoutId = null;

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const reactionZone = document.getElementById('reactionZone');
const reactionText = document.getElementById('reactionText');

document.getElementById('startBtn').onclick = startGame;
document.getElementById('playAgainBtn').onclick = startGame;
reactionZone.onmousedown = handleZoneClick;

function startGame() {
  round = 1;
  times = [];
  updateHUD();
  
  startScreen.style.display = 'none';
  resultScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  startRound();
}

function updateHUD() {
  document.getElementById('roundDisplay').textContent = `${round} / ${maxRounds}`;
  const avg = times.length ? Math.round(times.reduce((a,b)=>a+b,0)/times.length) : '--';
  document.getElementById('avgDisplay').textContent = `${avg} ms`;
}

function startRound() {
  state = 'waiting';
  reactionZone.className = 'mg-reaction-zone waiting';
  reactionText.textContent = 'Wait for green...';
  reactionText.className = 'mg-center-text';
  
  const delay = 1500 + Math.random() * 3500;
  timeoutId = setTimeout(() => {
    state = 'ready';
    reactionZone.className = 'mg-reaction-zone ready';
    reactionText.textContent = 'CLICK NOW!';
    startTime = performance.now();
  }, delay);
}

function handleZoneClick() {
  if (state === 'waiting') {
    clearTimeout(timeoutId);
    state = 'too-soon';
    reactionZone.className = 'mg-reaction-zone too-soon';
    reactionText.textContent = 'Too soon! Click to try again.';
  } else if (state === 'ready') {
    const timeTaken = Math.round(performance.now() - startTime);
    times.push(timeTaken);
    state = 'clicked';
    reactionZone.className = 'mg-reaction-zone clicked';
    reactionText.textContent = `${timeTaken} ms`;
    reactionText.className = 'mg-center-text mg-center-big';
    
    updateHUD();
    
    if (round < maxRounds) {
      round++;
      setTimeout(startRound, 2000);
    } else {
      setTimeout(endGame, 2000);
    }
  } else if (state === 'too-soon') {
    startRound();
  }
}

function endGame() {
  gameScreen.style.display = 'none';
  resultScreen.style.display = 'flex';
  
  const avg = Math.round(times.reduce((a,b)=>a+b,0)/times.length);
  const best = Math.min(...times);
  const score = Math.max(100, Math.round(10000 - (avg * 12)));
  
  document.getElementById('finalScore').textContent = score;
  document.getElementById('rsAvg').textContent = `${avg} ms`;
  document.getElementById('rsBest').textContent = `${best} ms`;

  const user = Auth.getUser();
  try {
    fetch(`${AWS_CONFIG.apiUrl}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Anonymous',
        score: score,
        mode: 'Reaction Time',
        difficulty: 'normal',
        correct: 5,
        wrong: 0,
        streak: best,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) { console.error('Score save failed:', e); }
}
