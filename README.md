<div align="center">

# Text Mode Pixel

**A pixel-art terminal skin for the DeepSeek Harness Web UI.**
Square tiles, monospace type, and a live ASCII wallpaper — with the entire
interface dyed in the color of the scene you pick.

[![License](https://img.shields.io/badge/license-MIT-ffc24a?style=flat-square)](LICENSE)
![Platform](https://img.shields.io/badge/platform-DSH%20Web-57d8c4?style=flat-square)
[![Version](https://img.shields.io/github/v/tag/Galaxy-VN/dsh-pixel-themes?style=flat-square&color=f2a0c0)](https://github.com/Galaxy-VN/dsh-pixel-themes/tags)
![Bundle](https://img.shields.io/badge/type-cordis%20bundle-9aaeff?style=flat-square)

</div>

![Amber auto scene](docs/preview-amber-auto.png)

---

## What it does

- **Paints the whole app.** Backgrounds, layers, sidebar, menus, borders,
  labels, hover states, toasts and the brand color all come from the theme —
  the Harness never falls back to its stock gray.
- **Color follows the scene.** Every wallpaper carries an accent; selecting one
  rebuilds the token layer from that hue, so the UI and the animation always
  agree.
- **12 live ASCII wallpapers** drawn on a canvas behind the interface:
  koi pond, honu lagoon, moonlit, cloud drift, fireflies, jellyfish, lantern
  night, neon rain, sakura dusk, snow cabin, star voyage, clawd.
- **Text-mode chrome.** Monospace everywhere, ligatures off, hard 1–4 px
  shadows, square corners, 10 px pixel scrollbars.
- **No light/dark switch.** It is one fixed dark terminal look; the app's own
  appearance preference does not repaint it.
- **Reduced motion respected** — a still frame is drawn instead of animating.

<table>
<tr>
<td width="50%"><img src="docs/preview-koi-pond.png" alt="Koi pond scene"><br><sub><b>Koi pond</b> · teal</sub></td>
<td width="50%"><img src="docs/preview-sakura-dusk.png" alt="Sakura dusk scene"><br><sub><b>Sakura dusk</b> · rose</sub></td>
</tr>
<tr>
<td width="50%"><img src="docs/preview-moonlit.png" alt="Moonlit scene"><br><sub><b>Moonlit</b> · periwinkle</sub></td>
<td width="50%"><img src="docs/preview-amber-auto.png" alt="Auto scene"><br><sub><b>Auto</b> · amber</sub></td>
</tr>
</table>

> Previews are rendered from the theme's own CSS variables, so they show the
> exact palette the plugin applies. They are not screenshots of a live session.

## Scenes

| Scene | Accent | Mood |
| --- | --- | --- |
| Auto | `#FFC24A` amber | The classic terminal look, koi pond behind it |
| Koi pond | `#57D8C4` teal | Still water, lily pads, three drifting carp |
| Honu lagoon | `#7FE3D2` mint | Turquoise reef with a slow sea turtle |
| Moonlit | `#9AAEFF` periwinkle | Navy sky, gold crescent, meteors |
| Cloud drift | `#9BB7D4` slate blue | Pale sky, cumulus banks, birds |
| Fireflies | `#E3D06A` gold | Grass, wandering lights |
| Jellyfish | `#C08CF0` violet | Deep water, waving tentacles |
| Lantern night | `#FFA45C` ember | Floating lanterns and reflections |
| Neon rain | `#6CE0FF` cyan | Rain streaks over a neon skyline |
| Sakura dusk | `#F2A0C0` rose | Falling petals, pink haze |
| Snow cabin | `#BFD9F2` frost | Falling snow, warm window |
| Star voyage | `#A98CF0` indigo | Starfield drift |
| Clawd | `#D97757` clay | The little mascot, pixel by pixel |

## Install

This directory is a Cordis plugin bundle for the Harness desktop / web profile.

```text
plugin_manager install_bundle  →  target: <absolute path to this folder>
```

Then restart or hard-refresh the Web UI (`Ctrl` + `Shift` + `R`). A **Pixel
theme** icon appears in the left sidebar rail; opening it lists every scene,
and a second click on the active card turns the skin off without disabling the
plugin.

The install is a junction to this working copy, so editing `client.js` and
refreshing the page is enough — no reinstall needed.

## How it works

A single client half registers two things inside one `ctx.effect`:

1. a `<style>` tag with the structural CSS (type scale, square corners, pixel
   scrollbars, hard shadows);
2. a theme layer via `ctx.theme.overrideTokens(source, tokens)`.

The token layer is **regenerated from the chosen scene's accent**: the accent's
hue drives every surface and border, while labels stay warm off-white so text
contrast holds on all thirteen palettes.

```js
const accent = accentFor(store.scene);            // e.g. '#57D8C4'
paletteOff = ctx.theme.overrideTokens(SOURCE, buildTokens(accent));
document.documentElement.style.setProperty('background-color', pageBackground(accent));
startWall(sceneFor(store.scene, true), true);      // the ASCII canvas
```

The sidebar page writes `{ on, scene }` to `localStorage` under `tm.pixel`, so
the choice survives reloads.

## Project layout

| Path | Purpose |
| --- | --- |
| `client.js` | The whole skin: tokens, CSS, ASCII scene engine, sidebar page |
| `index.js` | Host half (intentionally empty) |
| `cordis.patch.yml` | Patch row that inserts the plugin into the profile |
| `package.json` | Bundle manifest, `dsh.bundle` and `dsh.client` entries |
| `locale/en.json`, `locale/zh.json` | Plugin Manager title and description |
| `icon.svg` | Pixel monitor icon |
| `LICENSE` | MIT licence |
| `docs/preview-*.png` | Palette previews used by this README |

## Development

```bash
node --check client.js    # syntax
node -e "JSON.parse(require('fs').readFileSync('package.json'))"
```

Bump `version` in `package.json`, commit, tag `vX.Y.Z`, then refresh the Web UI
to see the change.

## License

MIT — see [LICENSE](LICENSE).
