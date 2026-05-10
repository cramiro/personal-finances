# Gastly Design System

> *Saber en qué gastás, sin que sea un trabajo.*

Gastly is a shared household expense tracker built for Argentine couples and households. It prioritizes speed of input, shared visibility, and native support for ARS + USD (dólar blue). This design system documents the visual language, component patterns, and brand guidelines extracted from the production codebase.

---

## Sources

- **Codebase**: [github.com/cramiro/personal-finances](https://github.com/cramiro/personal-finances) — Next.js 14 app (App Router), Tailwind CSS + CSS custom properties, React with `styled-jsx` for component styles, Supabase backend.
- **No Figma file was provided.** All design tokens and patterns are extracted directly from source code.

---

## Product Overview

Gastly is a **mobile-first PWA** (max-width 480px) with three main screens:

| Screen | Route | Purpose |
|--------|-------|---------|
| **Cargar** | `/` | Natural-language expense input + recent list + recurring checklist + shopping list |
| **Resumen** | `/resumen` | Bar chart, category breakdown, period presets, ARS↔USD toggle |
| **Config** | `/config` | Workspace settings, members, invite codes, category management |

Auth uses email + 6-digit PIN (custom numpad). No OAuth.

---

## Content Fundamentals

### Voice & Tone
- **Language**: Spanish (Argentina), always informal (`vos` register implicitly, `tuteo` in action buttons)
- **Short and direct**: Labels are terse — "Guardar", "Confirmar gasto", "Cerrar sesión". Never padded.
- **Action-oriented CTAs**: Buttons say what they do. No "OK", no "Submit". Always specific: "Confirmar gasto", "Generar código", "Crear cuenta".
- **Contextual feedback**: States like "Guardando...", "✓ Guardado", "Procesando..." are written as-is — not hidden behind spinners alone.
- **Emoji as icons only in nav + categories**: The bottom nav uses ⚡📊⚙️; categories use 🛒🚗🍕 etc. Not used as decoration in body copy.
- **No exclamation marks**: The tone is calm and confident, not hype-y.
- **Argentine financial vocabulary**: "dólar blue", "ARS", "USD", "cuotas", "expensas", "SUBE" are first-class terms.

### Casing
- Section headers: ALL CAPS (12px, tracking 0.5px)
- Button labels: Sentence case ("Confirmar gasto")
- Nav labels: Title case ("Cargar", "Resumen")
- Error messages: Sentence case, plain Spanish, no jargon

### Copy Examples
```
"100k super" o "25k café"      — input placeholder
Saber en qué gastás, sin que sea un trabajo  — tagline
La forma más rápida de trackear gastos       — subtitle
Cargá tu primer gasto          — empty state
Sin gastos en este período     — empty summary state
¿A dónde se fue la plata?      — implied user question
```

---

## Visual Foundations

### Color System
Defined in `colors_and_type.css`. Core palette:

| Token | Value | Usage |
|-------|-------|-------|
| `--primary` | `#1D9E75` | Brand green — buttons, active states, logos, badges |
| `--primary-light` | `#E8F7F2` | Tinted backgrounds — active chips, member badges |
| `--bg` | `#FAFAF8` | App background — warm off-white, not pure white |
| `--surface` | `#FFFFFF` | Cards, inputs, panels |
| `--text` | `#1A1A1A` | Primary text — near-black, not pure black |
| `--text-secondary` | `#6B6B6B` | Labels, metadata, descriptions |
| `--text-tertiary` | `#ABABAB` | Section headers, timestamps, hints |
| `--border` | `#E8E8E8` | All dividers and input borders |
| `--danger` | `#E24B4A` | Destructive actions, error text |

**Category accent palette** (also used for chart cells, avatar backgrounds):
`#1D9E75` `#378ADD` `#D85A30` `#7F77DD` `#BA7517` `#D4537E` `#E24B4A` `#639922` `#534AB7` `#888780`

### Typography
The app uses **system fonts** (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`). On iOS this renders as SF Pro; on macOS as SF Pro; on Windows as Segoe UI. For HTML prototypes, **DM Sans** (Google Fonts) is the designated substitute — similar geometry, clean grotesque, excellent weight range.

| Role | Size | Weight | Notes |
|------|------|--------|-------|
| Logo / wordmark | 40px | 800 | Letter-spacing -1.5px |
| Total amount | 36px | 800 | Letter-spacing -1.5px |
| Workspace name | 22px | 800 | Letter-spacing -0.5px |
| Preview amount | 22px | 800 | Letter-spacing -0.5px |
| Section heading | 20px | 700 | PIN title, modal title |
| Body primary | 16px | 500–600 | Input text, button text |
| List item | 14px | 500–700 | Descriptions, names |
| Label / meta | 13px | 600 | Form labels, secondary actions |
| Small / meta | 12px | 500–700 | Timestamps, category meta |
| Section header | 12px | 700 | ALL CAPS, tracking 0.5px |
| Micro | 11px | 600 | Badges, percentages |

### Layout
- **Max-width**: 480px, centered on wide viewports
- **Mobile-first**: `min-height: 100dvh`, uses `dvh` throughout
- **Screen padding**: 16px horizontal, 16px vertical
- **Gap between cards**: 12px
- **Fixed bottom nav**: 72px height, `position: fixed`, `z-index: 50`
- **Bottom sheets**: `position: fixed; inset: 0; align-items: flex-end`

### Borders & Radius
| Usage | Radius |
|-------|--------|
| Circular (dots, avatars, toggles) | 50% / 13px |
| Bottom sheet / modal | 20px 20px 0 0 |
| Main cards | 16px |
| Input fields | 10px |
| Panels / section cards | 12px |
| Small buttons / badges | 6–8px |
| Chip/pill | 20px (fully rounded) |
| Category row items | 10px |

Border weight: always **1.5px** (inputs, chips, outlines). Never 1px for interactive elements.

### Shadows
| Usage | Value |
|-------|-------|
| Card (main) | `0 2px 12px rgba(0,0,0,0.06)` |
| Dropdown / popover | `0 4px 20px rgba(0,0,0,0.12)` |
| Keypad keys | `0 1px 4px rgba(0,0,0,0.08)` |
| Chart card | `0 2px 8px rgba(0,0,0,0.04)` |

### Interaction States
- **Tap on list row**: `:active { opacity: 0.7 }` — simple opacity fade
- **Keypad key tap**: `:active { background: var(--border) }` — subtle grey flash
- **Hover on cat-option**: `background: var(--bg)` — very subtle
- **Disabled button**: `opacity: 0.4`
- **Focus on input**: `border-color: var(--primary)` — no outline, just border color change
- **Transitions**: `0.15s` for opacity/color, `0.2s` for transforms (chevrons, toggle knob), `0.3s` for bar fills

### Animation
- Minimal. Transitions only (no keyframe animations except the loading spinner).
- Loading spinner: `border-top-color: var(--primary)`, `0.7s linear infinite`
- Chevron rotation: `transform: rotate(180deg)` on expand, `transition: 0.2s`
- Toggle knob: `transform: translateX(18px)`, `transition: 0.2s`
- **No entrance animations, no bounces, no spring physics**

### Bottom Sheets (Modal Pattern)
All modals are bottom sheets:
- Overlay: `rgba(0,0,0,0.45–0.6)`
- Sheet: `border-radius: 20px 20px 0 0`
- Close: tap overlay or ✕ button
- Max-height: `80dvh` or `90dvh`
- Internal scroll on list content

### Cards
- Background: `var(--surface)` (white)
- Border-radius: 16px (main cards), 12px (section panels)
- Shadow: `0 2px 12px rgba(0,0,0,0.06)`
- No visible border on cards — shadow only

### Imagery & Iconography
See ICONOGRAPHY section below.

### Color Vibe
Warm, clean, minimal. The off-white background (`#FAFAF8`) gives warmth without being overtly earthy. The primary green (`#1D9E75`) is confident but not aggressive — a real money-positive green. No gradients anywhere in the current UI.

---

## Iconography

The app uses **emoji as icons** in two specific contexts:
1. **Bottom navigation**: ⚡ (Cargar), 📊 (Resumen), ⚙️ (Config)
2. **Default categories**: Each category has an emoji icon (🛒🚗🍕📺🏠💊🎭👕📚📦)

No SVG icon library is used. No icon font. No PNG icons. The `public/` folder contains only Next.js defaults (file.svg, globe.svg, etc.) which are not used in the app UI.

For HTML prototypes and design assets, use emoji directly — they are the canonical icon system.

The app does NOT use:
- Lucide, Heroicons, or any icon library
- Icon fonts (no FontAwesome, etc.)
- Decorative SVG illustrations

Exception: A single inline SVG chevron (`<path d="M3 6l5 5 5-5">`) is used for expand/collapse toggles. This is the only drawn graphic element.

---

## File Index

```
/
├── README.md                    ← This file
├── SKILL.md                     ← Agent skill definition
├── colors_and_type.css          ← All CSS variables (colors + typography)
├── assets/
│   └── (no raster logos found in repo; favicon.ico copied)
├── preview/
│   ├── colors-brand.html        ← Brand + semantic color swatches
│   ├── colors-categories.html   ← Category accent palette
│   ├── type-scale.html          ← Full type scale specimen
│   ├── type-amounts.html        ← Numeric/financial type treatments
│   ├── spacing-tokens.html      ← Radius + shadow + spacing tokens
│   ├── components-buttons.html  ← All button variants
│   ├── components-inputs.html   ← Inputs, selects, toggles
│   ├── components-cards.html    ← Card + list row patterns
│   ├── components-badges.html   ← Badges, chips, pills
│   ├── components-nav.html      ← Bottom nav + tab bar
│   └── components-modals.html   ← Bottom sheet pattern
└── ui_kits/
    └── app/
        ├── README.md            ← App UI kit notes
        └── index.html           ← Interactive app prototype (4 screens)
```
