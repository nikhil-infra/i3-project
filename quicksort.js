let score = 0;
let level = 1;
const maxLevels = 10;
let lives = 3;
let correctCount = 0;
let numbers = [];
let expectedIndex = 0;

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const sortGrid = document.getElementById('sortGrid');
const sortedRow = document.getElementById('sortedRow');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownDisplay = document.getElementById('countdownDisplay');

document.getElementById('startBtn').onclick = startGame;
document.getElementById('playAgainBtn').onclick = startGame;

function startGame() {
  score = 0;
  level = 1;
  lives = 3;
  correctCount = 0;
  updateHUD();
  
  startScreen.style.display = 'none';
  resultScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  doCountdown().then(startLevel);
}

function updateHUD() {
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('levelDisplay').textContent = `${level} / ${maxLevels}`;
  let hearts = '';
  for(let i=0; i<lives; i++) hearts += '❤️';
  document.getElementById('livesDisplay').textContent = hearts;
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

function generateNumbers() {
  let count = 5;
  if (level >= 4) count = 6;
  if (level >= 7) count = 7;
  if (level >= 9) count = 8;
  
  let nums = [];
  while(nums.length < count) {
    let n;
    if (level < 9) {
      n = Math.floor(Math.random() * (level * 10)) + 1;
    } else if (level === 9) {
      n = Math.floor(Math.random() * 40) - 20;
    } else {
      n = (Math.random() * 40 - 10).toFixed(1);
      n = parseFloat(n);
    }
    if (!nums.includes(n)) nums.push(n);
  }
  
  nums.sort((a,b) => a - b);
  return nums;
}

function startLevel() {
  numbers = generateNumbers();
  expectedIndex = 0;
  
  let shuffled = [...numbers].sort(() => Math.random() - 0.5);
  
  sortGrid.innerHTML = '';
  sortedRow.innerHTML = '';
  
  shuffled.forEach(num => {
    const btn = document.createElement('div');
    btn.className = 'mg-sort-num';
    btn.textContent = num;
    btn.onclick = () => handlePick(num, btn);
    sortGrid.appendChild(btn);
  });
}

function handlePick(num, btn) {
  if (btn.classList.contains('picked')) return;
  
  if (num === numbers[expectedIndex]) {
    btn.classList.add('picked');
    
    const sorted = document.createElement('div');
    sorted.className = 'mg-sorted-item';
    sorted.textContent = num;
    sortedRow.appendChild(sorted);
    
    expectedIndex++;
    correctCount++;
    score += 50;
    updateHUD();
    
    if (expectedIndex === numbers.length) {
      showFeedback('✅');
      score += 200; // Level complete bonus
      updateHUD();
      if (level < maxLevels) {
        level++;
        setTimeout(startLevel, 1500);
      } else {
        setTimeout(endGame, 1000);
      }
    }
  } else {
    lives--;
    updateHUD();
    btn.style.animation = 'none';
    void btn.offsetWidth;
    btn.style.animation = 'shake 0.4s ease';
    
    if (lives <= 0) {
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
        mode: 'Quick Sort',
        difficulty: 'normal',
        correct: correctCount,
        wrong: 3 - lives,
        streak: level,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) { console.error('Score save failed:', e); }
}
