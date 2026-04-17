/* ═══════════════════════════════════════════════════════════
   JONEIL CAOILE // PORTFOLIO JS (CLEAN REBUILD)
   Architecture: ZERO competing mousemove handlers.
   One cursor system. No body transforms. Modular features.
   ═══════════════════════════════════════════════════════════ */

(function(){
'use strict';

/* ─── Safe localStorage wrapper ─── */
function ls(key, fallback) {
  try { return localStorage.getItem(key); } catch { return fallback || null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, val); } catch { /* private mode */ }
}

/* ─── State ─── */
const S = {
  theme: ls('jc-theme') || (matchMedia('(prefers-color-scheme:light)').matches ? 'light' : 'dark'),
  particles: ls('jc-particles') !== 'off',
  crt: ls('jc-crt') === 'on',
  xp: parseInt(ls('jc-xp')) || 0,
  maxXp: 2026,
  menuOpen: false,
  sectionsRevealed: JSON.parse(ls('jc-sections') || '{}'),
  isMobile: matchMedia('(pointer:coarse)').matches,
  reducedMotion: matchMedia('(prefers-reduced-motion:reduce)').matches,
  konami: [],
  konamiCode: ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'],
  termHistory: [],
  termHistIdx: -1,
  petModel: ls('jc-pet-model') || null,
  petBehavior: ls('jc-pet-behavior') || 'stay',
  petSpark: ls('jc-pet-spark') || 'default',
};

/* ─── Page Visibility (pause animations when tab hidden) ─── */
var pageVisible = true;
document.addEventListener('visibilitychange', function() {
  pageVisible = !document.hidden;
});

/* ─── DOM refs ─── */
const $ = (s, p) => (p || document).querySelector(s);
const $$ = (s, p) => [...(p || document).querySelectorAll(s)];

const DOM = {
  entranceOverlay: $('#entranceOverlay'),
  entranceCanvas: $('#entranceCanvas'),
  entranceTitle: $('#entranceTitle'),
  entranceSubtitle: $('#entranceSubtitle'),
  entranceCta: $('#entranceCta'),
  loader: $('#loader'),
  loaderText: $('#loaderText'),
  loaderFill: $('#loaderFill'),
  gameMenu: $('#gameMenu'),
  menuReopen: $('#menuReopen'),
  gmStart: $('#gmStart'),
  gmCharSelect: $('#gmCharSelect'),
  gmOptions: $('#gmOptions'),
  charSelect: $('#charSelect'),
  charGrid: $('#charGrid'),
  charBack: $('#charBack'),
  optionsPanel: $('#optionsPanel'),
  optTheme: $('#optTheme'),
  optParticles: $('#optParticles'),
  optCRT: $('#optCRT'),
  optBack: $('#optBack'),
  toast: $('#toast'),
  nav: $('#mainNav'),
  hamburger: $('#hamburger'),
  mobileMenu: $('#mobileMenu'),
  themeToggle: $('#themeToggle'),
  scrollFill: $('#scrollFill'),
  termBody: $('#terminalBody'),
  termInput: $('#terminalInput'),
  cursorDot: $('.cursor-dot'),
  cursorRing: $('.cursor-ring'),
  xpHud: $('#xpHud'),
  xpTitle: $('#xpTitle'),
  xpFill: $('#xpFill'),
  xpText: $('#xpText'),
  critterCanvas: $('#critterCanvas'),
};

/* ═══════════════════════════════════════
   1. INTERACTIVE CONSTELLATION ENTRANCE
   ═══════════════════════════════════════ */

var constellationRAF = null;

function initConstellation() {
  var canvas = DOM.entranceCanvas;
  var ctx = canvas.getContext('2d');
  var W, H, dismissed = false;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  /* ── ECG Waveform Data ── */
  function ecgSample(t) {
    t = t % 1;
    if (t < 0.10) return 0;
    /* P wave */
    if (t < 0.18) { var p = (t - 0.10) / 0.08; return Math.sin(p * Math.PI) * 0.12; }
    if (t < 0.22) return 0;
    /* Q dip */
    if (t < 0.25) { var q = (t - 0.22) / 0.03; return -Math.sin(q * Math.PI) * 0.08; }
    /* R spike */
    if (t < 0.30) { var r = (t - 0.25) / 0.05; return Math.sin(r * Math.PI) * 1.0; }
    /* S dip */
    if (t < 0.34) { var s = (t - 0.30) / 0.04; return -Math.sin(s * Math.PI) * 0.15; }
    if (t < 0.42) return 0;
    /* T wave */
    if (t < 0.56) { var tw = (t - 0.42) / 0.14; return Math.sin(tw * Math.PI) * 0.2; }
    return 0;
  }

  var startTime = Date.now();
  var TRACE_SPEED = 200;
  var BEAT_PERIOD = 0.9;
  var traceHistory = [];
  var TRAIL_LEN = 500;
  var phase = 'tracing';
  var flatlineStart = 0;
  var pulseTime = 0;
  var flashAlpha = 0;
  var traceX = 0;

  /* Grid dots for monitor feel */
  var gridDots = [];
  function buildGrid() {
    gridDots = [];
    for (var gx = 40; gx < W; gx += 40) {
      for (var gy = 40; gy < H; gy += 40) {
        gridDots.push({ x: gx, y: gy });
      }
    }
  }
  buildGrid();

  /* Subtle floating particles */
  var particles = [];
  var PCOUNT = S.isMobile ? 20 : 40;
  for (var i = 0; i < PCOUNT; i++) {
    particles.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
      r: Math.random() * 1.5 + 0.3, alpha: Math.random() * 0.15 + 0.05
    });
  }

  function draw() {
    var now = Date.now();
    var elapsed = (now - startTime) / 1000;
    ctx.clearRect(0, 0, W, H);

    /* Grid */
    ctx.fillStyle = 'rgba(198,123,46,0.035)';
    for (var gi = 0; gi < gridDots.length; gi++) {
      ctx.fillRect(gridDots[gi].x, gridDots[gi].y, 1, 1);
    }

    /* Particles */
    for (var pi = 0; pi < particles.length; pi++) {
      var pt = particles[pi];
      pt.x += pt.vx; pt.y += pt.vy;
      if (pt.x < 0) pt.x = W; if (pt.x > W) pt.x = 0;
      if (pt.y < 0) pt.y = H; if (pt.y > H) pt.y = 0;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(198,123,46,' + pt.alpha + ')';
      ctx.fill();
    }

    /* ECG Trace */
    var midY = H * 0.48;
    var amp = Math.min(H * 0.16, 90);

    if (phase === 'tracing') {
      traceX += TRACE_SPEED / 60;
      var beatT = (elapsed / BEAT_PERIOD) % 1;
      var sample = ecgSample(beatT);
      traceHistory.push({ x: traceX % W, y: midY - sample * amp });
      if (traceHistory.length > TRAIL_LEN) traceHistory.shift();
      if (elapsed > 2.5) { phase = 'flatline'; flatlineStart = now; }
    } else if (phase === 'flatline') {
      traceX += TRACE_SPEED / 60;
      traceHistory.push({ x: traceX % W, y: midY });
      if (traceHistory.length > TRAIL_LEN) traceHistory.shift();
      if (now - flatlineStart > 1200) { phase = 'pulse'; pulseTime = now; flashAlpha = 0.5; }
    } else if (phase === 'pulse') {
      var pt2 = (now - pulseTime) / 1000;
      traceX += TRACE_SPEED / 60;
      var sample2 = pt2 < 0.8 ? ecgSample(pt2 / 0.8) * 1.5 : ecgSample(((pt2 - 0.8) / BEAT_PERIOD) % 1);
      traceHistory.push({ x: traceX % W, y: midY - sample2 * amp });
      if (traceHistory.length > TRAIL_LEN) traceHistory.shift();
    }

    /* Draw trail */
    if (traceHistory.length > 1) {
      for (var ti = 1; ti < traceHistory.length; ti++) {
        var age = ti / traceHistory.length;
        var pv = traceHistory[ti - 1], cu = traceHistory[ti];
        if (Math.abs(cu.x - pv.x) > W * 0.5) continue;
        ctx.beginPath();
        ctx.moveTo(pv.x, pv.y);
        ctx.lineTo(cu.x, cu.y);
        ctx.strokeStyle = 'rgba(198,123,46,' + (age * 0.8) + ')';
        ctx.lineWidth = 1 + age * 1.5;
        ctx.stroke();
      }
      /* Glow at head */
      var hd = traceHistory[traceHistory.length - 1];
      var grd = ctx.createRadialGradient(hd.x, hd.y, 0, hd.x, hd.y, 24);
      grd.addColorStop(0, 'rgba(198,123,46,0.4)');
      grd.addColorStop(1, 'rgba(198,123,46,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(hd.x - 24, hd.y - 24, 48, 48);
    }

    /* Flash on pulse */
    if (flashAlpha > 0) {
      ctx.fillStyle = 'rgba(198,123,46,' + flashAlpha + ')';
      ctx.fillRect(0, 0, W, H);
      flashAlpha *= 0.92;
      if (flashAlpha < 0.01) flashAlpha = 0;
    }

    if (!dismissed) constellationRAF = requestAnimationFrame(draw);
  }

  draw();

  /* Text reveal: name appears with the pulse beat */
  setTimeout(function() {
    if (dismissed) return;
    DOM.entranceTitle.style.transition = 'opacity 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1)';
    DOM.entranceTitle.style.transform = 'translateY(0)';
    DOM.entranceTitle.style.opacity = '1';
  }, 3700);

  setTimeout(function() {
    if (dismissed) return;
    DOM.entranceSubtitle.style.transition = 'opacity 1s cubic-bezier(0.4,0,0.2,1)';
    DOM.entranceSubtitle.style.opacity = '1';
  }, 4400);

  setTimeout(function() {
    if (dismissed) return;
    DOM.entranceCta.style.opacity = '1';
    DOM.entranceCta.style.pointerEvents = 'auto';
  }, 5200);

  /* Dismiss */
  function triggerDismiss() {
    if (dismissed) return;
    dismissed = true;
    DOM.entranceTitle.style.transition = 'opacity 0.4s';
    DOM.entranceTitle.style.opacity = '0';
    DOM.entranceSubtitle.style.transition = 'opacity 0.3s';
    DOM.entranceSubtitle.style.opacity = '0';
    DOM.entranceCta.style.transition = 'opacity 0.2s';
    DOM.entranceCta.style.opacity = '0';
    setTimeout(function() {
      DOM.entranceOverlay.classList.add('fade-out');
      setTimeout(function() {
        DOM.entranceOverlay.style.display = 'none';
        cancelAnimationFrame(constellationRAF);
        canvas.width = 0; canvas.height = 0;
        window.removeEventListener('resize', resize);
      }, 800);
    }, 300);
    enterSite();
  }

  DOM.entranceOverlay.addEventListener('click', triggerDismiss);
  DOM.entranceOverlay.addEventListener('wheel', triggerDismiss, { passive: true });
  var touchStartY = 0;
  DOM.entranceOverlay.addEventListener('touchstart', function(e) {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  DOM.entranceOverlay.addEventListener('touchend', function(e) {
    var dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
    if (dy < 10) triggerDismiss();
  }, { passive: true });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      triggerDismiss();
      document.removeEventListener('keydown', onKey);
    }
  });

  /* No auto-dismiss: wait for user interaction */

  /* Reduced motion: skip animation, show static */
  if (S.reducedMotion) {
    DOM.entranceTitle.style.opacity = '1';
    DOM.entranceSubtitle.style.opacity = '1';
    DOM.entranceCta.style.opacity = '1';
    cancelAnimationFrame(constellationRAF);
    setTimeout(triggerDismiss, 1500);
  }
}

function enterSite() {
  S.menuOpen = false;
  document.body.style.overflow = '';
  if (!S.reducedMotion) initScrollReveals();
  initParticleSystem();
  initMagneticButtons();
  awardXP(50, 'Welcome bonus');
  /* Reveal nav with a smooth slide-down */
  setTimeout(function() { DOM.nav.classList.add('nav-visible'); }, 300);
  /* Show the menu reopen button */
  setTimeout(function() { DOM.menuReopen.classList.add('visible'); }, 600);
}

/* Legacy loader functions (kept for compatibility) */
const BOOT_LINES = [
  'INITIALIZING', 'Loading device projects...',
  'Running validation checks...', 'SYSTEM READY'
];
function runLoader() {
  /* Now just starts the constellation entrance */
  initConstellation();
}
function showGameMenu() {
  /* No longer called from loader. Game menu accessible via MENU button. */
}

function dismissMenu() {
  DOM.gameMenu.classList.remove('visible');
  S.menuOpen = false;
  document.body.style.overflow = '';
  /* If enterSite hasn't run yet (menu opened from reopen), just close it */
  setTimeout(function() { DOM.menuReopen.classList.add('visible'); }, 600);
}

function reopenMenu() {
  DOM.menuReopen.classList.remove('visible');
  DOM.charSelect.classList.remove('visible');
  DOM.optionsPanel.classList.remove('visible');
  DOM.gameMenu.classList.add('visible');
  S.menuOpen = true;
  DOM.gmStart.focus();
}

/* Menu reopen button */
DOM.menuReopen.addEventListener('click', reopenMenu);

/* Game menu buttons */
DOM.gmStart.addEventListener('click', dismissMenu);
DOM.gmCharSelect.addEventListener('click', () => {
  DOM.gameMenu.classList.remove('visible');
  DOM.charSelect.classList.add('visible');
});
DOM.gmOptions.addEventListener('click', () => {
  DOM.gameMenu.classList.remove('visible');
  DOM.optionsPanel.classList.add('visible');
});
DOM.charBack.addEventListener('click', () => {
  DOM.charSelect.classList.remove('visible');
  DOM.gameMenu.classList.add('visible');
});
DOM.optBack.addEventListener('click', () => {
  DOM.optionsPanel.classList.remove('visible');
  DOM.gameMenu.classList.add('visible');
});

/* Keyboard nav for game menu */
document.addEventListener('keydown', e => {
  if (!S.menuOpen) return;
  if (e.key === 'Enter') {
    const active = document.activeElement;
    if (active && active.classList.contains('gm-opt')) active.click();
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const opts = $$('.gm-opt');
    const idx = opts.indexOf(document.activeElement);
    if (idx === -1) return;
    e.preventDefault();
    const next = e.key === 'ArrowDown' ? (idx + 1) % opts.length : (idx - 1 + opts.length) % opts.length;
    opts[next].focus();
  }
});

/* ═══════════════════════════════════════
   2. CHARACTER SELECT
   ═══════════════════════════════════════ */
const CHARACTERS = [
  { name: 'SoCal Kid', class: 'Origin', desc: 'Carson/Torrance native. 400+ hrs clinical observation. The starting build.', sprite: 'socal', glow: '#FF6B35' },
  { name: 'Prospector', class: 'Job Seeker', desc: 'Actively hunting SoCal medtech roles. Validation, apps, R&D, HFE.', sprite: 'prospector', glow: '#D4A233' },
  { name: 'Field Analyst', class: 'Applications', desc: 'End-user training, field feedback, troubleshooting docs.', sprite: 'analyst', glow: '#42A5F5' },
  { name: 'Duck', class: 'Debug Companion', desc: 'Rubber duck debugging partner. Surprisingly effective.', sprite: 'duck', glow: '#FFD700' },
  { name: 'Acolyte', class: 'Validation', desc: 'IQ/OQ/PQ protocols, risk-based test strategies, CAPA workflows.', sprite: 'acolyte', glow: '#8866CC' },
  { name: 'Sage', class: 'Regulatory', desc: 'FDA 21 CFR 820, IEC 62366-1, ISO 14971. Knows the regs.', sprite: 'sage', glow: '#2E5BD0' },
  { name: 'Blacksmith', class: 'R&D', desc: 'Sensor systems, signal processing, rapid prototyping.', sprite: 'blacksmith', glow: '#FF6600' },
  { name: 'Creator', class: 'Human Factors', desc: 'Usability studies, use error classification, HFE reports.', sprite: 'creator', glow: '#FF69B4' },
];

/* ══════════════════════════════════════════════════════
   Pixel art character sprite renderer (RO chibi style)
   Resolution: 2px per pixel (~24x36 pixel art grid)
   Features: large round head, small body, detail shading,
   idle breathing frame support
   ══════════════════════════════════════════════════════ */
