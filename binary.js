let score = 0;
let target = 0;
let current = 0;
let bits = [128, 64, 32, 16, 8, 4, 2, 1];
let bulbStates = [];

let numBulbs = 8;
function setDiff(level, btn) {
  document.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
  });
  btn.classList.remove('btn-secondary');
  btn.classList.add('btn-primary');
  
  if(level === 'easy') numBulbs = 4;
  else if(level === 'medium') numBulbs = 6;
  else numBulbs = 8;
}

const container = document.getElementById('bulbsContainer');
const tNum = document.getElementById('targetNum');
const cNum = document.getElementById('currentNum');
const sNum = document.getElementById('scoreNum');
const bigTarget = document.getElementById('bigTarget');

function startGame() {
  SoundEngine.init();
  SoundEngine.playLevelUp();
  score = 0;
  document.getElementById('startScreen').classList.add('hidden');
  document.getElementById('resultScreen').classList.add('hidden');
  document.getElementById('gameHud').classList.remove('hidden');
  document.getElementById('gameContainer').classList.remove('hidden');
  
  createBulbs();
  nextRound();
}

function createBulbs() {
  container.innerHTML = '';
  
  let activeBits = bits.slice(8 - numBulbs);
  bulbStates = new Array(numBulbs).fill(0);
  
  activeBits.forEach((val, i) => {
    const box = document.createElement('div');
    box.className = 'bulb-box';
    box.id = `bulb-box-${i}`;
    box.onclick = () => toggleBulb(i, val);
    
    box.innerHTML = `
      <div class="bulb-val">${val}</div>
      <div class="bulb" id="bulb-${i}"></div>
      <div class="bulb-bit" id="bit-${i}">0</div>
    `;
    container.appendChild(box);
  });
}

function nextRound() {
  let activeBits = bits.slice(8 - numBulbs);
  let max = activeBits.reduce((a,b) => a+b, 0);
  target = Math.floor(Math.random() * max) + 1;
  tNum.textContent = target;
  bigTarget.textContent = target;
  
  bulbStates = new Array(numBulbs).fill(0);
  updateView(activeBits);
}

function toggleBulb(i, val) {
  SoundEngine.playBulb();
  bulbStates[i] = bulbStates[i] === 1 ? 0 : 1;
  let activeBits = bits.slice(8 - numBulbs);
  updateView(activeBits);
  checkWin();
}

function updateView(activeBits) {
  current = 0;
  bulbStates.forEach((state, i) => {
    const box = document.getElementById(`bulb-box-${i}`);
    const bulb = document.getElementById(`bulb-${i}`);
    const bit = document.getElementById(`bit-${i}`);
    
    if (state === 1) {
      box.classList.add('on');
      bulb.classList.add('on');
      bit.textContent = '1';
      current += activeBits[i];
    } else {
      box.classList.remove('on');
      bulb.classList.remove('on');
      bit.textContent = '0';
    }
  });
  
  cNum.textContent = current;
  cNum.classList.toggle('pink', current > target);
  cNum.classList.toggle('cyan', current <= target);
}

function checkWin() {
  if (current === target) {
    SoundEngine.playCorrect();
    document.getElementById('gameContainer').classList.add('pop-in');
    setTimeout(() => document.getElementById('gameContainer').classList.remove('pop-in'), 300);
    
    score++;
    sNum.textContent = score;
    
    if (score >= 10) {
      endGame();
    } else {
      setTimeout(nextRound, 500);
    }
  } else if (current > target) {
    SoundEngine.playWrong();
    document.getElementById('gameContainer').classList.add('shake');
    setTimeout(() => document.getElementById('gameContainer').classList.remove('shake'), 500);
  }
}

function endGame() {
  document.getElementById('gameHud').classList.add('hidden');
  document.getElementById('gameContainer').classList.add('hidden');
  document.getElementById('resultScreen').classList.remove('hidden');
  document.getElementById('rsScore').textContent = score;
  
  const user = Auth.getUser();
  try {
    fetch(`${AWS_CONFIG.apiUrl}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Anonymous',
        score: score * 100,
        mode: 'Binary Bulbs',
        difficulty: 'educational',
        correct: score,
        wrong: 0,
        streak: score,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) {}
}
