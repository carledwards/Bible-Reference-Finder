# Bible Reference Finder

Live site: https://carledwards.github.io/Bible-Reference-Finder/

Detect and explore Bible references in any pasted text. The app highlights references inline, lists them in a side panel, and can optionally display verse text inline.

## Features
- Fast reference detection (e.g., “John 3:16–18; 1 Cor 13:4–7”)
- Marked preview with clickable references
- Detected references panel with “Open” link (BibleGateway)
- Optional “Inline verses” mode that fetches and shows verse text
- Theme switcher:
  - Light, Light High Contrast, Light Soft
  - Dark, Dark Soft, Dark High Contrast
- Recent texts history (local only)

## Dark mode note
This project uses CSS variables plus Tailwind’s `dark:` variants. If you ever fork/rename or change theming logic:
- We toggle the `data-theme` attribute to swap CSS variables.
- We also toggle Tailwind’s `dark` class on `<html>` so `dark:*` utilities apply in dark themes.
- Common gray utilities are mapped to theme variables in `src/style.css` to ensure good contrast.

If text in the Detected references list appears hard to read in dark mode, ensure the `dark` class is being applied to `<html>` (handled in `applyTheme` in `src/main.ts`).

## Getting started (local)
Prerequisites: Node 18+ (Node 20 used in CI)

- Install deps:
  npm install

- Run dev server:
  npm run dev

- Run tests:
  npm test

- Build for production:
  npm run build

- Preview production build locally:
  npm run preview

## Deployment (GitHub Pages)
This repo is configured for GitHub Pages via Actions.

1) Vite base path is set in `vite.config.ts`:
   base: "/Bible-Reference-Finder/"
   If you fork or rename the repo, update `base` to match your repo name, e.g. `"/my-repo/"`.

2) GitHub Actions workflow:
   .github/workflows/deploy.yml
   On push to `main`, it builds and deploys the `dist/` folder to GitHub Pages.

3) In your repository settings:
   - Settings → Pages → Build and deployment
   - Source: “GitHub Actions”

Your published site will be at:
https://<your-username>.github.io/<your-repo>/

For this repo:
https://carledwards.github.io/Bible-Reference-Finder/

## Project structure
- index.html — App shell/layout
- src/main.ts — App logic, theming, list/preview rendering
- src/parser.ts — Reference parsing + marked HTML generation
- src/api.ts — Verse text fetching
- src/style.css — Tailwind plus theme variable mapping
- tailwind.config.js — Tailwind setup (dark mode via class)
- vite.config.ts — Vite base path for GitHub Pages

## Notes
- Recent texts and preferences (theme, inline verses) are stored in `localStorage`.
- The demo verse-fetch API may not always return content for every reference.
