# Design System: Coffee Selection — The Digital Sommelier

## 1. Overview & Creative North Star

**Creative North Star: "The Curated Gallery"**

This design system is built on the philosophy of **Quiet Luxury**. Unlike standard e-commerce platforms that shout for attention, this system whispers. It acts as a digital concierge — sophisticated, serene, and deeply intentional.

We break the traditional "boxed" web template using **Swiss-minimalist principles**: asymmetric layouts that allow imagery to breathe, high-contrast typography scales that prioritize editorial storytelling over dense data, and a "no-border" architecture. The goal is to make the user feel like they are flipping through a high-end coffee monograph rather than navigating an interface.

**Target Feel:** A premium boutique in Zurich that happens to sell the world's finest specialty coffees. Calm. Confident. Unhurried.

---

## 2. Colors: Tonal Depth & Warmth

The palette is rooted in the organic tones of the coffee ritual, moving away from sterile whites and greys in favor of warmth and richness.

### Core Palette

| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#341706` | Deep Espresso — all high-authority text and brand moments |
| `background` / `surface` | `#fdf9f4` | Soft Almond — primary canvas |
| `secondary` | `#795900` | Champagne Gold — used with extreme restraint (price tags, badges, selection dots) |
| `on-primary` | `#ffffff` | White text on primary buttons |
| `surface-container-low` | `#f7f3ee` | Nested sections, filter bars |
| `surface-container-lowest` | `#ffffff` | Most prominent cards — creates visual "lift" |
| `surface-container` | `#f1ede8` | Mid-level containers |
| `surface-container-high` | `#ebe8e3` | Chips, secondary backgrounds |
| `outline-variant` | `#d5c3bb` | Ghost borders (15% opacity only) |
| `error` | `#ba1a1a` | Error states — subtle, never alarming |

### The "No-Line" Rule
**Explicit Instruction:** Do NOT use 1px solid borders to section content. Boundaries must be defined through:
1. **Background Shifts** — Transition from `surface` to `surface-container-low` to define new sections.
2. **Whitespace** — Use the spacing scale to create mental groupings.
3. **Ghost Border Fallback** — Only if accessibility strictly requires it: `outline-variant` at **15% opacity**. Never opaque borders.

### Surface Hierarchy & Nesting (Physical Paper Layers)
- **Level 0:** `#fdf9f4` — Base background
- **Level 1:** `#f7f3ee` — Nested sections (filter bars, secondary content)
- **Level 2:** `#ffffff` — Interactive cards (subtle visual "lift")

### Signature Textures
- **Buttons & CTAs:** Subtle linear gradient from `#341706` to `#4d2c19` — adds depth, avoids flat plastic look.
- **Floating Elements / Headers:** Glassmorphism — semi-transparent `surface` at 80% opacity with `20px` backdrop-blur, allowing coffee imagery to bleed through softly.

---

## 3. Typography: Editorial Authority

High-contrast pairing: Swiss precision meets artisanal warmth.

| Role | Font | Tokens | Notes |
|------|------|--------|-------|
| **Display / Headlines** | Noto Serif (400, 700, italic) | `display`, `headline` | Conveys heritage and authority |
| **Body / UI** | Manrope (300–700) | `title`, `body`, `label` | Swiss-minimalist clarity |

### Styling Rules
- **Headlines (Noto Serif):** Decrease letter-spacing slightly on large sizes (`-0.01em`) for a compact, premium feel.
- **Labels / Titles (Manrope):** Increase letter-spacing (`+0.05em`) for airy, high-end elegance.
- **Never use `#000000`** — use `#341706` (primary) for all dark text elements.
- **Body copy:** `#51443e` (`on-surface-variant`) for secondary text.

### Google Fonts Import
```html
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
```

---

## 4. Elevation & Depth

Shadows are atmosphere, not structure.

