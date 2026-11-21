// Generates illustrated sample images for the dummy catalogue.
//   node scripts/generate-product-images.mjs
// Writes public/img/products/<slug>.jpg, public/img/categories/<slug>.jpg, src/lib/sample-images.ts
// and supabase/set-product-images.sql (maps product names to images).
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// ---------- helpers ----------
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function rngFrom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 3432918353), (h = (h << 13) | (h >>> 19));
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}
const f = (n) => Math.round(n * 10) / 10;
const pol = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];

const BG = {
  purple: ['#4b2391', '#12052b'],
  maroon: ['#8a2343', '#1c0711'],
  navy: ['#14497a', '#03101f'],
  green: ['#17643a', '#03180b'],
  amber: ['#7a3e10', '#1a0b02'],
  indigo: ['#3a3d99', '#090a24'],
  teal: ['#0f6470', '#021618'],
  rose: ['#9c3a63', '#22081a'],
};
const SPARK = {
  gold: ['#FFE27A', '#FFB347', '#FFF6D5'],
  silver: ['#FFFFFF', '#DCE6FF', '#FFF6D5'],
  multi: ['#FF5D8F', '#6DD3FF', '#FFE27A', '#9BFF7A', '#C792FF'],
  red: ['#FF4D4D', '#FF9E7A', '#FFE27A'],
  green: ['#7CFFB2', '#C6FF7A', '#FFFFFF'],
  blue: ['#6DD3FF', '#B0E8FF', '#FFFFFF'],
};

// A firework burst: rays with dots and a soft glow.
function burst(id, cx, cy, r, colors, rays, rnd, opts = {}) {
  let s = `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.9)}" fill="url(#${id}-glow)" opacity="${opts.glow ?? 0.55}"/>`;
  for (let i = 0; i < rays; i++) {
    const a = (360 / rays) * i + rnd() * 8;
    const len = r * (0.7 + rnd() * 0.3);
    const [x1, y1] = pol(cx, cy, r * 0.18, a);
    const [x2, y2] = pol(cx, cy, len, a);
    const c = colors[i % colors.length];
    s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${opts.w ?? 2.6}" stroke-linecap="round" opacity=".95"/>`;
    s += `<circle cx="${f(x2)}" cy="${f(y2)}" r="${f((opts.w ?? 2.6) * 1.3)}" fill="${c}"/>`;
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.1)}" fill="#fff"/>`;
}

// Sparks scattering from a point (for burning tips).
function sparks(cx, cy, r, colors, n, rnd) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const a = rnd() * 360;
    const d1 = r * (0.15 + rnd() * 0.2);
    const d2 = r * (0.5 + rnd() * 0.5);
    const [x1, y1] = pol(cx, cy, d1, a);
    const [x2, y2] = pol(cx, cy, d2, a);
    const c = colors[i % colors.length];
    s += `<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="1.8" stroke-linecap="round"/>`;
    if (rnd() > 0.5) {
      const [bx, by] = pol(x2, y2, 5, a + 40);
      s += `<line x1="${f(x2)}" y1="${f(y2)}" x2="${f(bx)}" y2="${f(by)}" stroke="${c}" stroke-width="1.4" stroke-linecap="round"/>`;
    }
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="${f(r * 0.16)}" fill="#fff"/>`;
}

function frame(id, bg, body, rnd, glowColor = '#FFE9A8') {
  const [c1, c2] = BG[bg];
  let bokeh = '';
  for (let i = 0; i < 22; i++) {
    const x = rnd() * 400, y = rnd() * 400, r = 1 + rnd() * (i < 6 ? 14 : 2.2);
    bokeh += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" opacity="${f(i < 6 ? 0.06 + rnd() * 0.06 : 0.35 + rnd() * 0.5)}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
<defs>
<radialGradient id="${id}-bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
<radialGradient id="${id}-glow"><stop offset="0" stop-color="${glowColor}" stop-opacity=".9"/><stop offset=".45" stop-color="${glowColor}" stop-opacity=".25"/><stop offset="1" stop-color="${glowColor}" stop-opacity="0"/></radialGradient>
<radialGradient id="${id}-floor" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<linearGradient id="${id}-shine" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".0"/><stop offset=".35" stop-color="#fff" stop-opacity=".28"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
</defs>
<rect width="400" height="400" fill="url(#${id}-bg)"/>
${bokeh}
<ellipse cx="200" cy="334" rx="130" ry="16" fill="url(#${id}-floor)"/>
${body}
</svg>
`;
}

