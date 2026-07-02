---
name: Burdens SOF
description: Internal Shopify Order Fulfillment tool for warehouse and office staff
colors:
  primary: "oklch(0.478 0.136 252)"
  primary-deep: "oklch(0.380 0.130 252)"
  primary-wash: "oklch(0.930 0.035 252)"
  bg: "oklch(1.000 0.000 0)"
  surface: "oklch(0.972 0.006 252)"
  surface-hover: "oklch(0.952 0.012 252)"
  border: "oklch(0.860 0.008 252)"
  border-input: "oklch(0.620 0.018 252)"
  muted: "oklch(0.440 0.018 252)"
  ink: "oklch(0.165 0.020 252)"
  success: "oklch(0.450 0.150 152)"
  success-bg: "oklch(0.950 0.045 152)"
  failed: "oklch(0.460 0.180 22)"
  failed-bg: "oklch(0.955 0.045 22)"
  pending: "oklch(0.520 0.160 80)"
  pending-bg: "oklch(0.960 0.060 80)"
typography:
  headline:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.07em"
  mono:
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg}"
    rounded: "{rounded.md}"
    padding: "9px 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-deep}"
    textColor: "{colors.bg}"
    rounded: "{rounded.md}"
    padding: "9px 20px"
  button-ghost:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "9px 20px"
  button-ghost-hover:
    backgroundColor: "{colors.primary-wash}"
    textColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: "9px 20px"
  badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  badge-failed:
    backgroundColor: "{colors.failed-bg}"
    textColor: "{colors.failed}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  badge-pending:
    backgroundColor: "{colors.pending-bg}"
    textColor: "{colors.pending}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  input-default:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "9px 12px"
---

# Design System: Burdens SOF

## 1. Overview

**Creative North Star: "The Control Room"**

Burdens SOF is a logistics operations interface — the digital equivalent of a well-run dispatch floor. Everything is visible. Nothing requires interpretation. The interface has one job: put order status in front of the right person, immediately, with zero ambiguity. The design recedes so the data comes forward.

The system uses a single navigational anchor — Cobalt Ink — against a pure white ground. This is the color of precision instruments, of maritime charts, of something that works. There are no decorative layers. The hierarchy is enforced through weight, spacing, and the deliberate withholding of color until it means something: cobalt for actions, semantic green/red/amber for status, silence everywhere else.

The surface is information-dense but not cluttered. Rows breathe with consistent padding. The header is a control bar, not a billboard. Forms are austere and correct. The system should feel like it was engineered, not assembled — like it comes from a company that takes fulfilment seriously.

**Key Characteristics:**
- Pure white ground, cobalt-only primary — one decisive accent, no noise
- Status is always text-labeled; color reinforces, never substitutes
- Firm, announced interactive elements — buttons and links declare themselves
- Geist Sans at every scale; Geist Mono for order IDs, timestamps, and reference numbers
- Subtle ambient elevation — cards breathe without drama
- WCAG AA throughout — AA contrast for all text, 3:1 for all interactive borders and UI components

## 2. Colors: The Cobalt Navigation Palette

One saturated anchor, pure white ground, and semantic status colors. Restrained strategy: `primary` appears on ≤15% of any screen; most of the interface is white, surface, ink, and muted.

### Primary
- **Cobalt Ink** (`oklch(0.478 0.136 252)`): The brand's navigational anchor. Used on primary action buttons, focus rings, active link states, and the login CTA. Mid-luminance saturated fill — always pair with white text.
- **Deep Cobalt** (`oklch(0.380 0.130 252)`): Hover and active state for primary actions. Darker, more pressured — conveys directional response.
- **Cobalt Wash** (`oklch(0.930 0.035 252)`): Pale cobalt-tinted highlight. Used for selected row backgrounds, focus halos behind input rings, ghost button hover states. Never for text.