function drawCharSprite(ctx, type, w, h, frame) {
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  var p = 2;
  var cx = Math.floor(w / 2);
  var cy = Math.floor(h / 2) + 4;
  /* Breathing offset: frame 0 = normal, frame 1 = slight rise */
  var breathY = (frame === 1) ? -1 : 0;

  function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + (y + breathY) * p, p, p); }
  function run(x, y, len, c) { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + (y + breathY) * p, len * p, p); }
  /* No-breath versions for shadow/ground elements */
  function pxG(x, y, c) { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + y * p, p, p); }
  function runG(x, y, len, c) { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + y * p, len * p, p); }

  function drawBody(skinC, skinShade, skinHi, shirtC, shirtHi, shirtShade, pantsC, pantsShade, hairC, hairHi, hairShade, hairStyle, extras) {
    var e = extras || {};

    /* ── Shadow under feet (no breath offset) ── */
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(cx - 6 * p, cy + 5 * p, 12 * p, 2 * p);

    /* ── Hair back layer ── */
    if (hairStyle === 'long' || hairStyle === 'flowing') {
      run(-7, -14, 14, hairShade); run(-7, -13, 14, hairC);
      run(-7, -12, 1, hairC); run(6, -12, 1, hairC);
      run(-7, -11, 1, hairShade); run(6, -11, 1, hairShade);
      run(-7, -10, 1, hairC); run(6, -10, 1, hairC);
      run(-7, -9, 1, hairShade); run(6, -9, 1, hairShade);
      run(-7, -8, 1, hairC); run(6, -8, 1, hairC);
      run(-6, -7, 1, hairShade); run(5, -7, 1, hairShade);
    }

    /* ── Head (large, round = RO chibi) ── */
    run(-3, -17, 6, skinC);
    run(-5, -16, 10, skinC);
    run(-6, -15, 12, skinC);
    run(-6, -14, 12, skinC);
    run(-6, -13, 12, skinC);
    run(-6, -12, 12, skinC);
    run(-6, -11, 12, skinC);
    run(-6, -10, 12, skinC);
    run(-5, -9, 10, skinC);
    run(-4, -8, 8, skinC);
    /* Skin shading (right side + chin) */
    run(3, -15, 2, skinShade); run(3, -14, 2, skinShade);
    run(3, -13, 2, skinShade); run(3, -12, 2, skinShade);
    run(3, -11, 2, skinShade);
    run(-3, -8, 6, skinShade);
    /* Highlight on forehead */
    run(-2, -16, 2, skinHi);

    /* ── Eyes: big RO-style 3x2 with iris + highlight ── */
    /* Left eye */
    run(-4, -13, 3, '#1a1a2e'); /* top lid */
    px(-4, -12, '#2a3a5a'); px(-3, -12, '#3a5a8a'); px(-2, -12, '#2a3a5a'); /* iris */
    px(-4, -11, '#334'); px(-3, -11, '#445'); px(-2, -11, '#334'); /* lower */
    px(-3, -13, '#FFF'); /* highlight dot */
    /* Right eye */
    run(1, -13, 3, '#1a1a2e');
    px(1, -12, '#2a3a5a'); px(2, -12, '#3a5a8a'); px(3, -12, '#2a3a5a');
    px(1, -11, '#334'); px(2, -11, '#445'); px(3, -11, '#334');
    px(2, -13, '#FFF');

    /* Cheek blush */
    px(-5, -11, '#FFB8A0'); px(-5, -10, '#FFB8A0');
    px(4, -11, '#FFB8A0'); px(4, -10, '#FFB8A0');

    /* Nose hint */
    px(0, -10, skinShade);

    /* Mouth */
    px(-1, -9, '#C45'); px(0, -9, '#C45');

    /* ── Hair ── */
    if (hairStyle === 'spiky') {
      run(-6, -16, 12, hairC); run(-6, -15, 12, hairC); run(-5, -14, 10, hairC);
      /* Spikes */
      px(-4, -17, hairC); px(-2, -18, hairC); px(0, -19, hairHi); px(2, -18, hairC); px(4, -17, hairC);
      px(-1, -20, hairHi); px(1, -20, hairHi); /* tallest */
      px(0, -21, hairHi);
      /* Side fringe */
      run(-6, -13, 2, hairC); run(4, -13, 2, hairC);
      run(-6, -12, 1, hairShade); run(5, -12, 1, hairShade);
      /* Highlights */
      px(-1, -17, hairHi); px(1, -16, hairHi);
    } else if (hairStyle === 'bowl') {
      run(-4, -18, 8, hairC);
      run(-5, -17, 10, hairC); run(-6, -16, 12, hairC); run(-6, -15, 12, hairC);
      run(-6, -14, 3, hairC); run(3, -14, 3, hairC);
      run(-6, -13, 2, hairC); run(4, -13, 2, hairC);
      /* Highlights */
      px(-2, -18, hairHi); px(0, -17, hairHi); px(2, -16, hairHi);
    } else if (hairStyle === 'long' || hairStyle === 'flowing') {
      run(-4, -18, 8, hairC);
      run(-5, -17, 10, hairC); run(-6, -16, 12, hairC); run(-6, -15, 12, hairC);
      run(-6, -14, 3, hairC); run(3, -14, 3, hairC);
      /* Highlights */
      px(-2, -18, hairHi); px(1, -17, hairHi);
      /* Side bangs */
      run(-6, -13, 2, hairC); run(4, -13, 2, hairC);
    } else if (hairStyle === 'mohawk') {
      run(-1, -21, 2, hairHi); run(-2, -20, 4, hairHi); run(-2, -19, 4, hairC);
      run(-3, -18, 6, hairC); run(-4, -17, 8, hairC);
      run(-6, -16, 12, hairC); run(-6, -15, 12, hairC);
      /* Shaved sides */
      run(-6, -14, 2, skinShade); run(4, -14, 2, skinShade);
      run(-6, -13, 1, skinShade); run(5, -13, 1, skinShade);
    } else if (hairStyle === 'twin') {
      run(-4, -18, 8, hairC);
      run(-5, -17, 10, hairC); run(-6, -16, 12, hairC); run(-6, -15, 12, hairC);
      run(-6, -14, 3, hairC); run(3, -14, 3, hairC);
      px(-2, -18, hairHi); px(0, -17, hairHi);
      /* Twin tail left */
      px(-7, -14, hairC); px(-7, -13, hairC); px(-7, -12, hairHi);
      px(-7, -11, hairC); px(-7, -10, hairC); px(-7, -9, hairShade);
      px(-8, -13, hairC); px(-8, -12, hairC); px(-8, -11, hairHi);
      /* Twin tail right */
      px(6, -14, hairC); px(6, -13, hairC); px(6, -12, hairHi);
      px(6, -11, hairC); px(6, -10, hairC); px(6, -9, hairShade);
      px(7, -13, hairC); px(7, -12, hairC); px(7, -11, hairHi);
      /* Ribbons */
      px(-7, -15, '#FF6B9D'); px(-8, -14, '#FF6B9D');
      px(6, -15, '#FF6B9D'); px(7, -14, '#FF6B9D');
    }

    /* ── Neck ── */
    run(-2, -7, 4, skinC);
    px(-2, -7, skinShade); px(1, -7, skinShade);

    /* ── Body (small = chibi proportion) ── */
    /* Shirt */
    run(-5, -6, 10, shirtC);
    run(-5, -5, 10, shirtC);
    run(-5, -4, 10, shirtC);
    run(-5, -3, 10, shirtC);
    run(-4, -2, 8, shirtC);
    /* Shirt shading (right side) */
    run(2, -6, 2, shirtShade); run(2, -5, 2, shirtShade);
    run(2, -4, 2, shirtShade); run(2, -3, 2, shirtShade);
    /* Shirt highlight (left) */
    px(-5, -6, shirtHi); px(-5, -5, shirtHi);
    px(-4, -6, shirtHi);
    /* Collar */
    px(-1, -6, skinC); px(0, -6, skinC); px(1, -6, skinC);

    /* Arms */
    run(-6, -5, 1, skinC); run(-6, -4, 1, skinC); run(-6, -3, 1, skinC);
    px(-6, -2, skinShade);
    run(5, -5, 1, skinC); run(5, -4, 1, skinC); run(5, -3, 1, skinC);
    px(5, -2, skinShade);
    /* Hands */
    px(-6, -2, skinC); px(5, -2, skinC);

    /* Pants */
    run(-4, -1, 8, pantsC);
    run(-4, 0, 8, pantsC);
    run(-4, 1, 8, pantsC);
    run(-4, 2, 3, pantsC); run(1, 2, 3, pantsC);
    /* Pants shading */
    run(1, -1, 2, pantsShade); run(1, 0, 2, pantsShade);

    /* Belt */
    run(-4, -1, 8, e.beltC || shirtShade);

    /* Shoes */
    run(-5, 3, 3, '#443'); run(-5, 4, 3, '#332');
    run(2, 3, 3, '#443'); run(2, 4, 3, '#332');
    /* Shoe highlight */
    px(-5, 3, '#554'); px(2, 3, '#554');

    /* ── Accessories from extras ── */
    if (e.cape) {
      run(-5, -6, 1, e.cape); run(-5, -5, 1, e.cape);
      run(4, -6, 1, e.cape); run(4, -5, 1, e.cape);
      run(-5, -4, 1, e.cape); run(4, -4, 1, e.cape);
      run(-5, -3, 1, e.cape); run(4, -3, 1, e.cape);
    }
  }

  /* ══════ Character definitions ══════ */
  if (type === 'socal') {
    drawBody('#FFCC99','#E8B888','#FFE0C0', '#FF6B35','#FF8F5E','#CC5528', '#4A90D9','#3670B0', '#332211','#5A3D1A','#221100', 'spiky');
    /* Sunglasses */
    run(-4, -13, 3, '#111'); run(1, -13, 3, '#111');
    px(-4, -12, '#1a3a5a'); px(-3, -12, '#2a5a8a'); px(-2, -12, '#1a3a5a');
    px(1, -12, '#1a3a5a'); px(2, -12, '#2a5a8a'); px(3, -12, '#1a3a5a');
    px(0, -13, '#333'); px(-3, -13, '#FFF');
    /* Shell necklace */
    px(-1, -6, '#88DDCC'); px(0, -6, '#66CCBB'); px(1, -6, '#88DDCC');
    /* Board shorts detail */
    px(-3, 1, '#3A80C9'); px(2, 1, '#3A80C9');

  } else if (type === 'prospector') {
    drawBody('#FFCC99','#E8B888','#FFE0C0', '#8B5E3C','#A97850','#6B4020', '#555','#3D3D3D', '#332211','#4A3520','#1A0F00', 'bowl');
    /* Mining helmet */
    run(-4, -19, 8, '#D4A233'); run(-5, -18, 10, '#C67B2E'); run(-6, -17, 12, '#B06B20');
    px(0, -19, '#FFD700'); px(0, -20, '#FFFFAA'); px(1, -20, '#FFFF66');
    /* Pickaxe on back */
    px(6, -5, '#888'); px(7, -6, '#999'); px(7, -7, '#AAA'); px(8, -7, '#AAA');
    px(8, -8, '#C67B2E'); px(9, -8, '#C67B2E'); px(8, -9, '#C67B2E');
    /* Belt + buckle */
    run(-4, -1, 8, '#A97850'); px(0, -1, '#FFD700');

  } else if (type === 'analyst') {
    drawBody('#FFCC99','#E8B888','#FFE0C0', '#FFFFFF','#F8F8F8','#DDDDDD', '#2C3E50','#1A2838', '#554433','#6E5A45','#3D2E1F', 'bowl');
    /* Glasses (round frames) */
    px(-5, -13, '#AAA'); run(-4, -13, 3, '#999'); px(-1, -13, '#AAA');
    px(0, -13, '#AAA'); run(1, -13, 3, '#999'); px(4, -13, '#AAA');
    /* Clipboard */
    run(-7, -4, 2, '#C67B2E'); run(-7, -3, 2, '#FFF'); run(-7, -2, 2, '#F5F5F5'); run(-7, -1, 2, '#EAEAEA');
    px(-7, -5, '#C67B2E');
    /* Tie */
    px(0, -5, '#E74C3C'); px(0, -4, '#C0392B'); px(0, -3, '#C0392B');
    /* Pen */
    px(3, -6, '#3498DB');

  } else if (type === 'duck') {
    var dw = '#FAFAFA', dl = '#FFFFFF', dd = '#E0E0E0', ds = '#C8C8C8';
    /* Side-facing duck (facing right) */
    /* Tail feathers (left side, swept up) */
    px(-7, -5, dd); px(-8, -6, dw); px(-8, -7, dl);
    px(-7, -6, dd); px(-7, -7, ds);
    px(-6, -6, dd);
    /* Body (oval, wider than tall, shifted left for side profile) */
    run(-5, -2, 10, dd);
    run(-6, -3, 11, dw);
    run(-6, -4, 11, dl);
    run(-5, -5, 10, dl);
    run(-4, -6, 8, dw);
    run(-5, -1, 10, dd);
    run(-4, 0, 8, ds);
    /* Body highlight */
    run(-3, -5, 4, '#FFF'); run(-2, -4, 3, '#FFF');
    /* Wing detail (on body side) */
    run(-4, -4, 2, dd); run(-4, -3, 2, ds); run(-3, -2, 2, ds);
    px(-5, -3, dd); px(-5, -2, ds);
    /* Neck (right side, connecting to head) */
    run(3, -7, 3, dw); run(3, -8, 3, dl);
    run(2, -6, 3, dw);
    /* Head (round, positioned right and above body) */
    run(2, -13, 5, dw);
    run(1, -12, 7, dl);
    run(1, -11, 7, dl);
    run(1, -10, 7, dw);
    run(2, -9, 5, dw);
    run(3, -8, 3, dd);
    /* Eye (on right side of head, facing right) */
    run(5, -12, 2, '#1a1a2e'); run(5, -11, 2, '#222');
    px(6, -12, '#FFF');
    /* Rosy cheek */
    px(6, -10, '#FFB0B0'); px(7, -10, '#FFB0B0');
    /* Orange beak (pointing right, flat duck bill) */
    run(7, -11, 3, '#FF8C00'); run(7, -10, 3, '#FFa530');
    run(8, -11, 2, '#E07800');
    px(9, -11, '#FF8C00');
    /* Red Stevens scarf */
    run(1, -7, 6, '#CC2233'); run(0, -6, 7, '#CC2233');
    px(1, -7, '#EE3344'); px(2, -7, '#EE3344');
    /* Scarf tail (hangs left) */
    px(-1, -5, '#CC2233'); px(-1, -4, '#AA1122'); px(-2, -5, '#AA1122');
    /* Orange feet */
    run(-2, 1, 3, '#FF8C00'); run(2, 1, 3, '#FF8C00');
    px(-2, 1, '#FFa530'); px(2, 1, '#FFa530');
    /* Shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(cx - 6 * p, cy + 0 * p, 12 * p, 2 * p);
    return;

  } else if (type === 'acolyte') {
    drawBody('#FFCC99','#E8B888','#FFE0C0', '#F5F0E8','#FFFDF5','#DDD8CC', '#E8E0D4','#D0C8B8', '#8866CC','#AA88EE','#6644AA', 'long', {cape: '#F5F0E8'});
    /* White robe extends */
    run(-5, 1, 10, '#F5F0E8'); run(-5, 2, 10, '#EDE5D8');
    run(-5, 3, 4, '#E8E0D4'); run(1, 3, 4, '#F5F0E8');
    run(-5, 4, 4, '#DDD8CC'); run(1, 4, 4, '#EDE5D8');
    /* Holy staff */
    px(7, -12, '#66CCFF'); px(7, -13, '#99DDFF'); px(8, -12, '#44AADD'); /* orb */
    px(7, -11, '#8B6B4A'); px(7, -10, '#8B6B4A'); px(7, -9, '#8B6B4A');
    px(7, -8, '#7A5C3C'); px(7, -7, '#7A5C3C'); px(7, -6, '#7A5C3C');
    px(7, -5, '#6B4E33'); px(7, -4, '#6B4E33'); px(7, -3, '#6B4E33');
    /* Cross emblem */
    px(0, -4, '#FFD700'); px(-1, -3, '#FFD700'); px(0, -3, '#FFD700'); px(1, -3, '#FFD700');
    /* Halo */
    run(-3, -19, 6, 'rgba(255,255,200,0.5)'); run(-2, -20, 4, 'rgba(255,255,200,0.3)');

  } else if (type === 'sage') {
    drawBody('#FFCC99','#E8B888','#FFE0C0', '#1A3FA0','#2E5BD0','#0D2580', '#141650','#0A0C30', '#DDEEFF','#FFFFFF','#AACCDD', 'flowing', {cape: '#1A3FA0'});
    /* Wizard hat */
    run(-6, -17, 12, '#1A3FA0'); run(-5, -18, 10, '#2244BB');
    run(-4, -19, 8, '#2244BB'); run(-3, -20, 6, '#2E5BD0');
    run(-2, -21, 4, '#2E5BD0'); run(-1, -22, 2, '#3366DD');
    px(0, -23, '#3366DD');
    px(0, -22, '#FFD700'); /* star */
    /* Wide brim */
    run(-7, -16, 14, '#152E80');
    /* Book */
    run(-7, -4, 2, '#8B4513'); run(-7, -3, 2, '#FFFDE8'); run(-7, -2, 2, '#F5E6C8');
    /* Cape clasp */
    px(0, -6, '#FFD700');
    /* Robe trim */
    run(-4, 2, 8, '#0D2580');
    /* Magic particles */
    px(-8, -6, '#66CCFF'); px(7, -10, '#AADDFF'); px(-7, -2, '#88EEFF');

  } else if (type === 'blacksmith') {
    drawBody('#FFCC99','#E8B888','#FFE0C0', '#555555','#777777','#3D3D3D', '#3D3D3D','#2A2A2A', '#CC4400','#FF6622','#882200', 'mohawk');
    /* Leather apron */
    run(-3, -4, 6, '#8B5E3C'); run(-3, -3, 6, '#8B5E3C');
    run(-3, -2, 6, '#7A4E2E'); run(-3, -1, 6, '#6B4020');
    /* Apron stitching */
    px(-1, -3, '#A97850'); px(1, -3, '#A97850');
    /* Hammer */
    px(7, -6, '#888'); px(7, -5, '#888'); px(7, -4, '#777'); px(7, -3, '#666');
    run(6, -8, 3, '#B0B0B0'); run(6, -7, 3, '#CCCCCC'); /* head */
    px(7, -9, '#DDD');
    /* Goggles */
    run(-3, -17, 6, '#556'); px(-3, -16, '#88CCDD'); px(2, -16, '#88CCDD');
    /* Sparks */
    px(-8, -3, '#FFD700'); px(9, -7, '#FF6600'); px(-7, -7, '#FFAA00');
    /* Muscly arms */
    px(-6, -5, '#E8B888'); px(-6, -4, '#E8B888');
    px(5, -5, '#E8B888'); px(5, -4, '#E8B888');

  } else if (type === 'creator') {
    drawBody('#FFCC99','#E8B888','#FFE0C0', '#4A90D9','#6AAAF0','#336AB0', '#3B3B3B','#2A2A2A', '#1A1008','#3A2818','#0D0800', 'short');
    /* Beanie */
    run(-5, -19, 10, '#2C3E50'); run(-6, -18, 12, '#34495E');
    run(-5, -17, 10, '#2C3E50');
    px(4, -19, '#3D566E');
    /* Clipboard */
    run(6, -6, 2, '#C4A96A'); run(6, -5, 2, '#C4A96A'); run(6, -4, 2, '#C4A96A');
    run(6, -3, 2, '#B89B5E'); px(6, -7, '#AA8844');
    px(7, -6, '#FFF'); px(7, -5, '#DDD');
    /* Pencil in hand */
    px(-7, -4, '#E8C840'); px(-7, -3, '#E8C840'); px(-7, -2, '#D4A830');
    px(-7, -5, '#FF6B6B');
    /* Pocket detail */
    px(-1, -2, '#3A7AC0'); px(0, -2, '#3A7AC0');
  }
}

