let score = 0;
let round = 1;
const maxRounds = 15;
let timeLeft = 90;
let timer = null;
let currentAnswer = 0;
let correctCount = 0;
let wrongCount = 0;
let currentStreak = 0;
let bestStreak = 0;

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const sequenceRow = document.getElementById('sequenceRow');
const optionsGrid = document.getElementById('optionsGrid');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownDisplay = document.getElementById('countdownDisplay');

document.getElementById('startBtn').onclick = startGame;
document.getElementById('playAgainBtn').onclick = startGame;

function startGame() {
  score = 0;
  round = 1;
  timeLeft = 90;
  correctCount = 0;
  wrongCount = 0;
  currentStreak = 0;
  bestStreak = 0;
  updateHUD();
  
  startScreen.style.display = 'none';
  resultScreen.style.display = 'none';
  gameScreen.style.display = 'block';
  
  doCountdown().then(startRound);
}

function updateHUD() {
  document.getElementById('scoreDisplay').textContent = score;
  document.getElementById('roundDisplay').textContent = `${round} / ${maxRounds}`;
  document.getElementById('timeDisplay').textContent = `${timeLeft}s`;
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
  
  timer = setInterval(() => {
    timeLeft--;
    updateHUD();
    if (timeLeft <= 0) {
      clearInterval(timer);
      endGame();
    }
  }, 1000);
}

function generateSequence() {
  const seq = [];
  const type = Math.floor(Math.random() * 3); // 0: add, 1: multiply, 2: squares
  const start = Math.floor(Math.random() * 10) + 1;
  const step = Math.floor(Math.random() * 5) + 2;
  
  let val = start;
  for(let i=0; i<5; i++) {
    if (type === 0) {
      seq.push(val);
      val += step;
    } else if (type === 1) {
      seq.push(val);
      val *= (step > 3 ? 2 : 3);
    } else {
      seq.push((start+i) * (start+i));
    }
  }
  
  const mysteryIndex = Math.floor(Math.random() * 4) + 1; // 1 to 4
  currentAnswer = seq[mysteryIndex];
  
  sequenceRow.innerHTML = '';
  for(let i=0; i<seq.length; i++) {
    const el = document.createElement('div');
    if (i === mysteryIndex) {
      el.className = 'mg-seq-item mystery';
      el.textContent = '?';
    } else {
      el.className = 'mg-seq-item';
      el.textContent = seq[i];
    }
    sequenceRow.appendChild(el);
  }
  
  // Options
  let opts = [currentAnswer];
  while(opts.length < 4) {
    const fake = currentAnswer + (Math.floor(Math.random()*10)-5)*step;
    if (!opts.includes(fake) && fake > 0) opts.push(fake);
  }
  opts.sort(() => Math.random() - 0.5);
  
  optionsGrid.innerHTML = '';
  opts.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'mg-option-btn';
    btn.textContent = opt;
    btn.onclick = () => handleAnswer(opt, btn);
    optionsGrid.appendChild(btn);
  });
}

function startRound() {
  generateSequence();
}

function handleAnswer(ans, btn) {
  Array.from(optionsGrid.children).forEach(b => b.disabled = true);
  
  if (ans === currentAnswer) {
    btn.classList.add('correct-pick');
    correctCount++;
    currentStreak++;
    bestStreak = Math.max(bestStreak, currentStreak);
    score += 100 + (currentStreak * 25);
    showFeedback('✅');
  } else {
    btn.classList.add('wrong-pick');
    wrongCount++;
    currentStreak = 0;
    showFeedback('❌');
    // Highlight correct
    Array.from(optionsGrid.children).forEach(b => {
      if (parseInt(b.textContent) === currentAnswer) b.classList.add('correct-pick');
    });
  }
  updateHUD();
  
  setTimeout(() => {
    if (round < maxRounds && timeLeft > 0) {
      round++;
      updateHUD();
      startRound();
    } else {
      endGame();
    }
  }, 1000);
}

function showFeedback(emoji) {
  const fb = document.getElementById('feedback');
  fb.textContent = emoji;
  fb.classList.add('show');
  setTimeout(() => fb.classList.remove('show'), 600);
}

function endGame() {
  clearInterval(timer);
  gameScreen.style.display = 'none';
  resultScreen.style.display = 'flex';
  
  score += timeLeft * 5; // time bonus
  
  document.getElementById('finalScore').textContent = score;
  document.getElementById('rsCorrect').textContent = correctCount;
  document.getElementById('rsStreak').textContent = bestStreak;

  const user = Auth.getUser();
  try {
    fetch(`${AWS_CONFIG.apiUrl}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Anonymous',
        score: score,
        mode: 'Number Sequence',
        difficulty: 'normal',
        correct: correctCount,
        wrong: wrongCount,
        streak: bestStreak,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) { console.error('Score save failed:', e); }
}
