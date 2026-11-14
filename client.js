/**
 * Text Mode Pixel — live ASCII wallpaper for the Harness Web UI.
 *
 * The scene engine and the "Koi Pond" / "Honu Lagoon" scenes are adapted from
 * ai-chat-themes (https://github.com/Aohkne/ai-chat-themes), MIT License,
 * Copyright (c) 2026 Lê Hữu Khoa. See NOTICE.md in this package.
 */

window.__ModuleLoader__.load({
  id: '@local/textmode-pixel-theme',
  factory(require) {
    const SOURCE = '@local/textmode-pixel-theme';

    /* ------------------------------------------------------------------ */
    /* Scene kit (cell / glyph primitives)                                 */
    /* ------------------------------------------------------------------ */

    let CELL = 12;
    // The scene plays between the sidebar and the right rail, so the text and
    // the settings panels keep a clean bed. Both are in CSS pixels.
    const LEFT_PX = 252;
    const RIGHT_PX = 306;
    let SIDE = Math.round(LEFT_PX / CELL); // the scene's left edge, in cells

    const GLYPHS = 'St%;:X';
    const LOOSE = ".:',o";

    const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
    const hex = (c) => '#' + c.map((v) => Math.round(v * 255).toString(16).padStart(2, '0')).join('');
    const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);
    const shade = (c, k) => hex(mix(rgb(c), k > 0 ? [1, 1, 1] : [0, 0, 0], Math.abs(k)));

    const hash = (a, b, c = 0) => {
      let h = Math.imul(a, 374761393) ^ Math.imul(b, 668265263) ^ Math.imul(c, 1442695041);
      h = Math.imul(h ^ (h >>> 13), 1274126177);
      return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
    };
    const glyph = (set, x, y, t) =>
      set[Math.floor(hash(x, y, Math.floor(t * 1.2 + hash(y, x) * 7)) * set.length)];

    const ell = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    const drift = (cols, f, t, v, w) => {
      const span = cols + w * 2;
      return ((f * span + t * v) % span) - w;
    };
    const twinkle = (x, y, t, fg, odds) => {
      const s = hash(x, y, 9);
      if (s < odds) {
        return {
          ch: s < odds / 3 ? '+' : '.',
          fg,
          a: 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(t * (1 + s * 200) + s * 1000)),
        };
      }
    };
    const rising = (x, y, t, v, odds) => hash(x, Math.floor(y + t * v), 11) < odds;

    const sketch = (w, h, parts) => {
      const g = Array.from({ length: h }, () => Array(w).fill('.'));
      for (const [r, c, s] of parts) {
        [...s].forEach((ch, i) => {
          if (ch !== ' ' && g[r]?.[c + i]) g[r][c + i] = ch;
        });
      }
      return g.map((r) => r.join(''));
    };
    const shape = (w, h, at) =>
      Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => at(x, y)).join(''));
    const flip = (art) => art.map((r) => [...r].reverse().join(''));
    const frame = (frames, t, rate, phase = 0) =>
      frames[Math.floor(t * rate + phase) % frames.length];
    const tint = (bg, fg, alphas) =>
      Object.fromEntries(alphas.map((a, i) => [String(i + 1), { bg, fg, a }]));
    const near = (x, y, fg, a = 0.3, odds = 0.5) =>
      hash(x, y, 3) < odds ? { fg, a } : undefined;
    const root = document.documentElement;
    const halos = new WeakMap();
    const haloOf = (art) => {
      if (!halos.has(art)) {
        const on = (x, y) => (art[y]?.[x] ?? '.') !== '.';
        const out = [];
        for (let y = -1; y <= art.length; y++) {
          for (let x = -1; x <= art[0].length; x++) {
            if (
              !on(x, y)
              && [-1, 0, 1].some((i) => [-1, 0, 1].some((j) => on(x + i, y + j)))
              && hash(x + 50, y + 50, 5) < 0.45
            ) {
              out.push([x, y]);
            }
          }
        }
        halos.set(art, out);
      }
      return halos.get(art);
    };

    const SCENES = {};

    /* ------------------------------------------------------------------ */
    /* Koi Pond                                                            */
    /* ------------------------------------------------------------------ */

    const CARP_R = [1.8, 2.8, 3.4, 3.8, 3.9, 3.9, 3.7, 3.4, 3, 2.6, 2.2, 1.8, 1.4, 1.1, 0.9, 0.8];
    const CARP_LEN = CARP_R.length + 5;
    const CARP_PAL = (() => {
      const p = {
        w: { bg: '#f3eee5', fg: '#a59f94', a: 0.95 },
        r: { bg: '#de3a2a', fg: '#6e140c', a: 0.95 },
        k: { bg: '#1f1c1b', fg: '#6a6560', a: 0.95 },
        g: { bg: '#f2b52c', fg: '#7a5208', a: 0.95 },
        l: { bg: '#f8d769', fg: '#8a6110', a: 0.95 },
        e: { bg: '#120c0a', fg: '#5a504a', a: 0.97 },
        f: { bg: '#e6e2d8', fg: '#9a948a', a: 0.78 },
        F: { bg: '#f5cc4f', fg: '#8a6110', a: 0.8 },
      };
      for (const k of 'wrkgl') p[k.toUpperCase() + '_'] = { ...p[k], bg: shade(p[k].bg, -0.16) };
      return p;
    })();
    const CARP_KINDS = [
      { base: 'w', fin: 'f', spots: [[2, 0.6, 1.3, 'r'], [5.5, 1.6, 1.9, 'r'], [9.5, -1.3, 1.8, 'r'], [13, 0.8, 1.2, 'r']] },
      { base: 'w', fin: 'f', spots: [[1, 0, 1.5, 'r'], [3.5, -1.6, 1.9, 'k'], [6, 1.2, 2.2, 'r'], [8, 2, 1.6, 'k'], [10, -1, 2, 'r'], [12, -0.6, 1.6, 'k'], [14.5, 0.4, 1.2, 'k']] },
      { base: 'g', fin: 'F', spots: [] },
    ];
    const CARP_LOOPS = [
      [0.62, 0.80, 0.10, 0.06, 1, 1],
      [0.28, 0.72, 0.10, 0.05, 1, -1],
      [0.56, 0.88, 0.14, 0.04, 1, -1],
    ];
    const carpPath = (cols, rows, i, s) => {
      const [mx, my, rx, ry, k, dir] = CARP_LOOPS[i];
      return [
        SIDE + (cols - SIDE) * (mx + rx * Math.cos(s * k * dir + i * 2)),
        rows * (my + ry * Math.sin(s * dir + i * 2)),
      ];
    };
    const carp = (cols, rows, t, i) => {
      const z = Math.min(0.75, Math.max(0.5, (cols - SIDE) / 90));
      let s = t * (0.06 + i * 0.01);
      const spine = [carpPath(cols, rows, i, s)];
      for (let n = 0; spine.length < CARP_LEN && n < 20000; n++) {
        const q = carpPath(cols, rows, i, (s -= 0.002));
        const [lx, ly] = spine[spine.length - 1];
        if (Math.hypot(q[0] - lx, q[1] - ly) >= z) spine.push(q);
      }
      const norm = spine.map((_, k) => {
        const [ax, ay] = spine[Math.max(0, k - 1)];
        const [bx, by] = spine[Math.min(spine.length - 1, k + 1)];
        const d = Math.hypot(ax - bx, ay - by) || 1;
        return [-(ay - by) / d, (ax - bx) / d];
      });
      const xs = spine.map((p) => p[0]);
      const ys = spine.map((p) => p[1]);
      const ox = Math.min(...xs) - 6;
      const oy = Math.min(...ys) - 6;
      const kind = CARP_KINDS[i];
      const P = CARP_PAL;
      const swish = (u) => Math.sin(t * 3.2 + i * 2) * 1.3 * Math.max(0, u - 9) / 11;
      const paddle = 4.8 + 0.7 * Math.sin(t * 2.4 + i);
      return {
        x: ox,
        y: oy,
        w: Math.ceil(Math.max(...xs) - ox + 7),
        h: Math.ceil(Math.max(...ys) - oy + 7),
        key: i,
        shadow: '#0b3430',
        field: (gx, gy) => {
          const wx = ox + gx + 0.5;
          const wy = oy + gy + 0.5;
          let u = 0;
          let d = Infinity;
          spine.forEach(([px, py], j) => {
            const e = Math.hypot(wx - px, wy - py);
            if (e < d) {
              d = e;
              u = j;
            }
          });
          d /= z;
          const [nx, ny] = norm[u];
          const dx = (wx - spine[u][0]) / z;
          const dy = (wy - spine[u][1]) / z;
          const v = dx * nx + dy * ny - swish(u);
          const av = Math.abs(v);
          const seed = { sx: u + i * 40, sy: Math.round(v * 1.5) };
          if (u < CARP_R.length && av <= CARP_R[u] && d <= CARP_R[u] + 1) {
            if (u >= 1 && u <= 2 && Math.abs(av - 1.8) < 0.55) return { c: P.e, ...seed };
            const spot = kind.spots.find(([su, sv, sr]) => Math.hypot(u - su, v - sv) < sr);
            let key = spot ? spot[3] : kind.base;
            if (kind.base === 'g' && av < 0.9 && u > 1) key = 'l';
            return { c: av > CARP_R[u] - 0.8 ? P[key.toUpperCase() + '_'] : P[key], ...seed };
          }
          if (u >= CARP_R.length) {
            const a = u - CARP_R.length + (u === spine.length - 1 ? Math.max(0, dy * nx - dx * ny) : 0);
            if (av <= 0.7 + Math.min(a, 4.5) * 0.5 && a <= 4 + av * 0.8 && !(a > 4 && av < (a - 4) * 1.4 + 0.5)) {
              return { c: P[kind.fin], ...seed };
            }
          }
          if (u >= 3 && u <= 8 && ((u - 5.5) / 2.2) ** 2 + ((av - paddle) / 1.6) ** 2 <= 1) {
            return { c: P[kind.fin], ...seed };
          }
          if (u >= 9 && u <= 12 && ((u - 10.5) / 1.3) ** 2 + ((av - 3) / 1.1) ** 2 <= 1) {
            return { c: P[kind.fin], ...seed };
          }
        },
      };
    };
    const LILIES = [
      [0.8, 0.06, 4.2, 2.4],
      [0.95, 0.14, 6.5, 2],
      [0.99, 0.42, 5, 2.8],
      [0.01, 0.55, 5.5, 0.2],
      [0.2, 0.97, 4.8, -1.6],
      [0.04, 0.95, 6.5, -0.9],
      [0.97, 0.95, 5.5, -2.2],
    ];
    const LOTUS = [[0.82, 0.08, 3.2], [0.18, 0.87, 3.2]];
    const LILY_PAL = {
      pad: { bg: '#5c9a43', fg: '#2c5520', a: 0.93 },
      rim: { bg: '#3f7a31', fg: '#1d3d15', a: 0.93 },
      vein: { bg: '#86c066', fg: '#3a6a2a', a: 0.93 },
      petal: { bg: '#f28bb8', fg: '#8a2d55', a: 0.95 },
      inner: { bg: '#f9c3da', fg: '#a2466e', a: 0.95 },
      heart: { bg: '#f6d03f', fg: '#7a5a08', a: 0.97 },
      shadow: { bg: '#0b3430', fg: '#0b3430', ch: '', a: 0.35 },
    };
    const lilyAt = (x, y, cols, rows, t) => {
      const W = cols - SIDE;
      for (const [fx, fy, r] of LOTUS) {
        const cx = SIDE + fx * W;
        const cy = fy * rows;
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        const th = Math.atan2(dy, dx);
        const p = r * (0.55 + 0.45 * Math.abs(Math.cos(4 * th + fx * 9))) * (1 + 0.07 * Math.sin(t * 0.8 + fx * 5));
        if (d < 0.9) return LILY_PAL.heart;
        if (d < p * 0.55) return LILY_PAL.inner;
        if (d < p) return LILY_PAL.petal;
      }
      for (const [fx, fy, r, notch] of LILIES) {
        const cx = SIDE + fx * W;
        const cy = fy * rows;
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        if (d > r) continue;
        const th = Math.atan2(dy, dx);
        const off = Math.abs((((th - notch) % (Math.PI * 2) + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
        if (off < 0.3 && d > 0.4) continue;
        if (d > r - 0.8) return LILY_PAL.rim;
        const spoke = Math.abs(((((th - notch) * 11 / (Math.PI * 2)) % 1) + 1) % 1 - 0.5);
        return d < 0.8 || (d > 1.2 && spoke > 0.5 - 0.35 / d) ? LILY_PAL.vein : LILY_PAL.pad;
      }
    };

    SCENES['koi-pond'] = {
      cell: (x, y, cols, rows, t) => {
        const lily = lilyAt(x, y, cols, rows, t);
        if (lily) return lily;
        if (lilyAt(x - 1, y - 1, cols, rows, t)) return LILY_PAL.shadow;
        if (hash(x - Math.floor(t * 0.3), y + Math.floor(t * 0.12), 77) < 0.004) {
          return { bg: '#f4b6cc', fg: '#8a2d55', a: 0.85 };
        }
        for (let i = 0; i < 5; i++) {
          const rr = (t * 1.6 + i * 3.7) % 10;
          const d = Math.hypot(
            x - (SIDE + hash(i, 61) * (cols - SIDE)),
            y - hash(i, 62) * rows,
          );
          if ((Math.abs(d - rr) < 0.5 || Math.abs(d - rr + 2.2) < 0.5) && hash(x, y, 63) < 0.7) {
            return { ch: 'o', fg: '#d6f1e8', a: 0.4 * (1 - rr / 10) };
          }
        }
        const deep = ell(x, y, SIDE + (cols - SIDE) * 0.5, rows * 0.45, (cols - SIDE) * 0.2, rows * 0.28);
        if (deep < 1) return { bg: '#0d3a38', fg: '#0d3a38', ch: '', a: 0.45 * (1 - deep) };
        if (hash(x, y, 71) < 0.03) {
          return { ch: 'abcdeghkmnopqtu_.*'[Math.floor(hash(x, y, 72) * 18)], fg: '#cfeee6', a: 0.2 };
        }
        return twinkle(x, y, t, '#e8fbf6', 0.004);
      },
      sprites: (cols, rows, t) => [0, 1, 2].map((i) => carp(cols, rows, t, i)),
    };

    /* ------------------------------------------------------------------ */
    /* Moonlit                                                             */
    /* ------------------------------------------------------------------ */

    const clouds = new Map();
    const cloudArt = (w) => {
      if (!clouds.has(w)) {
        const cx = w / 2;
        const inside = (x, y) =>
          Math.min(ell(x, y, cx, 3, w / 2, 1.6), ell(x, y, cx + w * 0.1, 1.4, w * 0.28, 1.2)) <= 1;
        clouds.set(
          w,
          shape(w + 1, 6, (x, y) => (inside(x, y) ? String(1 + Math.min(3, Math.floor(4 * x / (w + 1)))) : '.')),
        );
      }
      return clouds.get(w);
    };

    const METEOR = sketch(8, 4, [[0, 0, '11'], [1, 2, '22'], [2, 4, '33'], [3, 6, '4H']]);
    const METEORS = [METEOR, flip(METEOR)];
    const meteorPal = (ch) => ({
      H: { bg: '#fff6d0', fg: '#3a3524', a: 1 },
      4: { ch, fg: '#fff6d0', a: 0.85 },
      3: { ch, fg: '#fff6d0', a: 0.6 },
      2: { ch, fg: '#dbe2f5', a: 0.4 },
      1: { ch, fg: '#dbe2f5', a: 0.2 },
    });
    const METEOR_PALS = [meteorPal('\\'), meteorPal('/')];
    const SKYFALL = 12;
    const FALL = 1.5;
    const meteor = (cols, rows, t) => {
      const k = Math.floor(t / SKYFALL);
      const p = (t - k * SKYFALL) / FALL;
      if (p >= 1) return [];
      const left = hash(k, 3) < 0.5;
      const run = 26 * p;
      const hx = cols * (0.25 + 0.5 * hash(k, 1)) + (left ? -run : run);
      const hy = rows * (0.05 + 0.25 * hash(k, 2)) + run * 0.5;
      return [
        {
          art: METEORS[+left],
          pal: METEOR_PALS[+left],
          key: 40,
          a: Math.sin(Math.PI * p),
          x: left ? hx : hx - 7,
          y: hy - 3,
        },
      ];
    };

    const CLOUDS = [[0.08, 0.14, 26, 0.6], [0.55, 0.36, 22, 0.45], [0.3, 0.6, 24, 0.5], [0.85, 0.8, 18, 0.7]];
    const NIGHT = tint('#7088d8', '#18214a', [0.35, 0.5, 0.65, 0.82]);

    SCENES.moonlit = {
      cell: (x, y, cols, rows, t) => {
        const mx = Math.round(cols * 0.86);
        const my = Math.round(rows * 0.22);
        const R = 6.5;
        const d1 = Math.hypot(x - mx, y - my);
        const d2 = Math.hypot(x - mx - 3.4, y - my + 1.8);
        if (d1 <= R && d2 > R * 0.85) return { bg: '#d9c98f', fg: '#3a3524', a: 0.9 };
        if (d1 <= R + 1.6 && d2 > R * 0.85 + 0.6 && hash(x, y, 5) < 0.45) {
          return { fg: '#d9c98f', a: 0.25 + 0.15 * Math.sin(t * 2 + x) };
        }
        return twinkle(x, y, t, '#dbe2f5', 0.014);
      },
      sprites: (cols, rows, t) => [
        ...meteor(cols, rows, t),
        ...CLOUDS.map(([fx, fy, w, v], i) => ({
          art: cloudArt(w),
          pal: NIGHT,
          halo: '#8ea2e6',
          x: drift(cols, fx, t, v, w) - w / 2,
          y: fy * rows - 3,
          key: i,
        })),
      ],
    };

    /* ------------------------------------------------------------------ */
    /* Honu Lagoon                                                         */
    /* ------------------------------------------------------------------ */

    const matrix = (x, y, cols, fg) =>
      x > cols * 0.82 && y % 2 === 0 && hash(x, y, 90) < 0.55
        ? { ch: '-', fg, a: 0.14 }
        : undefined;

    const REEF_COLORS = [
      '#2b9ee6', '#53ddf9', '#06aceb', '#69ebfa', '#e1f6f5', '#21bbef', '#3074ee', '#007cef',
      '#0499eb', '#05befa', '#1ccaf9', '#01b5fa', '#0281e1', '#7c4d36', '#033a9a', '#40b9cd',
      '#e5b77f', '#01adf9', '#0188f4', '#946a62', '#cbd5ac', '#2561a5', '#101b29', '#b7a976',
      '#35d4f9', '#043a78', '#01a0f9', '#f4e9bf', '#0163da', '#01a6f8', '#0191f8', '#874fe2',
      '#0142a9', '#6e7cc9', '#015ad2', '#016ce4', '#0198f8', '#f3688c', '#0488b8', '#116c66',
      '#9bf4f7', '#0155ca', '#014ec1', '#f6cc38', '#373b95', '#5fc04f', '#08508b', '#0148b7',
      '#ee7e3a', '#163b5d', '#a8a7e3', '#3b9662', '#555cba', '#f6e5ab', '#97df4f', '#1f2d89',
    ];
    const REEF_W = 97;
    const REEF_H = 47;
    const REEF_THINGS = {
      turtle: {
        c: 24,
        r: 33,
        art: [
          '.........................',
          '.......ppjMMNN.....pKpK..',
          '.....pMMjnddjdj..pRPmRPN.',
          '...NMdndjddd4dddNRPkmDDp.',
          '..jdgdk44ddjmDPSgRDkRRR..',
          '.jndddddNPDDJJSSRrRRkp...',
          '..ddpPRRSSDDNSRrnnpC.....',
          '.DnRRRRgkDDDNrrRkPSSC....',
          '..KnngDDDDDngggp.DDJRp...',
          '.....kDkDPk.......NJSR...',
          '....PDPjDR.........nDPN..',
          '...RPDnRK...........gDN..',
          '..P..Rp..............pC..',
          '.........................',
        ],
      },
      clownA: { c: 11, r: 20, art: ['........', '..dmMP..', '.M4M44M.', '.ddM4dM.', '........'] },
      clownB: { c: 16, r: 24, art: ['.........', '....pM...', '.LlMM4MC.', '.mM4MM4M.', '.........'] },
      tang: { c: 26, r: 27, art: ['.........', '...pp....', '.y6eeeFP.', '.66666pH.', '.........'] },
      yellow: {
        c: 48,
        r: 20,
        art: [
          '............',
          '........HP..',
          '.......HHHH.',
          '...DH...Hj..',
          '..HHHH......',
          '...HH...lHH.',
          '........HHH.',
          '............',
        ],
      },
      crab: { c: 29, r: 42, art: ['BmgjM.', '.MMMdg', 'M..jM.', 'j.....'] },
      idolA: { c: 61, r: 19, art: ['.......', '....4..', '..mR...', '.4mrmH.', '.4m4m..', '..m4...', '.......'] },
      idolB: { c: 63, r: 25, art: ['........', '...4....', '..m.....', '.4m.mH..', '.rm4N...', '..m44...', '........'] },
      star: {
        c: 3,
        r: 35,
        art: [
          '............',
          '.....M......',
          '............',
          '..MMMMMMM...',
          '..MMMMHM....',
          '....MMMM....',
          '...MM..MM...',
          '............',
          '............',
        ],
      },
      weedL: {
        c: 0,
        r: 10,
        art: [
          '........', '........', '.P......', '.JN.....', '..J.....', '...J....',
          '...J.D..', '..J..J..', '.JD.JJ..', '.JD.P.DN', '..PPD..S', '..JJ..JS',
          '.JP..DS.', '.PD.DS..', '.P.DJJ.S', '...P.P.S', '....D.JJ', '......J.',
          '........', '........', '........', '........', '........', '........',
        ],
      },
      weedM: {
        c: 16,
        r: 31,
        art: [
          '..........', '..........', '..J.......', '..J..DJ...', '...J..S...',
          '..JJ.JP...', '..J.JP....', '..P.DD.D..', '...P.P.J..', '....D.PD..',
          '.....DP...',
        ],
      },
      weedR: {
        c: 87,
        r: 17,
        art: [
          '..........', '..........', '..........', '..........', '......J.J.',
          '....J.PJJ.', '....J..JD.', '.....JJ.J.', '......J.J.', '......P...',
          '..........', '..........', '..........', '..........',
        ],
      },
    };
    const REEF_KEYS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const REEF_PAL = Object.fromEntries(
      REEF_COLORS.map((c, i) => [REEF_KEYS[i], { bg: c, fg: shade(c, -0.1), a: 0.96 }]),
    );
    const placeOf = (th, cols, rows) => [
      SIDE + th.c * (cols - SIDE) / REEF_W,
      th.r * rows / REEF_H,
    ];
    const nudge = (art, pick, dx, dy) => {
      const g = art.map((r) => [...r]);
      const moved = [];
      art.forEach((row, y) =>
        [...row].forEach((k, x) => {
          if (k !== '.' && pick(x, y, k)) {
            moved.push([x + dx, y + dy, k]);
            g[y][x] = '.';
          }
        }),
      );
      for (const [x, y, k] of moved) if (g[y]?.[x] !== undefined) g[y][x] = k;
      return g.map((r) => r.join(''));
    };
    const parts = (art) => {
      const seen = new Set();
      const out = [];
      art.forEach((row, y) =>
        [...row].forEach((k, x) => {
          if (k === '.' || seen.has(`${x},${y}`)) return;
          const cells = [];
          const todo = [[x, y]];
          seen.add(`${x},${y}`);
          while (todo.length) {
            const [cx, cy] = todo.pop();
            cells.push([cx, cy]);
            for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
              if ((art[ny]?.[nx] ?? '.') !== '.' && !seen.has(`${nx},${ny}`)) {
                seen.add(`${nx},${ny}`);
                todo.push([nx, ny]);
              }
            }
          }
          const xs = cells.map((c) => c[0]);
          const ys = cells.map((c) => c[1]);
          const x0 = Math.min(...xs);
          const y0 = Math.min(...ys);
          const own = shape(
            Math.max(...xs) - x0 + 1,
            Math.max(...ys) - y0 + 1,
            (px, py) => (cells.some(([a, b]) => a === px + x0 && b === py + y0) ? art[py + y0][px + x0] : '.'),
          );
          if (cells.length > 2) out.push({ dx: x0, dy: y0, art: own });
        }),
      );
      return out;
    };
    const wag = (art, facesRight) => {
      const w = art[0].length;
      const tail = (x) => (facesRight ? x < w * 0.36 : x >= w * 0.64);
      return [art, nudge(art, (x) => tail(x), 0, -1), art, nudge(art, (x) => tail(x), 0, 1)];
    };
    const both = (frames) => [frames, frames.map(flip)];
    const T0 = REEF_THINGS;
    const REEF_FRAMES = {
      clownA: both(wag(T0.clownA.art, true)),
      clownB: both(wag(T0.clownB.art, true)),
      tang: both(wag(T0.tang.art, false)),
      idolA: both(wag(T0.idolA.art, false)),
      idolB: both(wag(T0.idolB.art, false)),
      yellow: parts(T0.yellow.art).map((p) => ({ ...p, frames: wag(p.art, false) })),
      turtle: (() => {
        const a = T0.turtle.art;
        const fl = (x, y) => y >= a.length * 0.64;
        return [a, nudge(a, fl, -1, 0), nudge(a, fl, -1, 1), nudge(a, fl, 0, 1)];
      })(),
      crab: (() => {
        const a = T0.crab.art;
        const h = a.length;
        return [
          a,
          nudge(nudge(a, (x, y) => y === h - 1, 1, 0), (x, y) => y === 0, 0, -1),
          a,
          nudge(a, (x, y) => y === h - 1, -1, 0),
        ];
      })(),
      star: (() => {
        const a = T0.star.art;
        return [a, a, a, nudge(a, (x, y) => y <= 1, 0, -1)];
      })(),
    };
    const swaying = (art, t, i) => ({
      w: art[0].length + 4,
      h: art.length,
      field: (gx, gy) => {
        const off = Math.round(Math.sin(t * 1.2 + gy * 0.45 + i * 2) * 1.3 * (art.length - gy) / art.length);
        const k = art[gy][gx - 2 - off];
        return k && k !== '.' ? { c: REEF_PAL[k], sx: gx - 2 - off, sy: gy } : undefined;
      },
    });

    SCENES['honu-lagoon'] = {
      size: 18,
      cell: (x, y, cols, rows, t) => {
        for (let i = 0; i < 9; i++) {
          if (
            x === Math.floor(hash(i, 31) * cols) + Math.round(Math.sin(t + i))
            && y === Math.round(rows - ((t * 1.8 * (1 + hash(i, 32)) + hash(i, 33) * rows) % (rows + 4)))
          ) {
            return { ch: 'o', fg: '#e8fbff', a: 0.65 };
          }
        }
        if (rising(x, y, t, 0.5, 0.008)) return { ch: '.', fg: '#cdeefa', a: 0.35 };
        return twinkle(x, y, t, '#e8fbff', 0.006) ?? matrix(x, y, cols, '#e8fbff');
      },
      sprites: (cols, rows, t) => {
        const T = REEF_THINGS;
        const F = REEF_FRAMES;
        const out = [];
        const add = (art, x, y, key, extra = {}) => out.push({ art, pal: REEF_PAL, key, x, y, ...extra });
        const swim = (name, v, left) => {
          const w = T[name].art[0].length;
          const [x] = placeOf(T[name], cols, rows);
          const f = (x + w / 2 + w) / (cols + w * 2);
          const run = drift(cols, left ? 1 - f : f, t, v, w);
          return (left ? cols - run : run) - w / 2;
        };
        ['weedL', 'weedM', 'weedR'].forEach((n, i) => {
          const [x, y] = placeOf(T[n], cols, rows);
          out.push({ ...swaying(T[n].art, t, i), x: x - 2, y, key: 150 + i });
        });
        const [sx, sy] = placeOf(T.star, cols, rows);
        add(frame(F.star, t, 0.6), sx, sy, 7);
        const [, ty] = placeOf(T.turtle, cols, rows);
        add(frame(F.turtle, t, 2.2), swim('turtle', 0.8, false), ty + Math.sin(t * 0.6) * 0.8, 1, { shadow: '#0b3d7a' });
        const [, yy] = placeOf(T.yellow, cols, rows);
        const yx = swim('yellow', 1.3, true);
        F.yellow.forEach((p, i) =>
          add(
            frame(p.frames, t, 4, i * 1.3),
            yx + p.dx + Math.sin(t * 0.9 + i * 2) * 0.8,
            yy + p.dy + Math.sin(t * 1.1 + i) * 0.7,
            20 + i,
          ),
        );
        const [, gy] = placeOf(T.tang, cols, rows);
        add(frame(F.tang[0], t, 5), swim('tang', 2, true), gy + Math.sin(t * 1.4) * 0.5, 3);
        ['clownA', 'clownB'].forEach((n, i) => {
          const [x, y] = placeOf(T[n], cols, rows);
          const a = t * 0.7 + i * 2.2;
          add(frame(F[n][Math.cos(a) < 0 ? 1 : 0], t, 5, i * 2), x + Math.sin(a) * 2.5, y + Math.sin(t * 1.3 + i) * 0.6, 4 + i);
        });
        ['idolA', 'idolB'].forEach((n, i) => {
          const [x, y] = placeOf(T[n], cols, rows);
          const a = t * 0.45 + i * 1.7;
          add(frame(F[n][Math.cos(a) > 0 ? 1 : 0], t, 3, i * 2), x + Math.sin(a) * 1.5, y + Math.sin(t * 0.8 + i) * 0.8, 8 + i);
        });
        const [cx, cy] = placeOf(T.crab, cols, rows);
        add(frame(F.crab, t, 6), cx + Math.sin(t * 0.9) * 4, cy, 6);
        return out;
      },
    };

    /* ------------------------------------------------------------------ */
    /* Cloud Drift                                                         */
    /* ------------------------------------------------------------------ */

    const BIRDS = [['v'], ['^']];
    const BIRD_PAL = { v: { ch: 'v', fg: '#3f6280', a: 0.8 }, '^': { ch: '^', fg: '#3f6280', a: 0.8 } };
    const FLOCK = [[0, 0], [2, -1], [4, 0], [1.5, 1.5]];
    const skies = new Map();
    const skyArt = (seed) => {
      if (!skies.has(seed)) {
        const r = (j) => hash(seed, j, 3);
        const kind = seed % 4;
        const [n, R0, R1, base] = [
          [3 + Math.floor(r(2) * 2), 2.4, 4.2, 1],
          [6 + Math.floor(r(2) * 3), 1.1, 1.8, 1],
          [2, 1.6, 2.4, 1],
          [3, 2.6, 5.2, 2],
        ][kind];
        const domes = [];
        let cx = 0;
        for (let i = 0; i < n; i++) {
          const mid = 1 - Math.abs(i - (n - 1) / 2) / Math.max(1, (n - 1) / 2);
          const R = R0 + (R1 - R0) * (kind === 3 ? mid ** 2 : mid * 0.6 + r(10 + i) * 0.4);
          cx = i ? cx + R * 0.95 : R;
          domes.push([cx, R]);
          cx += R * 0.45;
        }
        const w = domes[n - 1][0] + domes[n - 1][1];
        const lift = (x) =>
          Math.max(0, ...domes.map(([dx, R]) => (Math.abs(x - dx) < R ? Math.sqrt(R * R - (x - dx) ** 2) * 0.75 : 0)));
        const h = Math.ceil(Math.max(...domes.map((d) => d[1])) * 0.75 + base);
        skies.set(
          seed,
          shape(Math.ceil(w) + 1, h, (x, y) => {
            const up = h - 1 - y;
            const hh = Math.ceil(base + lift(x + 0.5) - 0.35);
            const end = x + 0.5 < domes[0][0] - domes[0][1] * 0.7 || x + 0.5 > domes[n - 1][0] + domes[n - 1][1] * 0.7;
            if (up >= hh || (end && up >= base) || (up === hh - 1 && hh > 2 && hash(seed * 7 + x, 1, 4) < 0.25)) return '.';
            return String(1 + Math.min(3, Math.floor(4 * up / h)));
          }),
        );
      }
      return skies.get(seed);
    };
    const DAY_TOPS = {
      4: { bg: '#ffffff', fg: '#9db3c6', a: 0.96 },
      3: { bg: '#f2f6fa', fg: '#93a9bd', a: 0.93 },
      2: { bg: '#e0e9f1', fg: '#869cb0', a: 0.9 },
      1: { bg: '#cad7e3', fg: '#7a90a4', a: 0.86 },
    };
    const WISP = ['~-~~.~~-~~~.-~', '..~~-~.~~~....'];
    const WISP_PAL = { '~': { ch: '~', fg: '#ffffff', a: 0.55 }, '-': { ch: '-', fg: '#ffffff', a: 0.45 } };
    const FAR = [[2, 0.1, 0.14, 0.8, 0.65], [5, 0.55, 0.08, 0.95, 0.6], [6, 0.8, 0.3, 0.75, 0.65], [9, 0.35, 0.3, 0.85, 0.6], [10, 0.95, 0.2, 1, 0.65]];
    const NEAR_SKY = [[0, 0.15, 0.48, 1.6, 1], [3, 0.62, 0.42, 1.9, 1], [4, 0.88, 0.72, 1.7, 1], [7, 0.36, 0.78, 2.2, 1], [8, 0.05, 0.86, 1.5, 1]];
    const CIRRUS = [[0.2, 0.05, 2.6], [0.7, 0.13, 2.2]];
    const skySprite = (cols, rows, t) => ([seed, fx, fy, v, a]) => {
      const art = skyArt(seed);
      const w = art[0].length;
      return { art, pal: DAY_TOPS, a, halo: '#ffffff', x: drift(cols, fx, t, v, w) - w / 2, y: fy * rows - art.length / 2, key: seed };
    };

    SCENES['cloud-drift'] = {
      sprites: (cols, rows, t) => [
        ...CIRRUS.map(([fx, fy, v], i) => ({ art: WISP, pal: WISP_PAL, key: 60 + i, x: drift(cols, fx, t, v, 14) - 7, y: fy * rows })),
        ...FAR.map(skySprite(cols, rows, t)),
        ...[0, 1].flatMap((f) =>
          FLOCK.map(([bx, by], j) => ({
            art: frame(BIRDS, t, 3, j * 0.5),
            pal: BIRD_PAL,
            key: 20 + f * 4 + j,
            x: drift(cols, hash(f, 21), t, 2.4 + f * 0.4, 6) + bx,
            y: rows * (0.25 + 0.25 * f) + Math.sin(t * 0.7 + f) * 1.5 + by,
          })),
        ),
        ...NEAR_SKY.map(skySprite(cols, rows, t)),
      ],
    };

    /* ------------------------------------------------------------------ */
    /* Fireflies                                                           */
    /* ------------------------------------------------------------------ */

    const FLIES = [['a..', '.Y.', '..c'], ['..b', '.Y.', '...'], ['...', '.Y.', 'b.a']];
    const FLY_PAL = {
      Y: { bg: '#e9f57a', fg: '#2c3308', a: 1 },
      a: { ch: ':', fg: '#e9f57a', a: 0.55 },
      b: { ch: "'", fg: '#e9f57a', a: 0.55 },
      c: { ch: 'o', fg: '#e9f57a', a: 0.4 },
    };

    SCENES.fireflies = {
      cell: (x, y, cols, rows, t) => {
        const h = 2 + Math.floor(hash(x, 7) ** 2 * 8);
        if (y < rows - h || (y < rows - 1 && hash(x, y, 8) > 0.75)) return;
        return { ch: glyph('SXt%S', x, y, t * 0.5), fg: '#4fb85c', a: 0.5 + (0.45 * (y - rows + h)) / h };
      },
      sprites: (cols, rows, t) =>
        Array.from({ length: 18 }, (_, i) => {
          const b = Math.max(0, Math.min(1, Math.sin(t * (0.6 + 0.5 * hash(i, 5)) + i * 3) * 1.4 - 0.2));
          return {
            art: FLIES[i % 3],
            pal: FLY_PAL,
            key: i,
            a: 0.12 + 0.88 * b,
            glow: { r: 3.4, color: '#cfe86a', a: 0.18 + 0.3 * b },
            x: hash(i, 1) * cols + Math.sin(t * 0.2 * (1 + hash(i, 2)) + i) * 6 - 1,
            y: rows * (0.08 + 0.65 * hash(i, 3)) + Math.cos(t * 0.17 * (1 + hash(i, 4)) + i * 2) * 3.5 - 1,
          };
        }),
    };

    /* ------------------------------------------------------------------ */
    /* Jellyfish                                                           */
    /* ------------------------------------------------------------------ */

    const jelly = (ph) =>
      sketch(13, 22, [
        ...(ph
          ? [[0, 4, 'BBBBB'], [1, 2, 'BBBBBBBBB'], [2, 1, 'BBpBBBBBpBB'], [3, 0, 'RRRRRRRRRRRRR']]
          : [[0, 3, 'BBBBBBB'], [1, 1, 'BBBBBBBBBBB'], [2, 1, 'BBpBBBBBpBB'], [3, 1, 'RRRRRRRRRRR']]),
        [4, 3, 'kkkkkkk'],
        ...[1, 3, 5, 7, 9, 11].flatMap((c, k) =>
          Array.from({ length: 16 }, (_, i) => {
            const r = hash(k, i, 7);
            return r < 0.18 ? [] : [[5 + i, c, r < 0.42 ? 'o' : 'l']];
          }).flat(),
        ),
      ]);
    const JELLIES = [jelly(0), jelly(1)];
    const jellyPal = (c) => ({
      B: { bg: c, fg: shade(c, -0.6), a: 0.72 },
      p: { bg: shade(c, 0.55), fg: c, a: 0.85 },
      R: { bg: shade(c, 0.15), fg: shade(c, -0.6), a: 0.78 },
      k: { bg: shade(c, -0.15), fg: shade(c, -0.65), a: 0.6 },
      l: { bg: c, fg: shade(c, -0.6), a: 0.62 },
      o: { ch: 'o', fg: shade(c, 0.3), a: 0.5 },
    });
    const JELLY = [
      [0.25, '#9a7fe0', 0.6, 0.7],
      [0.82, '#ef8f63', 0.9, 0.95],
      [0.06, '#ec92c6', 0.75, 0.9],
      [0.55, '#7fb4ef', 1.1, 0.6],
    ].map(([x, c, v, a]) => [x, jellyPal(c), v, a]);

    SCENES.jellyfish = {
      cell: (x, y, cols, rows, t) => {
        const cx = -cols * 0.15;
        const cy = -rows * 0.35;
        const R = rows * 0.75 + cols * 0.1;
        const d = Math.hypot(x - cx, y - cy);
        if (Math.abs(d - R) < 0.55 && (((Math.atan2(y - cy, x - cx) * R - t * 3) % 3) + 3) % 3 < 1) {
          return { ch: 'o', fg: '#dbe8ff', a: 0.55 };
        }
        if (Math.abs(d - R - 1.6) < 0.55 && hash(x, y, 71) < 0.4) return { ch: '~', fg: '#9cc8ff', a: 0.35 };
        if (rising(x, y, t, 0.6, 0.01)) return { ch: '.', fg: '#9cc8ff', a: 0.35 };
      },
      sprites: (cols, rows, t) =>
        JELLY.map(([fx, pal, v, a], i) => {
          const span = rows + 34;
          return {
            art: frame(JELLIES, t, 1.1, i * 0.5),
            pal,
            a,
            key: i,
            x: fx * cols + Math.sin(t * 0.35 + i) * 2.5 - 6.5,
            y: rows + 4 - ((t * v + (i * span) / 4) % span),
          };
        }),
    };

    /* ------------------------------------------------------------------ */
    /* Lantern Night                                                       */
    /* ------------------------------------------------------------------ */

    const LANTERN_NEAR = ['..RRRR..', '.RRRRRR.', 'RRRRRRRR', '.pPPPPp.', '.pPPKPp.', '.pPKKPp.', '.pPPPPp.', '.pPPPPp.', '.WWWWWW.', 'wwwwwwww', '.wwwwww.'];
    const LANTERN_FAR = ['RRRRR', '.pPp.', '.pKp.', '.WWW.', 'wwwww'];
    const flicker = (art) => art.map((r, y) => (y === 3 || y === art.length - 4 ? r.replace(/P/g, 'p') : r));
    const REFLECT_NEAR = [
      ['..rrrr..', '...rr...', '..r..r..', '...rr...', '....r...'],
      ['.rrrrr..', '..rr.r..', '...rr...', '..r.....', '...r....'],
      ['..rrrrr.', '..r.rr..', '...rr...', '.....r..', '....r...'],
    ];
    const REFLECT_FAR = [['.rrr.', '..r..', '.r...'], ['rrr..', '.r.r.', '..r..'], ['.rrrr', '..r..', '...r.']];
    const lanternArts = (art, reflects) => [art, flicker(art)].flatMap((a) => reflects.map((r) => [...a, ...r]));
    const LANTERN_ARTS = [lanternArts(LANTERN_FAR, REFLECT_FAR), lanternArts(LANTERN_NEAR, REFLECT_NEAR)];
    const LANTERN_PAL = {
      R: { bg: '#3a1a14', fg: '#170905', a: 0.95 },
      P: { bg: '#ffd889', fg: '#c46a1c', a: 0.97 },
      p: { bg: '#f4a347', fg: '#7a3a0c', a: 0.95 },
      K: { bg: '#e07a2a', fg: '#5a2a08', a: 0.95 },
      W: { bg: '#4a2e1c', fg: '#1e120a', a: 0.95 },
      w: { bg: '#2e1c12', fg: '#120a06', a: 0.92 },
      r: { bg: '#f6b04e', fg: '#7a3a0c', a: 0.4 },
    };
    const LANTERNS = [
      [0.05, 0.1, 0.12],
      [0.4, 0.05, 0.1],
      [0.75, 0.18, 0.14],
      [0.2, 0.35, 0.2],
      [0.6, 0.42, 0.18],
      [0.9, 0.3, 0.22],
      [0.12, 0.72, 0.3],
      [0.5, 0.85, 0.26],
      [0.82, 0.68, 0.32],
    ];
    const BANK = 0.3;
    const lantern = (cols, rows, t, i, [fx, depth, v]) => {
      const isNear = depth > 0.5;
      const art = frame(LANTERN_ARTS[+isNear], t, 2.2, i * 1.7);
      const top = rows * BANK + 1 + depth * (rows * (1 - BANK) - 16);
      return {
        art,
        pal: LANTERN_PAL,
        key: 60 + i,
        a: 0.7 + 0.3 * depth,
        glow: { r: isNear ? 7 : 4, color: '#ffb347', a: isNear ? 0.42 : 0.28 },
        x: drift(cols, fx, t, v, art[0].length),
        y: top + Math.sin(t * 0.8 + i * 2) * 0.5,
      };
    };

    SCENES['lantern-night'] = {
      cell: (x, y, cols, rows, t) => {
        const bank = Math.round(rows * BANK);
        const roof = bank - 1 - Math.floor(2.6 * (0.5 + 0.5 * Math.sin(x * 0.21)) + hash(Math.floor(x / 3), 7) * 2.2);
        if (y < roof) return twinkle(x, y, t, '#fff1cf', 0.012);
        if (y < bank) {
          if (y < bank - 1 && hash(x, y, 41) < 0.07) return { bg: '#f2b65a', fg: '#6a3a0c', a: 0.55 + 0.3 * Math.sin(t * 0.7 + x) ** 2 };
          return { bg: '#04070e', fg: '#131c30', a: 0.97 };
        }
        if (y < bank + 4 && hash(x, bank - 2, 41) < 0.07 && hash(x, y + Math.floor(t * 2), 43) < 0.55) {
          return { ch: '|', fg: '#f2b65a', a: 0.35 * (1 - (y - bank) / 4) };
        }
        if (hash(Math.floor(x / 4 + t * 0.25 * (1 + (y % 3) * 0.3)), y, 45) < 0.07) {
          return { ch: (x + y) % 2 ? '~' : '-', fg: '#8fb0d6', a: 0.16 };
        }
      },
      sprites: (cols, rows, t) => LANTERNS.map((l, i) => lantern(cols, rows, t, i, l)),
    };

    /* ------------------------------------------------------------------ */
    /* Neon Rain                                                           */
    /* ------------------------------------------------------------------ */

    const STREET = 3;
    let city;
    const cityOf = (cols, rows) => {
      if (city?.cols !== cols || city.rows !== rows || city.side !== SIDE) {
        const mid = SIDE + (cols - SIDE) / 2;
        const half = Math.max(1, (cols - SIDE) / 2);
        const row = (seed, lo, hi, pow) => {
          const out = [];
          let x = 0;
          let b = 0;
          while (x < cols) {
            const w = 4 + Math.floor(hash(b, seed) * 5);
            const e = Math.min(1, Math.abs(x + w / 2 - mid) / half);
            const h = Math.round(rows * (lo + hi * e ** pow * (0.6 + 0.4 * hash(b, seed + 1))));
            for (let i = 0; i < w; i++) out[x + i] = [h, x, x + w - 1, b];
            x += w;
            b += 1;
          }
          return out;
        };
        city = { cols, rows, side: SIDE, near: row(1, 0.08, 0.52, 2), far: row(5, 0.16, 0.48, 1.4) };
      }
      return city;
    };
    const CITY = {
      wall: { bg: '#1b2242', fg: '#2b355a', a: 0.95 },
      roof: { bg: '#2a3358', fg: '#3a4570', a: 0.95 },
      dark: { bg: '#232b4e', fg: '#323c64', a: 0.95 },
      far: { bg: '#121730', fg: '#1b2140', a: 0.75 },
      farWin: { bg: '#6a5a3a', fg: '#2a2416', a: 0.5 },
      win: [
        { bg: '#f3c56b', fg: '#6a4a10', a: 0.85 },
        { bg: '#ffe2a0', fg: '#7a5a18', a: 0.85 },
        { bg: '#8fd3ff', fg: '#1d4a6a', a: 0.75 },
      ],
    };
    const RAIN_V = 11;
    const RAIN_K = 0.3;
    const rain = (x, y, t) => {
      const q = Math.floor(y - t * RAIN_V);
      const track = Math.floor(x + y * RAIN_K);
      const m = ((q % 3) + 3) % 3;
      if (m < 2 && hash(track, Math.floor(q / 3), 27) < 0.09) return { ch: '/', fg: '#a9c4f0', a: m ? 0.6 : 0.28 };
    };
    const SMEAR = ['#ff5fa2', '#4fe3ff', '#f3c56b'];
    const street = (x, y, t) => {
      if (y === 0) return { ch: '_', fg: '#3a4570', a: 0.55 };
      if (hash(x, y, 40 + Math.floor(t * 3)) < 0.025) return { ch: 'o', fg: '#a9c4f0', a: 0.5 };
      if (hash(x, Math.floor(t * 1.5) + y, 41) < 0.12) {
        return { ch: y === 1 ? '|' : '~', fg: SMEAR[Math.floor(hash(x, 42) * 3)], a: 0.28 };
      }
    };
    const neon = (word, c) => {
      const tube = (ch) => ({ ch, fg: c, a: 0.9 });
      const pal = { '+': tube('+'), '-': tube('-'), '|': tube('|') };
      for (const ch of word) {
        pal[ch] = { bg: '#1c0b1a', fg: c, a: 0.95, ch };
        pal[ch.toLowerCase()] = { bg: '#1c0b1a', fg: shade(c, -0.55), a: 0.9, ch };
      }
      const art = sketch(3, word.length + 2, [
        [0, 0, '+-+'],
        ...[...word].map((ch, i) => [i + 1, 0, `|${ch}|`]),
        [word.length + 1, 0, '+-+'],
      ]);
      return { c, pal, arts: [art, ...[...word].map((_, i) => art.map((r, y) => (y === i + 1 ? r.toLowerCase() : r)))] };
    };
    const SIGNS = [neon('RAMEN', '#ff5fa2'), neon('HOTEL', '#4fe3ff')];
    const signs = (cols, rows, t) => {
      const { near: nearRow } = cityOf(cols, rows);
      const ground = rows - STREET;
      const W = cols - SIDE;
      return SIGNS.flatMap((s, i) => {
        let best;
        for (let x = Math.floor(SIDE + (i ? W * 0.7 : 0)); x < (i ? cols : SIDE + W * 0.3); x++) {
          const cell = nearRow[x];
          if (cell && (!best || cell[0] > best[0])) best = cell;
        }
        if (!best || best[0] < s.arts[0].length + 3) return [];
        const k = Math.floor(t * 4);
        const art = hash(k, i, 51) < 0.1 ? s.arts[1 + Math.floor(hash(k, i, 52) * (s.arts.length - 1))] : s.arts[0];
        const a = (t + i * 4.5) % 9 < 0.3 ? 0.3 : 1;
        return [{ art, pal: s.pal, key: 70 + i, a, x: i ? best[1] - 2 : best[2], y: ground - best[0] + 2, glow: { r: 6, color: s.c, a: 0.35 * a } }];
      });
    };
    const WALK = [
      ['..uUu..', '.uUUUu.', 'uUUUUUu', 'd..|..d', '...h...', '..cCc..', '..cCc..', '..l.l..'],
      ['..uUu..', '.uUUUu.', 'uUUUUUu', '...|...', 'd..h..d', '..cCc..', '..cCc..', '...l...'],
    ];
    const walkPal = (c) => ({
      U: { bg: c, fg: shade(c, -0.6), a: 0.95 },
      u: { bg: shade(c, -0.25), fg: shade(c, -0.7), a: 0.95 },
      d: { ch: '.', fg: '#bcd2f5', a: 0.6 },
      '|': { ch: '|', fg: '#8a92b0', a: 0.9 },
      h: { bg: '#3a3550', fg: '#1a1828', a: 0.95 },
      c: { bg: '#252a42', fg: '#121526', a: 0.95 },
      C: { bg: '#2f3554', fg: '#151a2e', a: 0.95 },
      l: { bg: '#1c2034', fg: '#0c0e18', a: 0.95 },
    });
    const WALKERS = [[0.97, 1.5, false, walkPal('#ff5fa2')], [0.98, 1.1, true, walkPal('#f2c14e')]];
    const STORM = 23;
    const boltArt = (k) => {
      const out = [];
      let c = 4;
      for (let y = 0; y < 12; y++) {
        const s = Math.floor(hash(k, y, 61) * 3) - 1;
        c = Math.max(0, Math.min(8, c + s));
        out.push('.'.repeat(c) + (s < 0 ? '/' : s > 0 ? '\\' : '|') + '.'.repeat(8 - c));
      }
      return out;
    };
    const BOLT_PAL = Object.fromEntries(['/', '\\', '|'].map((ch) => [ch, { ch, fg: '#eef3ff', a: 1 }]));
    const lightning = (cols, rows, t) => {
      const err = root.dataset.themeEvent === 'error';
      const k = err ? -1 : Math.floor(t / STORM);
      const p = err ? 0 : t - k * STORM;
      if (!(p < 0.1 || (p > 0.2 && p < 0.32))) return [];
      const W = cols - SIDE;
      const fx = hash(k, 62) < 0.5 ? 0.06 + 0.14 * hash(k, 63) : 0.78 + 0.14 * hash(k, 63);
      return [{ art: boltArt(k), pal: BOLT_PAL, key: 80, x: SIDE + W * fx, y: rows * 0.03, glow: { r: 16, color: '#a9bcff', a: 0.45 } }];
    };

    SCENES['neon-rain'] = {
      cell: (x, y, cols, rows, t) => {
        const { near: nearRow, far } = cityOf(cols, rows);
        const ground = rows - STREET;
        if (y >= ground) return street(x, y - ground, t);
        const [h, x0, x1, b] = nearRow[x] ?? [0];
        const top = ground - h;
        if (y >= top) {
          if (y === top) return CITY.roof;
          if (x > x0 && x < x1 && (x - x0) % 2 === 1 && (ground - y) % 2 === 0 && y > top + 1) {
            const lit = (hash(x, y, 21) < 0.45) !== (hash(x, y, 22 + Math.floor(t / 7 + hash(x, y, 24) * 7)) < 0.08);
            const s = hash(x, y, 23);
            return lit ? CITY.win[s < 0.6 ? 0 : s < 0.85 ? 1 : 2] : CITY.dark;
          }
          return CITY.wall;
        }
        if (y === top - 1 && x === Math.floor((x0 + x1) / 2) && hash(b, 31) < 0.35) {
          return { ch: '*', fg: '#ff4d5e', a: Math.sin(t * 2.5 + b) > 0.3 ? 0.95 : 0.2 };
        }
        const [fh, fx0, fx1] = far[x] ?? [0];
        if (y >= ground - fh) {
          return fx1 - fx0 > 2 && (x - fx0) % 2 === 1 && (ground - y) % 3 === 0 && hash(x, y, 25) < 0.3
            ? CITY.farWin
            : CITY.far;
        }
        return rain(x, y, t);
      },
      sprites: (cols, rows, t) => [
        ...lightning(cols, rows, t),
        ...signs(cols, rows, t),
        ...WALKERS.map(([f, v, left, pal], i) => {
          const run = drift(cols, f, t, v, 7);
          return { art: frame(WALK, t, 3, i), pal, key: 90 + i, x: (left ? cols - run : run) - 3.5, y: rows - STREET - 8 };
        }),
      ],
    };

    /* ------------------------------------------------------------------ */
    /* Sakura Dusk                                                         */
    /* ------------------------------------------------------------------ */

    const BRANCH = [
      'BBBBBBBBBBBBbbb.........FF..',
      'BBBBBbbbFFf...bbbb....FFcFF.',
      'BBBb..FFcFF......bbbbb.FF...',
      'BBb....FFf...fFF....bb......',
      'Bb..........FFcF.....bFFf...',
      'B.......FF...fFF....FFcFF...',
      'b......FcFF..........fFF....',
      'b.......Ff..................',
    ];
    const bloom = (art, k) => art.map((r) => r.replace(/[Ff]/g, (c, i) => ((i + k) % 3 ? c : c === 'F' ? 'f' : 'F')));
    const BRANCHES = [0, 1, 2].map((k) => bloom(BRANCH, k));
    const BRANCHES_R = BRANCHES.map(flip);
    const BRANCH_PAL = {
      B: { bg: '#2a1a24', fg: '#120a10', a: 0.97 },
      b: { ch: '=', fg: '#3e2834', a: 0.9 },
      F: { bg: '#f7a8c4', fg: '#9a3d62', a: 0.95 },
      f: { bg: '#ffd6e4', fg: '#b8607e', a: 0.9 },
      c: { bg: '#ffe9a8', fg: '#9a5a20', a: 0.95 },
    };
    const branch = (cols, rows, t, right) => {
      const art = frame(right ? BRANCHES_R : BRANCHES, t, 1.4, right ? 1 : 0);
      return {
        art,
        pal: BRANCH_PAL,
        key: right ? 2 : 1,
        halo: '#f7a8c4',
        shadow: true,
        glow: { r: 5, color: '#f7a8c4', a: 0.16 },
        x: right ? cols - art[0].length : 0,
        y: Math.sin(t * 0.5 + (right ? 2 : 0)) * 0.4,
      };
    };
    const PETALS = [['Pp'], ['P', '.'], ['pP'], ['.', 'P']];
    const PETAL_PAL = {
      P: { bg: '#f7a8c4', fg: '#9a3d62', a: 0.9 },
      p: { ch: "'", fg: '#ffd6e4', a: 0.7 },
    };
    const petal = (cols, rows, t, i) => {
      const v = 0.8 + 1.2 * hash(i, 1);
      const span = rows + 4;
      const y = ((hash(i, 2) * span + t * v) % span) - 2;
      const side = hash(i, 3) < 0.5;
      const depth = hash(i, 4);
      const x0 = side ? cols * (0.02 + 0.3 * hash(i, 5)) : cols * (0.68 + 0.3 * hash(i, 5));
      return {
        art: frame(PETALS, t, 2 + 2 * hash(i, 6), i),
        pal: PETAL_PAL,
        key: 10 + i,
        a: 0.35 + 0.6 * depth,
        x: x0 + y * 0.35 + Math.sin(t * 0.9 + i) * 3,
        y,
      };
    };

    SCENES['sakura-dusk'] = {
      cell: (x, y, cols, rows, t) => {
        const hill = rows - 3 - Math.round(2.5 * (0.5 + 0.5 * Math.sin(x * 0.09 + 1)) + 1.5 * (0.5 + 0.5 * Math.sin(x * 0.23)));
        const sx = cols * 0.8;
        const sy = hill + 1;
        const d = Math.hypot((x - sx) * 0.5, y - sy);
        if (y >= hill) {
          if (hash(x, y, 21) < 0.05) return { ch: '.', fg: '#f7a8c4', a: 0.45 };
          return { bg: '#1a1222', fg: '#2c1d34', a: 0.96 };
        }
        if (d < 4) return { bg: '#ffb48a', fg: '#c0603a', a: 0.75, floor: 0.3 };
        if (d < 6 && hash(x, y, 22) < 0.4) return { fg: '#ffb48a', a: 0.25 + 0.15 * Math.sin(t + x) };
        if (y < rows * 0.45) return twinkle(x, y, t, '#f3dcef', 0.012);
        if (rising(x, y, -t, 0.6, 0.006)) return { ch: '.', fg: '#ffd6e4', a: 0.25 };
      },
      sprites: (cols, rows, t) => [
        branch(cols, rows, t, false),
        branch(cols, rows, t, true),
        ...Array.from({ length: Math.round(8 + cols / 8) }, (_, i) => petal(cols, rows, t, i)),
      ],
    };

    /* ------------------------------------------------------------------ */
    /* Snow Cabin                                                          */
    /* ------------------------------------------------------------------ */

    const CABIN_LIT = [
      '............CC....',
      '.......NNNNNCC....',
      '.....NNNNNNNNNN...',
      '...NNNNNNNNNNNNNN.',
      '.NNNRRRRRRRRRRRNNN',
      '..LLLLLLLLLLLLLLL.',
      '..lYyYlLLLLLLDDDl.',
      '..LyyyLLLLLLLDDDL.',
      '..lYyYlLLLLLLDdDl.',
      '..lllllllllllDDDl.',
      'NNNNNNNNNNNNNNNNNN',
    ];
    const CABIN_ARTS = [CABIN_LIT, CABIN_LIT.map((r, y) => (y > 5 && y < 9 ? r.replace(/Y/g, 'Z') : r))];
    const CABIN_PAL = {
      N: { bg: '#e8f0fb', fg: '#9fb4d4', a: 0.95 },
      C: { bg: '#3a2a24', fg: '#1a120e', a: 0.95 },
      R: { bg: '#2a1c18', fg: '#120b08', a: 0.95 },
      L: { bg: '#5a3b26', fg: '#2e1e12', a: 0.95 },
      l: { bg: '#4a2f1e', fg: '#24160c', a: 0.95 },
      D: { bg: '#3a2516', fg: '#1a1008', a: 0.95 },
      d: { bg: '#e0a458', fg: '#5a3a10', a: 0.95 },
      y: { bg: '#5a3b26', fg: '#2e1e12', a: 0.95 },
      Y: { bg: '#ffd38a', fg: '#c47a2a', a: 1 },
      Z: { bg: '#f6b860', fg: '#a8601c', a: 1 },
    };
    const PINE = ['....N....', '...NGN...', '..GGGGG..', '...GNG...', '..NGGGN..', '.GGGGGGG.', '..GGNGG..', '.NGGGGGGN', 'GGGGGGGGG', '....T....', '....T....'];
    const sway = (art, k) => art.map((r, y) => (y < 4 ? (k > 0 ? '.' + r.slice(0, -1) : r.slice(1) + '.') : r));
    const PINES = [PINE, sway(PINE, 1), PINE, sway(PINE, -1)];
    const PINE_PAL = {
      G: { bg: '#1f3a35', fg: '#0d1e1b', a: 0.95 },
      N: { bg: '#dbe6f6', fg: '#8ea2c4', a: 0.92 },
      T: { bg: '#3a2516', fg: '#1a1008', a: 0.95 },
    };
    const TREES = [[0.34, 1], [0.78, 0.7], [0.86, 1], [0.94, 0.8]];
    const GROUND = 0.84;
    const groundAt = (x, rows) => Math.round(rows * GROUND + Math.sin(x * 0.09) * 1.2);
    const cabinAt = (cols, rows) => ({ x: Math.round(cols * 0.05), y: groundAt(Math.round(cols * 0.05) + 9, rows) - 10 });
    const peak = (x, cols, rows) =>
      Math.max(
        0,
        rows * 0.34 - Math.abs(x - cols * 0.1) * 0.9,
        rows * 0.26 - Math.abs(x - cols * 0.24) * 1.1,
        rows * 0.38 - Math.abs(x - cols * 0.9) * 0.85,
        rows * 0.22 - Math.abs(x - cols * 0.74) * 1.2,
      );

    SCENES['snow-cabin'] = {
      cell: (x, y, cols, rows, t) => {
        const ground = groundAt(x, rows);
        const ridge = Math.round(rows * GROUND - peak(x, cols, rows));
        const fall = (v, odds, seed) =>
          hash(x + Math.round(Math.sin(y * 0.3 + t * 0.5 + seed) * 1.5), Math.floor(y - t * v), seed) < odds;
        if (y >= ground) {
          if (hash(x, y, 21) < 0.02) return { ch: '*', fg: '#ffffff', a: 0.3 + 0.5 * Math.sin(t * 2 + x * 7) ** 2 };
          return { bg: '#3d4d6e', fg: '#56688c', a: 0.85 };
        }
        if (y >= ridge) {
          if (y < ridge + 2 + hash(x, 13) * 2 && peak(x, cols, rows) > 6) return { bg: '#b8c7df', fg: '#8195b8', a: 0.7 };
          return { bg: '#18233d', fg: '#222f4d', a: 0.9 };
        }
        const { x: cx, y: cy } = cabinAt(cols, rows);
        const dy = cy + 1 - y;
        if (dy > 0 && dy < 12) {
          const mid = cx + 12.5 + Math.sin(t * 0.8 - dy * 0.5) * 1.2 + dy * 0.45;
          if (Math.abs(x - mid) <= 1 + dy * 0.12 && hash(x, Math.floor(y + t * 1.6), 17) < 0.55) {
            return { ch: dy < 4 ? 'o' : '~', fg: '#c9d3e6', a: 0.4 * (1 - dy / 12) };
          }
        }
        if (fall(3.2, 0.012, 31)) return { ch: '*', fg: '#ffffff', a: 0.7 };
        if (fall(1.6, 0.02, 33)) return { ch: '.', fg: '#dfe8f6', a: 0.45 };
        if (y < rows * 0.45) return twinkle(x, y, t, '#e6edf8', 0.01);
      },
      sprites: (cols, rows, t) => {
        const c = cabinAt(cols, rows);
        return [
          {
            art: frame(CABIN_ARTS, t, 1.6),
            pal: CABIN_PAL,
            key: 1,
            x: c.x,
            y: c.y,
            shadow: '#0a1020',
            glow: { r: 7, color: '#ffb85c', a: 0.32 + 0.06 * Math.sin(t * 3) },
          },
          ...TREES.map(([fx, s], i) => ({
            art: frame(PINES, t, 0.8, i * 1.3),
            pal: PINE_PAL,
            key: 10 + i,
            a: 0.6 + 0.4 * s,
            x: Math.round(cols * fx),
            y: groundAt(Math.round(cols * fx) + 4, rows) - 11 + Math.round((1 - s) * 3),
            halo: '#dfe8f6',
          })),
        ];
      },
    };

    /* ------------------------------------------------------------------ */
    /* Star Voyage                                                         */
    /* ------------------------------------------------------------------ */

    const HULL = [
      [0, 3, 'W'],
      [1, 3, 'WBBBBb'],
      [2, 3, 'WBBoBBBBNn'],
      [3, 3, 'WBBBBb'],
      [4, 3, 'W'],
    ];
    const FLAMES = [
      [[2, 0, 'fFF']],
      [[1, 1, 'f'], [2, 0, 'FFF'], [3, 1, 'f']],
      [[2, 1, 'fF'], [1, 2, 'f']],
    ];
    const ROCKET = FLAMES.map((f) => sketch(13, 5, [...HULL, ...f]));
    const ROCKET_PAL = {
      B: { bg: '#dfe4f5', fg: '#6a7090', a: 0.95 },
      b: { bg: '#aab1cc', fg: '#4a5070', a: 0.95 },
      W: { bg: '#ff6fb5', fg: '#5a1838', a: 0.95 },
      o: { bg: '#4fe3ff', fg: '#0d3a4a', a: 0.95 },
      N: { bg: '#ff6fb5', fg: '#5a1838', a: 0.95 },
      n: { ch: '>', fg: '#ff6fb5', a: 0.8 },
      F: { bg: '#ffb347', fg: '#7a3a00', a: 0.9 },
      f: { ch: '~', fg: '#ff7a3d', a: 0.8 },
    };
    const ROCKET_SPEED = 4;
    const ROCKET_W = 13;
    const rocketAt = (cols, rows, t) => ({
      x: drift(cols, 0.3, t, ROCKET_SPEED, ROCKET_W),
      y: rows * 0.12 + 1.5 * Math.sin(t * 0.9),
    });
    const planetOf = (cols, rows) => ({
      cx: cols * 0.84,
      cy: rows * 0.32,
      R: Math.max(4, Math.min(9, cols * 0.065)),
    });
    const BANDS = ['#7a4cc2', '#9b5fd6', '#c76fd0', '#8a55c8', '#6a3fae'];
    const planet = (x, y, t, { cx, cy, R }) => {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const d = Math.hypot(dx, dy);
      const ring = ell(x + 0.5, y + 0.5, cx, cy + dx * 0.12, R * 2.1, R * 0.5);
      const onRing = ring > 0.78 && ring < 1.05;
      const front = dy + dx * 0.12 > 0;
      if (onRing && (front || d > R)) {
        const a = 0.55 + 0.25 * Math.sin(dx * 0.6 - t * 1.5);
        return { bg: '#e6c9ff', fg: '#5a3a80', a: d > R ? a * 0.8 : a, floor: 0.45 };
      }
      if (d <= R) {
        const band = BANDS[Math.floor(((dy / R + 1) * 2.5 + 0.4 * Math.sin(dx * 0.5 + t * 0.3))) % BANDS.length] ?? BANDS[0];
        const lit = (-dx - dy) / (R * 1.6);
        return { bg: shade(band, Math.max(-0.55, Math.min(0.25, lit))), fg: shade(band, -0.6), a: 0.92, floor: 0.5 };
      }
      if (onRing || d <= R + 1.5) return near(x, y, '#c9a6ff', 0.22, 0.35);
    };
    const STREAK = sketch(8, 4, [[0, 0, '11'], [1, 2, '22'], [2, 4, '33'], [3, 6, '4H']]);
    const STREAKS = [STREAK, flip(STREAK)];
    const streakPal = (ch) => ({
      H: { bg: '#fff3fb', fg: '#5a3a50', a: 1 },
      4: { ch, fg: '#ffd1ea', a: 0.85 },
      3: { ch, fg: '#ffd1ea', a: 0.6 },
      2: { ch, fg: '#e6ecff', a: 0.4 },
      1: { ch, fg: '#e6ecff', a: 0.2 },
    });
    const STREAK_PALS = [streakPal('\\'), streakPal('/')];
    const EVERY = 9;
    const SHOOT_FALL = 1.3;
    const shooting = (cols, rows, t) => {
      const k = Math.floor(t / EVERY);
      const p = (t - k * EVERY) / SHOOT_FALL;
      if (p >= 1) return [];
      const left = hash(k, 3) < 0.5;
      const run = 24 * p;
      const hx = cols * (0.2 + 0.6 * hash(k, 1)) + (left ? -run : run);
      const hy = rows * (0.3 + 0.3 * hash(k, 2)) + run * 0.5;
      return [
        {
          art: STREAKS[+left],
          pal: STREAK_PALS[+left],
          key: 40,
          a: Math.sin(Math.PI * p),
          x: left ? hx : hx - 7,
          y: hy - 3,
          glow: { r: 5, color: '#ffd1ea', a: 0.3 * Math.sin(Math.PI * p) },
        },
      ];
    };
    const MOON = ['.mm.', 'mMMm', '.mm.'];
    const MOON_PAL = {
      M: { bg: '#d8dcec', fg: '#5a6080', a: 0.95 },
      m: { bg: '#a8aec8', fg: '#4a5070', a: 0.9 },
    };

    SCENES['star-voyage'] = {
      cell: (x, y, cols, rows, t) => {
        const p = planet(x, y, t, planetOf(cols, rows));
        if (p) return p;
        const r = rocketAt(cols, rows, t);
        const d = r.x - ROCKET_W / 2 - x;
        if (d > 0 && d < 16) {
          const ty = rocketAt(cols, rows, t - d / ROCKET_SPEED).y + 2;
          if (Math.abs(y + 0.5 - ty - 0.5) < 0.7 && hash(x, y, Math.floor(t * 5)) < 0.55 - d * 0.025) {
            return { ch: d < 5 ? 'o' : '.', fg: d < 5 ? '#ffb347' : '#ffd1ea', a: 0.6 * (1 - d / 16) };
          }
        }
        if (hash(Math.floor(x + t * 0.8), y, 17) < 0.004) return { ch: '.', fg: '#9aa6d8', a: 0.35 };
        return twinkle(x, y, t, '#e6ecff', 0.018);
      },
      sprites: (cols, rows, t) => {
        const { cx, cy, R } = planetOf(cols, rows);
        const r = rocketAt(cols, rows, t);
        const m = t * 0.35;
        const moonBehind = Math.sin(m) < 0 && Math.abs(Math.cos(m) * R * 2.8) < R + 2;
        return [
          ...shooting(cols, rows, t),
          { art: ['.'], pal: {}, x: cx - 0.5, y: cy - 0.5, key: 1, glow: { r: R * 2.2, color: '#9b5fd6', a: 0.22 } },
          ...(moonBehind
            ? []
            : [{
                art: MOON,
                pal: MOON_PAL,
                key: 2,
                shadow: '#05040d',
                halo: '#c9cde0',
                x: cx + Math.cos(m) * R * 2.8 - 2,
                y: cy + Math.sin(m) * R * 0.9 - 1.5,
              }]),
          {
            art: frame(ROCKET, t, 8),
            pal: ROCKET_PAL,
            key: 3,
            shadow: '#05040d',
            x: r.x - ROCKET_W / 2,
            y: r.y,
            glow: { r: 5, color: '#ffb347', a: 0.3 + 0.1 * Math.sin(t * 13) },
          },
        ];
      },
    };

    /* ------------------------------------------------------------------ */
    /* Clawd                                                               */
    /* ------------------------------------------------------------------ */

    const CLAWD = ['.#######.', '.#o###o#.', '#########', '.#######.'];
    const CLAWDS = [[...CLAWD, '.#.#.#.#.'], [...CLAWD, '#.#.#.#..']];

    SCENES.clawd = {
      cell: (x, y, cols, rows, t) => {
        const cx = cols * 0.8;
        const cy = rows * 0.3;
        let cover = 0;
        let glow = false;
        for (const [sx, sy] of [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]]) {
          const dx = x + sx - cx;
          const dy = y + sy - cy;
          const r = Math.hypot(dx, dy);
          const ang = Math.atan2(dy, dx);
          if (r <= 1.2) {
            cover += 1;
            continue;
          }
          for (let k = 0; k < 11; k++) {
            let da = Math.abs(ang - ((k * Math.PI * 2) / 11 + t * 0.04)) % (Math.PI * 2);
            da = Math.min(da, Math.PI * 2 - da);
            if (da >= Math.PI / 2) continue;
            const len = 6.5 + 5 * hash(k, 1) + Math.sin(t * 1.4 + k) * 0.7;
            const along = r * Math.cos(da);
            const off = r * Math.sin(da);
            if (along <= len && off <= 0.35 + 0.55 * (1 - along / len) ** 0.7) {
              cover += 1;
              break;
            }
            if (along <= len + 1.2 && off <= 1.6) glow = true;
          }
        }
        if (cover >= 2) {
          return {
            bg: '#d97757',
            fg: '#3b1d12',
            a: (0.55 + 0.1 * cover) * (1 - 0.35 * Math.min(1, Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / 12)),
            floor: 0.6,
          };
        }
        if (glow) return near(x, y, '#e9a083', 0.25, 0.3);
        if (rising(x, y, t, 1.2, 0.006)) return { ch: '.', fg: '#e9a083', a: 0.5 };
        const s = hash(x, y, 13);
        if (s < 0.008) {
          return { ch: '<>()=$/*'[Math.floor(s * 1000) % 8], fg: '#d97757', a: 0.15 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.3 + s * 900)) };
        }
      },
      sprites: (cols, rows, t) => {
        const lo = cols * 0.2;
        const hi = cols * 0.9 - 9;
        const p = ((t * 2.2) / (hi - lo)) % 2;
        return [
          { art: ['.'], pal: {}, x: cols * 0.8 - 0.5, y: rows * 0.3 - 0.5, key: 2, glow: { r: 12, color: '#d97757', a: 0.3 + 0.05 * Math.sin(t * 1.4) } },
          {
            art: frame(CLAWDS, t, 5),
            pal: { '#': { bg: '#d97757', fg: '#3b1d12', a: 0.95 }, o: { bg: '#2a1a14', fg: '#d97757', a: 0.95 } },
            x: lo + (hi - lo) * (p < 1 ? p : 2 - p),
            y: rows - 8,
            key: 1,
          },
        ];
      },
    };

    /* ------------------------------------------------------------------ */
    /* Wallpaper engine                                                    */
    /* ------------------------------------------------------------------ */

    const FRAME_MS = 42;
    const GRID = 2;
    const BASES = {
      'koi-pond': ['#135c56', '#0a3a39', '#041c1c'],
      moonlit: ['#1b2750', '#101a36', '#070b1a'],
      'honu-lagoon': ['#a9e9e1', '#63c9cb', '#166b7e'],
      'cloud-drift': ['#8fc4e8', '#dcecf7', '#f8fbfe'],
      fireflies: ['#0c1408', '#14220d', '#060a04'],
      jellyfish: ['#061a33', '#0b2a4a', '#030b18'],
      'lantern-night': ['#0a1220', '#0e1a2e', '#04070e'],
      'neon-rain': ['#0a0f20', '#151b35', '#070a14'],
      'sakura-dusk': ['#3a1e2e', '#2a1826', '#1a1222'],
      'snow-cabin': ['#0c1526', '#16233d', '#070d18'],
      'star-voyage': ['#0a0a1a', '#1a1030', '#05040d'],
      clawd: ['#1c0f0a', '#2a1a12', '#0e0805'],
    };
    const calm = () =>
      matchMedia('(prefers-reduced-motion: reduce)').matches
      || document.documentElement.dataset.reduceMotion === 'true';

    const put = (w, px, py, c, sx, sy) => {
      if (!c) return;
      const { ctx } = w;
      ctx.globalAlpha = Math.max(0, Math.min(1, c.a ?? 1));
      if (ctx.globalAlpha < 0.01) return;
      if (c.bg) {
        ctx.fillStyle = c.bg;
        ctx.fillRect(px + 1, py + 1, CELL - 2, CELL - 2);
      }
      ctx.fillStyle = c.fg ?? c.bg ?? '#fff';
      ctx.fillText(c.ch ?? glyph(c.bg ? GLYPHS : LOOSE, sx, sy, w.time), px + CELL / 2, py + CELL / 2 + 1);
    };

    const draw = (w) => {
      const { ctx, scene, time: t } = w;
      const W = innerWidth;
      const H = innerHeight;
      const cols = Math.ceil(W / CELL);
      const rows = Math.ceil(H / CELL);
      const sceneCols = Math.max(8, Math.ceil((W - RIGHT_PX) / CELL));
      ctx.globalAlpha = 1;
      const base = BASES[w.name] ?? BASES['koi-pond'];
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, base[0]);
      bg.addColorStop(0.55, base[1]);
      bg.addColorStop(1, base[2]);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = w.dark ? 'rgba(190, 220, 210, .05)' : 'rgba(20, 60, 70, .07)';
      ctx.beginPath();
      for (let x = 0; x <= cols; x += GRID) {
        ctx.moveTo(x * CELL + 0.5, 0);
        ctx.lineTo(x * CELL + 0.5, H);
      }
      for (let y = 0; y <= rows; y += GRID) {
        ctx.moveTo(0, y * CELL + 0.5);
        ctx.lineTo(W, y * CELL + 0.5);
      }
      ctx.stroke();
      if (scene.cell) {
        for (let y = 0; y < rows; y++) {
          for (let x = 0; x < sceneCols; x++) {
            const c = scene.cell(x, y, sceneCols, rows, t);
            if (c) put(w, x * CELL, y * CELL, c, x, y);
          }
        }
      }
      for (const s of scene.sprites?.(sceneCols, rows, t) ?? []) {
        const ox = (w.grid ? Math.round(s.x) : s.x) * CELL;
        const oy = (w.grid ? Math.round(s.y) : s.y) * CELL;
        const m = s.a ?? 1;
        const k = s.key * 997;
        const bw = s.art ? s.art[0].length : s.w;
        const bh = s.art ? s.art.length : s.h;
        if (ox > W + CELL * 4 || oy > H + CELL * 4 || ox + (bw + 4) * CELL < 0 || oy + (bh + 4) * CELL < 0) {
          continue;
        }
        if (s.glow) {
          const g = s.glow;
          const gx = ox + (bw / 2) * CELL;
          const gy = oy + (bh / 2) * CELL;
          const r = g.r * CELL;
          const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
          grad.addColorStop(0, g.color);
          grad.addColorStop(1, `${g.color}00`);
          ctx.globalAlpha = Math.min(1, g.a ?? 0.3);
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = grad;
          ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
        }
        const cells = [];
        if (s.art) {
          s.art.forEach((row, gy) => {
            for (let gx = 0; gx < row.length; gx++) {
              if (s.pal[row[gx]]) cells.push([gx, gy, s.pal[row[gx]], gx + k, gy]);
            }
          });
        } else {
          for (let gy = 0; gy < s.h; gy++) {
            for (let gx = 0; gx < s.w; gx++) {
              const f = s.field(gx, gy);
              if (f) cells.push([gx, gy, f.c, (f.sx ?? gx) + k, f.sy ?? gy]);
            }
          }
        }
        if (s.halo && s.art) {
          for (const [gx, gy] of haloOf(s.art)) {
            put(w, ox + gx * CELL, oy + gy * CELL, { fg: s.halo, a: 0.3 * m }, gx + k, gy);
          }
        }
        if (s.shadow) {
          for (const [gx, gy, c] of cells) {
            if (c.bg) {
              put(w, ox + (gx + 0.8) * CELL, oy + (gy + 0.8) * CELL, { bg: s.shadow, fg: s.shadow, ch: '', a: 0.4 * m }, 0, 0);
            }
          }
        }
        for (const [gx, gy, c, sx, sy] of cells) {
          put(w, ox + gx * CELL, oy + gy * CELL, m === 1 ? c : { ...c, a: c.a * m }, sx, sy);
        }
      }
      if (w.veil) {
        const l = W * 0.21;
        const r = W * 0.79;
        const g = ctx.createLinearGradient(l, 0, r, 0);
        const f = CELL / (r - l);
        g.addColorStop(0, w.bg + '00');
        g.addColorStop(f, w.bg);
        g.addColorStop(1 - f, w.bg);
        g.addColorStop(1, w.bg + '00');
        ctx.globalAlpha = w.veil;
        ctx.fillStyle = g;
        ctx.fillRect(l, 0, r - l, H);
        ctx.globalAlpha = 1;
      }
    };

    let wall;
    const stopWall = () => {
      if (!wall) return;
      cancelAnimationFrame(wall.raf);
      removeEventListener('resize', wall.size);
      wall.canvas.remove();
      wall = undefined;
    };

    const startWall = (name, dark) => {
      const scene = SCENES[name];
      if (!scene) return;
      if (wall && wall.name === name && wall.dark === dark && wall.canvas.isConnected) return;
      stopWall();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.id = 'tm-ascii-wall';
      canvas.style.cssText =
        'position:fixed;left:0;top:0;width:100vw;height:100vh;pointer-events:none;z-index:-1';
      const w = (wall = {
        name,
        scene,
        canvas,
        ctx,
        dark,
        time: 0,
        last: 0,
        raf: 0,
        speed: 1.15,
        veil: 0,
        bg: dark ? '#080b06' : '#f1ebd9',
        grid: false,
      });
      w.size = () => {
        const dpr = devicePixelRatio || 1;
        canvas.width = Math.round(innerWidth * dpr);
        canvas.height = Math.round(innerHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `bold ${Math.round(CELL * 13 / 22)}px ui-monospace, Menlo, Consolas, 'Cascadia Code', monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        draw(w);
      };
      addEventListener('resize', w.size);
      document.documentElement.append(canvas);
      w.size();
      if (calm()) return;
      const frame = (now) => {
        w.raf = requestAnimationFrame(frame);
        if (now - w.last < FRAME_MS) return;
        w.time += (w.last ? Math.min(now - w.last, 250) / 1000 : 0) * w.speed;
        w.last = now;
        draw(w);
      };
      w.raf = requestAnimationFrame(frame);
    };

    /* ------------------------------------------------------------------ */
    /* Palette                                                             */
    /* ------------------------------------------------------------------ */

    // Only the surfaces are touched, and only enough to let the wallpaper read
    // through them: a neutral tint of the stock light/dark neutrals, no accent,
    // label, border-hue or state colour is replaced. Everything else keeps the
    // shipped theme exactly as it is.
    const TOKENS = {
      '--dsw-alias-bg-base': { light: 'rgb(255 255 255 / 66%)', dark: 'rgb(18 18 20 / 58%)' },
      '--dsw-alias-bg-layer-1': { light: 'rgb(255 255 255 / 78%)', dark: 'rgb(28 28 31 / 72%)' },
      '--dsw-alias-bg-layer-2': { light: 'rgb(250 250 251 / 86%)', dark: 'rgb(36 36 40 / 82%)' },
      '--dsw-alias-bg-layer-3': { light: 'rgb(247 247 248 / 86%)', dark: 'rgb(32 32 36 / 82%)' },
      '--dsw-alias-bg-layer-4': { light: 'rgb(243 243 245 / 90%)', dark: 'rgb(42 42 47 / 88%)' },
      '--dsw-alias-bg-overlay': { light: 'rgb(255 255 255 / 96%)', dark: 'rgb(44 44 49 / 96%)' },
      '--dsw-alias-bg-mask-1': { light: 'rgb(0 0 0 / 36%)', dark: 'rgb(0 0 0 / 58%)' },
      '--dsw-alias-bg-module-platform': { light: 'rgb(246 246 248 / 84%)', dark: 'rgb(32 32 36 / 76%)' },
      '--dsw-specific-sidebar-fill': { light: 'rgb(250 250 251 / 76%)', dark: 'rgb(16 16 18 / 62%)' },
      '--dsw-specific-menu': { light: 'rgb(255 255 255 / 97%)', dark: 'rgb(44 44 49 / 97%)' },
      '--dsw-alias-interactive-bg-hover': { light: 'rgb(0 0 0 / 5%)', dark: 'rgb(255 255 255 / 6%)' },
      '--dsw-alias-switch-thumb': { light: '#FFFFFF', dark: '#FFFFFF' },
    };

    const CSS = `
:root {
  --dsh-font-family-text-default: "Cascadia Mono", "Cascadia Code", Consolas, "Courier New", ui-monospace, monospace;
  --dsh-font-family-code-default: "Cascadia Mono", "Cascadia Code", Consolas, "Courier New", ui-monospace, monospace;
  --dsh-font-family-terminal-default: "Cascadia Mono", Consolas, "Courier New", ui-monospace, monospace;
  --dsh-scrollbar-width: 10px;
  --dsw-focus-ring-color: var(--dsw-alias-brand-primary);
  --dsw-alias-state-business-primary: var(--dsw-alias-brand-primary);
  --dsw-shadow-lv1: 1px 1px 0 0 var(--dsw-alias-border-l2);
  --dsw-shadow-lv2: 2px 2px 0 0 var(--dsw-alias-border-l2);
  --dsw-shadow-lv3: 3px 3px 0 0 var(--dsw-alias-border-l3);
  --dsw-shadow-lv4: 4px 4px 0 0 var(--dsw-alias-border-l3);
  --dsw-elevation-soft: var(--dsw-shadow-lv1);
  --dsw-elevation-panel: var(--dsw-shadow-lv2);
  --dsw-elevation-prominent: var(--dsw-shadow-lv3);
}

html {
  background-color: #FFFFFF;
}

html:has(body[data-ds-dark-theme]) {
  background-color: #121214;
}

body {
  --dsh-scrollbar-width: 10px;
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l2);
  --dsw-focus-ring-color: var(--dsw-alias-brand-primary);
  --dsw-alias-state-business-primary: var(--dsw-alias-brand-primary);
  --dsw-shadow-lv1: 1px 1px 0 0 var(--dsw-alias-border-l2);
  --dsw-shadow-lv2: 2px 2px 0 0 var(--dsw-alias-border-l2);
  --dsw-shadow-lv3: 3px 3px 0 0 var(--dsw-alias-border-l3);
  --dsw-shadow-lv4: 4px 4px 0 0 var(--dsw-alias-border-l3);
  --dsw-elevation-soft: var(--dsw-shadow-lv1);
  --dsw-elevation-panel: var(--dsw-shadow-lv2);
  --dsw-elevation-prominent: var(--dsw-shadow-lv3);
  font-variant-ligatures: none;
  font-feature-settings: "liga" 0, "calt" 0;
  background: transparent !important;
  background-image: none !important;
  image-rendering: auto;
}

#tm-ascii-wall {
  image-rendering: auto;
}

/* Every tile is a tile: no rounded corners anywhere. */
*,
*::before,
*::after {
  border-radius: 0 !important;
}

h1, h2, h3, h4, h5, h6,
[role="heading"] {
  letter-spacing: 0.04em;
}

/* Square pixel scrollbars. */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--dsw-alias-border-l2);
  border: 2px solid var(--dsw-alias-bg-base);
}
::-webkit-scrollbar-thumb:hover {
  background: var(--dsw-alias-brand-primary);
}
::-webkit-scrollbar-corner {
  background: transparent;
}

