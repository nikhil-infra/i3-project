// game.js — Full Game Engine for MathBlast

(function() {

  // === GAME STATE ===
  let gameState = {
    mode: 'speed',
    difficulty: 'easy',
    operations: ['add', 'sub', 'mul'],
    score: 0,
    streak: 0,
    bestStreak: 0,
    lives: 3,
    questionCount: 0,
    totalQuestions: 20,
    correctAnswers: 0,
    wrongAnswers: 0,
    timeLeft: 60,
    timerInterval: null,
    questionTimer: null,
    currentAnswer: 0,
    hintUsed: false,
    isRunning: false,
    gameOver: false,
  };

  // === DIFFICULTY CONFIG ===
  const diffConfig = {
    easy:   { max: 20,   mulMax: 10,  divMax: 5,  timePerQ: 15, bonusTime: 3 },
    medium: { max: 50,   mulMax: 12,  divMax: 10, timePerQ: 12, bonusTime: 2 },
    hard:   { max: 100,  mulMax: 15,  divMax: 12, timePerQ: 10, bonusTime: 2 },
    expert: { max: 200,  mulMax: 20,  divMax: 15, timePerQ: 8,  bonusTime: 1 },
  };

  const modeConfig = {
    speed:    { time: 60, lives: Infinity, totalQ: Infinity, label: 'Speed Round' },
    survival: { time: Infinity, lives: 3, totalQ: Infinity, label: 'Survival Mode' },
    challenge:{ time: Infinity, lives: Infinity, totalQ: 20, label: 'Daily Challenge' },
    practice: { time: Infinity, lives: Infinity, totalQ: Infinity, label: 'Practice Mode' },
  };

  // === DOM REFS ===
  const screens = {
    mode: document.getElementById('modeScreen'),
    countdown: document.getElementById('countdownScreen'),
    game: document.getElementById('gameScreen'),
    result: document.getElementById('resultScreen'),
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => { if (s) s.classList.add('hidden'); });
    if (screens[name]) screens[name].classList.remove('hidden');
  }

  // === MODE SELECTION ===
  let selectedMode = 'speed';
  let selectedDiff = 'easy';
  let selectedOps = new Set(['add', 'sub', 'mul']);

  document.querySelectorAll('.mode-sel-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.mode-sel-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedMode = card.dataset.mode;

      // Auto-select from URL param
      if (selectedMode === 'survival') showToast('3 lives only — survive as long as you can!', 'info');
      else if (selectedMode === 'challenge') showToast('20 questions — compete for daily #1!', 'info');
      else if (selectedMode === 'practice') showToast('No timer! Learn at your own pace.', 'success');
    });
  });

  // Read URL param for mode
  const urlParams = new URLSearchParams(window.location.search);
  const urlMode = urlParams.get('mode');
  if (urlMode) {
    const card = document.querySelector(`[data-mode="${urlMode}"]`);
    if (card) card.click();
  } else {
    document.querySelector('[data-mode="speed"]')?.click();
  }

  // Difficulty buttons
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDiff = btn.dataset.diff;
    });
  });

  // Operations buttons (toggle multi)
  document.querySelectorAll('.ops-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const op = btn.dataset.op;
      if (selectedOps.has(op)) {
        if (selectedOps.size === 1) { showToast('Select at least one operation!', 'error'); return; }
        selectedOps.delete(op);
        btn.classList.remove('active');
      } else {
        selectedOps.add(op);
        btn.classList.add('active');
      }
    });
  });

  // === START GAME ===
  document.getElementById('startGameBtn')?.addEventListener('click', startCountdown);

  function startCountdown() {
    showScreen('countdown');
    let count = 3;
    const numEl = document.getElementById('countdownNumber');
    const labelEl = document.querySelector('.countdown-label');

    const tick = () => {
      if (count > 0) {
        numEl.textContent = count;
        numEl.style.animation = 'none';
        requestAnimationFrame(() => { numEl.style.animation = 'popIn 0.4s ease'; });
        count--;
        setTimeout(tick, 900);
      } else {
        numEl.textContent = '⚡';
        labelEl.textContent = "GO!";
        setTimeout(startGame, 500);
      }
    };
    tick();
  }

  function startGame() {
    const mConf = modeConfig[selectedMode];
    const dConf = diffConfig[selectedDiff];

    gameState = {
      mode: selectedMode,
      difficulty: selectedDiff,
      operations: [...selectedOps],
      score: 0,
      streak: 0,
      bestStreak: 0,
      lives: mConf.lives,
      questionCount: 0,
      totalQuestions: mConf.totalQ,
      correctAnswers: 0,
      wrongAnswers: 0,
      timeLeft: mConf.time === Infinity ? 999999 : mConf.time,
      timerInterval: null,
      currentAnswer: 0,
      hintUsed: false,
      isRunning: true,
      gameOver: false,
    };

    showScreen('game');
    document.getElementById('hudModeLabel').textContent = mConf.label;

    // Show/hide lives HUD
    const livesHud = document.getElementById('livesHud');
    if (mConf.lives !== Infinity) {
      livesHud.style.display = 'block';
    } else {
      livesHud.style.display = 'none';
    }

    // Hide timer ring for infinite time modes
    const timerSvg = document.getElementById('timerSvg');
    const timerDisplay = document.getElementById('timerDisplay');
    if (mConf.time === Infinity) {
      timerDisplay.parentElement.style.opacity = '0.3';
      timerDisplay.textContent = '∞';
    }

    updateHUD();
    nextQuestion();

    // Start timer for timed modes
    if (mConf.time !== Infinity) {
      gameState.timerInterval = setInterval(() => {
        gameState.timeLeft--;
        updateTimer();
        if (gameState.timeLeft <= 0) endGame('timeout');
      }, 1000);
    }
  }

  // === QUESTION GENERATION ===
  function generateQuestion(ops, diff) {
    const dConf = diffConfig[diff];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1, n2, answer, opSign;

    switch (op) {
      case 'add':
        n1 = randInt(1, dConf.max);
        n2 = randInt(1, dConf.max);
        answer = n1 + n2;
        opSign = '+';
        break;
      case 'sub':
        n1 = randInt(1, dConf.max);
        n2 = randInt(1, n1);
        answer = n1 - n2;
        opSign = '−';
        break;
      case 'mul':
        n1 = randInt(2, dConf.mulMax);
        n2 = randInt(2, dConf.mulMax);
        answer = n1 * n2;
        opSign = '×';
        break;
      case 'div':
        n2 = randInt(2, dConf.divMax);
        answer = randInt(2, dConf.divMax);
        n1 = n2 * answer;
        opSign = '÷';
        break;
      default:
        n1 = 5; n2 = 3; answer = 8; opSign = '+';
    }

    return { n1, n2, answer, opSign };
  }

  function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  function generateWrongAnswers(correct, difficulty) {
    const wrongs = new Set();
    const dConf = diffConfig[difficulty];

    while (wrongs.size < 3) {
      let offset = randInt(1, Math.max(5, Math.floor(correct * 0.3)));
      if (Math.random() > 0.5) offset = -offset;
      const w = correct + offset;
      if (w !== correct && w >= 0) wrongs.add(w);
    }
    return [...wrongs];
  }

  function nextQuestion() {
    if (gameState.gameOver) return;

    // Check total questions limit
    if (gameState.totalQuestions !== Infinity && gameState.questionCount >= gameState.totalQuestions) {
      endGame('completed');
      return;
    }

    gameState.hintUsed = false;
    gameState.questionCount++;

    const q = generateQuestion(gameState.operations, gameState.difficulty);
    gameState.currentAnswer = q.answer;

    // Update equation display
    document.getElementById('num1').textContent = q.n1;
    document.getElementById('opSign').textContent = q.opSign;
    document.getElementById('num2').textContent = q.n2;
    document.getElementById('questionNumber').textContent = `Question ${gameState.questionCount}`;

    // Update progress bar
    if (gameState.totalQuestions !== Infinity) {
      const pct = (gameState.questionCount / gameState.totalQuestions) * 100;
      document.getElementById('progressFill').style.width = pct + '%';
    }

    // Generate answers (correct + 3 wrong)
    const wrongs = generateWrongAnswers(q.answer, gameState.difficulty);
    const allAnswers = [...wrongs, q.answer];
    shuffleArray(allAnswers);

    const answerBtns = document.querySelectorAll('.answer-btn');
    answerBtns.forEach((btn, i) => {
      btn.textContent = allAnswers[i];
      btn.classList.remove('correct', 'wrong');
      btn.disabled = false;
      btn.style.animation = '';
      btn.style.animationDelay = `${i * 0.05}s`;
      btn.style.animation = 'fadeInUp 0.3s ease both';
    });

    // Animate question
    const qArea = document.getElementById('questionArea');
    qArea.style.animation = 'none';
    requestAnimationFrame(() => { qArea.style.animation = 'fadeInUp 0.3s ease'; });
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // === ANSWER HANDLING ===
  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (gameState.gameOver) return;
      const chosen = parseInt(btn.textContent);
      handleAnswer(chosen, btn);
    });
  });

  function handleAnswer(chosen, btn) {
    const isCorrect = chosen === gameState.currentAnswer;
    const dConf = diffConfig[gameState.difficulty];

    // Disable all buttons
    document.querySelectorAll('.answer-btn').forEach(b => b.disabled = true);

    // Highlight correct/wrong
    btn.classList.add(isCorrect ? 'correct' : 'wrong');

    if (!isCorrect) {
      // Show correct answer
      document.querySelectorAll('.answer-btn').forEach(b => {
        if (parseInt(b.textContent) === gameState.currentAnswer) b.classList.add('correct');
      });
    }

    if (isCorrect) {
      gameState.streak++;
      gameState.bestStreak = Math.max(gameState.bestStreak, gameState.streak);
      gameState.correctAnswers++;

      // Score calculation
      const diffMult = { easy: 1, medium: 1.5, hard: 2, expert: 3 }[gameState.difficulty];
      const streakBonus = Math.min(gameState.streak, 10);
      const pts = Math.round((100 + streakBonus * 15) * diffMult);
      gameState.score += pts;

      // Hint penalty already applied
      if (gameState.hintUsed) gameState.score = Math.max(0, gameState.score - 50);

      showFeedback(`+${pts}`, 'correct-fb');
      playSound('correct');

      // Combo banner
      if (gameState.streak > 2) {
        const banner = document.getElementById('comboBanner');
        document.getElementById('comboText').textContent = `${gameState.streak}x Combo! +${pts} pts`;
        banner.classList.remove('hidden');
        setTimeout(() => banner.classList.add('hidden'), 1200);
      }

      // Bonus time in speed mode
      if (gameState.mode === 'speed') {
        gameState.timeLeft = Math.min(gameState.timeLeft + dConf.bonusTime, 60);
      }

    } else {
      gameState.streak = 0;
      gameState.wrongAnswers++;
      showFeedback('Wrong!', 'wrong-fb');
      playSound('wrong');

      if (gameState.lives !== Infinity) {
        gameState.lives--;
        if (gameState.lives <= 0) {
          setTimeout(() => endGame('lives'), 800);
          return;
        }
      }
    }

    updateHUD();

    // Next question after delay
    setTimeout(() => {
      if (!gameState.gameOver) nextQuestion();
    }, 800);
  }

  // === HINT ===
  document.getElementById('hintBtn')?.addEventListener('click', () => {
    if (gameState.hintUsed) { showToast('Hint already used for this question!', 'warning'); return; }
    gameState.hintUsed = true;

    // Eliminate two wrong answers
    const answerBtns = [...document.querySelectorAll('.answer-btn')];
    const wrongBtns = answerBtns.filter(b => parseInt(b.textContent) !== gameState.currentAnswer);
    shuffleArray(wrongBtns);
    wrongBtns.slice(0, 2).forEach(b => {
      b.disabled = true;
      b.style.opacity = '0.3';
    });
    showToast('Hint used! -50 points', 'warning');
  });

  // === QUIT ===
  document.getElementById('quitGameBtn')?.addEventListener('click', () => {
    if (confirm('Quit this game? Your score won\'t be saved.')) {
      clearInterval(gameState.timerInterval);
      gameState.gameOver = true;
      showScreen('mode');
    }
  });

  // === TIMER ===
  function updateTimer() {
    const tEl = document.getElementById('timerDisplay');
    const circle = document.getElementById('timerCircle');

    if (tEl) tEl.textContent = gameState.timeLeft;

    if (gameState.timeLeft <= 10) {
      tEl?.classList.add('timer-critical');
    } else if (gameState.timeLeft <= 20) {
      tEl?.classList.add('timer-warning');
    }

    // Update SVG ring
    if (circle) {
      const maxTime = modeConfig[gameState.mode].time === Infinity ? 999999 : modeConfig[gameState.mode].time;
      const pct = gameState.timeLeft / maxTime;
      const circ = 276.5;
      circle.style.strokeDashoffset = circ * (1 - pct);
    }
  }

  // === HUD UPDATE ===
  function updateHUD() {
    document.getElementById('scoreDisplay').textContent = formatNumber(gameState.score);
    document.getElementById('streakDisplay').textContent = `🔥 ${gameState.streak}`;

    const livesMap = ['', '❤️', '❤️❤️', '❤️❤️❤️'];
    if (gameState.lives !== Infinity) {
      document.getElementById('livesDisplay').textContent = livesMap[Math.max(0, gameState.lives)] || '';
    }
  }

  // === FEEDBACK POPUP ===
  function showFeedback(text, className) {
    const popup = document.getElementById('feedbackPopup');
    if (!popup) return;
    popup.textContent = text;
    popup.className = `feedback-popup ${className}`;
    setTimeout(() => {
      popup.className = 'feedback-popup hidden';
    }, 700);
  }

  // === SOUNDS (Web Audio API) ===
  function playSound(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'correct') {
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'wrong') {
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.setValueAtTime(180, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {}
  }

  // === END GAME ===
  function endGame(reason) {
    if (gameState.gameOver) return;
    gameState.gameOver = true;
    gameState.isRunning = false;
    clearInterval(gameState.timerInterval);

    // Save score
    const user = Auth.getUser();
    ScoreDB.add({
      score: gameState.score,
      mode: modeConfig[gameState.mode].label,
      difficulty: gameState.difficulty,
      correct: gameState.correctAnswers,
      wrong: gameState.wrongAnswers,
      streak: gameState.bestStreak,
      userName: user?.name || 'Anonymous',
    });

    showResultScreen(reason);
  }

  function showResultScreen(reason) {
    showScreen('result');

    const score = gameState.score;
    const correct = gameState.correctAnswers;
    const wrong = gameState.wrongAnswers;
    const total = correct + wrong;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Pick emoji and title
    let emoji = '🏆', title = 'Legendary!', subtitle = 'You absolutely crushed it!';
    if (score >= 5000) { emoji = '🏆'; title = 'Legendary!'; }
    else if (score >= 3000) { emoji = '🌟'; title = 'Amazing!'; subtitle = 'Top tier performance!'; }
    else if (score >= 1500) { emoji = '🎯'; title = 'Great Job!'; subtitle = 'Keep improving!'; }
    else if (score >= 500) { emoji = '👍'; title = 'Good Effort!'; subtitle = 'Practice makes perfect!'; }
    else { emoji = '💪'; title = 'Keep Going!'; subtitle = 'Every attempt makes you stronger!'; }

    if (reason === 'lives') { emoji = '💔'; title = 'Out of Lives!'; subtitle = 'Try again — you got this!'; }
    if (reason === 'timeout') { emoji = '⏰'; title = "Time's Up!"; subtitle = `Answered ${correct} questions!`; }

    document.getElementById('resultEmoji').textContent = emoji;
    document.getElementById('resultTitle').textContent = title;
    document.getElementById('resultSubtitle').textContent = subtitle;

    const user = Auth.getUser();
    const scoreData = {
      score: gameState.score,
      mode: modeConfig[gameState.mode].label,
      difficulty: gameState.difficulty,
      correct: gameState.correctAnswers,
      wrong: gameState.wrongAnswers,
      streak: gameState.bestStreak,
      userName: user?.name || 'Anonymous',
    };

    (async () => {
      try {
        await fetch(`${AWS_CONFIG.apiUrl}/scores`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scoreData)
        });
      } catch (err) {
        console.error('Failed to save score to AWS:', err);
      }
    })();

    // Animate score counting up
    let displayed = 0;
    const scoreEl = document.getElementById('finalScore');
    const step = score / 60;
    const scoreTimer = setInterval(() => {
      displayed = Math.min(displayed + step, score);
      scoreEl.textContent = formatNumber(Math.floor(displayed));
      if (displayed >= score) clearInterval(scoreTimer);
    }, 16);

    document.getElementById('rsCorrect').textContent = correct;
    document.getElementById('rsWrong').textContent = wrong;
    document.getElementById('rsStreak').textContent = gameState.bestStreak;
    document.getElementById('rsAccuracy').textContent = accuracy + '%';

    // Mock rank
    const rank = Math.max(1, Math.floor(1000 - score / 10) + Math.floor(Math.random() * 50));
    document.getElementById('resultRank').textContent = `#${formatNumber(rank)}`;

    // Confetti for good scores
    if (score >= 1000) launchConfetti();
  }

  // === CONFETTI ===
  function launchConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    const colors = ['#00d4ff', '#8b5cf6', '#10d98b', '#ff6b35', '#ffd700', '#ff3d9a'];
    const pieces = [];

    for (let i = 0; i < 120; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -10,
        r: Math.random() * 8 + 3,
        d: Math.random() * 120,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 10,
        tiltAngleIncrementFactor: 0.07 + Math.random() * 0.07,
        tiltAngle: 0,
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 2 + 1,
      });
    }

    let frame = 0;
    function drawConfetti() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.tiltAngle += p.tiltAngleIncrementFactor;
        p.y += p.vy;
        p.x += p.vx;
        p.tilt = Math.sin(p.tiltAngle) * 12;

        ctx.beginPath();
        ctx.ellipse(p.x, p.y, p.r, p.r * 0.4, p.tilt, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frame / 200);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      frame++;
      if (frame < 200) requestAnimationFrame(drawConfetti);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    drawConfetti();
  }

  // === PLAY AGAIN ===
  document.getElementById('playAgainBtn')?.addEventListener('click', () => {
    showScreen('mode');
  });

})();