// ---------- product drawers (keep main content within y 60..340 so 4:3 crops look right) ----------
const draw = {
  sparklers(id, o, rnd) {
    const L = o.len ?? 190, n = o.count ?? 5, col = SPARK[o.sparks ?? 'gold'];
    let s = '';
    for (let i = 0; i < n; i++) {
      const a = -90 + (i - (n - 1) / 2) * (o.spread ?? 11);
      const [bx, by] = [200 + (i - (n - 1) / 2) * 6, 330];
      const [tx, ty] = pol(bx, by, L, a);
      const [cx, cy] = pol(bx, by, L * 0.42, a);
      s += `<line x1="${f(bx)}" y1="${by}" x2="${f(tx)}" y2="${f(ty)}" stroke="#A9AFB8" stroke-width="3.2" stroke-linecap="round"/>`;
      s += `<line x1="${f(cx)}" y1="${f(cy)}" x2="${f(tx)}" y2="${f(ty)}" stroke="${o.coat ?? '#4b4e57'}" stroke-width="7.5" stroke-linecap="round"/>`;
      s += `<circle cx="${f(tx)}" cy="${f(ty)}" r="30" fill="url(#${id}-glow)"/>`;
      s += sparks(f(tx), f(ty), 46, col, 16, rnd);
    }
    return s;
  },

  flowerpot(id, o, rnd) {
    const sc = o.scale ?? 1, col = SPARK[o.sparks ?? 'gold'];
    const top = 330 - 92 * sc, w1 = 15 * sc, w2 = 48 * sc;
    let s = `<g>`;
    const H = o.height ?? 170;
    s += `<ellipse cx="200" cy="${f(top - H * 0.55)}" rx="${f(H * 0.75)}" ry="${f(H * 0.7)}" fill="url(#${id}-glow)" opacity=".7"/>`;
    for (let i = 0; i < 26; i++) {
      const t = i / 25 - 0.5;
      const ex = 200 + t * H * 1.6 + (rnd() - 0.5) * 20;
      const ey = top - H * (0.25 + (1 - Math.abs(t) * 1.5) * 0.75) + rnd() * 20;
      const qx = 200 + t * H * 0.5;
      const qy = top - H * (1.05 - Math.abs(t) * 0.4);
      const c = col[i % col.length];
      s += `<path d="M200 ${f(top)} Q${f(qx)} ${f(qy)} ${f(ex)} ${f(ey)}" stroke="${c}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".9"/>`;
      s += `<circle cx="${f(ex)}" cy="${f(ey)}" r="2.6" fill="${c}"/>`;
    }
    s += `<path d="M${f(200 - w1)} ${f(top)} L${f(200 + w1)} ${f(top)} L${f(200 + w2)} 330 L${f(200 - w2)} 330 Z" fill="${o.pot ?? '#D9382B'}"/>`;
    const bands = [0.35, 0.62];
    for (const b of bands) {
      const y = top + (330 - top) * b, hw = w1 + (w2 - w1) * b, hw2 = w1 + (w2 - w1) * (b + 0.1);
      s += `<path d="M${f(200 - hw)} ${f(y)} L${f(200 + hw)} ${f(y)} L${f(200 + hw2)} ${f(y + (330 - top) * 0.1)} L${f(200 - hw2)} ${f(y + (330 - top) * 0.1)} Z" fill="${o.band ?? '#F2B233'}"/>`;
    }
    s += `<path d="M${f(200 - w1)} ${f(top)} L${f(200 + w1)} ${f(top)} L${f(200 + w2)} 330 L${f(200 - w2)} 330 Z" fill="url(#${id}-shine)"/>`;
    s += `<ellipse cx="200" cy="${f(top)}" rx="${f(w1)}" ry="4" fill="#3a2a1a"/>`;
    s += `<circle cx="200" cy="${f(top - 2)}" r="9" fill="#fff"/></g>`;
    return s;
  },

  chakkar(id, o, rnd) {
    const cols = SPARK[o.sparks ?? 'gold'], R = o.r ?? 46;
    let s = `<ellipse cx="200" cy="215" rx="150" ry="140" fill="url(#${id}-glow)" opacity=".5"/>`;
    const arms = o.arms ?? 18;
    for (let i = 0; i < arms; i++) {
      const a0 = (360 / arms) * i;
      const [x1, y1] = pol(200, 215, R + 4, a0);
      const [x2, y2] = pol(200, 215, R + 60 + rnd() * 40, a0 + 50);
      const [qx, qy] = pol(200, 215, R + 40, a0 + 15);
      const c = cols[i % cols.length];
      s += `<path d="M${f(x1)} ${f(y1)} Q${f(qx)} ${f(qy)} ${f(x2)} ${f(y2)}" stroke="${c}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
      s += `<circle cx="${f(x2)}" cy="${f(y2)}" r="2.8" fill="${c}"/>`;
    }
    const paper = o.paper ?? ['#2E8B57', '#F2B233'];
    s += `<circle cx="200" cy="215" r="${R}" fill="${paper[0]}"/>`;
    for (let k = 0; k < 4; k++) s += `<circle cx="200" cy="215" r="${f(R - 7 - k * 9)}" fill="none" stroke="${k % 2 ? paper[0] : paper[1]}" stroke-width="5" stroke-dasharray="${8 + k * 2} 6"/>`;
    s += `<circle cx="200" cy="215" r="7" fill="#3a2a1a"/>`;
    s += `<circle cx="${f(200 + R * 0.7)}" cy="${f(215 - R * 0.7)}" r="12" fill="#fff"/>`;
    return s;
  },

  rocket(id, o, rnd) {
    const n = o.count ?? 1;
    let s = '';
    const sc = n > 1 ? 0.62 : 1;
    for (let i = 0; i < n; i++) {
      const x = n > 1 ? 120 + i * 80 : 205, y = n > 1 ? 150 + (i % 2) * 35 : 130;
      const ang = n > 1 ? -12 + i * 12 : 18;
      s += `<g transform="translate(${x} ${y}) rotate(${ang}) scale(${sc})">`;
      // trail
      if (o.whistle) {
        s += `<path d="M0 190 q-18 25 0 50 t0 50 t0 50" stroke="#FFE9A8" stroke-width="4" fill="none" opacity=".7"/>`;
      }
      s += `<path d="M-14 120 Q0 230 14 120 Z" fill="#FFB347" opacity=".9"/><path d="M-8 120 Q0 190 8 120 Z" fill="#FFF3B0"/>`;
      s += sparks(0, 150, 70, SPARK[o.sparks ?? 'gold'], 14, rnd);
      s += `<rect x="-3" y="40" width="6" height="150" rx="2" fill="#C9A66B"/>`;
      s += `<path d="M0 -70 Q26 -40 26 20 L26 100 L-26 100 L-26 20 Q-26 -40 0 -70 Z" fill="${o.body ?? '#E63946'}"/>`;
      s += `<path d="M0 -70 Q14 -54 20 -32 L-20 -32 Q-14 -54 0 -70 Z" fill="${o.nose ?? '#F1FAEE'}"/>`;
      s += `<rect x="-26" y="30" width="52" height="12" fill="${o.band ?? '#F2B233'}"/><rect x="-26" y="62" width="52" height="8" fill="${o.band ?? '#F2B233'}"/>`;
      s += `<path d="M-26 70 L-46 112 L-26 100 Z M26 70 L46 112 L26 100 Z" fill="${o.fin ?? '#1D3557'}"/>`;
      s += `<path d="M0 -70 Q26 -40 26 20 L26 100 L8 100 L8 20 Q8 -40 0 -70Z" fill="#000" opacity=".12"/>`;
      s += `<circle cx="0" cy="-2" r="10" fill="#A8DADC" stroke="#F1FAEE" stroke-width="3"/></g>`;
    }
    if (o.twoSound) s += burst(id, 90, 95, 40, SPARK.multi, 14, rnd) + burst(id, 320, 80, 34, SPARK.gold, 12, rnd);
    return s;
  },

  bomb(id, o, rnd) {
    let s = `<circle cx="285" cy="95" r="70" fill="url(#${id}-glow)"/>`;
    s += `<path d="M215 140 Q235 95 275 92" stroke="#C8B48A" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    s += sparks(280, 92, 50, SPARK.gold, 18, rnd);
    if (o.shape === 'cylinder') {
      s += `<rect x="150" y="150" width="110" height="170" rx="16" fill="${o.color ?? '#2E7D32'}"/>`;
      s += `<rect x="150" y="185" width="110" height="18" fill="${o.band ?? '#F2B233'}"/><rect x="150" y="270" width="110" height="18" fill="${o.band ?? '#F2B233'}"/>`;
      s += `<ellipse cx="205" cy="150" rx="55" ry="12" fill="${o.cap ?? '#C1272D'}"/>`;
      s += `<rect x="150" y="150" width="110" height="170" rx="16" fill="url(#${id}-shine)"/>`;
      s += `<circle cx="205" cy="236" r="18" fill="#fff" opacity=".9"/><path d="M205 222 l4 10 11 1 -8 7 3 11 -10 -6 -10 6 3 -11 -8 -7 11 -1z" fill="${o.color ?? '#2E7D32'}"/>`;
    } else {
      s += `<circle cx="200" cy="235" r="92" fill="${o.color ?? '#C1272D'}"/>`;
      for (let k = -2; k <= 2; k++) s += `<ellipse cx="200" cy="235" rx="${f(92 * Math.cos((k * Math.PI) / 6.5))}" ry="92" fill="none" stroke="${o.twine ?? '#F3D99A'}" stroke-width="3" opacity=".75"/>`;
      s += `<ellipse cx="200" cy="235" rx="92" ry="30" fill="none" stroke="${o.twine ?? '#F3D99A'}" stroke-width="3" opacity=".75"/>`;
      s += `<circle cx="168" cy="200" r="24" fill="#fff" opacity=".22"/>`;
      s += `<rect x="186" y="133" width="30" height="16" rx="4" fill="${o.cap ?? '#F2B233'}"/>`;
    }
    return s;
  },

  garland(id, o, rnd) {
    const rows = o.rows ?? 2;
    let s = `<ellipse cx="200" cy="200" rx="170" ry="120" fill="url(#${id}-glow)" opacity=".35"/>`;
    for (let r = 0; r < rows; r++) {
      const y0 = 205 - (rows - 1) * 32 + r * 64;
      for (let i = 0; i < 26; i++) {
        const t = i / 25;
        const x = 55 + t * 290;
        const y = y0 + Math.sin(t * Math.PI * 2 + r) * 26;
        const ang = Math.cos(t * Math.PI * 2 + r) * 40;
        s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(ang + 90)})"><rect x="-5" y="-13" width="10" height="26" rx="3" fill="${i % 2 ? '#D62828' : '#B71C1C'}"/><rect x="-5" y="-3" width="10" height="5" fill="#F2B233"/></g>`;
      }
      s += `<path d="M55 ${y0} ${Array.from({ length: 26 }, (_, i) => { const t = i / 25; return `L${f(55 + t * 290)} ${f(y0 + Math.sin(t * Math.PI * 2 + r) * 26)}`; }).join(' ')}" stroke="#E9D8A6" stroke-width="1.6" fill="none" opacity=".7"/>`;
    }
    s += `<path d="M345 ${205 + (rows - 1) * 32} q20 -30 10 -70" stroke="#C8B48A" stroke-width="4" fill="none"/>`;
    s += sparks(355, 135 + (rows - 1) * 32, 40, SPARK.gold, 14, rnd);
    return s;
  },

  chorsa(id, o, rnd) {
    let s = `<rect x="110" y="120" width="180" height="120" rx="10" fill="#C1272D"/><rect x="110" y="120" width="180" height="26" rx="10" fill="#F2B233"/>`;
    s += `<circle cx="200" cy="188" r="30" fill="#FFF6D5"/><path d="M200 165 l7 16 17 1 -13 11 4 17 -15 -9 -15 9 4 -17 -13 -11 17 -1z" fill="#C1272D"/>`;
    for (let i = 0; i < 46; i++) {
      const x = 80 + rnd() * 240, y = 270 + rnd() * 55 - Math.abs(x - 200) * 0.12;
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rnd() * 180)})"><rect x="-4" y="-11" width="8" height="22" rx="2.5" fill="${rnd() > 0.5 ? '#E53935' : '#C62828'}"/><line x1="0" y1="-11" x2="0" y2="-17" stroke="#C8B48A" stroke-width="1.5"/></g>`;
    }
    return s;
  },

  cake(id, o, rnd) {
    const shots = o.shots ?? 30;
    const grid = shots <= 7 ? [3, 3] : shots <= 12 ? [4, 3] : shots <= 30 ? [6, 5] : shots <= 60 ? [8, 6] : [10, 8];
    const [cols, rows] = grid;
    const bw = 150, bh = 92, x0 = 200 - bw / 2, top = 230;
    let s = '';
    const nb = Math.min(5, 2 + Math.floor(shots / 25));
    const spots = [[200, 105], [115, 125], [290, 115], [150, 70], [255, 65]];
    const palettes = [SPARK.multi, SPARK.gold, SPARK.blue, SPARK.red, SPARK.green];
    for (let i = 0; i < nb; i++) {
      const [x, y] = spots[i];
      s += `<line x1="200" y1="${top}" x2="${x}" y2="${y + 20}" stroke="#FFE9A8" stroke-width="1.4" opacity=".35"/>`;
      s += burst(id, x, y, i === 0 ? 62 : 44, o.green ? SPARK.green : palettes[(i + (o.shift ?? 0)) % palettes.length], i === 0 ? 20 : 14, rnd);
    }
    // box (front + top in light perspective)
    s += `<path d="M${x0} ${top} L${x0 + 26} ${top - 26} L${x0 + bw + 26} ${top - 26} L${x0 + bw} ${top} Z" fill="${o.top ?? '#3a2a1a'}"/>`;
    s += `<path d="M${x0 + bw} ${top} L${x0 + bw + 26} ${top - 26} L${x0 + bw + 26} ${top - 26 + bh} L${x0 + bw} ${top + bh} Z" fill="${o.side ?? '#8E1B1B'}"/>`;
    s += `<rect x="${x0}" y="${top}" width="${bw}" height="${bh}" fill="${o.box ?? '#C1272D'}"/>`;
    s += `<rect x="${x0}" y="${top + 30}" width="${bw}" height="22" fill="${o.band ?? '#F2B233'}"/>`;
    s += `<rect x="${x0}" y="${top}" width="${bw}" height="${bh}" fill="url(#${id}-shine)"/>`;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const t = (c + 0.5) / cols, u = (r + 0.5) / rows;
        const cx = x0 + 26 * (1 - u) + t * bw, cy = top - 26 * (1 - u);
        s += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f((bw / cols) * 0.36)}" ry="${f((26 / rows) * 0.36)}" fill="#120a04"/>`;
      }
    s += `<circle cx="${x0 + 22}" cy="${top + 72}" r="9" fill="#fff" opacity=".85"/><circle cx="${x0 + bw - 22}" cy="${top + 72}" r="9" fill="#fff" opacity=".85"/>`;
    return s;
  },

  peacock(id, o, rnd) {
    let s = `<ellipse cx="200" cy="170" rx="160" ry="120" fill="url(#${id}-glow)" opacity=".5"/>`;
    const n = 15;
    for (let i = 0; i < n; i++) {
      const a = -160 + (140 / (n - 1)) * i;
      const [x, y] = pol(200, 260, 150, a);
      const [qx, qy] = pol(200, 260, 80, a);
      s += `<path d="M200 260 Q${f(qx)} ${f(qy)} ${f(x)} ${f(y)}" stroke="#2EC4B6" stroke-width="3" fill="none"/>`;
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="13" ry="18" transform="rotate(${f(a + 90)} ${f(x)} ${f(y)})" fill="#1B998B"/>`;
      s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="7" ry="10" transform="rotate(${f(a + 90)} ${f(x)} ${f(y)})" fill="#FFD166"/>`;
      s += `<circle cx="${f(x)}" cy="${f(y)}" r="4" fill="#1D3557"/>`;
    }
    s += sparks(200, 255, 50, SPARK.gold, 12, rnd);
    s += `<path d="M185 262 L215 262 L238 330 L162 330 Z" fill="#3A0CA3"/><path d="M178 285 L222 285 L227 300 L173 300 Z" fill="#FFD166"/>`;
    return s;
  },

  smoke(id, o, rnd) {
    const cols = ['#FF5D8F', '#FFD166', '#6DD3FF'];
    let s = '';
    cols.forEach((c, i) => {
      const x = 140 + i * 60;
      for (let k = 0; k < 9; k++) {
        const y = 250 - k * 20 - rnd() * 8, r = 16 + k * 3.2 + rnd() * 5;
        s += `<circle cx="${f(x + Math.sin(k * 0.9 + i) * 18)}" cy="${f(y)}" r="${f(r)}" fill="${c}" opacity="${f(0.55 - k * 0.04)}"/>`;
      }
    });
    cols.forEach((c, i) => {
      const x = 140 + i * 60;
      s += `<rect x="${x - 14}" y="250" width="28" height="80" rx="5" fill="#F1FAEE"/><rect x="${x - 14}" y="270" width="28" height="30" fill="${c}"/>`;
    });
    return s;
  },

  snake(id, o, rnd) {
    let s = `<ellipse cx="200" cy="318" rx="110" ry="18" fill="#C9C2B5"/><ellipse cx="200" cy="314" rx="100" ry="13" fill="#E9E4DA"/>`;
    s += `<path d="M200 312 C150 290 250 260 200 230 C150 200 250 170 205 140 C175 120 215 95 235 105" stroke="#2b2b2b" stroke-width="22" fill="none" stroke-linecap="round"/>`;
    s += `<path d="M200 312 C150 290 250 260 200 230 C150 200 250 170 205 140 C175 120 215 95 235 105" stroke="#5a5a5a" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="3 9"/>`;
    s += `<circle cx="238" cy="104" r="4" fill="#FFE27A"/>`;
    for (const [x, y] of [[135, 312], [262, 310], [155, 320], [245, 320]]) s += `<ellipse cx="${x}" cy="${y}" rx="12" ry="5" fill="#3b3b3b"/>`;
    return s;
  },

  star(id, o, rnd) {
    let s = '';
    [[150, 330, 115, -10], [250, 330, 95, 12]].forEach(([bx, by, ty, rot], j) => {
      s += `<g transform="rotate(${rot} ${bx} ${by})"><line x1="${bx}" y1="${by}" x2="${bx}" y2="${ty + 30}" stroke="#A9AFB8" stroke-width="4" stroke-linecap="round"/>`;
      s += `<circle cx="${bx}" cy="${ty}" r="55" fill="url(#${id}-glow)"/>`;
      const pts = Array.from({ length: 10 }, (_, i) => pol(bx, ty, i % 2 ? 14 : 34, -90 + i * 36)).map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
      s += `<polygon points="${pts}" fill="${j ? '#FF9EC7' : '#FFD34D'}" stroke="#fff" stroke-width="2.5"/>`;
      s += sparks(bx, ty, 62, SPARK.silver, 12, rnd) + '</g>';
    });
    return s;
  },

  poppop(id, o, rnd) {
    let s = '';
    for (let i = 0; i < 14; i++) {
      const x = 90 + rnd() * 220, y = 230 + rnd() * 90, r = rnd() * 360;
      s += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(r)})"><path d="M0 10 Q-10 0 0 -8 Q10 0 0 10Z" fill="#FFFDF5" stroke="#D9CBB0" stroke-width="1"/><path d="M0 -8 l-3 -7 M0 -8 l3 -7" stroke="#D9CBB0" stroke-width="1.6"/></g>`;
    }
    for (const [x, y, c] of [[130, 140, '#FF5D8F'], [270, 120, '#6DD3FF'], [205, 170, '#FFE27A']]) {
      const pts = Array.from({ length: 16 }, (_, i) => pol(x, y, i % 2 ? 14 : 34, i * 22.5)).map(([a, b]) => `${f(a)},${f(b)}`).join(' ');
      s += `<polygon points="${pts}" fill="${c}"/><circle cx="${x}" cy="${y}" r="9" fill="#fff"/>`;
    }
    return s;
  },

  pencils(id, o, rnd) {
    const cols = ['#E63946', '#FFB703', '#2A9D8F', '#8E7DBE', '#F77F00'];
    let s = '';
    cols.forEach((c, i) => {
      const a = -90 + (i - 2) * 13;
      const [tx, ty] = pol(200, 335, 190, a);
      const [mx, my] = pol(200, 335, 150, a);
      s += `<line x1="200" y1="335" x2="${f(mx)}" y2="${f(my)}" stroke="${c}" stroke-width="13" stroke-linecap="round"/>`;
      s += `<line x1="${f(mx)}" y1="${f(my)}" x2="${f(tx)}" y2="${f(ty)}" stroke="#4b4e57" stroke-width="6" stroke-linecap="round"/>`;
      s += sparks(f(tx), f(ty), 36, [c, '#FFF6D5', '#FFE27A'], 12, rnd);
    });
    return s;
  },

  giftbox(id, o, rnd) {
    const box = o.box ?? '#C1272D', lid = o.lid ?? '#E63946', rib = o.ribbon ?? '#F2B233';
    let s = `<ellipse cx="200" cy="150" rx="150" ry="110" fill="url(#${id}-glow)" opacity=".6"/>`;
    s += burst(id, 200, 110, 58, o.green ? SPARK.green : SPARK.multi, 18, rnd, { glow: 0.3 });
    // items peeking out
    s += `<g transform="rotate(-18 150 220)"><rect x="140" y="140" width="22" height="90" rx="4" fill="#1D3557"/><path d="M140 140 Q151 115 162 140Z" fill="#F1FAEE"/></g>`;
    s += `<g transform="rotate(16 255 220)"><path d="M245 160 L265 160 L280 230 L230 230Z" fill="#2A9D8F"/></g>`;
    for (let i = 0; i < 4; i++) s += `<line x1="${190 + i * 7}" y1="230" x2="${178 + i * 12}" y2="150" stroke="#A9AFB8" stroke-width="3"/>`;
    s += `<rect x="105" y="215" width="190" height="115" rx="6" fill="${box}"/>`;
    s += `<rect x="186" y="215" width="28" height="115" fill="${rib}"/>`;
    s += `<rect x="105" y="215" width="190" height="115" rx="6" fill="url(#${id}-shine)"/>`;
    s += `<g transform="rotate(-14 110 200)"><rect x="92" y="186" width="216" height="34" rx="6" fill="${lid}"/><rect x="186" y="186" width="28" height="34" fill="${rib}"/></g>`;
    s += `<g fill="${rib}"><path d="M185 182 q-40 -36 -52 -6 q-4 18 52 6z"/><path d="M215 172 q40 -40 54 -10 q4 18 -54 10z"/></g>`;
    for (const [x, y] of [[125, 300], [270, 300], [130, 245], [265, 245]]) s += `<circle cx="${x}" cy="${y}" r="4" fill="#fff" opacity=".7"/>`;
    return s;
  },
};

