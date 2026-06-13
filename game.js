'use strict';

/* =============================================================
   PERSONALIZEAZA JOCUL — Editeaza aceste liste oricand!
   ============================================================= */

const COMPLIMENTS = [
  'Esti adorabila! 💕',
  'Cel mai dragut om din lume',
  'Persoana mea preferata ✨',
  '10/10 te-as alege mereu!',
  'Imi faci ziua mai frumoasa ☀️',
  'Premiul celei mai bune prietene 🏆',
  'Esti totul pentru mine 💖',
  'Zambetul tau imi lumineaza ziua',
  'Esti absolut minunata! 🌟',
  'Cu tine totul e mai bun 🌈',
  'Iti multumesc ca existi 🌸',
  'Esti visul meu devenit realitate 💫',
  'Cea mai tare fata din lume 🌍',
  // versete biblice
  'Pot totul in Hristos - Filipeni 4:13 📖',
  'Bucurati-va totdeauna in Domnul - Filipeni 4:4 📖',
  'Ma bizui pe Domnul - Psalmul 37:5 📖',
  'Domnul te iubeste - Ieremia 31:3 📖',
];

const GOOD_ITEMS = [
  { emoji: '❤️',  points: 10 },
  { emoji: '✈️',  points: 15 },
  { emoji: '🌸',  points: 10 },
  { emoji: '🍕',  points: 12 },
  { emoji: '🍫',  points: 12 },
  { emoji: '🧸',  points: 15 },
  { emoji: '🌮',  points: 12 },
  { emoji: '🤗',  points: 10 },
  { emoji: '💋',  points: 15 },
  { emoji: '💐',  points: 12 },
  { emoji: '🍓',  points: 10 },
  { emoji: '🎀',  points: 12 },
  { emoji: '💍',  points: 20 },
  { emoji: '📖',  points: 18 },
];

const BAD_ITEMS = [
  { emoji: '🕷️' },
  { emoji: '⏰' },
  { emoji: '💩' },
  { text:  'MON' },
];

/* ============================================================= */

const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

// ── Resize ───────────────────────────────────────────────────
function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => {
  resize();
  basket.y       = canvas.height - 70;
  clampBasket();
});

// ── State ────────────────────────────────────────────────────
let gameState = 'start'; // 'start' | 'playing' | 'gameover'
let score     = 0;
let lives     = 3;
let lastTime  = 0;
let lastSpawn = 0;
let soundOn   = true;
let audioCtx  = null;

let items       = [];
let floatTexts  = [];
let particles   = [];
let confettiPcs = [];

// ── Basket ───────────────────────────────────────────────────
const basket = {
  x: 0, targetX: 0,
  y: 0,
  w: 130, h: 55,
  squish: 0,
};

// ── Input ────────────────────────────────────────────────────
const keys = {};

window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if ((e.key === ' ' || e.key === 'Enter') && gameState !== 'playing') startGame();
  if (e.key.toLowerCase() === 'm') soundOn = !soundOn;
});
window.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('mousemove', e => {
  if (gameState !== 'playing') return;
  basket.targetX = e.clientX - canvas.getBoundingClientRect().left;
});

canvas.addEventListener('click', e => {
  const r = canvas.getBoundingClientRect();
  handleTap(e.clientX - r.left, e.clientY - r.top);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const r = canvas.getBoundingClientRect();
  handleTap(e.touches[0].clientX - r.left, e.touches[0].clientY - r.top);
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (gameState !== 'playing') return;
  basket.targetX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
}, { passive: false });

function handleTap(x, y) {
  // Sound toggle — bottom-right corner
  if (Math.hypot(x - (canvas.width - 36), y - (canvas.height - 36)) < 34) {
    soundOn = !soundOn;
    return;
  }
  if (gameState === 'start')    hitCheck(x, y, startBtnRect(),   startGame);
  if (gameState === 'gameover') hitCheck(x, y, restartBtnRect(), startGame);
}

function hitCheck(x, y, r, fn) {
  if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) fn();
}