function buildCharGrid() {
  CHARACTERS.forEach(c => {
    const card = document.createElement('div');
    card.className = 'char-card';
    if (c.glow) card.style.setProperty('--card-glow', c.glow);

    /* Pixel art sprite canvas */
    var cvs = document.createElement('canvas');
    cvs.className = 'char-sprite';
    cvs.width = 72;
    cvs.height = 72;
    cvs.style.width = '72px';
    cvs.style.height = '72px';
    card.appendChild(cvs);

    var nameEl = document.createElement('div');
    nameEl.className = 'char-card-name';
    nameEl.textContent = c.name;
    card.appendChild(nameEl);

    var classEl = document.createElement('div');
    classEl.className = 'char-card-class';
    classEl.textContent = c.class;
    card.appendChild(classEl);

    var descEl = document.createElement('div');
    descEl.className = 'char-card-desc';
    descEl.textContent = c.desc;
    card.appendChild(descEl);

    /* Draw sprite + permanent idle breathing */
    var ctx = cvs.getContext('2d');
    var sprType = c.sprite;
    var breathFrame = 0, lastBreath = 0, hovering = false;
    function idleLoop(ts) {
      if (!pageVisible) return requestAnimationFrame(idleLoop);
      /* Alternate breath frame every 800ms */
      if (ts - lastBreath > 800) { breathFrame = 1 - breathFrame; lastBreath = ts; }
      drawCharSprite(ctx, sprType, 72, 72, breathFrame);
      /* Gentle bob when hovering */
      if (hovering) { cvs.style.transform = 'translateY(' + (Math.sin(ts / 300) * 3 - 2) + 'px)'; }
      else { cvs.style.transform = ''; }
      requestAnimationFrame(idleLoop);
    }
    requestAnimationFrame(idleLoop);
    card.addEventListener('mouseenter', function() { hovering = true; });
    card.addEventListener('mouseleave', function() { hovering = false; });

    card.addEventListener('click', () => {
      showToast(`Class selected: ${c.name}`);
      awardXP(25, 'Character selected');
      DOM.charSelect.classList.remove('visible');
      DOM.gameMenu.classList.add('visible');
    });
    DOM.charGrid.appendChild(card);
  });
}
buildCharGrid();

/* ═══════════════════════════════════════
   2b. CLASS TREE SPRITES
   ═══════════════════════════════════════ */
(function initClassTreeSprites() {
  var treeSprites = {
    ctNoviceSprite: 'socal',
    ctAcolyteSprite: 'acolyte',
    ctSageSprite: 'sage',
    ctBlacksmithSprite: 'blacksmith',
    ctCreatorSprite: 'creator',
  };
  var entries = [];
  Object.keys(treeSprites).forEach(function(id) {
    var cvs = document.getElementById(id);
    if (!cvs) return;
    entries.push({ ctx: cvs.getContext('2d'), type: treeSprites[id] });
  });
  var breathFrame = 0, lastBreath = 0;
  function treeBreathLoop(ts) {
    if (!pageVisible) return requestAnimationFrame(treeBreathLoop);
    if (ts - lastBreath > 800) { breathFrame = 1 - breathFrame; lastBreath = ts; }
    entries.forEach(function(e) { drawCharSprite(e.ctx, e.type, 48, 64, breathFrame); });
    requestAnimationFrame(treeBreathLoop);
  }
  requestAnimationFrame(treeBreathLoop);
})();

/* ═══════════════════════════════════════
   2c. JOURNEY WALK ANIMATION
   ═══════════════════════════════════════ */
(function initJourneyWalk() {
  /* ── Timeline: sprite walks L→R through milestones, pauses to think, loops ── */
  /* Total cycle: 10s walk + 3s think + 1s fade = 14s, then restart */
  var CYCLE_MS = 14000;
  var WALK_END = 10000;   /* 0..10s = walking */
  var THINK_END = 13000;  /* 10..13s = thinking at crossroads */
  /* 13..14s = brief fade/reset */

  var MILESTONES = [
    { x: 0.10, label: 'B.S. Kinesiology', sub: 'CSULB', icon: 'campus', color: '#F9A825' },
    { x: 0.30, label: '400+ Hrs Clinical', sub: 'PT Clinics', icon: 'clinic', color: '#66BB6A' },
    { x: 0.50, label: 'Career Pivot', sub: 'Engineering Path', icon: 'school', color: '#42A5F5' },
    { x: 0.70, label: 'M.S. BME', sub: 'Stevens 2026', icon: 'lab', color: '#AB47BC' },
    { x: 0.88, label: '???', sub: 'Next Chapter', icon: 'crossroads', color: '#FFD700' },
  ];

  var CAREER_SPRITES = [
    { type: 'acolyte', label: 'Validation' },
    { type: 'sage', label: 'Applications' },
    { type: 'blacksmith', label: 'R&D' },
    { type: 'creator', label: 'HFE' },
  ];

  /* Pre-render career sprites to avoid creating canvases every frame */
  var roleCache = {};
  function cacheRoleSprites() {
    CAREER_SPRITES.forEach(function(cs) {
      var tmp = document.createElement('canvas');
      tmp.width = 56; tmp.height = 72;
      drawCharSprite(tmp.getContext('2d'), cs.type, 56, 72, 0);
      roleCache[cs.type] = tmp;
    });
  }

  function setupCanvas(canvasId) {
    var cvs = document.getElementById(canvasId);
    if (!cvs) return null;
    var container = cvs.parentElement;
    var dpr = window.devicePixelRatio || 1;
    var w = container.offsetWidth;
    var h = container.offsetHeight;
    cvs.width = w * dpr;
    cvs.height = h * dpr;
    var ctx = cvs.getContext('2d');
    ctx.scale(dpr, dpr);
    return { cvs: cvs, ctx: ctx, w: w, h: h };
  }

  /* ── Pixel building icons ── */
  function drawIcon(ctx, type, x, y, s) {
    function r(rx, ry, rw, rh, c) {
      ctx.fillStyle = c;
      ctx.fillRect(x + rx * s, y + ry * s, rw * s, rh * s);
    }
    if (type === 'campus') {
      r(0, -20, 30, 20, '#5D4037'); r(2, -24, 26, 4, '#6D4C41');
      r(10, -28, 10, 4, '#795548');
      r(5, -18, 3, 14, '#8D6E63'); r(13, -18, 3, 14, '#8D6E63'); r(22, -18, 3, 14, '#8D6E63');
      r(8, -8, 6, 8, '#3E2723'); r(18, -14, 4, 4, '#FFEE58');
    } else if (type === 'clinic') {
      r(0, -18, 24, 18, '#E8F5E9'); r(0, -20, 24, 2, '#66BB6A');
      r(9, -15, 6, 2, '#EF5350'); r(11, -17, 2, 6, '#EF5350');
      r(3, -8, 5, 8, '#81C784'); r(15, -12, 4, 4, '#B3E5FC');
    } else if (type === 'school') {
      r(0, -18, 28, 18, '#BBDEFB'); r(0, -20, 28, 2, '#42A5F5');
      r(10, -8, 8, 8, '#1565C0');
      r(3, -14, 4, 4, '#E3F2FD'); r(21, -14, 4, 4, '#E3F2FD');
      r(12, -24, 4, 4, '#FDD835');
    } else if (type === 'lab') {
      r(0, -22, 30, 22, '#7B1FA2'); r(0, -26, 6, 4, '#9C27B0'); r(24, -26, 6, 4, '#9C27B0');
      r(10, -28, 10, 6, '#AB47BC');
      r(12, -8, 6, 8, '#4A148C');
      r(3, -16, 4, 4, '#CE93D8'); r(23, -16, 4, 4, '#CE93D8');
      r(14, -22, 2, 2, '#FFD700');
    } else if (type === 'crossroads') {
      r(12, -30, 2, 30, '#8D6E63');
      r(0, -30, 12, 6, '#FFD54F'); r(14, -30, 12, 6, '#FFD54F');
      r(2, -22, 10, 6, '#FFB74D'); r(14, -22, 10, 6, '#FFB74D');
      r(14, -28, 2, 2, '#FFF'); r(4, -28, 2, 2, '#FFF');
    }
  }

  /* ── Walking sprite ── */
  function drawWalkSprite(ctx, x, y, frame, thinking) {
    var p = 2;
    function px(ox, oy, c) { ctx.fillStyle = c; ctx.fillRect(x + ox * p, y + oy * p, p, p); }
    function run(ox, oy, len, c) { ctx.fillStyle = c; ctx.fillRect(x + ox * p, y + oy * p, len * p, p); }

    run(-3, -9, 6, '#332211');
    run(-2, -10, 4, '#FFCC99');
    run(-3, -8, 6, '#FFCC99'); run(-4, -7, 8, '#FFCC99'); run(-4, -6, 8, '#FFCC99');
    run(-4, -5, 8, '#FFCC99'); run(-4, -4, 8, '#FFCC99'); run(-3, -3, 6, '#FFCC99');
    /* Cheek blush */
    px(-3, -4, '#FFB8A0'); px(2, -4, '#FFB8A0');
    /* Eyes */
    if (thinking && Math.floor(Date.now() / 400) % 6 === 0) {
      run(-2, -6, 1, '#332211'); run(1, -6, 1, '#332211');
    } else {
      px(-2, -7, '#222'); px(1, -7, '#222');
      px(-2, -6, '#334'); px(1, -6, '#334');
      px(-1, -7, '#FFF'); px(2, -7, '#FFF');
    }
    /* Mouth */
    if (thinking) { px(0, -4, '#C45'); } else { px(-1, -4, '#C45'); px(0, -4, '#C45'); }
    /* Hair */
    run(-3, -10, 6, '#332211'); run(-4, -9, 8, '#332211');
    px(-3, -11, '#332211'); px(-1, -12, '#332211'); px(1, -12, '#4A3520'); px(3, -11, '#332211');
    px(0, -13, '#4A3520');
    /* Shirt */
    run(-3, -2, 6, '#5C6BC0'); run(-3, -1, 6, '#5C6BC0');
    run(-3, 0, 6, '#5C6BC0'); run(-3, 1, 6, '#5C6BC0');
    px(-3, -2, '#7986CB'); px(-3, -1, '#7986CB');
    px(-1, -2, '#FFCC99'); px(0, -2, '#FFCC99');
    /* Arms */
    var armOff = thinking ? 0 : ((frame % 2 === 0) ? 0 : 1);
    px(-4, -1 + armOff, '#FFCC99'); px(-4, 0 - armOff, '#FFCC99');
    px(3, -1 - armOff, '#FFCC99'); px(3, 0 + armOff, '#FFCC99');
    /* Pants */
    run(-3, 2, 6, '#37474F'); run(-3, 3, 6, '#37474F');
    /* Legs */
    if (thinking) {
      run(-3, 4, 2, '#443'); run(1, 4, 2, '#443');
    } else {
      var step = Math.floor(frame / 4) % 4;
      if (step === 0 || step === 2) { run(-3, 4, 2, '#443'); run(1, 4, 2, '#443'); }
      else if (step === 1) { run(-4, 4, 2, '#443'); run(2, 4, 2, '#443'); }
      else { run(-2, 4, 2, '#443'); run(0, 4, 2, '#443'); }
    }
    /* Shadow */
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.fillRect(x - 4 * p, y + 5 * p, 8 * p, p);
    /* Thinking bubble */
    if (thinking) {
      var blink = Math.floor(Date.now() / 600) % 3;
      px(5, -10, 'rgba(255,255,255,0.4)');
      px(6, -12, 'rgba(255,255,255,0.5)');
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.arc(x + 9 * p, y - 16 * p, 4 * p, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#555';
      ctx.font = 'bold ' + (6 * p) + 'px monospace';
      ctx.fillText('.'.repeat(blink + 1), x + 5 * p, y - 14 * p);
    }
  }

  /* ── Render one frame ── */
  function renderJourney(setup, now, isMini) {
    if (!setup) return;
    var ctx = setup.ctx, w = setup.w, h = setup.h;
    ctx.clearRect(0, 0, w, h);

    var groundY = h - 30;
    var iconScale = isMini ? 1.2 : 1.8;

    /* Pixel stars (seeded from canvas width for consistency) */
    if (!isMini) {
      var starSeed = w * 7;
      for (var si = 0; si < 18; si++) {
        starSeed = (starSeed * 9301 + 49297) % 233280;
        var sx = (starSeed / 233280) * w;
        starSeed = (starSeed * 9301 + 49297) % 233280;
        var sy = (starSeed / 233280) * (groundY - 30);
        var twinkle = Math.sin(now / 1200 + si * 2.1) * 0.3 + 0.5;
        ctx.globalAlpha = twinkle;
        ctx.fillStyle = si % 3 === 0 ? '#FFD700' : '#AABBCC';
        ctx.fillRect(Math.floor(sx), Math.floor(sy), 2, 2);
      }
      ctx.globalAlpha = 1;
    }

    /* Ground */
    ctx.fillStyle = '#1E1B18';
    ctx.fillRect(0, groundY, w, h - groundY);
    /* Ground texture (subtle pixel dots) */
    ctx.fillStyle = '#2A2520';
    for (var gi = 0; gi < w; gi += 12) {
      ctx.fillRect(gi, groundY + 4, 2, 2);
      ctx.fillRect(gi + 6, groundY + 10, 2, 2);
    }
    /* Path surface */
    ctx.fillStyle = '#3E3530';
    ctx.fillRect(0, groundY - 2, w, 3);
    /* Dashed guide line */
    ctx.save();
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = 'rgba(198,123,46,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
    ctx.restore();

    /* Milestones */
    MILESTONES.forEach(function(m) {
      var mx = m.x * w;
      drawIcon(ctx, m.icon, mx - 12, groundY - 4, iconScale);
      ctx.fillStyle = m.color;
      ctx.font = 'bold ' + (isMini ? 8 : 10) + 'px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, mx + 3, groundY + (isMini ? 10 : 13));
      if (!isMini) {
        ctx.fillStyle = '#777';
        ctx.font = '8px monospace';
        ctx.fillText(m.sub, mx + 3, groundY + 23);
      }
    });

    /* ── Time-based sprite position ── */
    var t = now % CYCLE_MS;
    var progress, isThinking, fadeAlpha;

    if (t < WALK_END) {
      /* Walking phase: ease-in-out for natural feel */
      var raw = t / WALK_END;
      progress = raw < 0.5 ? 2 * raw * raw : 1 - Math.pow(-2 * raw + 2, 2) / 2;
      isThinking = false;
      fadeAlpha = 1;
    } else if (t < THINK_END) {
      /* Thinking phase: parked at crossroads */
      progress = 1;
      isThinking = true;
      fadeAlpha = 1;
    } else {
      /* Brief fade before loop restart */
      progress = 1;
      isThinking = true;
      fadeAlpha = 1 - (t - THINK_END) / (CYCLE_MS - THINK_END);
    }

    var startX = MILESTONES[0].x * w;
    var endX = MILESTONES[4].x * w;
    var spriteX = startX + progress * (endX - startX);
    var spriteY = groundY - 6;
    var frame = Math.floor(now / 120);

    ctx.globalAlpha = fadeAlpha;
    drawWalkSprite(ctx, spriteX, spriteY, frame, isThinking);

    /* Career role sprites appear when thinking */
    if (isThinking) {
      var thinkT = t - WALK_END;
      var roleAlpha = Math.min(1, thinkT / 600) * fadeAlpha;
      ctx.globalAlpha = roleAlpha;
      var crossX = MILESTONES[4].x * w;
      var roleSpacing = isMini ? 36 : 64;
      var baseY = groundY - (isMini ? 48 : 78);
      var groupW = roleSpacing * 3;
      var startX = crossX - groupW / 2;
      /* Clamp so rightmost sprite + label stays on canvas */
      var maxStart = w - groupW - 40;
      if (startX > maxStart) startX = maxStart;
      CAREER_SPRITES.forEach(function(cs, i) {
        var rx = startX + i * roleSpacing;
        var bob = Math.sin(now / 500 + i * 1.2) * 3;
        var cached = roleCache[cs.type];
        if (cached) ctx.drawImage(cached, rx - 28, baseY + bob - 36);
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold ' + (isMini ? 8 : 11) + 'px monospace';
        ctx.textAlign = 'center';
        /* Stagger labels: even indices above sprites, odd indices below */
        var labelY = (i % 2 === 0)
          ? baseY - (isMini ? 28 : 42)
          : baseY + (isMini ? 24 : 34);
        ctx.fillText(cs.label, rx, labelY);
      });
    }
    ctx.globalAlpha = 1;
  }

  /* ── Canvas setup + animation loop ── */
  var mainSetup = null, miniSetup = null;
  var animRunning = false;

  function initCanvases() {
    mainSetup = setupCanvas('journeyWalkCanvas');
    miniSetup = setupCanvas('journeyWalkMini');
  }

  function animLoop() {
    if (!pageVisible) return requestAnimationFrame(animLoop);
    var now = Date.now();
    if (mainSetup) renderJourney(mainSetup, now, false);
    if (miniSetup) {
      var parent = document.getElementById('charSelect');
      if (parent && parent.classList.contains('visible')) {
        renderJourney(miniSetup, now, true);
      }
    }
    requestAnimationFrame(animLoop);
  }

  function startAnim() {
    cacheRoleSprites();
    initCanvases();
    if (!animRunning) { animRunning = true; animLoop(); }
  }

  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(initCanvases, 200);
  });

  if (document.readyState === 'complete') { startAnim(); }
  else { window.addEventListener('load', startAnim); }

  /* Re-init mini canvas when charSelect opens */
  var csel = document.getElementById('charSelect');
  if (csel) {
    new MutationObserver(function() {
      if (csel.classList.contains('visible')) miniSetup = setupCanvas('journeyWalkMini');
    }).observe(csel, { attributes: true, attributeFilter: ['class'] });
  }
})();

