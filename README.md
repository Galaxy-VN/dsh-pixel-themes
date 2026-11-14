# Text Mode Pixel Theme

A persistent theme plugin for the DeepSeek Harness Web UI: monospace type,
square tiles, pixel scrollbars, and a **live ASCII wallpaper** drawn on a
canvas behind the interface. It keeps the Harness **default colors** — no
custom palette, no separate light or dark theme — and simply follows whichever
setting you already use.

## Features

- **12 live ASCII wallpapers:** Auto, Koi pond, Honu lagoon, Moonlit, Cloud
  drift, Fireflies, Jellyfish, Lantern night, Neon rain, Sakura dusk, Snow
  cabin, Star voyage, and Clawd.
- **Default colors only.** Only the surface layers turn faintly translucent so
  the wallpaper shows through; text, brand, borders and state colors stay the
  shipped Harness values in both light and dark mode.
- A **Pixel theme** page in the left sidebar switches scenes or turns the skin
  off without disabling the plugin. The choice is stored in `localStorage`.
- Respects `prefers-reduced-motion` (draws a still frame).
- MIT. The ASCII scene engine and the wallpapers are adapted from
  [ai-chat-themes](https://github.com/Aohkne/ai-chat-themes); see
  [NOTICE.md](NOTICE.md).

## Install

This directory is a Harness plugin bundle. Install it with the plugin manager
(for example `plugin_manager install_bundle` with this absolute directory), then
restart or hard-refresh the Web UI. The **Pixel theme** icon appears in the left
sidebar rail. Light/dark stays where it has always been: Settings → Appearance.

## Layout

| File | Purpose |
| --- | --- |
| `package.json` | Bundle manifest and `dsh.client` entry. |
| `cordis.patch.yml` | Inserts the plugin row. |
| `index.js` | Host half (no host behavior). |
| `client.js` | The whole skin: theme tokens, CSS, ASCII scene engine, sidebar page. |
| `locale/en.json`, `locale/zh.json` | Plugin Manager title and description. |
| `icon.svg` | Plugin icon. |
| `NOTICE.md` | Third-party MIT attribution. |
