# Design System Document: Zimbabwe Football Travel Authority

## 1. Overview & Creative North Star: "The Diplomatic Pitch"
The design system for the Zimbabwe Football Travel Authority is governed by the Creative North Star: **The Diplomatic Pitch.**

This system rejects the "standard dashboard" aesthetic in favor of a high-end, editorial experience that balances the prestige of national representation with the high-performance requirements of international travel logistics. We move beyond generic UI by utilizing **intentional asymmetry** and **tonal depth**. Layouts should feel like a premium broadsheet or a luxury travel dossier - authoritative, spacious, and meticulously organized. We replace rigid grid lines with sophisticated "white space" and layered surfaces, ensuring the travel authorization process feels like an elite service rather than a bureaucratic hurdle.

---

## 2. Colors & Atmospheric Tones
The palette translates the Zimbabwe national colors into a "Deep Luxury" context. We avoid vibrant, primary-school hues in favor of rich, desaturated tones and "Inky" blacks.

### Core Palette Application
* **Primary (`#002b14`):** Our "Forest Pitch." Use this for deep backgrounds and high-authority headers.
* **Secondary (`#725c00`):** "Burnished Gold." Reserved for high-importance accents and achievement states.
* **Tertiary (`#510000`):** "Oxblood Red." Used sparingly for critical alerts or premium status indicators to maintain an authoritative tone.
* **Surface Hierarchy:** We utilize the `surface-container` tiers (`lowest` to `highest`) to build a sense of physical architecture.

### The "No-Line" Rule
Explicit Instruction: Do not use `1px solid` borders to define sections. Sectioning must be achieved through background shifts. For example, a `surface-container-low` profile section should sit directly on a `surface` background. The eye should perceive the boundary through the change in tone, not a line.

### The "Glass & Gradient" Rule
To elevate the "Digital-First" feel, use **Glassmorphism** for floating navigation bars or modal overlays.
* Implementation: Use `surface` color at 70% opacity with a `backdrop-blur` of 20px.
* Signature Textures: For Hero CTAs, apply a subtle linear gradient transitioning from `primary` (`#002b14`) to `primary_container` (`#004322`) at a 135-degree angle. This adds "soul" and depth that flat color lacks.

---

## 3. Typography: The Editorial Voice
We use a dual-typeface system to create an "Authority vs. Utility" contrast.

* **Display & Headlines (Manrope):** Chosen for its modern, geometric structure. Large scales (e.g., `display-lg` at 3.5rem) should be used with tight letter-spacing (-0.02em) to create a bold, editorial impact.
* **Body & Labels (Inter):** The workhorse for high-performance travel data. Inter provides maximum legibility for passport numbers, flight times, and authorization codes.

### Hierarchy Strategy
Use `headline-lg` for page titles to establish dominance. Pair it with `body-lg` for introductory text to maintain an inviting, breathable reading experience.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows are often "muddy." In this system, we achieve hierarchy through **Tonal Layering** and **Ambient Light.**

* The Layering Principle: Stacking tiers is mandatory. A `surface-container-lowest` card (Pure White) should be placed on a `surface-container-low` section to create a soft, natural "lift."
* Ambient Shadows: For floating elements (like the Sign-In modal), use a shadow with a 40px blur, 0% spread, and 6% opacity. The shadow color must be a tint of `on-surface` (`#191c1b`), never a neutral grey.
* The "Ghost Border" Fallback: If accessibility requires a container boundary, use the `outline-variant` token at 15% opacity. This creates a "whisper" of a line rather than a hard edge.

---

## 5. Components: High-Performance Primitives

### Premium Buttons (Sign In / Sign Up)
* The "Auth" Button Style: These are the most refined elements in the UI.
* Sign In (Secondary): Use `secondary_container` (`#fdd000`) with `on_secondary_container` (`#6e5900`) text. Apply a subtle inner-glow (1px white overlay at 10% opacity) on the top edge to give it a "minted" feel.
* Sign Up (Primary): Use the `primary` gradient.
* Rounding: Apply `md` (0.375rem) for a sleek, modern look.
* Interaction: On hover, the button should lift slightly (2px) using an ambient shadow rather than changing color dramatically.

### Input Fields & Travel Forms
* Style: No borders. Use `surface-container-highest` as the background.
* Focus State: Transition the background to `surface-container-lowest` and apply a 1px "Ghost Border" using the `primary` color at 30% opacity.
* Efficiency: Labels use `label-md` and should be placed above the field with `spacing-1.5` for maximum scanability during high-pressure travel moments.

### Cards & Lists (Travel Itineraries)
* Constraint: Strictly forbid divider lines.
* Separation: Use `spacing-4` (1rem) of vertical white space or shift the background color of alternating items to `surface-container-low`.
* Rounding: All cards must use `xl` (0.75rem) rounding to soften the "authoritative" tone and make the experience feel user-centric.

### Travel Status Chips
* Approved: `primary_fixed` background with `on_primary_fixed_variant` text.
* Pending: `secondary_fixed` background with `on_secondary_fixed_variant` text.
* Rounding: Always `full` (pill shape).

---

## 6. Do's and Don'ts

### Do
* Do use asymmetrical layouts. A left-aligned headline with a right-aligned "Glass" card creates a premium, custom feel.
* Do use the full range of the spacing scale. High-end design requires "breathing room." When in doubt, increase the margin.
* Do prioritize `Manrope` for any numeric data that needs to feel "important" (e.g., flight numbers).

### Don't
* Don't use 100% black (`#000000`). Always use `on_background` (`#191c1b`) to keep the UI feeling sophisticated.
* Don't use standard "Drop Shadows" from a software preset. Always craft "Ambient Shadows" with high blur and low opacity.
* Don't use icons as purely decorative elements. Every icon must serve a functional purpose in the travel authorization workflow.