### Neutral
- **Background White** (`oklch(1.000 0.000 0)`): The page ground. Literal pure white — no warmth, no tint. The cobalt does the identity work; the background must not add to it.
- **Panel** (`oklch(0.972 0.006 252)`): Card and panel backgrounds, table header rows, sidebar fills. Barely perceptible cobalt tint — more shadow than hue. Enough to lift a card off the white ground.
- **Hover Canvas** (`oklch(0.952 0.012 252)`): Table row hover state. Slightly more cobalt than Panel — visible motion cue without visual alarm.
- **Frame** (`oklch(0.860 0.008 252)`): Table row dividers, card outlines, non-interactive separators. Decorative — does not need to meet 3:1 contrast.
- **Input Frame** (`oklch(0.620 0.018 252)`): All interactive borders — text inputs, select elements, search fields. Meets WCAG 1.4.11 (≥3:1 vs white background).
- **Signal Gray** (`oklch(0.440 0.018 252)`): Secondary text — column headers in label role, metadata, pagination counts, logout button. Meets WCAG AA (≥4.5:1 vs white). Do not go lighter for any text that users need to read.
- **Control Black** (`oklch(0.165 0.020 252)`): Primary text — order names, customer names, all body copy. Near-black with a whisper of cobalt. The dominant text color.

### Tertiary (Status Semantic)
- **Verified Green / Meadow** (`oklch(0.450 0.150 152)` on `oklch(0.950 0.045 152)`): "Success" fulfilled orders. Text on tinted background — contrast meets AA (≥4.5:1).
- **Alert Red / Ember** (`oklch(0.460 0.180 22)` on `oklch(0.955 0.045 22)`): "Failed" orders. Same pattern — dark text on pale tinted bg.
- **Amber Hold / Warm Haze** (`oklch(0.520 0.160 80)` on `oklch(0.960 0.060 80)`): "Pending" orders awaiting action.

### Named Rules
**The One Anchor Rule.** Cobalt Ink is the only saturated color on any non-status surface. If a new component is reaching for a second brand hue, stop. The discipline is the design.

**The Status Text Rule.** Every status badge must carry a text label alongside its color. Color blindness is real; "green" cannot be the only signal that an order fulfilled.

**The Muted Floor Rule.** `Signal Gray` (`oklch(0.440)`) is the lightest any secondary text may go. Anything lighter fails WCAG AA and reads as disabled.

## 3. Typography

**Primary Font:** Geist Sans (`var(--font-geist-sans)`, loaded via `next/font/google`)
**Mono Font:** Geist Mono (`var(--font-geist-mono)`, loaded via `next/font/google`)

**Character:** Geist Sans is a geometric-adjacent variable sans — precise, neutral, and comfortable at small sizes. It reads as technical without being cold, which suits a logistics tool used by warehouse and office staff alike. Geist Mono earns its place for reference numbers, order IDs, and timestamps — anywhere a fixed-width grid makes scanning faster.

The root `font-family` must be `var(--font-geist-sans), system-ui, sans-serif`. The existing globals.css sets `font-family: Arial` — override it.

### Hierarchy

- **Headline** (600 weight, 1.125rem / 18px, line-height 1.3, −0.01em tracking): Section page titles — "Orders (142)", "Users". Used once per page in the header bar.
- **Title** (600 weight, 0.9375rem / 15px, line-height 1.4): Sub-headings, modal titles, form section headings. Smaller than Headline; same weight.
- **Body** (400 weight, 0.875rem / 14px, line-height 1.5): Table cell text — customer names, store labels, all primary table data. The default text style for the interface.
- **Label** (500 weight, 0.6875rem / 11px, line-height 1.4, 0.07em tracking, UPPERCASE): Column headers, filter control labels. Uppercase is contextually appropriate here — it separates structural labels from data.
- **Mono** (Geist Mono, 400 weight, 0.8125rem / 13px): Order names/IDs, reference numbers, timestamps. Always monospaced; these values benefit from fixed-width alignment in table columns.

### Named Rules
**The Mono Discipline Rule.** Geist Mono appears only for reference numbers, order names, and timestamps — values where fixed-width glyph alignment aids scanning. Do not use it for labels, descriptions, or UI copy.

**The Size Floor Rule.** 11px (Label scale) is the minimum text size in the interface. No text smaller; warehouse staff may view this on low-resolution monitors under industrial lighting.

## 4. Elevation

This system uses **subtle ambient shadows** for structural separation, not decoration. Shadows appear only on persistent surfaces that hold content — cards, table containers, the login form — not on individual rows, badges, or inline elements.