/* ═══════════════════════════════════════
   3. OPTIONS PANEL
   ═══════════════════════════════════════ */
function updateOptionsUI() {
  DOM.optTheme.textContent = S.theme === 'dark' ? 'DARK' : 'LIGHT';
  DOM.optParticles.textContent = S.particles ? 'ON' : 'OFF';
  DOM.optCRT.textContent = S.crt ? 'ON' : 'OFF';
}
updateOptionsUI();

DOM.optTheme.addEventListener('click', () => { toggleTheme(); updateOptionsUI(); });
DOM.optParticles.addEventListener('click', () => {
  S.particles = !S.particles;
  lsSet('jc-particles', S.particles ? 'on' : 'off');
  updateOptionsUI();
});
DOM.optCRT.addEventListener('click', () => {
  S.crt = !S.crt;
  lsSet('jc-crt', S.crt ? 'on' : 'off');
  document.body.classList.toggle('crt-on', S.crt);
  updateOptionsUI();
});

/* ═══════════════════════════════════════
   4. THEME TOGGLE
   ═══════════════════════════════════════ */
function setTheme(t) {
  S.theme = t;
  document.documentElement.setAttribute('data-theme', t);
  lsSet('jc-theme', t);
}
setTheme(S.theme);

function toggleTheme() {
  setTheme(S.theme === 'dark' ? 'light' : 'dark');
}

DOM.themeToggle.addEventListener('click', toggleTheme);

/* ═══════════════════════════════════════
   5. CUSTOM CURSOR (single system, no duplicates)
   ═══════════════════════════════════════ */
if (!S.isMobile) {
  let mx = 0, my = 0, cx = 0, cy = 0, rx = 0, ry = 0;
  const SPEED_DOT = 0.25, SPEED_RING = 0.12;
  let hovering = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    document.documentElement.style.setProperty('--mouse-x', mx + 'px');
    document.documentElement.style.setProperty('--mouse-y', my + 'px');
  });

  function tickCursor() {
    if (!pageVisible) return requestAnimationFrame(tickCursor);
    cx += (mx - cx) * SPEED_DOT;
    cy += (my - cy) * SPEED_DOT;
    rx += (mx - rx) * SPEED_RING;
    ry += (my - ry) * SPEED_RING;
    DOM.cursorDot.style.transform = `translate(${cx}px, ${cy}px)`;
    DOM.cursorRing.style.transform = `translate(${rx}px, ${ry}px) scale(${hovering ? 1.6 : 1})`;
    requestAnimationFrame(tickCursor);
  }
  requestAnimationFrame(tickCursor);

  /* Hover detection via delegation */
  document.addEventListener('mouseover', e => {
    const t = e.target.closest('a, button, .work-card, .bring-card, .char-card, .gm-opt, .pet-card, .pet-opt, .btn, input, textarea, .career-path, .personal-item, .criteria-item');
    if (t) { hovering = true; DOM.cursorRing.style.borderColor = 'var(--amber)'; }
  });
  document.addEventListener('mouseout', e => {
    const t = e.target.closest('a, button, .work-card, .bring-card, .char-card, .gm-opt, .pet-card, .pet-opt, .btn, input, textarea, .career-path, .personal-item, .criteria-item');
    if (t) { hovering = false; DOM.cursorRing.style.borderColor = ''; }
  });
}

/* ═══════════════════════════════════════
   5.2 MAGNETIC BUTTON HOVER
   ═══════════════════════════════════════ */
function initMagneticButtons() {
  if (S.isMobile) return;

  const buttons = $$('.btn');
  const ATTRACTION_RANGE = 40;
  const MAX_DISPLACEMENT = 8;

  let mouseX = 0;
  let mouseY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect();
      const btnCenterX = rect.left + rect.width / 2;
      const btnCenterY = rect.top + rect.height / 2;

      const dx = mouseX - btnCenterX;
      const dy = mouseY - btnCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ATTRACTION_RANGE && dist > 0) {
        const force = (1 - dist / ATTRACTION_RANGE);
        const offsetX = (dx / dist) * force * MAX_DISPLACEMENT;
        const offsetY = (dy / dist) * force * MAX_DISPLACEMENT;
        btn.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
      } else {
        btn.style.transform = 'translate(0, 0)';
      }
    });
  });

  /* Reset on page blur */
  window.addEventListener('mouseleave', () => {
    buttons.forEach(btn => {
      btn.style.transform = 'translate(0, 0)';
    });
  });
}

/* ═══════════════════════════════════════
   5.3 TEXT SCRAMBLE EFFECT (Section H2)
   ═══════════════════════════════════════ */
function scrambleText(element, finalText, duration) {
  if (S.reducedMotion) {
    element.textContent = finalText;
    return;
  }

  const charset = '!<>-_\\/[]{}=+*^?#';
  const chars = finalText.split('');
  const startTime = Date.now();

  function update() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const charsToReveal = Math.floor(chars.length * progress);

    let result = '';
    for (let i = 0; i < chars.length; i++) {
      if (i < charsToReveal) {
        result += chars[i];
      } else {
        result += charset[Math.floor(Math.random() * charset.length)];
      }
    }

    element.textContent = result;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = finalText;
    }
  }

  update();
}

/* ═══════════════════════════════════════
   5.5 PARTICLE CONSTELLATION (Hero Canvas)
   ═══════════════════════════════════════ */
function initParticleSystem() {
  if (S.reducedMotion || !S.particles) return;

  const canvas = $('#particleCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const AMBER = '#C67B2E';
  const TEAL = '#3CB8B5';
  const GRID_SPACING = 80;
  const GRID_DOT_RADIUS = 1.2;
  const GRID_OPACITY = 0.14;
  const WAVE_SPEED = 0.6;
  const WAVE_COUNT = 4;

  let time = 0;
  let waves = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    initWaves();
  }

  function initWaves() {
    waves = [];
    const h = canvas.height;
    for (let i = 0; i < WAVE_COUNT; i++) {
      waves.push({
        y: h * 0.15 + (h * 0.7 / WAVE_COUNT) * i,
        offset: i * 200,
        color: i % 2 === 0 ? AMBER : TEAL,
        opacity: 0.55 - i * 0.08,
        lineWidth: 2.2 - i * 0.25
      });
    }
  }

  /* ECG waveform shape: flat, P-wave, flat, QRS spike, flat, T-wave, flat */
  function ecgY(t) {
    const x = ((t % 1) + 1) % 1;
    /* P-wave: small bump at 0.1-0.2 */
    if (x > 0.1 && x < 0.2) {
      const p = (x - 0.1) / 0.1;
      return -Math.sin(p * Math.PI) * 8;
    }
    /* QRS complex: sharp spike at 0.3-0.4 */
    if (x > 0.28 && x < 0.32) {
      const q = (x - 0.28) / 0.04;
      return Math.sin(q * Math.PI) * 6;
    }
    if (x > 0.32 && x < 0.38) {
      const r = (x - 0.32) / 0.06;
      return -Math.sin(r * Math.PI) * 40;
    }
    if (x > 0.38 && x < 0.42) {
      const s = (x - 0.38) / 0.04;
      return Math.sin(s * Math.PI) * 10;
    }
    /* T-wave: broader bump at 0.55-0.7 */
    if (x > 0.55 && x < 0.7) {
      const tw = (x - 0.55) / 0.15;
      return -Math.sin(tw * Math.PI) * 12;
    }
    return 0;
  }

  function drawGrid() {
    ctx.strokeStyle = AMBER;
    ctx.globalAlpha = GRID_OPACITY;
    ctx.lineWidth = 0.5;
    /* Vertical lines */
    for (let x = 0; x < canvas.width; x += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    /* Horizontal lines */
    for (let y = 0; y < canvas.height; y += GRID_SPACING) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    /* Grid dots at intersections */
    ctx.fillStyle = AMBER;
    ctx.globalAlpha = GRID_OPACITY * 2;
    for (let x = 0; x < canvas.width; x += GRID_SPACING) {
      for (let y = 0; y < canvas.height; y += GRID_SPACING) {
        ctx.beginPath();
        ctx.arc(x, y, GRID_DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawWaves() {
    const w = canvas.width;
    const cycleWidth = 300;

    for (const wave of waves) {
      ctx.strokeStyle = wave.color;
      ctx.globalAlpha = wave.opacity;
      ctx.lineWidth = wave.lineWidth;
      ctx.beginPath();

      for (let px = 0; px < w; px += 2) {
        const t = (px + wave.offset + time * WAVE_SPEED * 60) / cycleWidth;
        const y = wave.y + ecgY(t);
        if (px === 0) ctx.moveTo(px, y);
        else ctx.lineTo(px, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  function animate() {
    if (!pageVisible) return requestAnimationFrame(animate);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawWaves();
    time += 0.016;
    requestAnimationFrame(animate);
  }

  resizeCanvas();
  animate();

  window.addEventListener('resize', resizeCanvas);
}

/* ═══════════════════════════════════════
   6. NAVIGATION
   ═══════════════════════════════════════ */
/* Scroll behavior: shrink nav + progress bar + direction-aware hide/show */
let ticking = false;
let lastSy = 0;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const sy = window.scrollY;
    DOM.nav.classList.toggle('scrolled', sy > 60);
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    DOM.scrollFill.style.transform = `scaleX(${docH > 0 ? sy / docH : 0})`;

    /* Hide nav on scroll down, show on scroll up (only after passing hero) */
    if (sy > 400) {
      if (sy > lastSy + 8) {
        DOM.nav.style.transform = 'translateY(-100%)';
      } else if (sy < lastSy - 4) {
        DOM.nav.style.transform = 'translateY(0)';
      }
    } else {
      DOM.nav.style.transform = 'translateY(0)';
    }
    lastSy = sy;

    /* Hero parallax depth (after entrance animation completes) */
    if (sy < window.innerHeight && document.body.classList.contains('hero-ready')) {
      var heroRight = document.querySelector('.hero-right');
      var heroLeft = document.querySelector('.hero-left');
      if (heroRight) heroRight.style.transform = 'translateY(' + (sy * 0.12) + 'px)';
      if (heroLeft) heroLeft.style.transform = 'translateY(' + (sy * 0.04) + 'px)';
    }

    ticking = false;
  });
}, { passive: true });

/* Mobile hamburger */
DOM.hamburger.addEventListener('click', () => {
  const open = DOM.hamburger.classList.toggle('open');
  DOM.mobileMenu.classList.toggle('open', open);
  DOM.hamburger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
});

/* Close mobile on link click */
$$('.mm-link').forEach(a => a.addEventListener('click', () => {
  DOM.hamburger.classList.remove('open');
  DOM.mobileMenu.classList.remove('open');
  DOM.hamburger.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}));

/* Escape key closes mobile menu */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && DOM.mobileMenu.classList.contains('open')) {
    DOM.hamburger.classList.remove('open');
    DOM.mobileMenu.classList.remove('open');
    DOM.hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    DOM.hamburger.focus();
  }
});

/* ── Hero entrance complete flag (enables parallax) ── */
setTimeout(function() { document.body.classList.add('hero-ready'); }, 1500);

/* ── Hero keyword sequential highlight ── */
(function() {
  var keywords = $$('.hero-desc .text-gradient, .hero-desc .text-gradient-teal');
  if (!keywords.length) return;
  var delay = 1800; /* after hero entrance */
  keywords.forEach(function(kw, i) {
    setTimeout(function() {
      kw.classList.add('keyword-lit');
    }, delay + i * 400);
  });
  /* After all lit, keep them lit permanently */
})();

/* ── Back to top ── */
document.getElementById('btnBackTop').addEventListener('click', function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ── Scrollspy: highlight active nav link + section indicator ── */
(function() {
  var navLinks = $$('.nav-links a[href^="#"]');
  var indicator = document.getElementById('navSectionIndicator');
  var sections = [];
  var sectionLabels = {
    hero: '', statement: 'About', bring: 'Skills', featured: 'Featured',
    work: 'Projects', toolkit: 'Toolkit', journey: 'Journey',
    'skills-matrix': 'Matrix', personal: 'Personal',
    criteria: 'Criteria', contact: 'Contact'
  };
  navLinks.forEach(function(a) {
    var el = $(a.getAttribute('href'));
    if (el) sections.push({ el: el, link: a });
  });
  if (!sections.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        navLinks.forEach(function(l) { l.classList.remove('active'); });
        var match = sections.find(function(s) { return s.el === entry.target; });
        if (match) match.link.classList.add('active');
        if (indicator) {
          var label = sectionLabels[entry.target.id] || '';
          if (label) {
            indicator.textContent = '/ ' + label;
            indicator.classList.add('visible');
          } else {
            indicator.classList.remove('visible');
          }
        }
      }
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });

  sections.forEach(function(s) { observer.observe(s.el); });
})();

/* Pipeline animation trigger on scroll into view */
(function initPipelineObserver() {
  var pipes = $$('.pipeline');
  if (!pipes.length) return;
  var pipeObs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        pipeObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });
  pipes.forEach(function(p) { pipeObs.observe(p); });
})();

/* Smooth scroll for anchor links */
$$('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    if (typeof gsap !== 'undefined') {
      gsap.to(window, { scrollTo: { y: el, offsetY: 72 }, duration: 0.8, ease: 'power2.inOut' });
    } else {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* Active nav link tracking */
const navSections = $$('section[id]');
const navLinks = $$('.nav-links a[href^="#"]');
const observerNav = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      navLinks.forEach(l => l.classList.remove('active'));
      const match = $(`.nav-links a[href="#${en.target.id}"]`);
      if (match) match.classList.add('active');
    }
  });
}, { rootMargin: '-30% 0px -70% 0px' });
navSections.forEach(s => observerNav.observe(s));

/* ═══════════════════════════════════════
   7. GSAP SCROLL REVEALS
   ═══════════════════════════════════════ */