// ── Audio ─────────────────────────────────────────────────────
function getAC() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep(f1, f2, dur, vol) {
  vol = vol || 0.25;
  if (!soundOn) return;
  try {
    const ac  = getAC();
    const osc = ac.createOscillator();
    const g   = ac.createGain();
    osc.connect(g);
    g.connect(ac.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f1, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(f2, ac.currentTime + dur);
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    osc.start();
    osc.stop(ac.currentTime + dur);
  } catch (_) {}
}

function beepGood()     { beep(523, 880, 0.22); }
function beepBad()      { beep(300, 140, 0.30, 0.2); }
function beepGameover() { beep(380, 110, 0.60, 0.3); }

// ── Entity helpers ────────────────────────────────────────────
function spawnItem(ts) {
  const margin = 55;
  const x      = margin + Math.random() * (canvas.width - margin * 2);
  const speed  = 1.5 + score / 50 + Math.random() * 0.8;
  const isGood = Math.random() < 0.65;

  if (isGood) {
    const t = GOOD_ITEMS[Math.floor(Math.random() * GOOD_ITEMS.length)];
    items.push({
      x, y: -48, speed, type: 'good',
      emoji: t.emoji, pts: t.points,
      wobble: Math.random() * Math.PI * 2,
    });
  } else {
    const t = BAD_ITEMS[Math.floor(Math.random() * BAD_ITEMS.length)];
    items.push({
      x, y: -48, speed, type: 'bad',
      emoji: t.emoji, text: t.text,
      wobble: Math.random() * Math.PI * 2,
    });
  }
  lastSpawn = ts;
}

function addFloat(x, y, msg) {
  floatTexts.push({ x, y, msg, life: 1 });
}

function burst(x, y, good) {
  const cols = good
    ? ['#ff6b9d','#ff9de2','#ffb3c1','#ffc8dd','#b5a8ff','#ffec80']
    : ['#aaa','#888','#ccc','#666'];
  for (let i = 0; i < 14; i++) {
    const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const s = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 1.5,
      color: cols[i % cols.length],
      r: 3 + Math.random() * 5,
      life: 1,
    });
  }
}

function makeConfetti() {
  const cols = ['#ff6b9d','#b5a8ff','#ffd700','#afffaf','#87ceeb','#ffb347','#ff85a1'];
  for (let i = 0; i < 110; i++) {
    confettiPcs.push({
      x:   Math.random() * canvas.width,
      y:  -30 - Math.random() * canvas.height * 0.6,
      vx:  (Math.random() - 0.5) * 2.5,
      vy:  1.8 + Math.random() * 3,
      color: cols[i % cols.length],
      w:   7 + Math.random() * 9,
      h:   4 + Math.random() * 5,
      rot: Math.random() * Math.PI * 2,
      rv:  (Math.random() - 0.5) * 0.14,
    });
  }
}

// ── Geometry ──────────────────────────────────────────────────
function rrect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);   ctx.arcTo(x + w, y,   x + w, y + r,     r);
  ctx.lineTo(x + w, y + h-r); ctx.arcTo(x + w, y+h, x + w-r, y + h,   r);
  ctx.lineTo(x + r, y + h);   ctx.arcTo(x,     y+h, x,       y + h-r,  r);
  ctx.lineTo(x, y + r);       ctx.arcTo(x,     y,   x + r,   y,        r);
  ctx.closePath();
}

function clampBasket() {
  const half = basket.w / 2;
  basket.targetX = Math.max(half, Math.min(canvas.width - half, basket.targetX));
}

// ── Button rects ──────────────────────────────────────────────
function startBtnRect()   { return { x: canvas.width/2 - 95,  y: canvas.height * 0.56, w: 190, h: 62 }; }
function restartBtnRect() { return { x: canvas.width/2 - 110, y: canvas.height * 0.60, w: 220, h: 62 }; }

// ── Draw helpers ──────────────────────────────────────────────
function drawBG() {
  const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  g.addColorStop(0,   '#ffe4f0');
  g.addColorStop(0.5, '#f0e4ff');
  g.addColorStop(1,   '#e4f0ff');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawBasket() {
  const sx = 1 + basket.squish * 0.28;
  const sy = 1 - basket.squish * 0.18;

  ctx.save();
  ctx.translate(basket.x, basket.y);
  ctx.scale(sx, sy);

  const bx = -basket.w / 2;
  const by = -basket.h / 2;

  // drop shadow
  ctx.globalAlpha = 0.18;
  ctx.fillStyle   = '#9370db';
  rrect(bx + 4, by + 6, basket.w, basket.h, 22);
  ctx.fill();
  ctx.globalAlpha = 1;

  // body gradient
  const g = ctx.createLinearGradient(bx, by, bx, by + basket.h);
  g.addColorStop(0, '#ffb3d9');
  g.addColorStop(1, '#ff6b9d');
  rrect(bx, by, basket.w, basket.h, 22);
  ctx.fillStyle = g;
  ctx.fill();

  // rim stroke
  ctx.strokeStyle = '#ff85a1';
  ctx.lineWidth   = 3;
  ctx.stroke();

  // weave lines
  ctx.save();
  rrect(bx, by, basket.w, basket.h, 22);
  ctx.clip();
  ctx.strokeStyle = 'rgba(255,255,255,0.28)';
  ctx.lineWidth   = 2;
  for (let i = 1; i < 4; i++) {
    const lx = bx + (basket.w / 4) * i;
    ctx.beginPath();
    ctx.moveTo(lx, by);
    ctx.lineTo(lx, by + basket.h);
    ctx.stroke();
  }
  ctx.restore();

  // center icon
  ctx.font         = '26px serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('💕', 0, 2);

  ctx.restore();
}

function drawItem(item) {
  item.wobble += 0.045;
  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(Math.sin(item.wobble) * 0.13);

  if (item.text) {
    // MON calendar block
    rrect(-26, -20, 52, 40, 8);
    ctx.fillStyle = '#e74c3c';
    ctx.fill();
    ctx.font         = "bold 19px 'Fredoka One', cursive";
    ctx.fillStyle    = '#fff';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.text, 0, 0);
  } else {
    ctx.font         = '44px serif';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.emoji, 0, 0);
  }
  ctx.restore();
}

