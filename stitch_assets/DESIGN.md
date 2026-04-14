# Design System Specification: The Executive Workspace

## 1. Overview & Creative North Star
This design system is built upon the Creative North Star of **"The Digital Curator."** In a high-density HR environment, the interface must act as a sophisticated editor, organizing complex data into an effortless, editorial-grade experience. 

We move beyond the "generic SaaS dashboard" by rejecting rigid, boxy constraints. Instead, we utilize **Tonal Layering** and **Intentional Asymmetry** to guide the eye. While the layout maintains the professional rigor required for hiring tools, it breathes through high-contrast typography scales and "paper-on-glass" depth. The goal is to make the user feel like they are interacting with a premium physical workspace—tactile, organized, and authoritative.

---

## 2. Colors
The palette is rooted in a professional hierarchy. We use a sophisticated foundation of `surface` and `surface-container` tiers to define logic, rather than relying on structural lines.

*   **Primary (`#0053db`):** A commanding Slate Blue used for key actions and brand presence.
*   **Neutral Foundation:** `background` (#f7f9fb) provides a soft, low-strain canvas.
*   **Status Indicators:**
    *   **Active:** `tertiary` (#006d4a) - A deep, professional green.
    *   **Pending:** `secondary` (#506076) - A muted, thoughtful slate.
    *   **Waitlisted:** `outline` (#717c82) - A sophisticated neutral gray.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off areas. Boundaries must be defined solely through background shifts. For example, a `surface-container-low` side panel sitting on a `surface` background creates a natural boundary without the visual "noise" of a line.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers:
*   **Layer 1 (The Desk):** `surface` or `background`
*   **Layer 2 (The Folder):** `surface-container-low` for large logical groupings.
*   **Layer 3 (The Card):** `surface-container-lowest` (#ffffff) for individual data entries.

### Signature Textures
Main CTAs should utilize a subtle linear gradient from `primary` to `primary_dim` to provide visual "soul" and depth. For floating navigation or "quick-view" modals, use a backdrop-blur (12px–20px) combined with 80% opacity `surface_container_lowest` to create a premium glass effect.

---

## 3. Typography
We utilize a dual-font strategy to balance character with utility.

*   **Display & Headlines (Manrope):** Chosen for its modern, geometric structure. Use `headline-lg` (2rem) and `headline-sm` (1.5rem) to create clear editorial entry points. The slightly wider tracking of Manrope gives the HR tool an "executive" feel.
*   **Body & Labels (Inter):** The workhorse. Inter’s high x-height ensures readability in high-density tables and candidate lists.
*   **The Hierarchy Rule:** Use `label-sm` (#6875rem) in `on-surface-variant` for metadata. The contrast between a `title-lg` candidate name and a `label-sm` timestamp creates an immediate information hierarchy.

---

## 4. Elevation & Depth
Depth is achieved through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** To lift a card, place a `surface-container-lowest` card on a `surface-container-low` background. The natural delta in hex values creates a "soft lift."
*   **Ambient Shadows:** Where floating elements are required (e.g., a dropdown or a primary action button), use an extra-diffused shadow: `box-shadow: 0 12px 32px rgba(42, 52, 57, 0.06);`. The shadow color is a tinted version of `on-surface`, never pure black.
*   **The "Ghost Border" Fallback:** For accessibility in input fields, use the `outline-variant` token at **20% opacity**. This provides a "hint" of a container without breaking the editorial flow.
*   **Glassmorphism:** Navigation sidebars should feel lightweight. Use a semi-transparent `surface` with a `backdrop-filter: blur(10px)` to allow the soft background tones to bleed through.

---

## 5. Components

### Buttons
*   **Primary:** `primary` background, `on-primary` text. `sm` roundedness (0.125rem) for a sharp, professional look.
*   **Tertiary:** No background or border. Use `primary` text. These must align perfectly with text grids to maintain the "No-Line" rule.

### Input Fields
*   **Style:** `surface-container-lowest` background with a 1px "Ghost Border."
*   **States:** On focus, transition the border to `primary` with a 2px outer "glow" using 10% opacity of the `primary` color.

### Cards & Lists
*   **The Divider Ban:** Strictly forbid 1px horizontal dividers between list items. Use **Vertical White Space** (from the 8px spacing scale) or a subtle shift to `surface-container-high` on hover to separate items.
*   **Candidate Cards:** Use `surface-container-lowest` with `xl` (0.75rem) corner radius. Elements inside the card should use `none` or `sm` radius to create a "nested" visual interest.

### Status Chips
*   **Active/Green:** `tertiary-container` background with `on-tertiary-container` text.
*   **Waitlisted/Gray:** `surface-container-highest` background with `on-surface-variant` text.
*   **Shape:** Always use `full` (9999px) roundedness for chips to contrast against the architectural squareness of cards.

---

## 6. Do's and Don'ts

### Do
*   **Do** use asymmetrical padding in headers to create an editorial feel (e.g., more padding on the left than the right).
*   **Do** use `on-surface-variant` for secondary information to reduce visual clutter in high-density views.
*   **Do** prioritize "Breathing Room." Even in high-density layouts, ensure there is at least 24px of margin between major surface containers.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on-surface` (#2a3439) to maintain a soft, premium contrast.
*   **Don't** use "Default Blue" for links. Always use the specified `primary` Slate Blue.
*   **Don't** stack more than three levels of surface nesting. If you need a fourth level, use a "Ghost Border" instead of another color shift.
*   **Don't** use heavy shadows. If the shadow is clearly visible as a "dark smudge," it is too high in opacity. It should be felt, not seen.