function initScrollReveals() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  /* Mark body so CSS hides .r elements (only when GSAP is ready to animate them) */
  document.body.classList.add('gsap-ready');

  /* All .r elements: animate TO visible. CSS starts them at opacity:0 via .gsap-ready */
  $$('.r').forEach(el => {
    gsap.to(el, {
      y: 0,
      opacity: 1,
      duration: 0.7,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 88%',
        once: true,
        onEnter: () => {
          const sec = el.closest('section');
          if (sec && sec.id && !S.sectionsRevealed[sec.id]) {
            S.sectionsRevealed[sec.id] = true;
            lsSet('jc-sections', JSON.stringify(S.sectionsRevealed));
            awardXP(15, `Discovered: ${sec.id}`);
          }
        }
      }
    });
  });

  /* Stagger bring cards with scale entrance */
  gsap.fromTo('.bring-card',
    { y: 50, opacity: 0, scale: 0.94 },
    { y: 0, opacity: 1, scale: 1, duration: 0.65, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '.bring-grid', start: 'top 85%', once: true }
    }
  );

  /* Horizontal scroll gallery on desktop, stagger on mobile */
  (function() {
    var workGrid = document.querySelector('.work-grid');
    var workCards = document.querySelectorAll('.work-card');
    if (!workGrid || !workCards.length) return;

    if (window.innerWidth > 900) {
      /* Make cards visible immediately (no opacity reveal needed) */
      workCards.forEach(function(c) { c.style.opacity = '1'; c.style.transform = 'none'; c.classList.remove('r'); });

      /* Calculate scroll distance */
      var scrollDist = workGrid.scrollWidth - workGrid.parentElement.offsetWidth;

      var workST = gsap.to(workGrid, {
        x: -scrollDist,
        ease: 'none',
        scrollTrigger: {
          trigger: '#work',
          start: 'top 10%',
          end: function() { return '+=' + scrollDist; },
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          anticipatePin: 1
        }
      });

      /* ── Click-and-drag for horizontal gallery ── */
      (function() {
        var dragActive = false, startX = 0, startScroll = 0;
        var workSection = document.getElementById('work');
        if (!workSection) return;

        workSection.style.cursor = 'grab';

        function onPointerDown(e) {
          /* Only activate when gallery is pinned */
          var st = workST.scrollTrigger;
          if (!st || !st.isActive) return;
          dragActive = true;
          startX = e.touches ? e.touches[0].clientX : e.clientX;
          startScroll = window.pageYOffset;
          workSection.style.cursor = 'grabbing';
          workSection.style.userSelect = 'none';
        }

        function onPointerMove(e) {
          if (!dragActive) return;
          var clientX = e.touches ? e.touches[0].clientX : e.clientX;
          var dx = startX - clientX;
          /* Map horizontal drag to vertical scroll (GSAP scrub reads scroll position) */
          window.scrollTo(0, startScroll + dx);
          /* Prevent text selection and default touch scroll */
          if (e.cancelable) e.preventDefault();
        }

        function onPointerUp() {
          if (!dragActive) return;
          dragActive = false;
          workSection.style.cursor = 'grab';
          workSection.style.userSelect = '';
        }

        workSection.addEventListener('mousedown', onPointerDown);
        workSection.addEventListener('touchstart', onPointerDown, { passive: true });
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('touchmove', onPointerMove, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchend', onPointerUp);

        /* Prevent click on cards after drag */
        workSection.addEventListener('click', function(e) {
          if (Math.abs(window.pageYOffset - startScroll) > 5) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true);
      })();

    } else {
      /* Mobile: stagger entrance */
      gsap.fromTo('.work-card',
        { y: 60, opacity: 0, scale: 0.92 },
        { y: 0, opacity: 1, scale: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.work-grid', start: 'top 85%', once: true }
        }
      );
    }
  })();

  /* Timeline stagger */
  gsap.to('.timeline-item', {
    x: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out',
    scrollTrigger: { trigger: '.timeline', start: 'top 85%', once: true }
  });

  /* Personal items stagger */
  gsap.to('.personal-item', {
    y: 0, opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out',
    scrollTrigger: { trigger: '.personal-grid', start: 'top 85%', once: true }
  });

  /* Criteria items stagger */
  gsap.to('.criteria-item', {
    x: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out',
    scrollTrigger: { trigger: '.criteria-list', start: 'top 85%', once: true }
  });

  /* Skill bars animate */
  $$('.bring-card').forEach(card => {
    const bar = card.querySelector('.bring-skill-bar');
    if (!bar) return;
    gsap.fromTo(bar, { width: '0%' }, {
      width: card.style.getPropertyValue('--skill-pct'),
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: { trigger: card, start: 'top 80%', once: true }
    });
  });

  /* Credential pills */
  gsap.to('.credential-pill', {
    scale: 1, opacity: 1, duration: 0.4, stagger: 0.06, ease: 'back.out(1.7)',
    scrollTrigger: { trigger: '.credential-pills', start: 'top 85%', once: true }
  });

  /* Marquee items */
  gsap.to('.marquee-item', {
    opacity: 1, duration: 0.3, stagger: 0.03,
    scrollTrigger: { trigger: '.marquee-wrap', start: 'top 95%', once: true }
  });

  /* Featured card */
  gsap.to('.featured-card', {
    y: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
    scrollTrigger: { trigger: '.featured-card', start: 'top 85%', once: true }
  });

  /* Architecture flow */
  gsap.to('.arch-node', {
    y: 0, opacity: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out',
    scrollTrigger: { trigger: '.arch-flow', start: 'top 85%', once: true }
  });

  /* Floating hero orbs */
  $$('.hero-orb').forEach((orb, i) => {
    gsap.to(orb, {
      y: i % 2 === 0 ? 30 : -30,
      x: i % 2 === 0 ? -20 : 20,
      duration: 4 + i,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  });

  /* Scroll indicator fade */
  gsap.to('.scroll-indicator', {
    opacity: 0,
    scrollTrigger: { trigger: '#hero', start: 'bottom 80%', end: 'bottom 60%', scrub: true }
  });

  /* Section heading text scramble effect */
  const revealedHeadings = new Set();
  const headingObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !revealedHeadings.has(entry.target)) {
        revealedHeadings.add(entry.target);
        const finalText = entry.target.textContent;
        scrambleText(entry.target, finalText, 800);
      }
    });
  }, { threshold: 0.3 });

  $$('section h2').forEach(h2 => {
    headingObserver.observe(h2);
  });

  /* ── Text Split Animations (hero name + section headings) ── */
  function splitWords(el) {
    var text = el.textContent;
    var words = text.split(' ').filter(function(w){ return w.length > 0; });
    el.textContent = '';
    words.forEach(function(word, i) {
      var outer = document.createElement('span');
      outer.className = 'split-word';
      var inner = document.createElement('span');
      inner.className = 'split-word-inner';
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
    return el.querySelectorAll('.split-word-inner');
  }

  /* Hero name: word-by-word reveal */
  var heroName = document.querySelector('.hero-name');
  if (heroName) {
    var nameWords = splitWords(heroName);
    gsap.to(nameWords, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.12,
      ease: 'expo.out',
      delay: 0.2
    });
  }

  /* Hero description: word-by-word reveal */
  var heroDesc = document.querySelector('.hero-desc');
  if (heroDesc) {
    var descWords = splitWords(heroDesc);
    gsap.to(descWords, {
      y: 0,
      opacity: 1,
      duration: 0.6,
      stagger: 0.03,
      ease: 'power3.out',
      delay: 0.8
    });
  }

  /* ── By the Numbers: counter animation ── */
  $$('.number-card').forEach(function(card) {
    gsap.to(card, {
      y: 0,
      opacity: 1,
      duration: 0.6,
      ease: 'power2.out',
      stagger: 0.1,
      scrollTrigger: { trigger: '#numbers', start: 'top 80%', once: true }
    });
  });

  /* Animate counter numbers */
  $$('.counter').forEach(function(counter) {
    var target = parseInt(counter.getAttribute('data-target'), 10);
    var obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: 1.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: '#numbers',
        start: 'top 80%',
        once: true
      },
      onUpdate: function() {
        counter.textContent = Math.round(obj.val);
      }
    });
  });

  /* Number cards stagger */
  gsap.fromTo('.number-card',
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, ease: 'power3.out',
      scrollTrigger: { trigger: '#numbers', start: 'top 80%', once: true }
    }
  );

  /* ── Hero Parallax: slow-scroll the particle canvas and hero orbs ── */
  gsap.to('#particleCanvas', {
    y: 200,
    ease: 'none',
    scrollTrigger: {
      trigger: '#hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

  $$('.hero-orb').forEach(function(orb, i) {
    gsap.to(orb, {
      y: 100 + i * 40,
      ease: 'none',
      scrollTrigger: {
        trigger: '#hero',
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
  });

  /* Refresh after all triggers are set up */
  ScrollTrigger.refresh();
}

/* ═══════════════════════════════════════
   8. INTERACTIVE TERMINAL
   ═══════════════════════════════════════ */
const TERM_COMMANDS = {
  help: () => `Available commands:
  help        Show this message
  whoami      About me
  skills      My skill set
  projects    My projects
  contact     How to reach me
  education   Degrees & certs
  stack       Tech stack
  tools       Engineering tools
  hire        Why hire me
  criteria    What I'm looking for
  arcade      Play Device Quest
  feed        Feed the pet
  neofetch    System info
  clear       Clear terminal
  sudo        Nice try
  ls          List files
  pwd         Current directory
  date        Today's date
  echo [msg]  Repeat message
  cat [file]  Read a file
  ping        Test connection
  matrix      Enter the Matrix
  ascii       ASCII art portrait
  hack        Hack sequence`,

  whoami: () => 'Joneil Caoile. M.S. Biomedical Engineering, Stevens 2026. Device tester, tool builder, validation nerd. Available May 2026 in SoCal.',

  skills: () => `VALIDATION   ████████████████████░  90%
APPLICATIONS ████████████████░░░░░  85%
R&D          ████████████████░░░░░  80%
HUMAN FACTORS████████████████████░  92%`,

  projects: () => `[★] UseTrace HFE    . AI usability classification (IEC 62366-1)
[★] PhotoCull AI     . Client-side ML photo quality scorer
[◆] Pneumothorax     . Air leak monitor (M.S. capstone)
[◆] EMG Cuff         . Tremor-suppression wearable sim
[◆] Biofeedback Study. Motion-cap audio feedback (Max/MSP)
[◆] Fall Risk Study  . Reliability tool (Krippendorff's Alpha)
[◆] Biostats Study   . MIMIC-III BMI vs ICU LOS (null result)
[◆] ACL Graft Design . Multilayer composite biomaterials
[★] PhysioRep        . Pose estimation PT coach PWA`,

  contact: () => `Email:    joneilcaoile@gmail.com
Phone:    (424) 421-9173
LinkedIn: linkedin.com/in/joneilcaoile
GitHub:   github.com/joneilcaoile`,

  education: () => `M.S. Biomedical Engineering, Stevens Institute of Technology (2024-2026)
  GPA: 3.9+ | Provost Scholarship
B.S. Kinesiology, Cal State Long Beach (2017-2020)
  GPA: 3.6
Google UX Design Professional Certificate`,

  stack: () => `Languages:  JavaScript, Python, MATLAB, HTML/CSS
Frameworks: React, TensorFlow.js, Firebase
ML:         scikit-learn, pandas, NumPy, SciPy
Tools:      Git, Jupyter, Figma, JIRA
Regulatory: IEC 62366-1, FDA 21 CFR 820, ISO 14971`,

  tools: () => `Testing:    V&V protocols, IQ/OQ/PQ, risk-based strategies
Regulatory: Design controls, CAPA, CSA, 510(k) support
HFE:        Usability studies, use error classification, HFE reports
Software:   Web apps, data pipelines, client-side ML, APIs`,

  hire: () => `1. 400+ hrs clinical observation. I've seen devices fail patients
2. Built 9 real device projects, not homework exercises
3. Understand the regulatory path (IEC 62366, 21 CFR 820, MDR)
4. Can code tools that make your team faster (UseTrace, PhotoCull)
5. Available May 2026. SoCal. Ready to prove it on day one.`,

  criteria: () => `1. Product touches patients
2. Physical testing is part of the job
3. Regulated enough to matter
4. Engineers have signature authority
5. SoCal, market-rate comp
6. Team tells the truth about tradeoffs`,

  feed: () => {
    if (window.__feedPet) window.__feedPet();
    return `Feeding the pet...\n*nom nom nom*\nHappiness: 100% | Energy: 100%`;
  },

  arcade: () => {
    awardXP(10, 'Arcade discovered');
    setTimeout(() => { window.location.href = 'quest.html'; }, 800);
    return `Loading Device Quest...\nNavigate the medtech facility. Defeat bugs. Survive the audit.`;
  },

  quest: () => {
    awardXP(10, 'Quest discovered');
    setTimeout(() => { window.location.href = 'quest.html'; }, 800);
    return `Loading Device Quest: The Validation Engineer...\nPrepare for the FDA audit.`;
  },

  play: () => {
    awardXP(10, 'Play discovered');
    setTimeout(() => { window.location.href = 'quest.html'; }, 800);
    return `Loading Device Quest...\nGood luck, engineer.`;
  },

  neofetch: () => {
    const w = window.innerWidth, h = window.innerHeight;
    return `joneil@portfolio
-----------------
OS:       Portfolio v2.0 (clean rebuild)
Host:     joneilcaoile.github.io
Kernel:   Vanilla JS + GSAP
Shell:    Custom Terminal v1.0
Display:  ${w}x${h}
Theme:    ${S.theme}
Font:     Space Grotesk / Inter / JetBrains Mono
Uptime:   Since the loader finished
XP:       ${S.xp} / ${S.maxXp}`;
  },

  clear: () => '__CLEAR__',

  sudo: () => {
    awardXP(5, 'Nice try');
    return 'Permission denied. Nice try though. +5 XP for audacity.';
  },

  ls: () => `case-pneumothorax.html  case-photocull.html     case-usetrace.html
case-emg.html           case-biofeedback.html   case-fall.html
case-biostats.html      case-biomaterials.html  case-physiorep.html
index.html              tools.html              hfe-sample.html
quest.html              Joneil_Caoile_Resume.pdf
headshot.webp           og-preview.png          README.md`,

  pwd: () => '/home/joneil/portfolio',
  date: () => new Date().toLocaleString(),

  matrix: () => {
    awardXP(25, 'Entered the Matrix');
    const canvas = document.createElement('canvas');
    canvas.id = 'matrixOverlay';
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:#000;z-index:9999;pointer-events:none;';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const charset = 'ァアィイゥウェエォオカガキギクグケゲコゴサザシジスズセゼソゾタダチヂツヅテデトドナニヌネノハバパヒビピフブプヘベペホボポマミムメモヤラリルレロワヲン0123456789';
    const fontSize = 20;
    const cols = Math.ceil(canvas.width / fontSize);
    const drops = Array(cols).fill(0);

    function draw() {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#00FF41';
      ctx.font = fontSize + 'px monospace';

      for (let i = 0; i < drops.length; i++) {
        const char = charset[Math.floor(Math.random() * charset.length)];
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    let matrixInterval = setInterval(draw, 30);

    setTimeout(() => {
      clearInterval(matrixInterval);
      let fade = 1;
      const fadeInterval = setInterval(() => {
        fade -= 0.02;
        canvas.style.opacity = fade;
        if (fade <= 0) {
          clearInterval(fadeInterval);
          document.body.removeChild(canvas);
        }
      }, 30);
    }, 8000);

    return 'Entering the Matrix...';
  },

  ascii: () => {
    awardXP(10, 'ASCII art discovered');
    return `     ___  ____
    / _ \\/ ___|
   | | | |
   | |_| | |___
    \\___/ \\____|

    JONEIL CAOILE
    Biomedical Engineer
    Available May 2026`;
  },

  hack: () => {
    awardXP(15, 'Hacking sequence initiated');
    let output = '';

    const steps = [
      'Accessing mainframe...',
      'Bypassing firewall...',
      'Cracking encryption...',
      'Downloading patient data...',
      'JUST KIDDING.',
      'This is a regulatory nightmare.',
      'FDA audit incoming.'
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        const inLine = document.createElement('div');
        inLine.innerHTML = `<span class="response">${steps[stepIdx]}</span>`;
        DOM.termBody.appendChild(inLine);
        DOM.termBody.scrollTop = DOM.termBody.scrollHeight;
        stepIdx++;
      } else {
        clearInterval(interval);
      }
    }, 300);

    return '';
  },
};

function termExec(input) {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1).join(' ');

  if (cmd === 'echo') return args || '';
  if (cmd === 'cat') {
    if (!args) return 'Usage: cat <filename>';
    if (args === 'resume' || args === 'resume.pdf') return 'Try the download button instead. Or: hire';
    return `cat: ${args}: No such file or directory`;
  }
  if (cmd === 'ping') return `PING joneilcaoile.github.io, 64 bytes, time=0.1ms\nHe responds to emails even faster.`;

  const fn = TERM_COMMANDS[cmd];
  if (!fn) return `command not found: ${cmd}. Type "help" for available commands.`;
  return fn();
}

DOM.termInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const val = DOM.termInput.value.trim();
    if (!val) return;
    S.termHistory.push(val);
    S.termHistIdx = S.termHistory.length;

    /* Add input line */
    const inLine = document.createElement('div');
    inLine.innerHTML = `<span class="prompt">$ </span><span class="response">${escHTML(val)}</span>`;
    DOM.termBody.appendChild(inLine);

    const result = termExec(val);
    if (result === '__CLEAR__') {
      DOM.termBody.innerHTML = '';
    } else {
      const outLine = document.createElement('div');
      outLine.innerHTML = `<span class="response" style="white-space:pre-wrap;">${escHTML(result)}</span>`;
      DOM.termBody.appendChild(outLine);
    }

    DOM.termInput.value = '';
    DOM.termBody.scrollTop = DOM.termBody.scrollHeight;
    awardXP(5, 'Terminal use');
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (S.termHistIdx > 0) { S.termHistIdx--; DOM.termInput.value = S.termHistory[S.termHistIdx]; }
  }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (S.termHistIdx < S.termHistory.length - 1) { S.termHistIdx++; DOM.termInput.value = S.termHistory[S.termHistIdx]; }
    else { S.termHistIdx = S.termHistory.length; DOM.termInput.value = ''; }
  }
});