function drawUI() {
  // Lives (top-left)
  ctx.textBaseline = 'top';
  ctx.font         = '30px serif';
  for (let i = 0; i < 3; i++) {
    ctx.globalAlpha = i < lives ? 1 : 0.22;
    ctx.fillText('❤️', 16 + i * 40, 16);
  }
  ctx.globalAlpha = 1;

  // Score (top-right)
  ctx.font         = "bold 26px 'Fredoka One', cursive";
  ctx.fillStyle    = '#c2185b';
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(score + ' ✨', canvas.width - 16, 16);

  // Sound toggle (bottom-right)
  ctx.font         = '28px serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(soundOn ? '🔊' : '🔇', canvas.width - 36, canvas.height - 36);
}

function drawBtn(label, r) {
  const g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + r.h);
  g.addColorStop(0, '#ff6b9d');
  g.addColorStop(1, '#d63384');
  rrect(r.x, r.y, r.w, r.h, 31);
  ctx.fillStyle = g;
  ctx.fill();

  ctx.font         = "bold 26px 'Fredoka One', cursive";
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle    = '#fff';
  ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2);
}

function drawSoundBtn() {
  ctx.font         = '28px serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(soundOn ? '🔊' : '🔇', canvas.width - 36, canvas.height - 36);
}

