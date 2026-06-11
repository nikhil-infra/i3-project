// ==========================================
// MathBlast Educational Sound Engine
// No external files, purely code-generated
// ==========================================

const SoundEngine = (function() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let masterGain = null;

  function init() {
    if (!ctx) {
      ctx = new AudioContext();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  function playTone(freq, type, duration, vol=1) {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  function playNoise(duration, vol=1) {
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;
    
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    
    noise.start();
  }

  return {
    init: init,
    
    // UI interactions
    playClick: () => playTone(600, 'sine', 0.1, 0.2),
    playHover: () => playTone(400, 'sine', 0.05, 0.1),
    
    // Game logic
    playCorrect: () => {
      playTone(600, 'sine', 0.1, 0.3);
      setTimeout(() => playTone(800, 'sine', 0.2, 0.3), 100);
    },
    playWrong: () => {
      playTone(300, 'sawtooth', 0.3, 0.4);
    },
    
    // Specific effects
    playBulb: () => playTone(1200, 'square', 0.05, 0.1),
    playCoin: () => {
      playTone(1200, 'sine', 0.1, 0.3);
      setTimeout(() => playTone(1600, 'sine', 0.3, 0.3), 80);
    },
    playChaChing: () => {
      playNoise(0.2, 0.5); // Drawer opening
      setTimeout(() => playTone(2000, 'square', 0.1, 0.3), 100); // Bell
      setTimeout(() => playTone(3000, 'sine', 0.4, 0.3), 150); // Ring out
    },
    playThud: () => {
      playTone(100, 'square', 0.2, 0.5);
      playNoise(0.1, 0.3);
    },
    playPop: () => {
      playTone(800, 'sine', 0.1, 0.3);
    },
    playCannon: () => {
      playNoise(0.5, 0.8);
      playTone(100, 'sawtooth', 0.5, 0.6);
    },
    playLevelUp: () => {
      playTone(440, 'sine', 0.1, 0.3);
      setTimeout(() => playTone(554, 'sine', 0.1, 0.3), 100);
      setTimeout(() => playTone(659, 'sine', 0.3, 0.3), 200);
    }
  };
})();

// Auto-init
document.addEventListener('click', () => SoundEngine.init(), { once: true });
document.addEventListener('touchstart', () => SoundEngine.init(), { once: true });