// ---------- catalogue (names must match supabase/seed.sql) ----------
const P = [
  ['10 cm Electric Sparklers', 'sparklers', 'sparklers', 'navy', { len: 150, count: 5, sparks: 'silver' }],
  ['15 cm Colour Sparklers', 'sparklers', 'sparklers', 'purple', { len: 175, count: 5, sparks: 'multi' }],
  ['30 cm Red Sparklers', 'sparklers', 'sparklers', 'maroon', { len: 210, count: 4, sparks: 'red' }],
  ['Green 10 cm Sparklers', 'sparklers', 'sparklers', 'green', { len: 150, count: 5, sparks: 'green', coat: '#3c5a45' }],
  ['Green 50 cm Sparklers', 'sparklers', 'sparklers', 'green', { len: 235, count: 3, sparks: 'gold', coat: '#3c5a45', spread: 14 }],
  ['Flower Pots Big', 'flower-pots', 'flowerpot', 'navy', { pot: '#D9382B', sparks: 'gold', height: 180 }],
  ['Flower Pots Special', 'flower-pots', 'flowerpot', 'indigo', { pot: '#7B2CBF', band: '#E0E1DD', sparks: 'silver', height: 185 }],
  ['Colour Koti', 'flower-pots', 'flowerpot', 'purple', { pot: '#F77F00', band: '#2A9D8F', sparks: 'multi', height: 200, scale: 1.1 }],
  ['Green Flower Pots', 'flower-pots', 'flowerpot', 'green', { pot: '#2E7D32', band: '#C6FF7A', sparks: 'green', height: 170 }],
  ['Ground Chakkar Big', 'chakkars', 'chakkar', 'maroon', { sparks: 'gold', paper: ['#2E8B57', '#F2B233'] }],
  ['Ground Chakkar Deluxe', 'chakkars', 'chakkar', 'indigo', { sparks: 'multi', r: 52, arms: 22, paper: ['#C1272D', '#F2B233'] }],
  ['Spinner Wheel 5 Colour', 'chakkars', 'chakkar', 'purple', { sparks: 'multi', arms: 25, paper: ['#1D3557', '#FFB703'] }],
  ['Green Ground Chakkar', 'chakkars', 'chakkar', 'green', { sparks: 'green', paper: ['#1B5E20', '#C6FF7A'] }],
  ['Baby Rocket', 'rockets', 'rocket', 'navy', { count: 3, body: '#FFB703', fin: '#E63946' }],
  ['Lunik Express Rocket', 'rockets', 'rocket', 'indigo', { body: '#E63946', sparks: 'multi' }],
  ['Two Sound Rocket', 'rockets', 'rocket', 'purple', { body: '#3A86FF', fin: '#FFBE0B', twoSound: true }],
  ['Green Whistle Rocket', 'rockets', 'rocket', 'green', { body: '#2E7D32', fin: '#C6FF7A', band: '#FFFFFF', whistle: true, sparks: 'green' }],
  ['Hydro Bomb', 'bombs', 'bomb', 'navy', { shape: 'cylinder', color: '#2E7D32' }],
  ['Atom Bomb', 'bombs', 'bomb', 'maroon', { color: '#C1272D' }],
  ['Green Sound Cracker', 'bombs', 'bomb', 'green', { color: '#2E7D32', twine: '#C6FF7A' }],
  ['1000 Wala Garland', 'bombs', 'garland', 'maroon', { rows: 2 }],
  ['5000 Wala Garland', 'bombs', 'garland', 'amber', { rows: 3 }],
  ['28 Chorsa', 'bombs', 'chorsa', 'amber', {}],
  ['7 Shot Colour Cracker', 'fancy', 'cake', 'indigo', { shots: 7, box: '#3A86FF', side: '#23599e', band: '#FFBE0B' }],
  ['30 Shot Multi Colour', 'fancy', 'cake', 'purple', { shots: 30, shift: 1 }],
  ['60 Shot Mega Display', 'fancy', 'cake', 'navy', { shots: 60, box: '#7B2CBF', side: '#4d1a7a', shift: 2 }],
  ['120 Shot Grand Finale', 'fancy', 'cake', 'maroon', { shots: 120, box: '#111111', side: '#000000', band: '#F2B233', shift: 3 }],
  ['Green 12 Shot', 'fancy', 'cake', 'green', { shots: 12, box: '#2E7D32', side: '#1B5E20', band: '#C6FF7A', green: true }],
  ['Peacock Feather Fountain', 'fancy', 'peacock', 'teal', {}],
  ['Magic Smoke Colour', 'fancy', 'smoke', 'indigo', {}],
  ['Pencil Crackers', 'kids', 'pencils', 'rose', {}],
  ['Snake Tablets', 'kids', 'snake', 'teal', {}],
  ['Twinkling Star', 'kids', 'star', 'indigo', {}],
  ['Pop Pop', 'kids', 'poppop', 'rose', {}],
  ['Mini Fountain Kids', 'kids', 'flowerpot', 'teal', { pot: '#FF5D8F', band: '#FFE27A', sparks: 'multi', height: 120, scale: 0.75 }],
  ['Family Gift Box 25 Items', 'gift-boxes', 'giftbox', 'maroon', {}],
  ['Deluxe Gift Box 40 Items', 'gift-boxes', 'giftbox', 'indigo', { box: '#1D1D1D', lid: '#2B2B2B', ribbon: '#D4AF37' }],
  ['Peacock Premium Box', 'gift-boxes', 'giftbox', 'teal', { box: '#1B998B', lid: '#2EC4B6', ribbon: '#FFD166' }],
  ['Green Kids Gift Box', 'gift-boxes', 'giftbox', 'green', { box: '#2E7D32', lid: '#43A047', ribbon: '#FFE27A', green: true }],
  ['Green Family Box', 'gift-boxes', 'giftbox', 'green', { box: '#1B5E20', lid: '#2E7D32', ribbon: '#C6FF7A', green: true }],
];

