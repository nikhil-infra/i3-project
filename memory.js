let score = 0;
let level = 1;
let lives = 3;
let pattern = [];
let playerClicks = [];
let gridSize = 4;
let isPlaying = false;
let correctCount = 0;
let wrongCount = 0;

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const grid = document.getElementById('grid');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownDisplay = document.getElementById('countdownDisplay');

document.getElementById('startBtn').onclick = startGame;
document.getElementById('playAgainBtn').onclick = startGame;

function startGame() {
  score = 0;
  level = 1;
  lives = 3;
  correctCount = 0;
  wrongCount = 0;
  updateHUD();
  
  startScreen.style.display = 'none';
  resultScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  startLevel();
}

function updateHUD() {
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('levelDisplay').textContent = level;
  let hearts = '';
  for(let i=0; i<lives; i++) hearts += '❤️';
  document.getElementById('livesDisplay').textContent = hearts;
}

function getLevelSettings() {
  if (level <= 3) return { size: 4, count: level + 2 };
  if (level <= 6) return { size: 4, count: level + 1 };
  if (level <= 9) return { size: 5, count: level };
  return { size: 6, count: Math.min(level, 12) };
}

async function startLevel() {
  isPlaying = false;
  playerClicks = [];
  const settings = getLevelSettings();
  gridSize = settings.size;
  grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  
  grid.innerHTML = '';
  const totalCells = gridSize * gridSize;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'mg-grid-cell disabled';
    cell.dataset.index = i;
    cell.onclick = () => handleCellClick(i, cell);
    grid.appendChild(cell);
  }

  await doCountdown();

  pattern = [];
  while(pattern.length < settings.count) {
    const rnd = Math.floor(Math.random() * totalCells);
    if (!pattern.includes(rnd)) pattern.push(rnd);
  }

  // Flash pattern
  const cells = grid.children;
  for (let i of pattern) {
    cells[i].classList.add('active');
  }

  await new Promise(r => setTimeout(r, 2000));

  for (let i of pattern) {
    cells[i].classList.remove('active');
  }

  Array.from(cells).forEach(c => c.classList.remove('disabled'));
  isPlaying = true;
}

async function doCountdown() {
  countdownOverlay.classList.remove('hidden');
  for (let i = 3; i > 0; i--) {
    countdownDisplay.textContent = i;
    countdownDisplay.style.animation = 'none';
    void countdownDisplay.offsetWidth;
    countdownDisplay.style.animation = 'countPop 0.8s ease';
    await new Promise(r => setTimeout(r, 1000));
  }
  countdownDisplay.textContent = 'GO!';
  await new Promise(r => setTimeout(r, 500));
  countdownOverlay.classList.add('hidden');
}

function handleCellClick(index, cellEl) {
  if (!isPlaying || cellEl.classList.contains('correct') || cellEl.classList.contains('wrong')) return;

  if (pattern.includes(index)) {
    cellEl.classList.add('correct');
    playerClicks.push(index);
    score += 50 * level;
    correctCount++;
    updateHUD();

    if (playerClicks.length === pattern.length) {
      isPlaying = false;
      showFeedback('✅');
      level++;
      setTimeout(startLevel, 1500);
    }
  } else {
    cellEl.classList.add('wrong');
    lives--;
    wrongCount++;
    updateHUD();
    grid.style.animation = 'none';
    void grid.offsetWidth;
    grid.style.animation = 'shake 0.4s ease';

    if (lives <= 0) {
      isPlaying = false;
      setTimeout(endGame, 1000);
    }
  }
}

function showFeedback(emoji) {
  const fb = document.getElementById('feedback');
  fb.textContent = emoji;
  fb.classList.add('show');
  setTimeout(() => fb.classList.remove('show'), 600);
}

function endGame() {
  gameScreen.style.display = 'none';
  resultScreen.style.display = 'flex';
  document.getElementById('finalScore').textContent = score;
  document.getElementById('rsLevel').textContent = level;
  document.getElementById('rsCorrect').textContent = correctCount;

  const user = Auth.getUser();
  try {
    fetch(`${AWS_CONFIG.apiUrl}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Anonymous',
        score: score,
        mode: 'Memory Matrix',
        difficulty: 'normal',
        correct: correctCount,
        wrong: wrongCount,
        streak: level,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) { console.error('Score save failed:', e); }
}