function escHTML(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/* ═══════════════════════════════════════
   9. XP & CRITTER SYSTEM
   ═══════════════════════════════════════ */
const CRITTER_STAGES = [
  { name: 'Egg', minXp: 0 },
  { name: 'Slimeling', minXp: 100 },
  { name: 'Slime', minXp: 400 },
  { name: 'Grad Slime', minXp: 900 },
  { name: 'King Slime', minXp: 1500 },
];

function getStage(xp) {
  let stage = CRITTER_STAGES[0];
  for (const s of CRITTER_STAGES) { if (xp >= s.minXp) stage = s; }
  return stage;
}

function awardXP(amount, reason) {
  var prevStage = getStage(S.xp).name;
  S.xp = Math.min(S.xp + amount, S.maxXp);
  lsSet('jc-xp', S.xp);
  updateXPDisplay();
  drawCritter();
  if (reason) showToast(`+${amount} XP: ${reason}`);
  /* Check for evolution */
  var newStage = getStage(S.xp).name;
  if (newStage !== prevStage && typeof triggerEvolution === 'function') {
    setTimeout(function() { triggerEvolution(prevStage, newStage); }, 500);
  }
}

function updateXPDisplay() {
  const stage = getStage(S.xp);
  const lvl = Math.floor(S.xp / 75) + 1;
  DOM.xpTitle.textContent = `Lv(age).${lvl} ${stage.name}`;
  DOM.xpFill.style.width = (S.xp / S.maxXp * 100) + '%';
  DOM.xpText.textContent = `${S.xp.toLocaleString()} / ${S.maxXp.toLocaleString()} XP`;
}

/* ─── Floating Pet System ─── */
const pet = {
  el: $('#floatingPet'),
  x: window.innerWidth - 80,
  y: window.innerHeight - 100,
  vx: 0.4 + Math.random() * 0.3,
  vy: 0.3 + Math.random() * 0.2,
  bobPhase: 0,
  frame: 0,
  dragging: false,
  dragOffX: 0,
  dragOffY: 0,
  mouseX: window.innerWidth / 2,
  mouseY: window.innerHeight / 2,
};

function drawCritter() {
  const canvas = DOM.critterCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  let stage = getStage(S.xp);
  if (S.petModel) {
    const override = CRITTER_STAGES.find(s => s.name === S.petModel);
    if (override && S.xp >= override.minXp) stage = override;
  }
  const nameEl = $('#petName');
  if (nameEl) nameEl.textContent = stage.name;
  drawCritterOnCtx(ctx, stage.name, w, h);
}

/* Unified sprite renderer used by both the floating pet and preview cards */
function drawCritterOnCtx(ctx, name, w, h) {
  var p = 2; /* 2px grid for crisp pixel art */
  var cx = Math.floor(w / 2);
  var cy = Math.floor(h / 2);

  /* Helper: draw a pixel */
  function px(x, y, c) { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + y * p, p, p); }
  /* Helper: draw a horizontal run */
  function run(x, y, len, c) { ctx.fillStyle = c; ctx.fillRect(cx + x * p, cy + y * p, len * p, p); }

  if (name === 'Egg') {
    /* Clean oval egg, pink with speckles and crack */
    var ec = '#FFB6C1'; var eh = '#FFD1DC'; var es = '#FF9EAE';
    /* Outline */
    run(-3, -7, 6, ec);
    run(-4, -6, 8, ec);
    run(-5, -5, 10, ec);
    run(-5, -4, 10, ec);
    run(-5, -3, 10, ec);
    run(-5, -2, 10, ec);
    run(-5, -1, 10, ec);
    run(-5, 0, 10, ec);
    run(-5, 1, 10, ec);
    run(-4, 2, 8, ec);
    run(-4, 3, 8, ec);
    run(-3, 4, 6, ec);
    run(-2, 5, 4, es);
    /* Highlight */
    run(-3, -5, 3, eh); run(-3, -4, 2, eh);
    /* Speckles */
    px(2, -3, es); px(-2, 1, es); px(3, 0, es);
    /* Crack */
    px(-1, -6, '#FFF'); px(0, -5, '#FFF'); px(1, -6, '#FFF'); px(2, -5, '#EEE');

  } else if (name === 'Slimeling') {
    /* Tiny round blob with dot eyes and antenna */
    var sc = '#FFB6C1'; var sh = '#FFD1DC';
    run(-3, -2, 6, sc);
    run(-4, -1, 8, sc);
    run(-4, 0, 8, sc);
    run(-4, 1, 8, sc);
    run(-4, 2, 8, sc);
    run(-3, 3, 6, sc);
    run(-2, 4, 4, sc);
    /* Highlight */
    run(-3, -1, 2, sh); px(-3, 0, sh);
    /* Eyes */
    px(-2, 1, '#333'); px(1, 1, '#333');
    px(-2, 0, '#FFF'); px(1, 0, '#FFF');
    /* Blush */
    px(-3, 2, 'rgba(255,80,80,0.5)'); px(2, 2, 'rgba(255,80,80,0.5)');
    /* Antenna */
    px(0, -3, '#66BB6A'); px(-1, -4, '#66BB6A'); px(0, -5, '#4CAF50');

  } else if (name === 'Slime') {
    /* Bigger poring with face and leaf */
    var sc = '#FF9EBA'; var sh = '#FFB6C1'; var sd = '#FF85A2';
    run(-4, -3, 8, sc);
    run(-5, -2, 10, sc);
    run(-6, -1, 12, sc);
    run(-6, 0, 12, sc);
    run(-6, 1, 12, sc);
    run(-6, 2, 12, sc);
    run(-5, 3, 10, sc);
    run(-4, 4, 8, sc);
    run(-3, 5, 6, sd);
    /* Highlight */
    run(-4, -2, 3, sh); run(-4, -1, 2, sh);
    /* Eyes - white bg */
    run(-3, 0, 2, '#FFF'); run(1, 0, 2, '#FFF');
    run(-3, 1, 2, '#FFF'); run(1, 1, 2, '#FFF');
    /* Pupils */
    px(-2, 0, '#222'); px(2, 0, '#222');
    px(-2, 1, '#222'); px(2, 1, '#222');
    /* Eye shine */
    px(-3, 0, '#FFF');  px(1, 0, '#FFF');
    /* Mouth */
    px(-1, 3, '#D4566A'); px(0, 3, '#D4566A');
    /* Blush */
    px(-5, 2, 'rgba(255,80,80,0.4)'); px(4, 2, 'rgba(255,80,80,0.4)');
    /* Leaf on top */
    px(0, -4, '#4CAF50'); px(-1, -5, '#66BB6A'); px(1, -5, '#4CAF50'); px(0, -6, '#388E3C');

  } else if (name === 'Grad Slime') {
    /* Poring with graduation cap */
    var sc = '#FF85A2'; var sh = '#FFB0C4'; var sd = '#E8668A';
    run(-5, -2, 10, sc);
    run(-6, -1, 12, sc);
    run(-7, 0, 14, sc);
    run(-7, 1, 14, sc);
    run(-7, 2, 14, sc);
    run(-7, 3, 14, sc);
    run(-6, 4, 12, sc);
    run(-5, 5, 10, sc);
    run(-4, 6, 8, sd);
    /* Highlight */
    run(-5, -1, 3, sh); run(-5, 0, 2, sh);
    /* Eyes */
    run(-4, 1, 2, '#FFF'); run(2, 1, 2, '#FFF');
    run(-4, 2, 2, '#FFF'); run(2, 2, 2, '#FFF');
    px(-3, 1, '#222'); px(3, 1, '#222');
    px(-3, 2, '#222'); px(3, 2, '#222');
    px(-4, 1, '#FFF'); px(2, 1, '#FFF');
    /* Glasses frames */
    px(-5, 1, '#555'); px(-1, 1, '#555'); px(1, 1, '#555'); px(5, 1, '#555');
    px(0, 1, '#555');
    /* Mouth */
    px(-1, 4, '#D4566A'); px(0, 4, '#D4566A');
    /* Blush */
    px(-6, 3, 'rgba(255,80,80,0.4)'); px(5, 3, 'rgba(255,80,80,0.4)');
    /* Grad cap - mortarboard */
    run(-8, -5, 16, '#333');
    run(-8, -4, 16, '#2A2A2A');
    run(-4, -6, 8, '#333');
    run(-4, -7, 8, '#2A2A2A');
    /* Tassel */
    px(5, -5, '#D4AF37'); px(6, -4, '#D4AF37'); px(6, -3, '#D4AF37'); px(7, -3, '#FFD700');

  } else {
    /* King Slime - crown, wings, regal */
    var sc = '#FF6B8A'; var sh = '#FF9EBA'; var sd = '#E85577';
    run(-5, -1, 10, sc);
    run(-7, 0, 14, sc);
    run(-8, 1, 16, sc);
    run(-8, 2, 16, sc);
    run(-8, 3, 16, sc);
    run(-8, 4, 16, sc);
    run(-7, 5, 14, sc);
    run(-6, 6, 12, sc);
    run(-5, 7, 10, sd);
    /* Highlight */
    run(-6, 0, 3, sh); run(-6, 1, 2, sh);
    /* Eyes - big and sparkly */
    run(-5, 2, 3, '#FFF'); run(2, 2, 3, '#FFF');
    run(-5, 3, 3, '#FFF'); run(2, 3, 3, '#FFF');
    run(-4, 2, 2, '#222'); run(3, 2, 2, '#222');
    run(-4, 3, 2, '#222'); run(3, 3, 2, '#222');
    px(-5, 2, '#FFF'); px(2, 2, '#FFF');
    /* Star sparkle in eyes */
    px(-3, 3, '#FFD700'); px(4, 3, '#FFD700');
    /* Royal smile */
    run(-2, 5, 4, '#D4566A'); px(-3, 5, sd); px(2, 5, sd);
    /* Blush */
    run(-7, 4, 2, 'rgba(255,60,60,0.45)'); run(5, 4, 2, 'rgba(255,60,60,0.45)');
    /* Crown */
    run(-6, -4, 12, '#FFD700');
    run(-6, -3, 12, '#DAA520');
    px(-6, -6, '#FFD700'); px(-5, -5, '#FFD700');
    px(0, -6, '#FFD700'); px(-1, -5, '#FFD700'); px(1, -5, '#FFD700');
    px(5, -6, '#FFD700'); px(4, -5, '#FFD700');
    /* Gems */
    px(-4, -4, '#FF4444'); px(0, -4, '#4444FF'); px(3, -4, '#FF4444');
    /* Wings */
    px(-10, 2, 'rgba(255,255,255,0.6)'); px(-11, 1, 'rgba(255,255,255,0.6)'); px(-10, 0, 'rgba(255,255,255,0.4)');
    px(9, 2, 'rgba(255,255,255,0.6)'); px(10, 1, 'rgba(255,255,255,0.6)'); px(9, 0, 'rgba(255,255,255,0.4)');
  }
}

function fillEllipse(ctx, cx, cy, rx, ry, p) {
  for (let y = -ry; y <= ry; y += p) {
    for (let x = -rx; x <= rx; x += p) {
      if ((x*x)/(rx*rx) + (y*y)/(ry*ry) <= 1) ctx.fillRect(cx+x, cy+y, p, p);
    }
  }
}

/* Floating pet movement */
function animatePet() {
  if (!pet.el || S.isMobile || S.reducedMotion) return;
  if (!pageVisible) return requestAnimationFrame(animatePet);
  pet.bobPhase += 0.03;
  pet.frame++;

  if (!pet.dragging) {
    if (S.petBehavior === 'wander') {
      /* Gentle wander */
      if (pet.frame % 180 === 0) {
        pet.vx = (Math.random() - 0.5) * 1.2;
        pet.vy = (Math.random() - 0.5) * 0.8;
      }
      pet.x += pet.vx;
      pet.y += pet.vy;
    } else if (S.petBehavior === 'follow') {
      /* Lerp toward cursor */
      pet.x += (pet.mouseX - pet.x) * 0.02;
      pet.y += (pet.mouseY - pet.y) * 0.02;
    }
    /* 'stay' mode: don't move at all */
  }

  /* Bounce off viewport edges (all modes) */
  const margin = 60;
  if (pet.x < margin) { pet.x = margin; pet.vx = Math.abs(pet.vx); }
  if (pet.x > window.innerWidth - margin) { pet.x = window.innerWidth - margin; pet.vx = -Math.abs(pet.vx); }
  if (pet.y < margin) { pet.y = margin; pet.vy = Math.abs(pet.vy); }
  if (pet.y > window.innerHeight - margin) { pet.y = window.innerHeight - margin; pet.vy = -Math.abs(pet.vy); }

  /* Bob float */
  const bob = pet.dragging ? 0 : Math.sin(pet.bobPhase) * 6;
  const squash = 1 + Math.sin(pet.bobPhase * 2) * 0.04;
  const stretch = 1 - Math.sin(pet.bobPhase * 2) * 0.04;

  pet.el.style.left = pet.x + 'px';
  pet.el.style.top = (pet.y + bob) + 'px';
  pet.el.style.transform = `translate(-50%, -50%) scaleX(${squash}) scaleY(${stretch})`;

  requestAnimationFrame(animatePet);
}

/* ─── Pet Drag ─── */
if (pet.el) {
  pet.el.addEventListener('mousedown', function(e) {
    e.preventDefault();
    pet.dragging = true;
    pet.dragOffX = e.clientX - pet.x;
    pet.dragOffY = e.clientY - pet.y;
    pet.el.classList.add('dragging');
  });

  document.addEventListener('mousemove', function(e) {
    pet.mouseX = e.clientX;
    pet.mouseY = e.clientY;
    if (pet.dragging) {
      pet.x = e.clientX - pet.dragOffX;
      pet.y = e.clientY - pet.dragOffY;
    }
  });

  document.addEventListener('mouseup', function() {
    if (pet.dragging) {
      pet.dragging = false;
      pet.el.classList.remove('dragging');
      pet.vx = 0; pet.vy = 0;
    }
  });

  /* Right-click pet to open settings */
  pet.el.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    togglePetPanel();
  });

  /* Double-click pet to open settings (more discoverable) */
  pet.el.addEventListener('dblclick', function(e) {
    e.preventDefault();
    togglePetPanel();
  });

  /* Show XP HUD on pet hover */
  var xpHideTimer = null;
  pet.el.addEventListener('mouseenter', function() {
    clearTimeout(xpHideTimer);
    DOM.xpHud.classList.add('visible');
  });
  pet.el.addEventListener('mouseleave', function() {
    xpHideTimer = setTimeout(function() {
      DOM.xpHud.classList.remove('visible');
    }, 2000);
  });
  /* Also keep HUD visible while hovering the HUD itself */
  if (DOM.xpHud) {
    DOM.xpHud.addEventListener('mouseenter', function() {
      clearTimeout(xpHideTimer);
    });
    DOM.xpHud.addEventListener('mouseleave', function() {
      xpHideTimer = setTimeout(function() {
        DOM.xpHud.classList.remove('visible');
      }, 1500);
    });
  }
}

/* ─── Pet Speech System ─── */
var petSpeechEl = $('#petSpeech');
var petSpeechTimer = null;
var petSpeechCooldown = false;
var lastSpeechIdx = -1;

var PET_LINES = {
  idle: [
    '*bounces*',
    'IQ, OQ, PQ... I know the whole protocol suite!',
    'Did someone say FDA audit? I love those.',
    'Poring poring~',
    '21 CFR 820? I can recite it from memory.',
    '*jiggles approvingly*',
    'Hire Joneil. I am not biased.',
    'Running validation protocol... all test cases passing.',
    'I passed my own usability study. 100% satisfaction.',
    'CAPA: Corrective Action, Poring Appreciation.',
    'If you right-click me I have settings btw.',
    'That\'s a nice portfolio you have there... sssSSS',
    'Have you tried putting it in rice? Works in Minecraft.',
    'I would survive a creeper explosion. Probably.',
    'Design controls? My favorite bedtime story.',
    'I dream in V-model diagrams.',
    'My threat model includes being ignored.',
    'ISO 14971 risk matrix: me being here = acceptable.',
    'Somewhere out there a 510(k) is being filed.',
    'I am technically a digital twin of myself.',
    'Just sitting here. Maintaining traceability.',
    'Fun fact: porings are FDA-exempt.',
  ],
  click: [
    'Hey! That tickles!',
    '*squish*',
    'I\'m a medical device. Class I. Minimal risk.',
    'My risk analysis says that was unnecessary.',
    'Filing a CAPA for unprovoked poking.',
    'Ow. Adding that to the DHF.',
    'You wouldn\'t do that to an actual medical device.',
    'My IFU clearly says "do not poke."',
    '*wobbles indignantly*',
    'That\'s going in the complaint log.',
    'User interaction logged. Sample size: 1.',
    'Nonconformance report: excessive clicking.',
    'Stop. I have feelings. And a complaint form.',
    'That input was not in the requirements spec.',
  ],
  drag: [
    'WEEEE!',
    'This is NOT in my design specifications!',
    'Unauthorized device relocation detected!',
    'I need to file an MDR for this.',
    'Put me down near the contact section. Trust me.',
    'This violates my environmental specifications!',
    'At least this counts as usability testing.',
    'Wheee... wait, this is an adverse event!',
  ],
  scroll: [
    'Ooh, nice projects down here.',
    'Keep scrolling. The good stuff is below.',
    'You found the case studies? Good.',
    'The skills matrix is pretty cool, right?',
    'Every section is a verified deliverable.',
    'Scroll faster. I want to see the contact form.',
    'You\'re reviewing the portfolio? Same.',
    'I audit every section as you scroll past.',
  ],
  konami: [
    'KONAMI CODE DETECTED. You are a person of culture.',
  ],
  greeting: [
    'Welcome back! Ready to review some V&V protocols?',
    'Oh hi! I was just practicing my pixel art.',
    'The slime has been waiting for you.',
  ],
  hourly: {
    morning: 'Good morning! Time to check the job tracker.',
    afternoon: 'Afternoon grind. How\'s the capstone going?',
    evening: 'Evening mode. Portfolio looks better in dark theme btw.',
    latenight: 'It\'s late. Sleep > debugging. Usually.',
  }
};