const CATS = [
  ['sparklers', 'sparklers', 'purple', { len: 190, count: 5, sparks: 'gold' }],
  ['flower-pots', 'flowerpot', 'navy', { pot: '#D9382B', sparks: 'multi', height: 190 }],
  ['chakkars', 'chakkar', 'maroon', { sparks: 'multi', arms: 22 }],
  ['rockets', 'rocket', 'indigo', { body: '#E63946', twoSound: true }],
  ['bombs', 'bomb', 'amber', { color: '#C1272D' }],
  ['fancy', 'cake', 'purple', { shots: 60 }],
  ['kids', 'star', 'rose', {}],
  ['gift-boxes', 'giftbox', 'maroon', {}],
];

function render(key, kind, bg, opts) {
  const id = 'i' + slugify(key).replace(/-/g, '');
  const rnd = rngFrom(key);
  return frame(id, bg, draw[kind](id, opts, rnd), rnd);
}

const out = (p) => (mkdirSync(dirname(p), { recursive: true }), p);
let sql = `-- Sets illustrated images on the dummy products (generated by scripts/generate-product-images.mjs).
-- Run in the Supabase SQL editor.
update products p set image_url = v.url
from (values
`;
sql += P.map(([name]) => `  ('${name.replace(/'/g, "''")}', '/img/products/${slugify(name)}.jpg')`).join(',\n');
sql += `
) as v(name, url)
where p.name = v.name;

select count(*) filter (where image_url like '/img/products/%') as with_image, count(*) as total from products;
`;

