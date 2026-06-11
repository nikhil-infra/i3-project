let score = 0;
let round = 1;
const maxRounds = 20;
let timeLeft = 60;
let timer = null;
let isMathCorrect = false;
let correctCount = 0;
let trickedCount = 0;
let streak = 0;

const startScreen = document.getElementById('startScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const equationDisplay = document.getElementById('equationDisplay');
const answerDisplay = document.getElementById('answerDisplay');
const countdownOverlay = document.getElementById('countdownOverlay');
const countdownDisplay = document.getElementById('countdownDisplay');

document.getElementById('startBtn').onclick = startGame;
document.getElementById('playAgainBtn').onclick = startGame;
document.getElementById('btnTrue').onclick = () => handleAnswer(true);
document.getElementById('btnFalse').onclick = () => handleAnswer(false);

const colors = [
  { hex: '#10d98b', name: 'green' },
  { hex: '#ff3d9a', name: 'red' },
  { hex: '#00d4ff', name: 'cyan' },
  { hex: '#ffd700', name: 'yellow' },
  { hex: '#8b5cf6', name: 'purple' }
];

function startGame() {
  score = 0;
  round = 1;
  timeLeft = 60;
  correctCount = 0;
  trickedCount = 0;
  streak = 0;
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

function generateProblem() {
  const isAddition = Math.random() > 0.5;
  const num1 = Math.floor(Math.random() * (round * 2 + 5)) + 1;
  const num2 = Math.floor(Math.random() * (round * 2 + 5)) + 1;
  const actualAnswer = isAddition ? (num1 + num2) : (num1 - num2);
  
  isMathCorrect = Math.random() > 0.5;
  const displayedAnswer = isMathCorrect ? actualAnswer : actualAnswer + (Math.floor(Math.random() * 5) + 1) * (Math.random() > 0.5 ? 1 : -1);
  
  equationDisplay.textContent = `${num1} ${isAddition ? '+' : '-'} ${num2} =`;
  answerDisplay.textContent = displayedAnswer;
  
  // Decide color to try and trick
  let colorHex;
  const isTrickyRound = round > 5 && Math.random() > 0.4;
  
  if (isTrickyRound) {
    // Trick: if math is correct, show in RED. If math is wrong, show in GREEN.
    colorHex = isMathCorrect ? '#ff3d9a' : '#10d98b';
  } else {
    // Normal or random other color
    colorHex = colors[Math.floor(Math.random() * colors.length)].hex;
  }
  
  answerDisplay.style.color = colorHex;
}

function startRound() {
  document.getElementById('btnTrue').disabled = false;
  document.getElementById('btnFalse').disabled = false;
  generateProblem();
}

function handleAnswer(playerSaysTrue) {
  document.getElementById('btnTrue').disabled = true;
  document.getElementById('btnFalse').disabled = true;
  
  if (playerSaysTrue === isMathCorrect) {
    score += 100 + (streak * 30);
    streak++;
    correctCount++;
    showFeedback('✅');
  } else {
    streak = 0;
    trickedCount++;
    showFeedback('❌');
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
  }, 600);
}

function showFeedback(emoji) {
  const fb = document.getElementById('feedback');
  fb.textContent = emoji;
  fb.classList.add('show');
  setTimeout(() => fb.classList.remove('show'), 500);
}

function endGame() {
  clearInterval(timer);
  gameScreen.style.display = 'none';
  resultScreen.style.display = 'flex';
  
  document.getElementById('finalScore').textContent = score;
  document.getElementById('rsCorrect').textContent = correctCount;
  document.getElementById('rsTricked').textContent = trickedCount;

  const user = Auth.getUser();
  try {
    fetch(`${AWS_CONFIG.apiUrl}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Anonymous',
        score: score,
        mode: 'Color Math',
        difficulty: 'normal',
        correct: correctCount,
        wrong: trickedCount,
        streak: streak,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) { console.error('Score save failed:', e); }
}
