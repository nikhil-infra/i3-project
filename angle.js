let score = 0;
let ammo = 10;
let targetAngle = 45;
let isFiring = false;
let difficulty = 'medium';

function setDiff(level, btn) {
  document.querySelectorAll('.diff-btn').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
  });
  btn.classList.remove('btn-secondary');
  btn.classList.add('btn-primary');
  difficulty = level;
}

const startScreen = document.getElementById('startScreen');
const resultScreen = document.getElementById('resultScreen');
const gameHud = document.getElementById('gameHud');
const gameContainer = document.getElementById('gameContainer');
const barrel = document.getElementById('barrel');
const targetObj = document.getElementById('targetObj');
const ball = document.getElementById('ball');
const angleInput = document.getElementById('angleInput');

function startGame() {
  SoundEngine.init();
  SoundEngine.playLevelUp();
  score = 0;
  ammo = 10;
  
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  gameHud.classList.remove('hidden');
  gameContainer.classList.remove('hidden');
  
  updateHud();
  placeTarget();
}

function updateHud() {
  document.getElementById('hudScore').textContent = score;
  document.getElementById('hudAmmo').textContent = ammo;
}

function placeTarget() {
  if (difficulty === 'easy') {
    let opts = [30, 45, 60, 90, 120, 135, 150];
    targetAngle = opts[Math.floor(Math.random() * opts.length)];
  } else if (difficulty === 'medium') {
    targetAngle = (Math.floor(Math.random() * 15) + 2) * 10; // 20 to 160 step 10
  } else {
    targetAngle = Math.floor(Math.random() * 141) + 20; // 20 to 160 any
  }
  
  // Make target smaller on hard
  targetObj.style.width = difficulty === 'hard' ? '20px' : '40px';
  targetObj.style.height = difficulty === 'hard' ? '20px' : '40px';
  
  // Convert standard math angle to CSS position (origin at bottom center)
  // standard: 0 is right, 90 is up, 180 is left
  // screen: 0,0 is top left.
  const rad = targetAngle * (Math.PI / 180);
  const distance = 150 + Math.random() * 100; // random distance 150-250px from cannon
  
  // Center bottom is field.width/2, field.height
  // x = cos(a)*dist, y = sin(a)*dist
  const fw = document.getElementById('field').clientWidth;
  const fh = 400; // from CSS
  
  const tx = (fw / 2) + Math.cos(rad) * distance;
  const ty = fh - 15 - Math.sin(rad) * distance;
  
  targetObj.style.left = `${tx}px`;
  targetObj.style.top = `${ty}px`;
}

async function fireCannon() {
  if (isFiring || ammo <= 0) return;
  isFiring = true;
  ammo--;
  updateHud();
  
  let inputAngle = parseInt(angleInput.value) || 0;
  // Convert standard math angle to CSS rotate (CSS 0 is UP, 90 is RIGHT)
  // Standard math: 90 is UP, 0 is RIGHT.
  // CSS rotate = 90 - inputAngle
  const cssRotate = 90 - inputAngle;
  
  barrel.style.transform = `translateX(-50%) rotate(${cssRotate}deg)`;
  SoundEngine.playCannon();
  
  // Wait for barrel to rotate
  await new Promise(r => setTimeout(r, 600));
  
  // Fire animation
  const fw = document.getElementById('field').clientWidth;
  const fh = 400;
  
  const rad = inputAngle * (Math.PI / 180);
  let bx = (fw / 2);
  let by = fh - 15;
  
  ball.style.display = 'block';
  ball.style.left = `${bx}px`;
  ball.style.top = `${by}px`;
  
  const speed = 15;
  const vx = Math.cos(rad) * speed;
  const vy = -Math.sin(rad) * speed;
  
  const targetX = parseFloat(targetObj.style.left);
  const targetY = parseFloat(targetObj.style.top);
  
  let hit = false;
  
  // Simple animation loop
  const fly = setInterval(() => {
    bx += vx;
    by += vy;
    ball.style.left = `${bx}px`;
    ball.style.top = `${by}px`;
    
    // Check collision
    const dist = Math.hypot(bx - targetX, by - targetY);
    if (dist < 25) { // Hit
      hit = true;
      clearInterval(fly);
      ball.style.display = 'none';
      
      SoundEngine.playCorrect();
      targetObj.style.transform = 'translate(-50%, -50%) scale(1.5)';
      targetObj.style.opacity = '0';
      score++;
      updateHud();
      
      setTimeout(() => {
        targetObj.style.transform = 'translate(-50%, -50%) scale(1)';
        targetObj.style.opacity = '1';
        if (ammo <= 0) endGame();
        else placeTarget();
        isFiring = false;
      }, 500);
    }
    
    // Out of bounds
    if (bx < 0 || bx > fw || by < 0 || by > fh) {
      clearInterval(fly);
      ball.style.display = 'none';
      SoundEngine.playWrong();
      
      document.getElementById('field').classList.add('shake');
      setTimeout(() => document.getElementById('field').classList.remove('shake'), 500);
      
      if (ammo <= 0) setTimeout(endGame, 500);
      isFiring = false;
    }
  }, 20);
}

function endGame() {
  SoundEngine.playLevelUp();
  gameHud.classList.add('hidden');
  gameContainer.classList.add('hidden');
  resultScreen.classList.remove('hidden');
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
        mode: 'Angle Artillery',
        difficulty: difficulty,
        correct: score,
        wrong: 10 - score,
        streak: score,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) {}
}
