# Design System: The Digital Sommelier

## 1. Overview & Creative North Star
**Creative North Star: The Curated Gallery**
This design system is built on the philosophy of "Quiet Luxury." Unlike standard e-commerce platforms that shout for attention, this system whispers. It acts as a digital concierge—sophisticated, serene, and deeply intentional. 

We break the traditional "boxed" web template by utilizing **Swiss-minimalist principles**: asymmetric layouts that allow imagery to breathe, high-contrast typography scales that prioritize editorial storytelling over dense data, and a "no-border" architecture. The goal is to make the user feel like they are flipping through a high-end coffee monograph rather than navigating an interface.

---

## 2. Colors: Tonal Depth & Warmth
The palette is rooted in the organic tones of the coffee ritual, moving away from sterile whites and greys in favor of warmth and richness.

*   **Primary Palette:** `primary` (#341706 / Deep Espresso) serves as our "anchor." It is used for all high-authority text and critical brand moments.
*   **Background Surfaces:** The `background` (#fdf9f4 / Soft Almond) is our primary canvas. 
*   **Highlight Moments:** `secondary` (#795900 / Champagne Gold) is used with extreme restraint—reserved for discrete interactive highlights or prestige badges.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined through:
1.  **Background Shifts:** Transition from `surface` to `surface-container-low` to define new sections.
2.  **Whitespace:** Using the spacing scale to create mental groupings.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper. 
*   **Level 0:** `surface` (The base background).
*   **Level 1:** `surface-container-low` (Nested sections like filter bars or secondary content).
*   **Level 2:** `surface-container-lowest` (The most prominent interactive cards, creating a subtle visual "lift").

### Signature Textures
Avoid flat, plastic-looking fills. Use a subtle linear gradient from `primary` to `primary_container` (#4d2c19) for buttons and brand moments to add "soul" and depth. For floating elements, use **Glassmorphism**: a semi-transparent `surface` fill with a `20px` backdrop-blur to allow coffee imagery to bleed through the interface softly.

---

## 3. Typography: Editorial Authority
The typography uses a high-contrast pairing to balance Swiss precision with traditional elegance.

*   **The Serif (Noto Serif / Merriweather):** Used for all `display` and `headline` tokens. This conveys the brand's heritage and authority.
    *   *Styling Tip:* Decrease letter-spacing slightly for large headlines to feel more compact and premium.
*   **The Sans (Manrope / Montserrat):** Used for `title`, `body`, and `label` tokens. This provides the "Swiss-minimalist" clarity required for utility.
    *   *Styling Tip:* Increase letter-spacing (`0.05em`) on `label` and `title` tokens to create an airy, high-end feel.

---

## 4. Elevation & Depth
In this design system, shadows are an atmosphere, not a structure.

*   **Tonal Layering:** Most hierarchy is achieved by placing a `surface-container-lowest` card on top of a `surface-container-low` background. This creates a soft "natural" lift.
*   **Ambient Shadows:** If an element must float, use a shadow with a blur radius of at least `32px` and an opacity of `4%` using a tint of the `on-surface` color. It should feel like a soft glow, not a dark drop-shadow.
*   **The "Ghost Border" Fallback:** If a boundary is strictly required for accessibility, use the `outline-variant` token at **15% opacity**. High-contrast, opaque borders are strictly forbidden.

---

## 5. Components

### Buttons
*   **Primary:** Fill using the `primary` to `primary-container` gradient. Typography in `on-primary`. 8px rounded corners (`lg`).
*   **Secondary:** No fill. `Ghost Border` (15% opacity `outline-variant`). `primary` text.
*   **Tertiary:** No border, no fill. `primary` text with a subtle `secondary` (Gold) underline on hover.

### Input Fields
*   **Style:** Minimalist. Only a bottom border using `outline-variant`. On focus, the bottom border transitions to `primary`. Labels should use `label-md` with increased letter spacing.

### Cards & Lists
*   **Rule:** **No Divider Lines.** 
*   **Style:** Use `surface-container-lowest` for the card background. Separate list items using `16px` of vertical white space. If items must be grouped, use a subtle background shift instead of a line.

### Interactive Micro-components
*   **Chips:** 8px rounded. Background `surface-container-high`. No border.
*   **Checkboxes/Radio:** Use `primary` for active states. The "unselected" state should be a subtle `outline-variant` circle or square—never a heavy box.

### Contextual Component: The "Brew Card"
A specific layout for coffee selection: Large, high-resolution imagery with a `glassmorphism` overlay at the bottom for the name and price, using `notoSerif` for the title.

---

## 6. Do's and Don'ts

### Do
*   **Do** prioritize vertical whitespace. If a layout feels "full," it is likely over-designed.
*   **Do** use asymmetrical imagery. Align text to the left and allow the product image to bleed off the right edge.
*   **Do** use the `secondary` (Champagne Gold) only for the "final touch"—a price tag, a selection dot, or a signature icon.

### Don't
*   **Don't** use 100% black (#000000). Use `primary` (#341706) for all dark elements.
*   **Don't** use sharp 0px corners. Always use `lg` (8px) for a soft, approachable premium feel.
*   **Don't** use standard "Material Design" blue for links or errors. Use `error` (#ba1a1a) subtly for errors and `primary` for all links.
*   **Don't** use heavy "drop shadows." If the user can see the shadow's edge, it is too heavy.