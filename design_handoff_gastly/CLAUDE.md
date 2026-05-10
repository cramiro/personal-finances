# Gastly Design System — Claude Code Instructions

> Este archivo es el punto de entrada del design system de Gastly para Claude Code.
> Cuando trabajes en este proyecto, leé este archivo primero para entender las reglas visuales.

---

## ¿Qué es Gastly?

App de registro de gastos del hogar para parejas argentinas. Mobile-first PWA (Next.js), max-width 480px. Tres pantallas principales: **Cargar** (input NLP), **Resumen** (análisis), **Config** (workspace).

**Principio #1:** Velocidad. Cada pantalla tiene una acción principal. El registro de un gasto debe completarse en menos de 10 segundos.

---

## Tokens de diseño

Estos valores están en `colors_and_type.css`. Úsalos como CSS custom properties:

```css
/* Colores principales */
--primary:        #1D9E75   /* verde Gastly — botones, logo, estados activos */
--primary-light:  #E8F7F2   /* fondo tintado — chips activos, badges */
--bg:             #FAFAF8   /* fondo app — blanco cálido */
--surface:        #FFFFFF   /* cards, inputs, paneles */
--text:           #1A1A1A   /* texto principal */
--text-secondary: #6B6B6B   /* labels, metadata */
--text-tertiary:  #ABABAB   /* section headers, timestamps */
--border:         #E8E8E8   /* todos los dividers e inputs (1.5px) */
--danger:         #E24B4A   /* acciones destructivas */
```

```css
/* Paleta de categorías — en orden */
--cat-1:  #1D9E75  /* Supermercado */
--cat-2:  #378ADD  /* Transporte   */
--cat-3:  #D85A30  /* Comida       */
--cat-4:  #7F77DD  /* Suscripciones*/
--cat-5:  #BA7517  /* Hogar        */
--cat-6:  #D4537E  /* Salud        */
--cat-7:  #E24B4A  /* Entretenimiento */
--cat-8:  #639922  /* Ropa         */
--cat-9:  #534AB7  /* Educación    */
--cat-10: #888780  /* Otros        */
```

---

## Tipografía

**Font stack en producción:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
→ SF Pro en iOS/macOS. No cambiar.

| Rol                | Size  | Weight | Notas                         |
|--------------------|-------|--------|-------------------------------|
| Logo / wordmark    | 40px  | 800    | letter-spacing: -1.5px        |
| Monto total        | 36px  | 800    | letter-spacing: -1.5px        |
| Nombre workspace   | 22px  | 800    | letter-spacing: -0.5px        |
| Título modal       | 20px  | 700    |                               |
| Input / botones    | 16px  | 700    |                               |
| Ítem de lista      | 14px  | 500    |                               |
| Label de campo     | 13px  | 600    | color: var(--text-secondary)  |
| Section header     | 12px  | 700    | UPPERCASE · letter-spacing: 0.5px · color: var(--text-tertiary) |
| Micro / badge      | 11px  | 600    |                               |

---

## Layout & Estructura

```
Shell (max-width: 480px, margin: 0 auto)
├── <header> — sticky top, logo + avatar
├── <main> — flex: 1, overflow-y: auto, padding-bottom: 72px
└── <nav> — fixed bottom, 72px height, 3 tabs
```

- **Screen padding:** 16px horizontal
- **Gap entre cards:** 12px
- **Bottom sheet:** `border-radius: 20px 20px 0 0`, overlay `rgba(0,0,0,0.45–0.6)`

---

## Bordes, radios y sombras

```css
/* Border radius */
--radius-sm:   6px   /* tags pequeños, badges */
--radius-md:   8px   /* inputs, botones pequeños */
--radius-lg:   10px  /* botones principales, filas de lista */
--radius-xl:   12px  /* paneles de sección */
--radius-2xl:  16px  /* cards principales */
--radius-3xl:  20px  /* bottom sheets (esquinas superiores) */
--radius-pill: 20px  /* chips, pills */

/* Border width: siempre 1.5px para elementos interactivos */

/* Sombras */
--shadow-card:      0 2px 12px rgba(0,0,0,0.06)   /* cards principales */
--shadow-dropdown:  0 4px 20px rgba(0,0,0,0.12)   /* dropdown, popover */
--shadow-key:       0 1px 4px  rgba(0,0,0,0.08)   /* teclas del numpad */
```

---

## Patrones de componentes

### Botón primario
```css
background: var(--primary);
color: white;
border: none;
border-radius: 10px;
padding: 14px 20px;
font-size: 16px;
font-weight: 700;
/* disabled → opacity: 0.4 */
```

### Botón ghost / outline
```css
background: var(--surface);
color: var(--text-secondary);
border: 1.5px solid var(--border);
border-radius: 10px;
padding: 13px 20px;
font-size: 15px;
font-weight: 600;
```

### Botón de peligro (outline)
```css
background: none;
color: var(--danger);
border: 1.5px solid var(--danger);
border-radius: 10px;
```