// ── Start screen ──────────────────────────────────────────────
function drawStartScreen(ts) {
  drawBG();

  // floating bg hearts
  const hPos = [
    { fx: 0.08, fy: 0.18, ph: 0   },
    { fx: 0.92, fy: 0.12, ph: 1.1 },
    { fx: 0.04, fy: 0.65, ph: 2   },
    { fx: 0.96, fy: 0.70, ph: 1.5 },
    { fx: 0.50, fy: 0.88, ph: 0.7 },
    { fx: 0.20, fy: 0.90, ph: 0.3 },
    { fx: 0.80, fy: 0.85, ph: 1.8 },
  ];
  ctx.font         = '34px serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  hPos.forEach(h => {
    ctx.globalAlpha = 0.26;
    ctx.fillText('💕',
      h.fx * canvas.width,
      h.fy * canvas.height + Math.sin(ts / 900 + h.ph) * 14);
  });
  ctx.globalAlpha = 1;

  // Title with gradient
  const fs = Math.min(68, canvas.width / 8);
  ctx.font      = `bold ${fs}px 'Fredoka One', cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tg = ctx.createLinearGradient(canvas.width / 2 - 220, 0, canvas.width / 2 + 220, 0);
  tg.addColorStop(0, '#ff6b9d');
  tg.addColorStop(1, '#9b59b6');
  ctx.fillStyle = tg;

  const pulse = 1 + Math.sin(ts / 600) * 0.015;
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height * 0.33);
  ctx.scale(pulse, pulse);
  ctx.fillText('Catch My Love 💕', 0, 0);
  ctx.restore();

  // Subtitle
  ctx.font      = `${Math.min(20, canvas.width / 22)}px 'Fredoka One', cursive`;
  ctx.fillStyle = '#b36b9e';
  ctx.fillText('Prinde iubirea din aer! 💨❤️', canvas.width / 2, canvas.height * 0.46);

  drawBtn('Joaca 💕', startBtnRect());

  // Instructions
  ctx.font      = `${Math.min(15, canvas.width / 30)}px 'Fredoka One', cursive`;
  ctx.fillStyle = '#c084b0';
  ctx.textAlign = 'center';
  ctx.fillText('Mouse · Atingere · Sageti ← →', canvas.width / 2, canvas.height * 0.75);
  ctx.fillText('M = sunet on/off', canvas.width / 2, canvas.height * 0.81);

  drawSoundBtn();
}

// ── Game over screen ──────────────────────────────────────────
function getEndMsg() {
  if (score <  25) return 'Hmm... mai practica putin, iubire! 😄';
  if (score <  70) return 'Bravo! Ai prins cateva iubiri! 💪';
  if (score < 130) return 'Wow, esti senzationala! 🌟';
  return 'LEGENDA ABSOLUTA! Ce fata extraordinara! 🏆❤️';
}

function drawGameOverScreen() {
  drawBG();

  // confetti
  confettiPcs.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.globalAlpha = 0.92;
    ctx.fillStyle   = c.color;
    ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
    ctx.restore();
  });

  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.font      = `bold ${Math.min(58, canvas.width / 9)}px 'Fredoka One', cursive`;
  ctx.fillStyle = '#c2185b';
  ctx.fillText('Game Over! 💔', canvas.width / 2, canvas.height * 0.28);

  ctx.font      = `bold ${Math.min(42, canvas.width / 11)}px 'Fredoka One', cursive`;
  ctx.fillStyle = '#9b59b6';
  ctx.fillText('Scor: ' + score + ' ✨', canvas.width / 2, canvas.height * 0.41);

  ctx.font      = `${Math.min(19, canvas.width / 22)}px 'Fredoka One', cursive`;
  ctx.fillStyle = '#b36b9e';
  ctx.fillText(getEndMsg(), canvas.width / 2, canvas.height * 0.52);

  drawBtn('Joaca din nou 💕', restartBtnRect());

  drawSoundBtn();
}

// ── Game control ──────────────────────────────────────────────
function startGame() {
  score = 0; lives = 3;
  items = []; floatTexts = []; particles = []; confettiPcs = [];
  lastSpawn = 0;
  basket.x       = canvas.width  / 2;
  basket.targetX = canvas.width  / 2;
  basket.y       = canvas.height - 70;
  basket.squish  = 0;
  gameState = 'playing';
}

// ── Update ────────────────────────────────────────────────────
function update(ts) {
  // Keyboard input
  if (keys['ArrowLeft'])  basket.targetX -= 7;
  if (keys['ArrowRight']) basket.targetX += 7;
  clampBasket();

  basket.x     += (basket.targetX - basket.x) * 0.2;
  basket.squish *= 0.82;

  // Spawn scheduling
  const interval = Math.max(700, 1800 - score * 5);
  if (ts - lastSpawn > interval && items.length < 16) spawnItem(ts);

  // Collision boundaries
  const bTop   = basket.y - basket.h / 2;
  const bBot   = basket.y + basket.h / 2;
  const bLeft  = basket.x - basket.w / 2;
  const bRight = basket.x + basket.w / 2;

  items = items.filter(item => {
    item.y += item.speed;

    if (item.y + 24 >= bTop && item.y - 24 <= bBot &&
        item.x      >= bLeft && item.x      <= bRight) {

      if (item.type === 'good') {
        score += item.pts;
        beepGood();
        basket.squish = 1;
        addFloat(basket.x, bTop - 12,
          COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)]);
        burst(item.x, item.y, true);
      } else {
        lives--;
        beepBad();
        basket.squish = 0.65;
        addFloat(basket.x, bTop - 12, '💔 Vai de mine!');
        burst(item.x, item.y, false);
        if (lives <= 0) {
          beepGameover();
          gameState = 'gameover';
          if (score >= 80) makeConfetti();
        }
      }
      return false;
    }

    return item.y < canvas.height + 60;
  });

  floatTexts = floatTexts.filter(ft => {
    ft.y    -= 2;
    ft.life -= 0.016;
    return ft.life > 0;
  });

  particles = particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.18;
    p.r  *= 0.97;
    p.life -= 0.028;
    return p.life > 0;
  });
}

// ── Draw playing state ────────────────────────────────────────
function drawGame() {
  drawBG();

  items.forEach(drawItem);
  drawBasket();

  particles.forEach(p => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle   = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  floatTexts.forEach(ft => {
    ctx.save();
    ctx.globalAlpha  = ft.life;
    ctx.font         = "bold 16px 'Fredoka One', cursive";
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle  = 'white';
    ctx.lineWidth    = 3;
    ctx.strokeText(ft.msg, ft.x, ft.y);
    ctx.fillStyle    = '#ff3d7a';
    ctx.fillText(ft.msg, ft.x, ft.y);
    ctx.restore();
  });

  drawUI();
}

// ── Main loop ─────────────────────────────────────────────────
function loop(ts) {
  const dt = Math.min(ts - lastTime, 50);
  lastTime = ts;

  if (gameState === 'start') {
    drawStartScreen(ts);
  } else if (gameState === 'gameover') {
    confettiPcs.forEach(c => {
      c.x += c.vx; c.y += c.vy; c.rot += c.rv;
      if (c.y > canvas.height + 20) {
        c.y = -20;
        c.x = Math.random() * canvas.width;
      }
    });
    drawGameOverScreen();
  } else {
    update(ts);
    drawGame();
  }

  requestAnimationFrame(loop);
}

// ── Boot ──────────────────────────────────────────────────────
basket.x       = canvas.width  / 2;
basket.targetX = canvas.width  / 2;
basket.y       = canvas.height - 70;
requestAnimationFrame(loop);
