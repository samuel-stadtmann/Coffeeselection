# Design System Specification: High-End Editorial Coffee Experience

## 1. Overview & Creative North Star
**Creative North Star: "The Sensory Sommelier"**

This design system is engineered to elevate coffee from a commodity to a curated experience. Moving beyond standard e-commerce layouts, we embrace an **Editorial Luxury** aesthetic. The goal is to evoke the tactile quality of a Swiss boutique: high-contrast typography, expansive whitespace, and intentional asymmetry. We break the "template" look by layering elements like fine paper, using soft tonal shifts instead of rigid lines, and allowing imagery to breathe. Every interaction should feel deliberate, quiet, and premium.

---

## 2. Colors
Our palette is rooted in the organic warmth of coffee production, utilizing a "Tonal Layering" approach to define structure.

### Palette Strategy
- **Primary (`#4D2C19`):** Deep, roasted espresso. Used for high-authority elements and primary actions.
- **Background (`#fdf9f4`):** A warm, milky cream. This is our "canvas" and provides a soft, high-trust foundation.
- **Accent Gold (`#D4A017`):** To be used sparingly for "Moments of Delight"—badges, special micro-interactions, or luxury callouts.
- **Secondary (`#665d4b`):** Earthy taupe for supporting UI elements and less emphasized text.

### Implementation Rules
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. Structural boundaries must be achieved through background shifts (e.g., a `surface-container-low` section sitting on a `surface` background).
*   **Surface Hierarchy:** Treat the UI as physical layers of paper.
    *   **Base:** `surface` (#fdf9f4)
    *   **Nested Containers:** Use `surface-container-low` or `high` to create depth. A card should feel like a thicker piece of cardstock resting on a table, not a box drawn on a screen.
*   **Glassmorphism:** For floating headers or overlay menus, use `surface` with 80% opacity and a `20px` backdrop-blur. This softens the edges of the digital interface.
*   **Signature Textures:** Use a subtle linear gradient (Primary to Primary-Container) on main CTAs to add "soul" and depth, avoiding the flat, plastic look of standard buttons.

---

## 3. Typography
We use a high-contrast pairing of a geometric Sans and an elegant Serif to mirror the precision of Swiss engineering and the warmth of artisanal coffee.

| Level | Font Family | Size | Character | Use Case |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | Montserrat | 3.5rem | Bold, Geometric | Hero headlines, large editorial statements. |
| **Headline** | Montserrat | 1.5rem - 2rem | Medium | Section headers, product names. |
| **Title** | Merriweather | 1rem - 1.375rem | Serif, Warm | Sub-headings, storytelling pull-quotes. |
| **Body** | Merriweather | 0.875rem - 1rem | Serif, Elegant | Long-form descriptions, tasting notes. |
| **Label** | Montserrat | 0.6875rem | All Caps, Tracked | Navigation, small UI buttons, metadata. |

**Editorial Note:** Use wide letter-spacing (tracking) for Montserrat labels to increase the "luxury boutique" feel.

---

## 4. Elevation & Depth
In this system, depth is felt rather than seen. We move away from traditional drop shadows in favor of **Ambient Light**.

*   **Tonal Layering:** Avoid shadows for static components. Elevate a card by moving from `surface-container` to `surface-container-lowest` (white).
*   **Ambient Shadows:** For interactive floating elements (modals, dropdowns), use extra-diffused shadows: `box-shadow: 0 10px 40px rgba(77, 44, 25, 0.06);`. Note the shadow color is a tint of our **Dunkelbraun**, not grey.
*   **The "Ghost Border":** If a border is required for clarity (e.g., input fields), use `outline-variant` at 20% opacity. 100% opaque borders are too "loud" for this brand.
*   **Roundedness Scale:**
    *   **Default:** `0.75rem (12px)` for cards and main containers to maintain a soft, approachable luxury.
    *   **Full:** `9999px` for chips and pill-shaped buttons.

---

## 5. Components

### Buttons (The "Precision" Series)
*   **Primary:** Solid `primary` (#4D2C19) with `on-primary` (white) text. 12px rounded corners. Transition to `primary-container` on hover.
*   **Secondary:** `secondary-container` (#ebdec6) background with `on-secondary-container` text. This feels softer and less urgent.
*   **Tertiary:** Text-only in `primary` with a 1px `gold` underline that expands on hover.

### Cards & Collections
*   **Rule:** Forbid the use of divider lines. Separate product listings using `32px` or `48px` of vertical whitespace. 
*   **Imagery:** Use "Bleed" layouts where images touch the top and sides of the card, utilizing the `12px` corner radius.

### Input Fields
*   Background should be `surface-container-lowest` (#ffffff).
*   Label: Montserrat Label-MD, top-aligned, 20% opacity `on-surface`.
*   Focus state: A subtle shift to a `gold` ghost border.

### Signature Component: "The Tasting Note Chip"
*   Small, pill-shaped chips using `surface-variant` backgrounds and `tertiary` text. These should be used for flavor profiles (e.g., "Notes of Chocolate," "Swiss Roasted").

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical layouts (e.g., a text block offset against a large vertical image).
*   **Do** prioritize high-quality, warm-toned photography of coffee beans and Swiss landscapes.
*   **Do** allow for "dead space." Luxury is defined by what you choose not to show.
*   **Do** use the logo sparingly, ensuring it has a wide "clear zone" to maintain its premium status.

### Don't
*   **Don't** use pure black for text; use `Tiefschwarz` (#000000) only for headlines. Use `on-surface-variant` for long body text to reduce eye strain.
*   **Don't** use sharp 90-degree corners. Everything must feel "honed" and smooth.
*   **Don't** use standard "Material Design" blue for links or errors. Use our `error` (#ba1a1a) or `gold` accents.
*   **Don't** use horizontal dividers. Let the background color shifts do the work.