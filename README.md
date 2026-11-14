# Text Mode Pixel Theme

A persistent theme plugin for the DeepSeek Harness Web UI: **one fixed warm
terminal palette** covering the whole interface — ink surfaces, amber accents,
monospace type, square tiles, pixel scrollbars — with a **live ASCII wallpaper**
drawn on a canvas behind it. There is no light or dark variant: the theme keeps
the same look whatever the app's own appearance preference says.

## Features

- **12 live ASCII wallpapers:** Auto, Koi pond, Honu lagoon, Moonlit, Cloud
  drift, Fireflies, Jellyfish, Lantern night, Neon rain, Sakura dusk, Snow
  cabin, Star voyage, and Clawd.
- **One palette everywhere.** Backgrounds, layers, sidebar, menus, borders,
  labels, brand and state colors are all set to the theme, in both the light
  and dark token slots, so the UI never falls back to the stock gray.
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
sidebar rail. The theme replaces the app colors on its own; Settings →
Appearance no longer changes how it looks.

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
