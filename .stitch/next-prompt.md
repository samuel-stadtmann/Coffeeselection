---
page: coffee_catalog
---
A premium coffee catalog / shop page for Coffee Selection. This is the public browsing experience where customers can discover all available specialty coffees from partner roasters before or after taking the quiz. The page should feel like browsing a high-end coffee monograph.

**Page Structure:**
1. Minimal sticky navigation (logo left, "Mein Profil" and "Quiz starten" right)
2. Editorial hero section: large Noto Serif headline "Entdecke deine perfekte Röstung." with a short sub-line in Manrope, soft cream background
3. Filter chips row: Röstgrad (Hell / Medium / Dunkel), Region, Zubereitungsart — no borders, surface-container-high chips
4. Coffee grid: 3-column "Brew Card" layout
   - Each card: full-bleed coffee imagery, glassmorphism overlay at bottom with coffee name (Noto Serif italic), roaster name (Manrope small), price in secondary gold
   - Cards on #ffffff background sitting on #f7f3ee grid base
   - Subtle "Zum Quiz" CTA on hover
5. "Noch nicht sicher?" editorial CTA block — asymmetric layout, text left, soft imagery right — prompting users to take the taste quiz
6. Minimal footer: logo, nav links in Manrope with expanded letter-spacing

**DESIGN SYSTEM (REQUIRED):**

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