- **Primary Hierarchy Method:** Tonal layering — place `#ffffff` card on `#f7f3ee` background. Feels like a thicker piece of cardstock resting on a table.
- **Ambient Shadow (when floating is needed):** `box-shadow: 0 8px 32px rgba(28,28,25,0.04)` — soft glow, never a dark drop-shadow.
- **Rule:** If you can see the shadow's edge, it is too heavy.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill `#341706` → `#4d2c19`. White text (`#ffffff`). `border-radius: 8px`.
- **Secondary:** No fill. Ghost border (`outline-variant` at 15% opacity). `#341706` text.
- **Tertiary:** No border, no fill. `#341706` text. Champagne gold (`#795900`) underline on hover.

### Input Fields
- Minimalist: only a bottom border using `outline-variant` color.
- On focus: bottom border transitions to `primary` (`#341706`).
- Labels: Manrope, letter-spacing `+0.05em`.

### Cards — The "Brew Card"
The signature layout for coffee presentation:
- Large, high-resolution imagery (bleed to edges)
- Glassmorphism overlay at bottom for title and price
- Title in **Noto Serif** italic
- Background: `#ffffff` card on `#f7f3ee` base
- No border. No drop shadow. Tonal separation only.

### Cards — General
- Background: `surface-container-lowest` (`#ffffff`)
- **No divider lines.** Separate items with `16px` vertical whitespace.
- Group related items with background shift, never a line.

### Chips
- `border-radius: 8px`
- Background: `surface-container-high` (`#ebe8e3`)
- No border

### Checkboxes / Radio
- Active: `primary` (`#341706`)
- Unselected: subtle `outline-variant` shape — never a heavy box

### Navigation
- Minimal top bar: logo left, links right in Manrope with letter-spacing
- Active state: `secondary` gold dot or underline
- Mobile: drawer pattern with glassmorphism panel

---

## 6. Design System Notes for Stitch Generation

> **Copy this entire section into every Stitch prompt to ensure visual consistency.**

```
DESIGN SYSTEM — Coffee Selection (Quiet Luxury):

COLORS:
- Background: #fdf9f4 (Soft Almond)
- Primary: #341706 (Deep Espresso) — all headlines, primary buttons, nav
- Secondary/Accent: #795900 (Champagne Gold) — used sparingly (badges, price tags, selection dots only)
- Surface card: #ffffff
- Surface container: #f7f3ee (nested sections)
- Body text: #51443e
- Error: #ba1a1a

TYPOGRAPHY:
- Headlines/Display: Noto Serif (400, 700, italic) — compact letter-spacing on large sizes
- Body/UI: Manrope (300–700) — slightly expanded letter-spacing on labels (+0.05em)
- Never use pure black (#000000)

LAYOUT RULES:
- NO 1px borders for sectioning — use background color shifts and whitespace only
- Ghost border exception: outline-variant at 15% opacity max
- Asymmetric layouts: text anchored left, imagery bleeds right or full-width
- Generous vertical whitespace — if it feels full, it's over-designed

BUTTONS:
- Primary: gradient #341706 → #4d2c19, white text, 8px radius
- Secondary: ghost border (15% opacity), #341706 text, no fill

CARDS:
- No drop shadows — use tonal layering (#ffffff card on #f7f3ee base)
- Ambient shadow allowed: 0 8px 32px rgba(28,28,25,0.04)
- "Brew Card": full-bleed image + glassmorphism overlay (80% surface opacity, 20px blur) for coffee name/price in Noto Serif italic

ELEVATION:
- Floating elements: glassmorphism (80% surface opacity, 20px backdrop-blur)
- Layer feel: like physical paper sheets stacked on a fine linen surface

MOOD: Quiet. Premium. Editorial. Like a coffee monograph from a Zurich design studio.
```

---

## 7. Do's and Don'ts

### Do
- Prioritize vertical whitespace. If a layout feels "full," it is over-designed.
- Use asymmetrical imagery — text left, product image bleeds off right edge.
- Use `secondary` gold only for the "final touch" — a price tag, a selection dot, a signature icon.
- Let coffee photography dominate. The UI is a frame, not a focal point.

### Don't
- Use `#000000` — always use `#341706` for dark elements.
- Use sharp 0px corners — always `8px` radius minimum.
- Use Material Design blue for links — use `#341706` for all links.
- Use heavy drop shadows — if the shadow edge is visible, it's too heavy.
- Crowd the layout — white space is the luxury signal.
- Use colored chips or badges unless it's the `secondary` gold accent.
