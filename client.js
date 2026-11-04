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
    /* Wallpaper engine                                                    */
    /* ------------------------------------------------------------------ */

    const FRAME_MS = 42;
    const GRID = 2;
    const BASES = {
      'koi-pond': ['#135c56', '#0a3a39', '#041c1c'],
      moonlit: ['#1b2750', '#101a36', '#070b1a'],
      'honu-lagoon': ['#a9e9e1', '#63c9cb', '#166b7e'],
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

    const TOKENS = {
      '--dsw-alias-bg-base': { light: 'rgb(241 235 217 / 58%)', dark: 'rgb(8 11 6 / 46%)' },
      '--dsw-alias-bg-layer-1': { light: 'rgb(251 247 234 / 74%)', dark: 'rgb(15 20 11 / 64%)' },
      '--dsw-alias-bg-layer-2': { light: 'rgb(235 228 206 / 86%)', dark: 'rgb(21 28 16 / 78%)' },
      '--dsw-alias-bg-layer-3': { light: 'rgb(245 239 221 / 88%)', dark: 'rgb(18 26 14 / 78%)' },
      '--dsw-alias-bg-layer-4': { light: 'rgb(238 231 210 / 90%)', dark: 'rgb(26 36 19 / 85%)' },
      '--dsw-alias-bg-overlay': { light: 'rgb(255 253 245 / 96%)', dark: 'rgb(27 36 20 / 94%)' },
      '--dsw-alias-bg-mask-1': { light: 'rgb(40 35 20 / 38%)', dark: 'rgb(2 5 4 / 55%)' },
      '--dsw-alias-bg-module-platform': { light: 'rgb(239 232 210 / 84%)', dark: 'rgb(23 32 15 / 72%)' },
      '--dsw-specific-sidebar-fill': { light: 'rgb(231 223 200 / 70%)', dark: 'rgb(10 14 8 / 52%)' },
      '--dsw-specific-menu': { light: 'rgb(255 253 245 / 97%)', dark: 'rgb(27 36 20 / 96%)' },
      '--dsw-alias-border-l1': { light: '#CFC6AA', dark: '#263520' },
      '--dsw-alias-border-l2': { light: '#A2957A', dark: '#3F5733' },
      '--dsw-alias-border-l3': { light: '#857858', dark: '#587647' },
      '--dsw-alias-border-l4': { light: '#DED6BC', dark: '#2C3D24' },
      '--dsw-alias-brand-primary': { light: '#9C4A00', dark: '#FFC24A' },
      '--dsw-alias-link': { light: '#8A3F00', dark: '#FFD27A' },
      '--dsw-alias-label-primary': { light: '#1E1B12', dark: '#D6F5BE' },
      '--dsw-alias-label-secondary': { light: '#57503C', dark: '#93B87D' },
      '--dsw-alias-label-tertiary': { light: '#6E6752', dark: '#7C9468' },
      '--dsw-alias-state-success-primary': { light: '#1F6B35', dark: '#74E08A' },
      '--dsw-alias-state-warn-primary': { light: '#8A5A00', dark: '#FFC24A' },
      '--dsw-alias-state-error-primary': { light: '#A52A1F', dark: '#FF7A6E' },
      '--dsw-alias-state-idle-primary': { light: '#7B7358', dark: '#7C9468' },
      '--dsw-alias-interactive-bg-hover': { light: 'rgb(233 226 202 / 55%)', dark: 'rgb(26 36 19 / 50%)' },
      '--dsw-alias-button-ghost-active-fill': { light: 'rgb(156 74 0 / 10%)', dark: 'rgb(255 194 74 / 16%)' },
      '--dsw-alias-button-ghost-active-border': { light: '#9C4A00', dark: '#FFC24A' },
      '--dsw-alias-menu-icon': { light: '#3F3928', dark: '#C7E4B2' },
      '--dsw-alias-toast-bg': { light: 'rgb(38 33 21 / 97%)', dark: 'rgb(27 36 20 / 96%)' },
      '--dsw-alias-toast-label': { light: '#FBF7EA', dark: '#E6FFD6' },
      '--dsw-alias-switch-thumb': { light: '#FFFDF5', dark: '#D6F5BE' },
      '--dsw-alias-bg-document-selection': { light: 'rgb(156 74 0 / 30%)', dark: 'rgb(255 194 74 / 38%)' },
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
  background-color: #F1EBD9;
}

html:has(body[data-ds-dark-theme]) {
  background-color: #080B06;
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
    const VALID = new Set(['auto', 'koi-pond', 'honu-lagoon', 'moonlit']);

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
            desc: 'Koi pond in dark mode, honu lagoon in light.',
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
            { style: { padding: '34px 40px 64px', maxWidth: 800, margin: '0 auto' } },
            h(
              'div',
              { style: { fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--dsw-alias-label-tertiary)' } },
              'Harness skin',
            ),
            h('h1', { style: { margin: '10px 0 8px', fontSize: 26, letterSpacing: '.02em', fontWeight: 700 } }, 'Text mode pixel'),
            h(
              'p',
              { style: { margin: '0 0 26px', color: 'var(--dsw-alias-label-secondary)', lineHeight: 1.6 } },
              'A live ASCII wallpaper runs behind the UI: ',
              h('b', null, 'koi pond'),
              ' in dark mode and ',
              h('b', null, 'honu lagoon'),
              ' in light mode. Pick a scene, or turn the skin off without disabling the plugin.',
            ),
            h(
              'div',
              { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 } },
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
