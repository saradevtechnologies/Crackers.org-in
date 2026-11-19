'use client';

/**
 * Lightweight canvas celebration effects: sparkle bursts, sparkle trails and sky shots.
 * Everything is skipped when the user has "reduce motion" switched on.
 */

const COLORS = ['#F3D99A', '#D4A23A', '#FFFFFF', '#FF7A45', '#7FE0A0', '#FF5A7A', '#8EC5FF'];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  g: number;
  life: number;
  decay: number;
  r: number;
  c: string;
}
interface Rocket {
  x: number;
  y: number;
  vy: number;
  ty: number;
}

export function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function lowEnd() {
  const n = navigator as Navigator & { deviceMemory?: number };
  return (n.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2;
}

let overlay: {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  parts: Particle[];
  rockets: Rocket[];
  running: boolean;
} | null = null;

function getOverlay() {
  if (overlay) return overlay;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '9999',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  overlay = { canvas, ctx, parts: [], rockets: [], running: false };
  const resize = () => {
    const d = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * d;
    canvas.height = window.innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  };
  resize();
  window.addEventListener('resize', resize);
  return overlay;
}

function scale(n: number) {
  return lowEnd() ? Math.ceil(n / 2) : n;
}

function addBurst(x: number, y: number, n: number, speed: number, gravity: number, color?: string) {
  const o = getOverlay();
  for (let i = 0; i < scale(n); i++) {
    const a = Math.random() * Math.PI * 2;
    const s = Math.random() * speed + speed * 0.3;
    o.parts.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      g: gravity,
      life: 1,
      decay: 0.012 + Math.random() * 0.012,
      r: Math.random() * 1.6 + 1,
      c: color ?? COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }
  run();
}

function run() {
  const o = getOverlay();
  if (o.running) return;
  o.running = true;
  const tick = () => {
    const { ctx } = o;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    o.rockets = o.rockets.filter((k) => {
      k.y += k.vy;
      k.vy *= 0.99;
      o.parts.push({ x: k.x + (Math.random() - 0.5) * 2, y: k.y, vx: 0, vy: 0.5, g: 0, life: 0.6, decay: 0.04, r: 1.4, c: '#F3D99A' });
      if (k.y <= k.ty) {
        addBurst(k.x, k.y, 70, 3.4, 0.05);
        return false;
      }
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(k.x, k.y, 2.4, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    o.parts = o.parts.filter((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= p.decay;
      if (p.life <= 0) return false;
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      return true;
    });
    if (o.parts.length || o.rockets.length) requestAnimationFrame(tick);
    else {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      o.running = false;
    }
  };
  requestAnimationFrame(tick);
}

/** Small burst, e.g. from the "Add to estimate" button. */
export function sparkleBurst(x: number, y: number) {
  if (reducedMotion()) return;
  addBurst(x, y, 30, 2.6, 0.06);
}

/** Tiny sparkles that follow the pointer (website banners). */
export function sparkleAt(x: number, y: number) {
  if (reducedMotion()) return;
  addBurst(x, y, 2, 0.8, 0.03, Math.random() < 0.6 ? '#F3D99A' : '#FFFFFF');
}

/** Rockets that rise and burst: 1 for an enquiry, 4–5 for a confirmed order. */
export function skyShots(count = 1) {
  if (reducedMotion()) return;
  const o = getOverlay();
  const w = window.innerWidth;
  const h = window.innerHeight;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      o.rockets.push({
        x: count === 1 ? w / 2 : w * (0.15 + Math.random() * 0.7),
        y: h,
        vy: -(h / 110 + Math.random() * 2),
        ty: h * (0.15 + Math.random() * 0.25),
      });
      run();
    }, i * 280);
  }
}