Inputs and interactive elements do not have shadows at rest; their `border-input` provides the affordance. The focus state adds an inset glow, not a shadow.

The header sits above the page content — a thin border + micro-shadow separates it without drama.

### Shadow Vocabulary
- **`shadow-card`** (`0 1px 2px oklch(0 0 0 / 0.06), 0 2px 8px oklch(0 0 0 / 0.04)`): Default container shadow. Applied to the orders table wrapper, the login card, user management panels. Very diffuse; provides depth without announcing itself.
- **`shadow-raised`** (`0 4px 16px oklch(0 0 0 / 0.10), 0 1px 4px oklch(0 0 0 / 0.06)`): Elevated elements — dropdown menus, popovers, any layer that floats above the main content.

### Named Rules
**The Flat-by-Default Rule.** Every surface starts flat. A shadow is added only when the surface permanently holds scrollable or interactive content. A row, a badge, a pagination link: no shadow. A card, a modal, a sticky header: yes.

**The Shadow-Over-Both Rule.** Never apply both a shadow and a non-decorative border to the same container. Cards use `shadow-card` with `border: 1px solid {border}` — the border catches the eye; the shadow provides depth. On modal overlays, use shadow only (the overlay implies separation).

## 5. Components

### Buttons

Firm and direct — solid fills, clear affordance, no mystery. Primary buttons use the full Cobalt Ink fill with white text. Ghost buttons use a bordered variant, not text-only. Text-only actions (Sign out, navigation links) are explicitly for low-weight utility contexts.

- **Shape:** Gently curved (8px radius, `{rounded.md}`)
- **Primary:** Cobalt Ink fill (`{colors.primary}`), Background White text, 9px 20px padding. White text is mandatory on this mid-luminance saturated fill — dark text produces muddy contrast.
- **Hover:** Deep Cobalt (`{colors.primary-deep}`). `transition: background-color 150ms ease-out`.
- **Focus-visible:** 2px cobalt outline, 2px offset. Keyboard navigability is required.
- **Disabled:** 50% opacity, `cursor: not-allowed`. Never hide disabled states.
- **Ghost:** White background, Input Frame border (1.5px, `{colors.border-input}`), Cobalt Ink text. Hover: Cobalt Wash background + Cobalt Ink border.
- **Text/utility:** `color: {colors.muted}`, no border, no background. Hover: `color: {colors.ink}`. Reserved for Sign out and inline navigation links.

### Status Badges

The most read component in the interface. Clear, legible, impossible to confuse.

- **Style:** Pill shape (`{rounded.full}`), 3px 10px padding, Label typography (11px, 500 weight, uppercase tracking)
- **Success:** Meadow background (`{colors.success-bg}`), Verified Green text (`{colors.success}`)
- **Failed:** Ember background (`{colors.failed-bg}`), Alert Red text (`{colors.failed}`)
- **Pending:** Warm Haze background (`{colors.pending-bg}`), Amber Hold text (`{colors.pending}`)
- **Text label always present.** Never use color alone.

### Data Table

The primary surface of the application. Built for scanning, not reading.

- **Container:** White background, `shadow-card`, 8px radius (`{rounded.md}`), `overflow: hidden`
- **Header row:** Panel background (`{colors.surface}`), Label typography, Signal Gray text, 1px Frame border-bottom
- **Data rows:** White at rest, Hover Canvas on hover (100ms ease-out), 1px Frame border-bottom between rows
- **Cell padding:** 12px vertical, 16px horizontal — generous enough to breathe; tight enough to show 50 rows without paging
- **Order names/IDs:** Mono typography — always. They scan differently from prose text.
- **Empty state:** Centered, Signal Gray text, 8 lines of vertical padding — `"No orders found"`

### Inputs / Filter Fields

Clean stroke inputs. The border is the affordance.

- **Style:** White background, Input Frame border (1.5px solid, `{colors.border-input}`), 8px radius, Body typography, 9px 12px padding
- **Placeholder:** `oklch(0.600 0.012 252)` — slightly lighter than Signal Gray, clearly distinguished from filled values. Must meet 4.5:1 vs bg.
- **Focus:** Input Frame border shifts to Cobalt Ink; 3px Cobalt Wash inset box-shadow (`box-shadow: 0 0 0 3px {colors.primary-wash}`). No outline; the ring is the focus indicator.
- **Error:** Alert Red border (`{colors.failed}`); Alert Red helper text at Label scale below the field.
- **Disabled:** 60% opacity on the field; `cursor: not-allowed`.

