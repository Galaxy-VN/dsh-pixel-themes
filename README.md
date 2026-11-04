# Text Mode Pixel Theme

A persistent theme plugin for the DeepSeek Harness Web UI: a text-mode terminal
palette, monospace type, square tiles, pixel scrollbars, and a **live ASCII
wallpaper** drawn on a canvas behind the interface.

## Features

- **12 live ASCII wallpapers:** Auto, Koi pond, Honu lagoon, Moonlit, Cloud
  drift, Fireflies, Jellyfish, Lantern night, Neon rain, Sakura dusk, Snow
  cabin, Star voyage, and Clawd.
- **Light / dark / system** from the same page (writes the built-in Appearance
  preference) plus **Auto** wallpaper that follows it.
- A **Pixel theme** page in the left sidebar switches scenes, sets the mode, or
  turns the skin off without disabling the plugin. The choice is stored in
  `localStorage`.
- Respects `prefers-reduced-motion` (draws a still frame).
- MIT. The ASCII scene engine and the wallpapers are adapted from
  [ai-chat-themes](https://github.com/Aohkne/ai-chat-themes); see
  [NOTICE.md](NOTICE.md).

## Install

This directory is a Harness plugin bundle. Install it with the plugin manager
(for example `plugin_manager install_bundle` with this absolute directory), then
restart or hard-refresh the Web UI. The **Pixel theme** icon appears in the left
sidebar rail; Settings → Appearance still handles light/dark.

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
