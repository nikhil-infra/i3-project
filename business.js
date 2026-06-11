let bank = 1000;
let month = 1;
let rep = 3;
let isAnimating = false;
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
const coinContainer = document.getElementById('coinContainer');

function startGame() {
  SoundEngine.init();
  SoundEngine.playChaChing();
  bank = 1000;
  month = 1;
  rep = 3;
  
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  gameHud.classList.remove('hidden');
  gameContainer.classList.remove('hidden');
  
  updateHud();
  loadScenario();
}

function updateHud() {
  document.getElementById('hudBank').textContent = `₹${bank.toLocaleString()}`;
  document.getElementById('hudMonth').textContent = `${month}/12`;
  let r = ''; for(let i=0; i<rep; i++) r += '⭐';
  document.getElementById('hudRep').textContent = r || 'BANKRUPT';
}

function generateScenario() {
  let types = ['profit', 'discount'];
  if (difficulty === 'easy') types = ['profit'];
  if (difficulty === 'hard') types = ['profit', 'discount', 'tax', 'loss'];
  
  const type = types[Math.floor(Math.random() * types.length)];
  
  // Cost logic based on diff
  let costMult = difficulty === 'hard' ? 25 : 50;
  let cost = (Math.floor(Math.random() * 20) + 1) * costMult; 
  
  // Percent logic
  let pct = (Math.floor(Math.random() * 8) + 1) * 5; 
  if (difficulty === 'hard' && Math.random() > 0.5) pct = [12, 18, 22, 35][Math.floor(Math.random()*4)]; // Tricky pcts
  
  let q = '';
  let a = 0;
  
  if (type === 'profit') {
    q = `You bought stock for ₹${cost}. You want a ${pct}% profit. What is the selling price?`;
    a = cost + (cost * (pct/100));
  } else if (type === 'discount') {
    q = `A customer wants a laptop marked at ₹${cost}. You offer a ${pct}% discount. What is the final price?`;
    a = cost - (cost * (pct/100));
  } else if (type === 'tax') {
    pct = 10; // fixed 10% tax for easy math
    q = `You sell a server for ₹${cost}. There is a ${pct}% sales tax added. What is the total cost to the customer?`;
    a = cost + (cost * (pct/100));
  } else if (type === 'loss') {
    q = `Old inventory cost you ₹${cost}. You sell it at a ${pct}% loss to clear space. What is the selling price?`;
    a = cost - (cost * (pct/100));
  }
  
  let options = [a];
  while(options.length < 4) {
    let fakePct = pct + (Math.floor(Math.random() * 5) - 2) * 5;
    if (fakePct === pct) fakePct += 5;
    let fake = type === 'discount' || type === 'loss' ? cost - (cost * (fakePct/100)) : cost + (cost * (fakePct/100));
    
    // Prevent negatives or duplicates
    if (fake > 0 && !options.includes(fake)) {
      options.push(fake);
    }
  }
  
  return { q, a, options: options.sort(() => Math.random() - 0.5) };
}

function loadScenario() {
  if (month > 12 || rep <= 0) {
    endGame();
    return;
  }
  
  isAnimating = false;
  const currentQ = generateScenario();
  
  document.getElementById('scenarioText').textContent = currentQ.q;
  
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';
  
  currentQ.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'biz-btn';
    btn.textContent = `₹${opt}`;
    btn.onclick = () => selectOption(btn, opt, currentQ.a);
    container.appendChild(btn);
  });
  
  gameContainer.classList.add('pop-in');
  setTimeout(() => gameContainer.classList.remove('pop-in'), 300);
}

function spawnCoins() {
  for(let i=0; i<15; i++) {
    const coin = document.createElement('div');
    coin.className = 'coin';
    coin.textContent = '🪙';
    coin.style.left = `${Math.random() * 80 + 10}%`;
    coin.style.animationDelay = `${Math.random() * 0.5}s`;
    coinContainer.appendChild(coin);
    
    setTimeout(() => coin.remove(), 2000);
  }
}

function selectOption(btn, selected, correct) {
  if (isAnimating) return;
  isAnimating = true;
  
  if (selected === correct) {
    SoundEngine.playChaChing();
    btn.classList.add('correct');
    bank += 500;
    spawnCoins();
  } else {
    SoundEngine.playWrong();
    btn.classList.add('wrong');
    bank -= 200;
    rep--;
    
    // highlight correct
    Array.from(document.getElementById('optionsContainer').children).forEach(b => {
      if (b.textContent === `₹${correct}`) {
        b.style.borderColor = 'var(--green)';
      }
    });
  }
  
  updateHud();
  
  setTimeout(() => {
    month++;
    loadScenario();
  }, 1500);
}

function endGame() {
  SoundEngine.playLevelUp();
  gameHud.classList.add('hidden');
  gameContainer.classList.add('hidden');
  resultScreen.classList.remove('hidden');
  document.getElementById('rsBank').textContent = `₹${bank.toLocaleString()}`;
  
  const user = Auth.getUser();
  try {
    fetch(`${AWS_CONFIG.apiUrl}/scores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user?.id || 'anonymous',
        userName: user?.name || 'Anonymous',
        score: Math.max(0, bank),
        mode: 'Business Boss',
        difficulty: difficulty,
        correct: rep,
        wrong: 3 - rep,
        streak: bank,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) {}
}
