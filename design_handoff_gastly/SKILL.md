---
name: gastly-design
description: Use this skill to generate well-branded interfaces and assets for Gastly, a shared household expense tracker for Argentine couples. Contains essential design guidelines, colors, type, fonts, assets, and a full interactive UI kit for prototyping the mobile app.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

- **Primary color**: `#1D9E75` — Gastly green
- **Font**: System font in production; use DM Sans for prototypes
- **Background**: `#FAFAF8` (warm off-white), surfaces `#FFFFFF`
- **Language**: Spanish (Argentina), informal, terse
- **Layout**: Mobile-first, max-width 480px, bottom tab nav
- **Iconography**: Emoji for nav/categories in production; SVG stroke icons preferred for new work
- **Shadows**: `0 2px 12px rgba(0,0,0,0.06)` for cards
- **Border radius**: 16px cards, 20px bottom sheets, 10px buttons, pill chips
- **Modals**: Always bottom sheets (border-radius 20px 20px 0 0, dark overlay)
- **Tone**: Direct, Argentine Spanish, no exclamation marks, action-first CTAs

## Key files

```
README.md                    — Full design guidelines
colors_and_type.css          — All CSS variables
preview/                     — Design system cards (colors, type, components)
ui_kits/app/index.html       — Interactive app prototype
ui_kits/app/AppShell.jsx     — Fake data, utilities, Shell component
```
