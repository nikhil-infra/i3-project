let score = 0;
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

function startGame() {
  SoundEngine.init();
  SoundEngine.playLevelUp();
  score = 0;
  rep = 3;
  
  startScreen.classList.add('hidden');
  resultScreen.classList.add('hidden');
  gameHud.classList.remove('hidden');
  gameContainer.classList.remove('hidden');
  
  updateHud();
  loadQuestion();
}

function updateHud() {
  document.getElementById('hudScore').textContent = score;
  let r = ''; for(let i=0; i<rep; i++) r += '⭐';
  document.getElementById('hudRep').textContent = r || 'LOCKED';
}

function formatTime(h, m) {
  let hh = h === 0 ? 12 : (h > 12 ? h - 12 : h);
  let mm = m < 10 ? `0${m}` : m;
  return `${hh}:${mm}`;
}

function loadQuestion() {
  if (rep <= 0) { endGame(); return; }
  isAnimating = false;
  
  let isDuration = difficulty !== 'easy';
  
  let h = Math.floor(Math.random() * 12) + 1;
  let m = 0;
  
  if (difficulty === 'easy') {
    m = Math.random() > 0.5 ? 0 : 30;
  } else if (difficulty === 'medium') {
    m = Math.floor(Math.random() * 12) * 5; // 0, 5, 10...
  } else {
    m = Math.floor(Math.random() * 60); // any minute
  }
  
  // Set clock hands
  const hDeg = (h * 30) + (m * 0.5);
  const mDeg = m * 6;
  
  document.getElementById('hHand').style.transform = `rotate(${hDeg}deg)`;
  document.getElementById('mHand').style.transform = `rotate(${mDeg}deg)`;
  
  let qText = '';
  let correctAns = '';
  
  if (isDuration) {
    let addMins = 0;
    if (difficulty === 'medium') {
      addMins = [15, 30, 45, 60, 90][Math.floor(Math.random()*5)];
    } else {
      addMins = Math.floor(Math.random()*120) - 60; // -60 to +60
      if (addMins === 0) addMins = 23;
    }
    
    let action = addMins > 0 ? 'in' : 'ago';
    let minText = Math.abs(addMins);
    qText = `What time ${addMins > 0 ? 'will it be in' : 'was it'} ${minText} minutes ${action === 'ago' ? 'ago' : ''}?`;
    
    let totalMins = (h * 60) + m + addMins;
    if (totalMins <= 0) totalMins += 12 * 60;
    
    let endH = Math.floor(totalMins / 60);
    let endM = totalMins % 60;
    if (endH > 12) endH = endH % 12 || 12;
    if (endH === 0) endH = 12;
    
    correctAns = formatTime(endH, endM);
  } else {
    qText = "What time is shown on the clock?";
    correctAns = formatTime(h, m);
  }
  
  document.getElementById('questionText').textContent = qText;
  
  // Generate options
  let options = [correctAns];
  while(options.length < 4) {
    let fh = Math.floor(Math.random() * 12) + 1;
    let fm = Math.floor(Math.random() * 12) * 5;
    let fStr = formatTime(fh, fm);
    if (!options.includes(fStr)) options.push(fStr);
  }
  options.sort(() => Math.random() - 0.5);
  
  const container = document.getElementById('optionsContainer');
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'time-btn';
    btn.textContent = opt;
    btn.onclick = () => selectOption(btn, opt, correctAns);
    container.appendChild(btn);
  });
  
  gameContainer.classList.add('pop-in');
  setTimeout(() => gameContainer.classList.remove('pop-in'), 300);
}

function selectOption(btn, selected, correct) {
  if (isAnimating) return;
  isAnimating = true;
  
  if (selected === correct) {
    SoundEngine.playCorrect();
    btn.classList.add('correct');
    score++;
  } else {
    SoundEngine.playWrong();
    btn.classList.add('wrong');
    rep--;
    Array.from(document.getElementById('optionsContainer').children).forEach(b => {
      if (b.textContent === correct) b.classList.add('correct');
    });
  }
  
  updateHud();
  setTimeout(loadQuestion, 1500);
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
        score: score * 10,
        mode: 'Time Hacker',
        difficulty: difficulty,
        correct: score,
        wrong: 3 - rep,
        streak: score,
        timestamp: new Date().toISOString()
      })
    });
  } catch(e) {}
}