### Input de texto
```css
border: 1.5px solid var(--border);
border-radius: 10px;
padding: 13px 14px;
font-size: 16px;
/* focus → border-color: var(--primary); outline: none */
```

### Input NLP grande (pantalla Cargar)
```css
font-size: 20px;
border: none;
border-bottom: 1.5px solid var(--border);
padding: 8px 0 12px;
/* focus → border-bottom-color: var(--primary) */
```

### Card principal
```css
background: var(--surface);
border-radius: 16px;
padding: 16px;
box-shadow: 0 2px 12px rgba(0,0,0,0.06);
```

### Fila de gasto (lista)
```css
display: flex;
align-items: center;
gap: 10px;
background: var(--surface);
border-radius: 10px;
padding: 12px;
/* :active → opacity: 0.7 */
```

### Chip / preset pill (activo/inactivo)
```css
/* inactivo */
border: 1.5px solid var(--border);
border-radius: 20px;
padding: 7px 14px;
font-size: 13px;
font-weight: 600;
background: var(--surface);
color: var(--text-secondary);

/* activo */
border-color: var(--primary);
background: var(--primary-light);
color: var(--primary);
```

### Toggle switch
```css
width: 44px; height: 26px;
border-radius: 13px;
background: var(--border);         /* off */
background: var(--primary);        /* on */
/* knob: 20x20px, top:3 left:3, translateX(18px) cuando on */
/* transition: 0.2s */
```

### Badge de member
```css
background: var(--primary-light);
color: var(--primary);
font-size: 12px;
font-weight: 700;
padding: 4px 9px;
border-radius: 6px;
```

### Section header label
```css
font-size: 12px;
font-weight: 700;
color: var(--text-tertiary);
text-transform: uppercase;
letter-spacing: 0.5px;
```

### Bottom sheet
```html
<!-- overlay -->
<div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:flex-end">
  <!-- sheet -->
  <div style="background:var(--surface);border-radius:20px 20px 0 0;padding:20px;width:100%;max-width:480px;max-height:80dvh">
    ...
  </div>
</div>
```

### Bottom nav (3 tabs)
```css
position: fixed;
bottom: 0;
width: 100%; max-width: 480px;
display: flex;
background: var(--surface);
border-top: 1px solid var(--border);
height: 72px;
z-index: 50;
```
Iconos aprobados (SVG stroke, 22×22px, strokeWidth=2, round caps):
- **Cargar:** `<circle cx="12" cy="12" r="9"/>` + líneas en cruz
- **Resumen:** `<path d="M6 20V14M12 20V8M18 20V3"/>`
- **Config:** 3 líneas horizontales + círculos (sliders)

Activo: `stroke: var(--primary)` · Inactivo: `stroke: var(--text-tertiary)`

---

## Interacciones y estados

| Elemento       | Estado        | CSS                                       |
|----------------|---------------|-------------------------------------------|
| Fila de lista  | `:active`     | `opacity: 0.7`                            |
| Tecla numpad   | `:active`     | `background: var(--border)`              |
| Input          | `:focus`      | `border-color: var(--primary)`           |
| Botón disabled | —             | `opacity: 0.4; cursor: not-allowed`      |
| Cat-option     | `:hover`      | `background: var(--bg)`                  |

Transiciones: `0.15s` opacity/color · `0.2s` transform (chevron, toggle knob) · `0.3s` barras de categoría

---

## Copy y tono

- **Idioma:** Español (Argentina), informal, `vos` implícito
- **CTAs:** Acción específica siempre — "Confirmar gasto", "Generar código", nunca "OK" o "Submit"
- **Estados:** "Guardando...", "✓ Guardado", "Procesando..." — texto en botones, no spinners solos
- **Sin signos de exclamación.** Tono calmo y directo.
- **Casing:** section headers en MAYÚSCULAS · botones en Sentence case
- **Vocabulario argentino:** dólar blue, ARS, USD, cuotas, expensas, SUBE — ciudadanos de primera clase

---

## Archivos de referencia

| Archivo | Contenido |
|---------|-----------|
| `colors_and_type.css` | Todos los CSS custom properties |
| `README.md` | Guía completa de diseño (Visual Foundations, Content) |
| `ui_kit/index.html` | Prototipo interactivo — todas las pantallas |

---

## Checklist antes de hacer PR

- [ ] Colores extraídos de `--primary`, `--bg`, `--surface`, etc. (no hardcoded)
- [ ] Font size ≥ 11px en toda la UI
- [ ] Hit targets táctiles ≥ 44px de alto
- [ ] Inputs: `border: 1.5px solid var(--border)` y `border-color: var(--primary)` en focus
- [ ] Modales implementados como bottom sheets (no centrados)
- [ ] Bottom nav fijo con `z-index: 50` y `padding-bottom: 72px` en main
- [ ] Copy en español argentino, sin exclamaciones