::selection {
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 45%, transparent);
}
`;

    const isDark = () =>
      document.body?.hasAttribute('data-ds-dark-theme')
      ?? false;

    const STORE_KEY = 'tm.pixel';
    const VALID = new Set([
      'auto',
      'koi-pond',
      'honu-lagoon',
      'moonlit',
      'cloud-drift',
      'fireflies',
      'jellyfish',
      'lantern-night',
      'neon-rain',
      'sakura-dusk',
      'snow-cabin',
      'star-voyage',
      'clawd',
    ]);

    const readStore = () => {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        if (!raw) return { on: true, scene: 'auto' };
        const value = JSON.parse(raw);
        return {
          on: value?.on !== false,
          scene: VALID.has(value?.scene) ? value.scene : 'auto',
        };
      } catch {
        return { on: true, scene: 'auto' };
      }
    };

    const writeStore = (value) => {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(value));
      } catch {
        /* storage unavailable; keep the in-memory choice */
      }
    };

    const sceneFor = (scene, dark) =>
      scene === 'auto' || !VALID.has(scene)
        ? (dark ? 'koi-pond' : 'honu-lagoon')
        : scene;

    return {
      inject: ['theme', 'slots'],
      apply(ctx) {
        const React = typeof require === 'function' ? require('react') : null;
        const h = React ? React.createElement : null;

        let store = readStore();
        let styleEl;
        let paletteOff;

        const applySkin = () => {
          if (!store.on) {
            stopWall();
            if (paletteOff) {
              paletteOff();
              paletteOff = undefined;
            }
            if (styleEl) {
              styleEl.remove();
              styleEl = undefined;
            }
            return;
          }

          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.dataset.plugin = SOURCE;
            styleEl.textContent = CSS;
            document.head.appendChild(styleEl);
          }

          if (!paletteOff) paletteOff = ctx.theme.overrideTokens(SOURCE, TOKENS);

          const dark = isDark();
          startWall(sceneFor(store.scene, dark), dark);
        };

        ctx.effect(() => {
          applySkin();
          const mo = new MutationObserver(applySkin);
          mo.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] });
          return () => {
            mo.disconnect();
            stopWall();
            if (paletteOff) paletteOff();
            if (styleEl) styleEl.remove();
          };
        }, 'textmode-pixel: skin and wallpaper');

        if (!React || !ctx.slots) return;

        const SCENES_UI = [
          {
            id: 'auto',
            title: 'Auto',
            desc: "Follows the app's own light or dark setting.",
            swatch: 'linear-gradient(135deg, #135c56 0 50%, #a9e9e1 50%)',
          },
          {
            id: 'koi-pond',
            title: 'Koi pond',
            desc: 'Teal water, lily pads, three drifting carp.',
            swatch: 'linear-gradient(135deg, #135c56, #041c1c)',
          },
          {
            id: 'honu-lagoon',
            title: 'Honu lagoon',
            desc: 'Turquoise lagoon with a sea turtle and reef fish.',
            swatch: 'linear-gradient(135deg, #a9e9e1, #166b7e)',
          },
          {
            id: 'moonlit',
            title: 'Moonlit',
            desc: 'Navy sky, a gold crescent, slow clouds and meteors.',
            swatch: 'linear-gradient(135deg, #1b2750, #070b1a)',
          },
          {
            id: 'cloud-drift',
            title: 'Cloud drift',
            desc: 'A pale sky, cumulus banks, wispy cirrus and birds.',
            swatch: 'linear-gradient(135deg, #8fc4e8, #f8fbfe)',
          },
          {
            id: 'fireflies',
            title: 'Fireflies',
            desc: 'Grass at the bottom, glowing fireflies wandering.',
            swatch: 'linear-gradient(135deg, #0c1408, #4fb85c)',
          },
          {
            id: 'jellyfish',
            title: 'Jellyfish',
            desc: 'Deep water, drifting jellyfish with waving tentacles.',
            swatch: 'linear-gradient(135deg, #061a33, #9a7fe0)',
          },
          {
            id: 'lantern-night',
            title: 'Lantern night',
            desc: 'A dark bank with floating lanterns and reflections.',
            swatch: 'linear-gradient(135deg, #0a1220, #ffb347)',
          },
          {
            id: 'neon-rain',
            title: 'Neon rain',
            desc: 'A rainy neon street, lit windows and walkers.',
            swatch: 'linear-gradient(135deg, #0a0f20, #ff5fa2)',
          },
          {
            id: 'sakura-dusk',
            title: 'Sakura dusk',
            desc: 'Cherry branches, falling petals and a low sun.',
            swatch: 'linear-gradient(135deg, #3a1e2e, #f7a8c4)',
          },
          {
            id: 'snow-cabin',
            title: 'Snow cabin',
            desc: 'Cold pines, falling snow and a lit cabin.',
            swatch: 'linear-gradient(135deg, #0c1526, #e8f0fb)',
          },
          {
            id: 'star-voyage',
            title: 'Star voyage',
            desc: 'A ringed planet, a rocket and shooting stars.',
            swatch: 'linear-gradient(135deg, #0a0a1a, #9b5fd6)',
          },
          {
            id: 'clawd',
            title: 'Clawd',
            desc: 'A warm orange creature reaching out of the dark.',
            swatch: 'linear-gradient(135deg, #1c0f0a, #d97757)',
          },
        ];

        const PixelIcon = ({ size = 16 }) =>
          h(
            'svg',
            {
              width: size,
              height: size,
              viewBox: '0 0 16 16',
              fill: 'none',
              'aria-hidden': 'true',
              style: { shapeRendering: 'crispEdges', imageRendering: 'pixelated' },
            },
            h('rect', { x: 1.5, y: 2.5, width: 13, height: 9, stroke: 'currentColor', strokeWidth: 1.5 }),
            h('rect', { x: 2.5, y: 3.5, width: 11, height: 7, fill: 'currentColor', opacity: 0.12 }),
            h('rect', { x: 4, y: 5, width: 2, height: 1, fill: 'currentColor' }),
            h('rect', { x: 5, y: 6, width: 1, height: 1, fill: 'currentColor' }),
            h('rect', { x: 4, y: 7, width: 2, height: 1, fill: 'currentColor' }),
            h('rect', { x: 8, y: 5, width: 4, height: 1, fill: 'currentColor' }),
            h('rect', { x: 8, y: 7, width: 3, height: 1, fill: 'currentColor' }),
            h('rect', { x: 7, y: 12, width: 2, height: 1.5, fill: 'currentColor' }),
            h('rect', { x: 5, y: 13.5, width: 6, height: 1, fill: 'currentColor' }),
          );

        const PixelPage = () => {
          const [state, setState] = React.useState(store);

          const pick = (scene) => {
            store = { on: true, scene };
            writeStore(store);
            setState(store);
            applySkin();
          };

          const toggle = () => {
            store = { ...store, on: !store.on };
            writeStore(store);
            setState(store);
            applySkin();
          };

          return h(
            'div',
            {
              style: {
                padding: '34px 40px 64px',
                maxWidth: 960,
                margin: '0 auto',
                height: '100%',
                overflowY: 'auto',
                boxSizing: 'border-box',
              },
            },
            h(
              'div',
              { style: { fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--dsw-alias-label-tertiary)' } },
              'Harness skin',
            ),
            h('h1', { style: { margin: '10px 0 8px', fontSize: 26, letterSpacing: '.02em', fontWeight: 700 } }, 'Text mode pixel'),
            h(
              'p',
              { style: { margin: '0 0 26px', color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.6 } },
              'A live ASCII wallpaper runs behind the UI. The app keeps its own colors and its own light or dark setting — this theme only adds the monospace type, square tiles and the animated backdrop. Pick a scene, or turn the skin off without disabling the plugin.',
            ),
            h(
              'div',
              { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 } },
              SCENES_UI.map((scene) => {
                const selected = state.scene === scene.id && state.on;
                return h(
                  'button',
                  {
                    key: scene.id,
                    type: 'button',
                    onClick: () => pick(scene.id),
                    'aria-pressed': selected,
                    style: {
                      textAlign: 'left',
                      padding: 0,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      border: '1px solid ' + (selected ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-border-l1)'),
                      background: 'var(--dsw-alias-bg-layer-1)',
                      color: 'var(--dsw-alias-label-primary)',
                      boxShadow: selected ? 'inset 0 0 0 1px var(--dsw-alias-brand-primary)' : 'none',
                    },
                  },
                  h('div', {
                    style: {
                      height: 58,
                      backgroundImage: scene.swatch,
                      imageRendering: 'pixelated',
                      borderBottom: '1px solid var(--dsw-alias-border-l1)',
                    },
                  }),
                  h(
                    'div',
                    { style: { padding: '10px 12px 12px' } },
                    h(
                      'div',
                      { style: { fontSize: 13, fontWeight: 700, letterSpacing: '.04em' } },
                      scene.title,
                    ),
                    h(
                      'div',
                      { style: { marginTop: 4, fontSize: 11, lineHeight: 1.45, color: 'var(--dsw-alias-label-secondary)' } },
                      scene.desc,
                    ),
                  ),
                );
              }),
            ),
            h(
              'div',
              {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginTop: 26,
                  paddingTop: 18,
                  borderTop: '1px solid var(--dsw-alias-border-l1)',
                },
              },
              h(
                'button',
                {
                  type: 'button',
                  onClick: toggle,
                  style: {
                    padding: '8px 14px',
                    cursor: 'pointer',
                    border: '1px solid var(--dsw-alias-border-l2)',
                    background: state.on ? 'var(--dsw-alias-bg-layer-2)' : 'var(--dsw-alias-brand-primary)',
                    color: state.on ? 'var(--dsw-alias-label-primary)' : '#08110a',
                    fontSize: 12,
                    letterSpacing: '.06em',
                    textTransform: 'uppercase',
                  },
                },
                state.on ? 'Turn skin off' : 'Turn skin on',
              ),
              h(
                'span',
                { style: { fontSize: 11, color: 'var(--dsw-alias-label-tertiary)' } },
                state.on ? 'Skin is on' : 'Skin is off',
              ),
            ),
          );
        };

        ctx.effect(
          () =>
            ctx.slots.inject('sidebar.panellist', () =>
              ctx.slots.register(
                { name: 'sidebar.panellist', id: 'pixel-theme', order: 30, label: 'Pixel theme' },
                PixelIcon,
              ),
            ),
          'textmode-pixel: sidebar entry',
        );

        ctx.effect(
          () =>
            ctx.slots.inject('main', () =>
              ctx.slots.register({ name: 'main', key: 'pixel-theme' }, PixelPage),
            ),
          'textmode-pixel: pixel theme page',
        );
      },
    };
  },
});