### Header / Navigation Bar

Fixed to the top; the control bar of the interface.

- **Background:** Background White, 1px Frame bottom border, `0 1px 2px oklch(0 0 0 / 0.04)` micro-shadow
- **Height:** 56px
- **Left zone:** Page title (Title typography, Control Black) + sibling page links (Body typography, Signal Gray → Control Black on hover)
- **Right zone:** Sign out (Body typography, Signal Gray → Control Black on hover). No icon needed; the text is sufficient.
- **No logo lockup needed** for an internal tool at this stage. The page title and product name in the browser tab serve this purpose.

### Login Card

The single entry point.

- **Container:** White background, 24px 32px padding, 12px radius (`{rounded.lg}`), `shadow-card`, max-width 400px, centered in page
- **Page background:** Panel (`{colors.surface}`) — slightly differentiated from the card white, making the card float without needing a heavy shadow
- **Heading:** "Burdens SOF" in Headline typography
- **Form spacing:** 20px between fields, 24px between last field and the submit button
- **Error state:** Alert Red text below the password field, Body typography

## 6. Do's and Don'ts

### Do:
- **Do** use Cobalt Ink (`oklch(0.478 0.136 252)`) as the primary action color, and only that. One anchor; one decision per screen.
- **Do** always pair status badges with a text label — "Success", "Failed", "Pending" — never rely on color alone.
- **Do** use Geist Mono for order names, order IDs, reference numbers, and timestamps. Fixed-width alignment makes table scanning measurably faster.
- **Do** keep table cell padding at 12px vertical / 16px horizontal minimum. Cramped rows sacrifice legibility for density; that's the wrong trade for a scan-and-act interface.
- **Do** meet WCAG AA — ≥4.5:1 for all body and label text, ≥3:1 for interactive borders (inputs, buttons, focus indicators), ≥3:1 for non-text UI components. Signal Gray (`oklch(0.440)`) is the lightest permissible secondary text.
- **Do** use `shadow-card` for containers and `shadow-raised` for floating elements. Apply once, to the right layer, at the right scale.
- **Do** set `font-family: var(--font-geist-sans), system-ui, sans-serif` on `:root` in `globals.css`. The existing `Arial` fallback must go.
- **Do** set `text-wrap: balance` on `h1`–`h3` headings; these are short titles and benefit from even line breaks.
- **Do** include `@media (prefers-reduced-motion: reduce)` alternatives for any transitions added in the future — remove or instant-switch them, never remove their visibility.

### Don't:
- **Don't** use cream, warm-neutral, or sand-beige page backgrounds. The background is pure white (`oklch(1.000 0.000 0)`). The cobalt does the brand work; the surface must not add warmth noise.
- **Don't** add gradient text (`background-clip: text`). Prohibited in this system — meaningless decoration, illegible at small sizes.
- **Don't** add glassmorphism or backdrop-filter blur as decoration. Purposeless here; it adds rendering cost and reduces contrast on status-critical UI.
- **Don't** add a second brand color "for variety". The discipline of a single cobalt anchor is the point. If something feels flat, solve it with spacing or weight, not another hue.
- **Don't** use the side-stripe pattern — `border-left` larger than 1px as a colored accent on cards or callouts. Use a tinted background instead.
- **Don't** add numbered section markers (01 / 02 / 03) to navigation or page sections. This is an ops tool, not a marketing site.
- **Don't** add uppercase eyebrow kickers above every heading. Labels above column headers are correct; kickers above page sections are pattern filler.
- **Don't** use Light Gray as body text color for "elegance". Any text smaller than Headline that users need to read must be Control Black or Signal Gray. Lighter is invisible, not refined.
- **Don't** build identical icon-grid cards as the primary content pattern. This is a table interface; ordered rows beat card grids for dense data.
- **Don't** stack shadows — adding both `shadow-card` and `shadow-raised` to the same element causes visual confusion. One element, one shadow level.