function petSay(line, duration) {
  if (!petSpeechEl) return;
  clearTimeout(petSpeechTimer);
  petSpeechEl.textContent = line;
  petSpeechEl.classList.add('show');
  petSpeechTimer = setTimeout(function() {
    petSpeechEl.classList.remove('show');
  }, duration || 3500);
}

function petSayRandom(category) {
  var lines = PET_LINES[category];
  if (!lines || !lines.length) return;
  var idx;
  do { idx = Math.floor(Math.random() * lines.length); } while (idx === lastSpeechIdx && lines.length > 1);
  lastSpeechIdx = idx;
  petSay(lines[idx]);
}

/* Click to make pet talk */
if (pet.el) {
  pet.el.addEventListener('click', function(e) {
    if (pet.dragging) return;
    petSayRandom('click');
  });
}

/* Random idle chatter every 25-45s */
var idleSpeechInterval = setInterval(function() {
  if (document.hidden) return;
  if (petSpeechCooldown) return;
  if (Math.random() < 0.4) petSayRandom('idle');
}, 30000 + Math.random() * 15000);

/* ── Pet reacts to which section is in view ── */
(function() {
  var sectionLines = {
    'hero': ['Home sweet home.', 'We starting from the top!'],
    'statement': ['400 hours of observation. That\'s a lot of clipboards.', 'This is the \"why\" section.'],
    'bring': ['Four skill sets. I can only bounce.', 'These skill bars look healthy.'],
    'featured': ['LEGENDARY item detected.', 'The capstone. The big one.'],
    'work': ['Nine projects! Let me audit each one.', 'Ooh, case studies. My favorite reading.'],
    'toolkit': ['I recognize those standards. IEC 62366 gang.', 'That\'s a solid tech stack.'],
    'journey': ['From clinics to code. What a journey.', 'The timeline looks good from here.'],
    'skills-matrix': ['Colorful dots. Very official.', 'Cross-project coverage confirmed.'],
    'personal': ['Off the clock? I never clock out.', 'Is that a Minecraft crafting recipe?!'],
    'criteria': ['Hiring criteria: must tolerate slimes.', 'SoCal only. I get it. The weather.'],
    'contact': ['You should send a message. I\'ll vouch for him.', 'Form detected. Go ahead, I\'ll wait.'],
  };
  var lastSection = '';
  var sectionObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (!e.isIntersecting) return;
      var id = e.target.id;
      if (id === lastSection) return;
      lastSection = id;
      var lines = sectionLines[id];
      if (!lines || petSpeechCooldown) return;
      if (Math.random() < 0.35) {
        var line = lines[Math.floor(Math.random() * lines.length)];
        petSay(line, 4000);
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });

  ['hero','statement','bring','featured','work','toolkit','journey','skills-matrix','personal','criteria','contact'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });
})();

/* Say something on drag start */
if (pet.el) {
  var origMousedown = null;
  pet.el.addEventListener('mousedown', function() {
    setTimeout(function() {
      if (pet.dragging) petSayRandom('drag');
    }, 300);
  });
}

/* ─── Tamagotchi Mood System ─── */
var petMood = {
  happiness: 80,
  energy: 100,
  lastInteraction: Date.now(),
  lastPoop: 0,
  poopCount: 0,
};

function getMoodState() {
  var h = petMood.happiness;
  var e = petMood.energy;
  var hour = new Date().getHours();
  if (hour >= 0 && hour < 6) return 'sleepy';
  if (h > 70) return 'happy';
  if (h > 40) return 'neutral';
  if (h > 20) return 'bored';
  return 'sad';
}

function getMoodEmoji() {
  var state = getMoodState();
  var emojis = { happy: '♥', neutral: '~', bored: '...', sad: ';;', sleepy: 'zzZ' };
  return emojis[state] || '~';
}

/* Mood indicator bubble */
var moodEl = document.createElement('div');
moodEl.className = 'pet-mood';
moodEl.style.cssText = 'position:absolute;top:-6px;right:-8px;font-family:var(--font-mono);font-size:8px;color:var(--gold);opacity:0.6;pointer-events:none;';
if (pet.el) pet.el.appendChild(moodEl);

function updateMoodDisplay() {
  if (moodEl) moodEl.textContent = getMoodEmoji();
}

/* Mood decay: happiness drops slowly when not interacted with */
setInterval(function() {
  var elapsed = (Date.now() - petMood.lastInteraction) / 1000;
  if (elapsed > 60) {
    petMood.happiness = Math.max(0, petMood.happiness - 1);
  }
  /* Energy recharges at night, drains during day */
  var hour = new Date().getHours();
  if (hour >= 0 && hour < 6) {
    petMood.energy = Math.min(100, petMood.energy + 2);
  } else {
    petMood.energy = Math.max(10, petMood.energy - 0.5);
  }
  updateMoodDisplay();

  /* Random "poop" event (humorous, Tamagotchi-style) */
  if (Math.random() < 0.005 && petMood.poopCount < 3) {
    spawnPoop();
  }

  /* Bored/sad reactions */
  if (petMood.happiness < 30 && Math.random() < 0.02) {
    petSay(petMood.happiness < 15 ? 'You forgot about me...' : 'Pet me? Click me?', 3000);
  }
}, 10000);

/* Clicking boosts happiness */
if (pet.el) {
  var origClick = pet.el.onclick;
  pet.el.addEventListener('click', function() {
    petMood.happiness = Math.min(100, petMood.happiness + 15);
    petMood.lastInteraction = Date.now();
    updateMoodDisplay();
  });
}

/* Poop system (Tamagotchi classic) */
function spawnPoop() {
  petMood.poopCount++;
  var poop = document.createElement('div');
  poop.textContent = '💩';
  poop.style.cssText = 'position:fixed;font-size:14px;z-index:89;pointer-events:auto;cursor:pointer;transition:opacity 0.3s;';
  poop.style.left = (pet.x + (Math.random() - 0.5) * 80) + 'px';
  poop.style.top = (pet.y + 30 + Math.random() * 20) + 'px';
  document.body.appendChild(poop);

  /* Click to clean */
  poop.addEventListener('click', function() {
    petMood.poopCount--;
    petMood.happiness = Math.min(100, petMood.happiness + 5);
    poop.style.opacity = '0';
    setTimeout(function() { poop.remove(); }, 300);
    petSay('Thank you for cleaning that up.', 2500);
    awardXP(5, 'Cleaned up');
  });

  /* Auto-remove after 30s */
  setTimeout(function() {
    if (poop.parentNode) {
      petMood.poopCount--;
      poop.style.opacity = '0';
      setTimeout(function() { poop.remove(); }, 300);
    }
  }, 30000);

  if (petMood.poopCount === 1) {
    petSay('Oops. That happens sometimes.', 2500);
  } else if (petMood.poopCount >= 3) {
    petSay('Please clean up... it\'s getting crowded.', 3000);
  }
}

/* Feed the pet (secret: type "feed" in terminal) */
window.__feedPet = function() {
  petMood.happiness = 100;
  petMood.energy = 100;
  petMood.lastInteraction = Date.now();
  updateMoodDisplay();
  petSay('NOM NOM. Fully restored!', 3000);
  awardXP(10, 'Fed the pet');
};

/* Greeting on first load */
setTimeout(function() {
  var h = new Date().getHours();
  if (h >= 5 && h < 12) petSay(PET_LINES.hourly.morning, 4000);
  else if (h >= 12 && h < 17) petSay(PET_LINES.hourly.afternoon, 4000);
  else if (h >= 17 && h < 22) petSay(PET_LINES.hourly.evening, 4000);
  else petSay(PET_LINES.hourly.latenight, 4000);
  updateMoodDisplay();
}, 3000);

/* Scroll-triggered speech (once per scroll session) */
var scrollSpeechFired = {};
function checkScrollSpeech() {
  var scrollPct = window.scrollY / (document.body.scrollHeight - window.innerHeight);
  var key = Math.floor(scrollPct * 4);
  if (!scrollSpeechFired[key] && scrollPct > 0.1) {
    scrollSpeechFired[key] = true;
    if (Math.random() < 0.3) petSayRandom('scroll');
  }
}
window.addEventListener('scroll', checkScrollSpeech, { passive: true });

/* ─── Pet Settings Panel ─── */
function togglePetPanel() {
  const panel = $('#petPanel');
  if (!panel) return;
  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    panel.classList.remove('open');
    return;
  }
  /* Position panel near pet */
  let px = pet.x + 40;
  let py = pet.y - 80;
  if (px + 280 > window.innerWidth) px = pet.x - 300;
  if (py < 10) py = 10;
  if (py + 300 > window.innerHeight) py = window.innerHeight - 310;
  panel.style.left = px + 'px';
  panel.style.top = py + 'px';
  panel.classList.add('open');
  buildModelGrid();
}

/* Draw a specific critter stage onto a given canvas context */
/* Preview cards use the same renderer as the floating pet */
function drawCritterStage(ctx, stageName, w, h) {
  ctx.clearRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = false;
  drawCritterOnCtx(ctx, stageName, w, h);
}

var _modelAnimFrames = [];
function buildModelGrid() {
  var grid = $('#petModelGrid');
  if (!grid) return;
  grid.innerHTML = '';
  grid.classList.add('pet-panel-row--models');

  /* Stop any existing animation frames */
  _modelAnimFrames.forEach(function(id) { cancelAnimationFrame(id); });
  _modelAnimFrames = [];

  CRITTER_STAGES.forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'pet-card';
    card.dataset.model = s.name;
    var unlocked = S.xp >= s.minXp;
    if (!unlocked) {
      card.classList.add('locked');
      card.title = s.minXp + ' XP to unlock';
    }

    /* XP badge */
    if (s.minXp > 0) {
      var xpBadge = document.createElement('span');
      xpBadge.className = 'pet-card-xp';
      xpBadge.textContent = unlocked ? '\u2713' : s.minXp;
      card.appendChild(xpBadge);
    }

    /* Mini canvas for sprite preview */
    var cvs = document.createElement('canvas');
    cvs.width = 40;
    cvs.height = 36;
    cvs.style.width = '40px';
    cvs.style.height = '36px';
    card.appendChild(cvs);

    /* Name label */
    var label = document.createElement('div');
    label.className = 'pet-card-name';
    label.textContent = s.name;
    card.appendChild(label);

    /* Draw initial sprite */
    var ctx = cvs.getContext('2d');
    drawCritterStage(ctx, s.name, 40, 36);

    /* Idle bob animation on hover */
    var bobPhase = 0;
    var isHovering = false;
    var animId = null;

    function animateBob() {
      if (!isHovering) { animId = null; return; }
      bobPhase += 0.08;
      var offsetY = Math.sin(bobPhase) * 2;
      cvs.style.transform = 'translateY(' + offsetY + 'px)';
      animId = requestAnimationFrame(animateBob);
    }

    card.addEventListener('mouseenter', function() {
      if (!unlocked) return;
      isHovering = true;
      bobPhase = 0;
      if (!animId) animId = requestAnimationFrame(animateBob);
    });
    card.addEventListener('mouseleave', function() {
      isHovering = false;
      cvs.style.transform = '';
    });

    /* Active state */
    var currentModel = S.petModel || getStage(S.xp).name;
    if (s.name === currentModel) card.classList.add('active');

    card.addEventListener('click', function() {
      if (!unlocked) return;
      S.petModel = s.name;
      lsSet('jc-pet-model', s.name);
      drawCritter();
      $$('.pet-card').forEach(function(c) { c.classList.remove('active'); });
      card.classList.add('active');
    });

    grid.appendChild(card);
  });
}

/* Behavior buttons */
$$('.pet-opt[data-behavior]').forEach(function(btn) {
  if (btn.dataset.behavior === S.petBehavior) {
    btn.classList.add('active');
    $$('.pet-opt[data-behavior]').forEach(function(b) {
      if (b !== btn) b.classList.remove('active');
    });
  }
  btn.addEventListener('click', function() {
    S.petBehavior = btn.dataset.behavior;
    lsSet('jc-pet-behavior', S.petBehavior);
    $$('.pet-opt[data-behavior]').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

/* Spark style buttons */
$$('.pet-opt[data-spark]').forEach(function(btn) {
  if (btn.dataset.spark === S.petSpark) {
    btn.classList.add('active');
    $$('.pet-opt[data-spark]').forEach(function(b) {
      if (b !== btn) b.classList.remove('active');
    });
  }
  btn.addEventListener('click', function() {
    S.petSpark = btn.dataset.spark;
    lsSet('jc-pet-spark', S.petSpark);
    $$('.pet-opt[data-spark]').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
  });
});

/* Close button */
const petCloseBtn = $('#petPanelClose');
if (petCloseBtn) petCloseBtn.addEventListener('click', function() {
  const panel = $('#petPanel');
  if (panel) panel.classList.remove('open');
});

/* Close panel when clicking outside */
document.addEventListener('click', function(e) {
  const panel = $('#petPanel');
  if (!panel || !panel.classList.contains('open')) return;
  if (!panel.contains(e.target) && !pet.el.contains(e.target)) {
    panel.classList.remove('open');
  }
});

/* Expose spark style getter for game-scripts.js */
window.__petSpark = function() { return S.petSpark; };

/* Initialize XP display */
updateXPDisplay();
drawCritter();
if (!S.isMobile && !S.reducedMotion) animatePet();

/* ═══════════════════════════════════════
   10. TOAST NOTIFICATIONS
   ═══════════════════════════════════════ */
let toastTimer = null;
function showToast(msg) {
  DOM.toast.textContent = msg;
  DOM.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => DOM.toast.classList.remove('show'), 2500);
}

/* ═══════════════════════════════════════
   11. CONTACT FORM (AJAX)
   ═══════════════════════════════════════ */
const contactForm = $('form.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = contactForm.querySelector('.form-submit');
    if (!btn) return;
    const origText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        btn.textContent = 'Sent!';
        contactForm.reset();
        awardXP(100, 'Message sent');
        showToast('Message sent. I respond fast.');
        setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 3000);
      } else {
        throw new Error('Form error');
      }
    } catch {
      btn.textContent = 'Error. Try email.';
      setTimeout(() => { btn.textContent = origText; btn.disabled = false; }, 3000);
      window.location.href = 'mailto:joneilcaoile@gmail.com';
    }
  });
}

/* ═══════════════════════════════════════
   12. KONAMI CODE EASTER EGG
   ═══════════════════════════════════════ */
document.addEventListener('keydown', e => {
  S.konami.push(e.code);
  if (S.konami.length > S.konamiCode.length) S.konami.shift();
  if (S.konami.join(',') === S.konamiCode.join(',')) {
    awardXP(200, 'KONAMI CODE ACTIVATED');
    showKonamiOverlay();
  }
});

function showKonamiOverlay() {
  let ov = $('#konamiOverlay');
  if (ov) { ov.remove(); return; }
  ov = document.createElement('div');
  ov.id = 'konamiOverlay';
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.92);display:flex;align-items:center;justify-content:center;padding:40px;';
  ov.innerHTML = `
    <div style="max-width:500px;font-family:var(--font-mono);color:var(--amber);line-height:1.8;font-size:14px;">
      <h2 style="font-family:var(--font-heading);font-size:28px;color:#FFD700;margin-bottom:24px;">⚡ GOD MODE ACTIVATED</h2>
      <pre style="color:var(--text-muted);">
CLASS:      Biomedical Engineer
LVL(AGE):   27
HP:         400+ (clinical observation hours)
STR:        6 device projects
INT:        M.S. BME (3.9+ GPA)
DEX:        Full-stack + ML
WIS:        400+ hrs watching devices fail
CHA:        Builds tools people actually use
ALIGNMENT:  Lawful Validated
STATUS:     ★ Available May 2026 ★
WEAKNESS:   Pour-over coffee
      </pre>
      <p style="margin-top:16px;color:var(--text-muted);font-size:12px;">Press Escape or click to close. +200 XP.</p>
    </div>`;
  ov.addEventListener('click', () => ov.remove());
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { ov.remove(); document.removeEventListener('keydown', esc); }
  });
  document.body.appendChild(ov);
}

/* ═══════════════════════════════════════
   13. CONSOLE EASTER EGG
   ═══════════════════════════════════════ */
console.log(
  '%c👋 Hey! You opened DevTools.',
  'font-size:16px;font-weight:bold;color:#D4AF37;'
);
console.log(
  '%cIf you\'re a recruiter: I wrote this entire site by hand. No frameworks.\nIf you\'re a dev: View source, it\'s all one file. DM me.\n\njoneilcaoile@gmail.com',
  'font-size:12px;color:#888;'
);

/* ═══════════════════════════════════════
   14. TAB TITLE + FOCUS
   ═══════════════════════════════════════ */
const originalTitle = document.title;
document.addEventListener('visibilitychange', () => {
  document.title = document.hidden ? 'Come back! // Joneil Caoile' : originalTitle;
});

