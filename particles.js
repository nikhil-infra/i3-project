// particles.js — Animated star/particle background
(function() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function randBetween(a, b) { return a + Math.random() * (b - a); }

  function createParticle() {
    return {
      x: Math.random() * W,
      y: Math.random() * H,
      r: randBetween(0.5, 2),
      alpha: randBetween(0.1, 0.6),
      speed: randBetween(0.1, 0.4),
      dx: randBetween(-0.2, 0.2),
      dy: -randBetween(0.1, 0.5),
      color: Math.random() > 0.7 ? '#8b5cf6' : '#00d4ff',
      twinkle: randBetween(0.01, 0.03),
      twinkleDir: 1,
    };
  }

  for (let i = 0; i < 140; i++) particles.push(createParticle());

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();

      p.x += p.dx;
      p.y += p.dy;
      p.alpha += p.twinkle * p.twinkleDir;
      if (p.alpha >= 0.7 || p.alpha <= 0.05) p.twinkleDir *= -1;

      if (p.y < -5 || p.x < -5 || p.x > W + 5) {
        p.x = Math.random() * W;
        p.y = H + 5;
      }
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }
  draw();
})();