const toJpg = (svg, file) =>
  sharp(Buffer.from(svg), { density: 144 }).resize(800, 800).jpeg({ quality: 86, mozjpeg: true }).toFile(out(file));

for (const [name, , kind, bg, opts] of P) await toJpg(render(name, kind, bg, opts), join(ROOT, 'public/img/products', slugify(name) + '.jpg'));
for (const [slug, kind, bg, opts] of CATS) await toJpg(render('cat-' + slug, kind, bg, opts), join(ROOT, 'public/img/categories', slug + '.jpg'));
writeFileSync(join(ROOT, 'supabase/set-product-images.sql'), sql);

const ts = `// Generated by scripts/generate-product-images.mjs. Sample photos for the dummy catalogue,
// used when a product has no image_url yet.
const SAMPLE_PRODUCT_IMAGES = new Set<string>(${JSON.stringify(P.map(([n]) => slugify(n)), null, 2)});

export function sampleImageFor(name: string): string | null {
  const slug = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return SAMPLE_PRODUCT_IMAGES.has(slug) ? '/img/products/' + slug + '.jpg' : null;
}
`;
writeFileSync(join(ROOT, 'src/lib/sample-images.ts'), ts);
console.log(`Wrote ${P.length} product + ${CATS.length} category JPGs, supabase/set-product-images.sql, src/lib/sample-images.ts`);