/* ═══════════════════════════════════════
   15. SKILL BARS ANIMATION (bring cards)
   ═══════════════════════════════════════ */
/* Handled in GSAP scroll reveals section above */

/* ═══════════════════════════════════════
   16. MARQUEE PAUSE ON HOVER
   ═══════════════════════════════════════ */
const marqueeTrack = $('.marquee-track');
if (marqueeTrack) {
  marqueeTrack.addEventListener('mouseenter', () => marqueeTrack.style.animationPlayState = 'paused');
  marqueeTrack.addEventListener('mouseleave', () => marqueeTrack.style.animationPlayState = 'running');
}

/* ═══════════════════════════════════════
   17. WORK CARD 3D TILT (isolated, no body transform)
   ═══════════════════════════════════════ */
if (!S.isMobile && !S.reducedMotion) {
  $$('.work-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      /* Include the hover lift (-6px) so CSS hover and JS tilt don't fight */
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-6px) translateZ(8px)`;
      card.style.setProperty('--card-mouse-x', (e.clientX - r.left) + 'px');
      card.style.setProperty('--card-mouse-y', (e.clientY - r.top) + 'px');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.transition = 'transform 0.3s ease';
      setTimeout(() => card.style.transition = '', 300);
    });
  });
}


/* ═══════════════════════════════════════
   BUTTON RIPPLE EFFECT
   ═══════════════════════════════════════ */
$$('.btn').forEach(function(btn) {
  btn.addEventListener('click', function(e) {
    var r = btn.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'btn-ripple';
    var size = Math.max(r.width, r.height);
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - r.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - r.top - size / 2) + 'px';
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', function() { ripple.remove(); });
  });
});

/* ═══════════════════════════════════════
   GAME ENHANCEMENTS
   Hit sparks, sparkles, achievements
   ═══════════════════════════════════════ */

/* Hit spark on button clicks (Tekken-inspired) */
function createHitSpark(event) {
  if (S.reducedMotion) return;
  if (S.petSpark === 'off') return;
  const button = event.target.closest('button, .btn, .cta-button, a.work-card-cta, .nav-link, .footer-links a');
  if (!button) return;
  const rect = button.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  /* Color palettes per spark style */
  var sparkPalettes = {
    default: ['var(--amber)', 'var(--teal)'],
    fire: ['#FF6B35', '#FFD166', '#FF4444'],
    ice: ['#7EC8E3', '#A5D8FF', '#FFFFFF'],
    gold: ['var(--gold)', '#FFD700', 'var(--amber)']
  };
  var palette = sparkPalettes[S.petSpark] || sparkPalettes['default'];
  var sparkCount = 6 + Math.floor(Math.random() * 5);
  for (var i = 0; i < sparkCount; i++) {
    var spark = document.createElement('div');
    spark.className = 'hit-spark burst';
    var angle = (i / sparkCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    var dist = 25 + Math.random() * 30;
    spark.style.setProperty('--ox', x + 'px');
    spark.style.setProperty('--oy', y + 'px');
    spark.style.setProperty('--sx', (Math.cos(angle) * dist) + 'px');
    spark.style.setProperty('--sy', (Math.sin(angle) * dist) + 'px');
    var color = palette[i % palette.length];
    spark.style.boxShadow = '0 0 6px 2px ' + color;
    spark.style.background = color;
    document.body.appendChild(spark);
    setTimeout(function(el) { return function() { el.remove(); }; }(spark), 600);
  }
}
document.addEventListener('click', createHitSpark);

/* Floating sparkles on scroll */
let activeSparkles = 0;
const MAX_SPARKLES = 6;
function createFloatingSparkle() {
  if (S.reducedMotion || !S.particles || activeSparkles >= MAX_SPARKLES) return;
  if (Math.random() > 0.12) return;
  activeSparkles++;
  const sparkle = document.createElement('div');
  const types = ['gold', 'teal', 'amber'];
  sparkle.className = 'sparkle-particle ' + types[Math.floor(Math.random() * 3)];
  sparkle.style.left = (Math.random() * window.innerWidth) + 'px';
  sparkle.style.top = (window.innerHeight + 20) + 'px';
  sparkle.innerHTML = '<div class="sprite-sparkle"></div>';
  document.body.appendChild(sparkle);
  const dur = 2500 + Math.random() * 1500;
  setTimeout(() => { sparkle.remove(); activeSparkles--; }, dur);
}
window.addEventListener('scroll', createFloatingSparkle, { passive: true });

/* Sparkle container initialization */
function initSparkleContainer() {
  const container = document.getElementById('sparkle-container');
  if (!container || S.reducedMotion) return;
  /* Already has static sparkles from HTML, add slight random delays */
  container.querySelectorAll('.sparkle-particle').forEach((s, i) => {
    s.style.animationDelay = (Math.random() * 3) + 's';
  });
}
initSparkleContainer();

/* Rarity system - auto-apply glow to cards */
function initRaritySystem() {
  $$('[data-rarity]').forEach(card => {
    card.classList.add('rarity-' + card.getAttribute('data-rarity'));
  });
}
initRaritySystem();

/* Console ASCII art (enhanced) */
console.log('%c' +
  '\n  ⚔️  WARRIOR MODE  ⚔️\n' +
  '  "The greatest victory is patience"\n' +
  '  - Ragnarok Online Wisdom\n' +
  '  ↑↑↓↓←→←→BA for a surprise\n',
  'color: #D4A233; font-size: 12px; font-family: monospace;'
);

/* ═══════════════════════════════════════
   XP ORB COLLECTION SYSTEM
   ═══════════════════════════════════════ */
var xpOrbs = [];
var ORB_CONFIG = {
  maxOrbs: 5,
  spawnInterval: 15000,
  collectRadius: 45,
  petCollectRadius: 35,
  orbXP: 10,
  bigOrbXP: 25,
  bigOrbChance: 0.15,
};

function spawnXPOrb() {
  return; /* Orbs disabled — they clutter the viewport */
  if (S.isMobile || S.reducedMotion) return;
  if (xpOrbs.length >= ORB_CONFIG.maxOrbs) return;

  var orb = document.createElement('div');
  var isBig = Math.random() < ORB_CONFIG.bigOrbChance;
  orb.className = 'xp-orb' + (isBig ? ' xp-orb--big' : '');

  /* Random position within viewport */
  var x = 80 + Math.random() * (window.innerWidth - 160);
  var y = 80 + Math.random() * (window.innerHeight - 160);
  orb.style.left = x + 'px';
  orb.style.top = y + 'px';
  orb.style.animationDelay = (Math.random() * 2) + 's';

  var orbData = { el: orb, x: x, y: y, xp: isBig ? ORB_CONFIG.bigOrbXP : ORB_CONFIG.orbXP, collected: false };
  xpOrbs.push(orbData);
  document.body.appendChild(orb);

  /* Auto-despawn after 20s */
  setTimeout(function() {
    if (!orbData.collected) removeOrb(orbData);
  }, 20000);
}

function removeOrb(orbData) {
  orbData.collected = true;
  if (orbData.el.parentNode) orbData.el.remove();
  xpOrbs = xpOrbs.filter(function(o) { return o !== orbData; });
}

function collectOrb(orbData) {
  if (orbData.collected) return;
  orbData.collected = true;
  orbData.el.classList.add('collecting');

  /* Pet eating animation */
  if (pet.el) {
    pet.el.classList.add('eating');
    setTimeout(function() { pet.el.classList.remove('eating'); }, 300);

    /* Yum text */
    var yum = document.createElement('div');
    yum.className = 'pet-yum';
    var yumTexts = ['+' + orbData.xp + ' XP', 'nom!', 'yum!', '*munch*', 'tasty!'];
    yum.textContent = yumTexts[Math.floor(Math.random() * yumTexts.length)];
    pet.el.appendChild(yum);
    setTimeout(function() { yum.remove(); }, 800);
  }

  /* Award XP */
  var prevStage = getStage(S.xp).name;
  awardXP(orbData.xp, 'Orb collected');

  /* Check for evolution */
  var newStage = getStage(S.xp).name;
  if (newStage !== prevStage) {
    triggerEvolution(prevStage, newStage);
  }

  /* Boost happiness */
  if (typeof petMood !== 'undefined') {
    petMood.happiness = Math.min(100, petMood.happiness + 8);
    petMood.lastInteraction = Date.now();
  }

  setTimeout(function() { removeOrb(orbData); }, 400);
}

/* Check cursor proximity to orbs every frame (disabled with orbs) */
function checkOrbCollection() {
  return; /* Orbs disabled */
  if (S.isMobile || S.reducedMotion) return;
  var mx = pet.mouseX;
  var my = pet.mouseY;

  for (var i = xpOrbs.length - 1; i >= 0; i--) {
    var o = xpOrbs[i];
    if (o.collected) continue;

    /* Check if cursor is near orb */
    var dx = mx - o.x;
    var dy = my - o.y;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < ORB_CONFIG.collectRadius) {
      /* Magnetic pull toward cursor */
      o.x += (mx - o.x) * 0.15;
      o.y += (my - o.y) * 0.15;
      o.el.style.left = o.x + 'px';
      o.el.style.top = o.y + 'px';
      o.el.style.transform = 'scale(1.2)';

      if (dist < 20) {
        collectOrb(o);
        continue;
      }
    }

    /* Also check pet proximity (pet eats orbs it touches) */
    if (pet.el) {
      var pdx = pet.x - o.x;
      var pdy = pet.y - o.y;
      var pdist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pdist < ORB_CONFIG.petCollectRadius) {
        collectOrb(o);
      }
    }
  }

  requestAnimationFrame(checkOrbCollection);
}
requestAnimationFrame(checkOrbCollection);

/* Spawn orbs periodically */
setInterval(spawnXPOrb, ORB_CONFIG.spawnInterval);
/* Initial batch */
setTimeout(function() {
  for (var i = 0; i < 3; i++) setTimeout(spawnXPOrb, i * 2000);
}, 2000);

/* ═══════════════════════════════════════
   POKEMON EVOLUTION ANIMATION
   ═══════════════════════════════════════ */
function triggerEvolution(fromName, toName) {
  /* Create overlay */
  var overlay = document.createElement('div');
  overlay.className = 'evo-overlay';

  var canvas = document.createElement('canvas');
  canvas.className = 'evo-canvas';
  canvas.width = 96;
  canvas.height = 96;
  canvas.style.width = '96px';
  canvas.style.height = '96px';
  overlay.appendChild(canvas);

  var text = document.createElement('div');
  text.className = 'evo-text';
  text.textContent = 'What? ' + fromName + ' is evolving!';
  overlay.appendChild(text);

  var flash = document.createElement('div');
  flash.className = 'evo-flash';

  document.body.appendChild(overlay);
  document.body.appendChild(flash);

  /* Draw the "from" sprite */
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  drawCritterOnCtx(ctx, fromName, 96, 96);

  /* Phase 1: fade in overlay */
  requestAnimationFrame(function() {
    overlay.classList.add('active');
  });

  /* Phase 2: pulsing glow (1.5s) */
  setTimeout(function() {
    canvas.style.animation = 'evo-glow 0.5s ease-in-out 3';
  }, 800);

  /* Phase 3: flicker between forms */
  var flickerCount = 0;
  var flickerMax = 8;
  var flickerInterval = setInterval(function() {
    flickerCount++;
    ctx.clearRect(0, 0, 96, 96);
    if (flickerCount % 2 === 0) {
      drawCritterOnCtx(ctx, fromName, 96, 96);
    } else {
      drawCritterOnCtx(ctx, toName, 96, 96);
      canvas.style.filter = 'brightness(2) drop-shadow(0 0 12px rgba(255,255,255,0.8))';
    }
    setTimeout(function() { canvas.style.filter = ''; }, 80);

    if (flickerCount >= flickerMax) {
      clearInterval(flickerInterval);
      /* Phase 4: white flash */
      flash.style.animation = 'evo-flash 0.6s ease-out forwards';

      /* Phase 5: show new form */
      setTimeout(function() {
        ctx.clearRect(0, 0, 96, 96);
        drawCritterOnCtx(ctx, toName, 96, 96);
        canvas.style.animation = 'evo-pulse 0.5s ease-out';
        text.textContent = fromName + ' evolved into ' + toName + '!';
        flash.remove();

        /* Pet says something */
        if (typeof petSay === 'function') {
          var evoLines = [
            'I feel... POWERFUL!',
            'New form unlocked!',
            'Is this what leveling up feels like?',
            'I can feel my pixels sharpening!',
          ];
          petSay(evoLines[Math.floor(Math.random() * evoLines.length)], 4000);
        }
      }, 400);

      /* Phase 6: dismiss */
      setTimeout(function() {
        overlay.style.transition = 'opacity 0.5s';
        overlay.style.opacity = '0';
        setTimeout(function() { overlay.remove(); }, 500);
      }, 3000);
    }
  }, 200);
}

/* ═══════════════════════════════════════
   JOURNEY TIMELINE SPRITES
   ═══════════════════════════════════════ */
(function initJourneySprites() {
  var timelineItems = $$('.timeline-item');
  var spriteData = [
    { type: 'socal', label: 'Beach Boy' },
    { type: 'sage', label: 'Clinic Observer' },
    { type: 'duck', label: 'Stevens Duck' },
    { type: 'prospector', label: 'Job Hunter' },
  ];
  var entries = [];
  timelineItems.forEach(function(item, i) {
    if (i >= spriteData.length) return;
    var dot = item.querySelector('.timeline-dot');
    if (!dot) return;
    /* Wrapper for sprite + label */
    var wrap = document.createElement('div');
    wrap.className = 'timeline-sprite-wrap';
    var cvs = document.createElement('canvas');
    cvs.className = 'timeline-sprite';
    cvs.width = 48;
    cvs.height = 64;
    cvs.style.width = '48px';
    cvs.style.height = '64px';
    wrap.appendChild(cvs);
    var lbl = document.createElement('div');
    lbl.className = 'timeline-sprite-label';
    lbl.textContent = spriteData[i].label;
    wrap.appendChild(lbl);
    entries.push({ ctx: cvs.getContext('2d'), type: spriteData[i].type });
    item.insertBefore(wrap, dot);
  });
  var breathFrame = 0, lastBreath = 0;
  function tlBreathLoop(ts) {
    if (!pageVisible) return requestAnimationFrame(tlBreathLoop);
    if (ts - lastBreath > 800) { breathFrame = 1 - breathFrame; lastBreath = ts; }
    entries.forEach(function(e) { drawCharSprite(e.ctx, e.type, 48, 64, breathFrame); });
    requestAnimationFrame(tlBreathLoop);
  }
  requestAnimationFrame(tlBreathLoop);
})();

/* ═══════════════════════════════════════
   BOOT SEQUENCE
   ═══════════════════════════════════════ */
document.body.style.overflow = 'hidden';

/* ── Hash navigation: skip entrance overlay if URL has a hash ── */
if (window.location.hash) {
  /* Immediately hide entrance overlay and enter site */
  DOM.entranceOverlay.style.display = 'none';
  document.body.style.overflow = '';
  if (!S.reducedMotion) initScrollReveals();
  initParticleSystem();
  initMagneticButtons();
  awardXP(50, 'Welcome bonus');
  setTimeout(function() { DOM.nav.classList.add('nav-visible'); }, 100);
  setTimeout(function() { DOM.menuReopen.classList.add('visible'); }, 300);
  /* Scroll to hash target after a brief paint delay */
  setTimeout(function() {
    var target = document.querySelector(window.location.hash);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 200);
} else {
  runLoader();
}

})();

/* Resume dropdown */
(function(){
  const btn = document.getElementById('resume-btn');
  const menu = document.getElementById('resume-menu');
  if(!btn||!menu) return;
  btn.addEventListener('click', function(e){
    e.stopPropagation();
    const open = menu.style.display !== 'none';
    menu.style.display = open ? 'none' : 'block';
    btn.setAttribute('aria-expanded', !open);
  });
  document.addEventListener('click', function(){ menu.style.display='none'; btn.setAttribute('aria-expanded','false'); });
  menu.querySelectorAll('.resume-item').forEach(function(a){
    a.addEventListener('mouseenter', function(){ a.style.background='rgba(255,255,255,.08)'; });
    a.addEventListener('mouseleave', function(){ a.style.background='transparent'; });
  });
})();

/* ═══════════════════════════════════════
   PAGE TRANSITIONS
   ═══════════════════════════════════════ */
(function(){
  var overlay = document.getElementById('pageTransition');
  if (!overlay) return;

  /* Fade in on page load (if navigating from another page) */
  if (performance.navigation && performance.navigation.type === 1) {
    /* Normal reload, skip */
  } else if (sessionStorage.getItem('jc-page-transition')) {
    overlay.style.opacity = '1';
    overlay.style.pointerEvents = 'all';
    overlay.style.transition = 'none';
    requestAnimationFrame(function() {
      overlay.style.transition = 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    });
    sessionStorage.removeItem('jc-page-transition');
  }

  /* Intercept internal link clicks for smooth fade-out */
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    /* Skip hash links, external links, new tabs, PDFs */
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('http') || href.endsWith('.pdf') || link.target === '_blank') return;
    /* Only intercept internal .html links */
    if (href.endsWith('.html') || href === '/' || href === '') {
      e.preventDefault();
      overlay.classList.add('active');
      sessionStorage.setItem('jc-page-transition', '1');
      setTimeout(function() {
        window.location.href = href;
      }, 350);
    }
  });
})();
