# Cairn Brand Identity & Design System

> Source of truth for Cairn's brand and UI. Synthesized by the Brand & Design Syndicate (Brand Strategist · Lead UI/UX Designer · Lead Front-End Developer) from the research in [`docs/research`](./research) — the App Concept, the Problem-Aware avatar (Daniel Okafor), the persona diary, and the competitive teardown — and reconciled with the brand already shipped in the codebase (`tailwind.config.js`, `src/index.css`, `Logo.tsx`, `ProviderBadge.tsx`).

---

## Brand Identity

*(Led by the Brand Strategist)*

### Brand Essence

Cairn is the **system of record for AI projects** — a calm, legible place where scattered, multi-model work assembles itself into one trustworthy plan, from portfolio down to task. The name is the metaphor: a cairn is a stack of balanced stones that marks the trail so the next traveler knows they are still on the path. Distilled from the Project Overview, Value Proposition, and the avatar's deepest want ("calm competence"), the brand stands on seven core attributes:

1. **Clarity** — one source of truth; the picture lives outside your head, not inside it.
2. **Calm** — the antidote to 2:47 a.m. overwhelm; restraint over noise.
3. **Trustworthy** — it shows ground truth, never the "Notion graveyard in a nicer font."
4. **Legible** — enforced hierarchy (portfolio → project → story → task) you can read at a glance.
5. **Attributed** — every artifact is traceable to the model or human that produced it.
6. **Leverage** — small inputs, outsized output; the system holds the load, not your stamina.
7. **Provider-agnostic** — built for the messy, multi-model reality of AI work, beholden to no ecosystem.

### Brand Voice

- **Tone**: Confident, grounded, and quietly reassuring. Peer-to-peer, never managerial. We speak like a respected senior engineer who has solved this pain, not like a vendor selling "AI-powered" wallpaper. We earn trust by *showing*, not claiming.
- **Language**: Plain, technically literate, and honest. We use the audience's own vocabulary — "source of truth," "context-switching," "who owns this?," "where does this live?," "ground truth," "good enough to ship," "this doesn't scale." We strip hype and vanity adjectives. If a sentence could appear on a status deck, we rewrite it.
- **Communication Style**: Problem-first and evidence-led. Name the pain precisely (the avatar is Problem Aware, not yet Solution Aware), then demonstrate the relief. Benefits over features; receipts over promises. Respect the reader's skepticism — assume they are arms-crossed, drafting the tweet about why it won't work, and disarm them with specifics.

### Brand Narrative

Daniel ships AI for a living, and he's drowning in his own success. Three experiments are in flight, the truth is smeared across Slack threads, ChatGPT tabs, a stale Jira board, and the inside of his skull — and he lies awake certain that something important is slipping, the way the last project quietly died. His tools were built for tidy sprints; AI work *sprawls*. So he becomes the human source of truth, the bottleneck and the backup plan, and it is costing him his nights, his calm, and his belief that he's a leader and not just a builder.

Cairn is the system built for the way AI work actually moves. Dump the chaos in — the real version, not the deck version — and Cairn assembles it: portfolio at the top, projects beneath, stories and tasks under those, the hierarchy he'd been holding by hand suddenly outside his head and legible on a screen. Next to every finished story sits the receipt — Copilot opened that PR, that spec came from ChatGPT, Gemini ran that research, Claude drafted that doc — attributed, current, and provider-agnostic. The source of truth finally lives outside his skull. He stops reconciling and starts leading; he gets his mornings, and his trail Saturdays, back. Cairn is for the technical leaders and founders shipping AI products who want calm competence: high output, present at home, because the system holds it — not their stamina.

---

## Design System

*(Led by the Lead UI/UX Designer and Lead Front-End Developer)*

### Color Palette

#### Primary Colors

**Gradient Base.** Cairn's signature gradient tells the brand's central story in color: *many AI providers converging into one calm signal.* It sweeps across the four provider-attribution hues already used in-product and resolves into the brand's **signal teal** — chaos becoming clarity, the source of truth at the end of the path. This is the brand's identity gradient (used for hero text, the logo mark, and key accents):

```css
linear-gradient(
  120deg,
  #f97316 0%,    /* Claude  — provider */
  #0ea5e9 26%,   /* Gemini  — provider */
  #8b5cf6 50%,   /* Copilot — provider */
  #10b981 74%,   /* ChatGPT — provider */
  #14b8a6 100%   /* Signal  — Cairn's one source of truth */
);
```

> The restrained in-product gradient (hero background + wordmark) is the teal-only resolution of this base — `linear-gradient(90deg, #14b8a6 0%, #5be4d2 100%)` — used where the full spectrum would be too loud.

**Primary Colors (extracted from the gradient).** The first four are Cairn's permanent **AI-attribution spectrum** (each provider owns a fixed hue across the entire product — see `ProviderBadge.tsx`); the last two are the **signal teal** the brand resolves to.

| Color | Hex | Name | Attribute |
|---|---|---|---|
| 🟠 | `#f97316` | Claude Orange | Craft |
| 🔵 | `#0ea5e9` | Gemini Sky | Insight |
| 🟣 | `#8b5cf6` | Copilot Violet | Velocity |
| 🟢 | `#10b981` | ChatGPT Emerald | Generation |
| 🩵 | `#14b8a6` | Signal Teal (500) | Trust |
| 💧 | `#5be4d2` | Signal Teal (300) | Clarity |

Full **Signal** ramp (the brand accent, from `tailwind.config.js`):

| Step | 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|---|
| Hex | `#effdfa` | `#c9fbf1` | `#96f3e3` | `#5be4d2` | `#2dccbd` | `#14b8a6` | `#0d9488` | `#107569` | `#115e55` | `#134e48` |

#### Secondary Colors

Stone-trail neutrals for structure and text. **Ink** is the brand dark base; the slate ramp carries text and surfaces in both modes.

| Role | Name | Hex |
|---|---|---|
| Primary text (dark) | Ink | `#0b1220` |
| Primary text (light mode) | Slate 900 | `#0f172a` |
| Secondary text | Slate 600 / Medium Gray | `#475569` |
| Muted text | Slate 400 | `#94a3b8` |
| Background (light) | Light Gray | `#f8fafc` |
| Borders / hairlines | Slate 200 | `#e2e8f0` |
| White | White | `#ffffff` |
| Black | Black | `#000000` |

#### Functional Colors

| Role | Hex | Usage |
|---|---|---|
| Success | `#16a34a` | Completed work, healthy project status, "shipped" |
| Warning | `#f59e0b` | Aging items, at-risk schedule, refinement needed |
| Error | `#dc2626` | Blockers, overdue, failed runs, hard validation errors |
| Info | `#0ea5e9` | Neutral notices, AI suggestions, tips (shares Gemini Sky) |

### Typography

#### Font Family

- **Primary Font — `Inter`** (already in use; `@fontsource/inter`). Inter is a highly legible, neutral sans-serif engineered for UI at small sizes — exactly right for a data-dense, text-first product the avatar will scan at a glance. It signals competence without flash, matching a craft-driven engineering audience that distrusts decoration.
- **Display Font — `Sora`** (already in use; `@fontsource/sora`). Cairn uses Sora — a modern geometric sans — for headlines and the wordmark, *not* a serif. Rationale: the audience is technical builders, and the brand essence is "calm, legible, systematic." A geometric display face reads as engineered and contemporary, where a high-contrast serif (e.g. DM Serif Display) would read as editorial/luxury and fight the product's identity. Sora gives headlines distinct character while staying in the sans family, preserving cohesion with Inter.

> Deviation from the generic template (which suggests a serif secondary) is deliberate and brand-correct. Both faces are self-hosted via Fontsource for performance and privacy.

#### Font Sizes

A modular type scale (1.250 / major-third ratio above body). Root = 16px.

| Token | rem | px | line-height | Typical use |
|---|---|---|---|---|
| **Display** | 4.5rem | 72px | 1.05 | Marketing hero only |
| **H1** | 3rem | 48px | 1.08 | Page title / hero headline |
| **H2** | 2.25rem | 36px | 1.15 | Section heading |
| **H3** | 1.75rem | 28px | 1.25 | Subsection heading |
| **H4** | 1.375rem | 22px | 1.30 | Card / panel title |
| **H5** | 1.125rem | 18px | 1.40 | Group label |
| **H6** | 1rem | 16px | 1.45 | Small heading / overline target |
| **Body (Regular)** | 1rem | 16px | 1.60 | Default paragraph & UI text |
| **Body (Small)** | 0.875rem | 14px | 1.55 | Secondary text, table cells, metadata |
| **Body (XSmall)** | 0.75rem | 12px | 1.50 | Dense labels, badge text, timestamps |
| **Caption** | 0.6875rem | 11px | 1.45 | Provider badges, micro-labels (see `ProviderBadge`) |

#### Font Weights

| Weight | Value |
|---|---|
| Light | 300 |
| Regular | 400 |
| Medium | 500 |
| Semibold | 600 |
| Bold | 700 |

Display/headings use Sora **600–700**; body uses Inter **400–500**; emphasis and buttons use **600**.

### UI Components

#### 21st.dev Components

Categories adopted for the core application shell and marketing surfaces:

- **Navigation** — top nav bar, app header, breadcrumb hierarchy (portfolio › project › story › task), sidebar/tree nav.
- **Layout** — page shells, split panes, resizable panels, kanban grids, dashboard grids.
- **Forms** — capture inputs, inline editors, selects, comboboxes, command palette, date/owner pickers.
- **Feedback** — toasts, inline validation, empty states, skeletons, progress.
- **Data Display** — tables, cards, badges, avatars, stat tiles, charts/KPI surfaces.
- **Disclosure** — accordions, tabs, popovers, tooltips, slide-over drawers, modals.
- **Overlay** — dialogs (sign-in/sign-up), command menu, context menus.

#### MagicUI Components

At least five animated components to add polish where it reinforces meaning (not decoration):

1. **Animated Cards / Magic Card** — hover-elevated story & task cards on the kanban board.
2. **Bento Grid** — the features and dashboard-template showcase on the landing page.
3. **Number Ticker** — animated KPI counters (completion rate, open risks, velocity) on dashboards.
4. **Marquee / Logo cloud** — provider attribution strip (Copilot · ChatGPT · Gemini · Claude) in motion.
5. **Animated Beam** — visualizing scattered context "converging" into one source of truth (the core narrative visual; mirrors `ContextCollapseVisual`).
6. **Shimmer / Border Beam** — subtle highlight on the primary CTA and AI-generated items.

#### reactbits.dev Components

Categories used for textural, attention-directing moments:

- **Backgrounds** — subtle gradient/grid backdrops for hero and section dividers.
- **Text Animations** — split/reveal headline effects on scroll for landing copy.
- **Animations** — scroll-reveal wrappers (mirrors existing `Reveal.tsx`), fade-up, float.
- **Components** — animated tabs, accordions, and carousels for testimonials/social proof.
- **Buttons** — micro-interactive CTA and toggle treatments.

#### Custom Components

Built bespoke because they encode Cairn's defensible whitespace (per the competitive teardown — hierarchy + cross-provider attribution + ADO sync):

1. **Provider Attribution Badge & Ledger** — the work-item-level "who/what produced this" marker (Human/Claude/ChatGPT/Copilot/Gemini), each with its fixed hue, rolling up into an attribution summary (exists as `ProviderBadge` / `AttributionSummary`).
2. **Hierarchy Tree (Portfolio → Project → Story → Task)** — the enforced, draggable, collapsible structure that is the product's spine.
3. **AI Capture Bar** — the chat/dictation input that deconstructs unstructured conversation into structured work items (exists as `CaptureBar`).
4. **Dashboard Builder & Widget Library** — natural-language dashboard generation plus the prebuilt template widgets (Project Health, Risks, Backlog, Sprint, Executive Summary, etc.).

### Micro-Interactions

Subtle, purposeful motion (≈150–400ms; all respect reduced-motion):

1. **Button Hover** — background shifts `signal-600 → signal-500`, shadow lifts (`shadow-signal-600/20 → /30`); 150ms ease.
2. **Form Focus** — 2px `signal-400` focus ring with offset; gentle border-color transition.
3. **Loading States** — skeleton shimmer for tree/board; spinner only for blocking actions.
4. **Success Actions** — task → done: card check animates, brief success-green pulse, optimistic move across kanban column.
5. **Navigation / Hierarchy** — accordion expand/collapse with height ease; active route fades in.
6. **Scrolling** — fade-up reveal of sections on enter (`animation: fade-up 0.6s`), float on hero visual (`float 5s`).

### Responsive Design

*(Led by the Lead Front-End Developer)*

- **Mobile-First Approach** — base styles target the smallest viewport; enhancements layer up via Tailwind `min-width` breakpoints. Touch is the default input assumption.
- **Breakpoints** (standard Tailwind):

| Token | Min width |
|---|---|
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |
| `xl` | 1280px |
| `2xl` | 1536px |

  Content column capped at **1140px** (`max-w-container`).

- **Mobile Adaptations** — hamburger/drawer navigation; stacked single-column layouts (hero, features, pricing collapse from multi-column); kanban becomes a horizontally swipeable or stacked list; hierarchy tree becomes a drill-in view; larger (≥44px) touch targets; capture bar docks to the bottom.

### Accessibility

- **Color Contrast** — meet **WCAG 2.1 AA** (≥4.5:1 body text, ≥3:1 large text/UI); verify signal-on-white and text-on-ink pairings. Never use provider color as the *only* signal — always pair with the text label.
- **Keyboard Navigation** — full operability without a mouse; logical tab order; command palette and shortcuts for power users (the avatar lives on the keyboard).
- **Screen Reader Support** — semantic HTML, correct ARIA roles/labels on tree, kanban, dialogs, and badges (`title="Produced by: {provider}"` pattern already in use).
- **Visible Focus Indicators** — consistent `focus-visible` ring (`signal-400`, 2px, offset) on every interactive element.
- **Respect Reduced Motion** — gate all non-essential animation behind `prefers-reduced-motion: reduce`.

### Dark / Light Mode

Both modes are first-class. Implemented with Tailwind `darkMode: 'class'` (already configured) and managed via the existing `useTheme` hook, with **automatic system-preference detection** (`prefers-color-scheme`) on first load and a **user-selectable toggle** that persists. DaisyUI themes are the intended mechanism for extending and tokenizing additional named themes (e.g. an enterprise/high-contrast theme) on top of the class-based base. Light mode is built on white / Light Gray surfaces; dark mode on **Ink** (`#0b1220`) with slate text.

---

## Implementation Guidelines

*(Led by the Lead Front-End Developer)*

### CSS Framework

- **Tailwind CSS** (v3.4) — utility-first foundation; already in use.
- **DaisyUI** — semantic component classes and themeable dark/light (and future enterprise) modes.
- **Custom utilities** — project-specific `@layer components` (e.g. `.container-cairn`, `.btn-primary`, `.eyebrow`, `.surface-gradient`) defined in `src/index.css`.

### Animation Library

- **Framer Motion** (already a dependency) — for complex, stateful, and orchestrated animation (hero entrance, layout transitions, drag on kanban, animated beam/convergence).
- **Tailwind Animations** — for simple, declarative motion (`fade-up`, `float`, hover/transition utilities) defined in `tailwind.config.js`.

### Icon System

- **Heroicons** (`@heroicons/react`, already a dependency) — primary, comprehensive outline/solid set covering UI affordances.
- **Custom SVGs** — for the Cairn logo mark (stacked stones), provider glyphs, and product-specific iconography.

### Asset Management

| Asset type | Preferred format |
|---|---|
| Icons & logo | **SVG** (inline or `@heroicons/react`) |
| Photographic / raster images | **WebP** (with PNG fallback where needed) |
| Social / OG image | **PNG** (1200×630, generated via `scripts/generate-og.mjs`) |
| Video | **MP4 / WebM** |
| Fonts | Self-hosted **WOFF2** via Fontsource |

### Code Structure

- **Component-Based Architecture** — small, single-purpose React components; marketing (`src/components`) and app (`src/components/app`) cleanly separated; shared logic in `src/lib` and `src/hooks`.
- **Utility-First CSS** — Tailwind utilities in markup; promote recurring patterns to `@layer components`.
- **Responsive Variants** — design mobile-first, layer `sm:`/`md:`/`lg:` variants; co-locate dark-mode variants (`dark:`) with their base.
- **TypeScript throughout** — typed domain model (`src/lib/types.ts`) for Portfolio/Project/Story/Task/Provider.

---

## Design Tokens

```json
{
  "colors": {
    "primary": {
      "signal-50": "#effdfa",
      "signal-100": "#c9fbf1",
      "signal-200": "#96f3e3",
      "signal-300": "#5be4d2",
      "signal-400": "#2dccbd",
      "signal-500": "#14b8a6",
      "signal-600": "#0d9488",
      "signal-700": "#107569",
      "signal-800": "#115e55",
      "signal-900": "#134e48",
      "attribution-claude": "#f97316",
      "attribution-gemini": "#0ea5e9",
      "attribution-copilot": "#8b5cf6",
      "attribution-chatgpt": "#10b981",
      "attribution-human": "#64748b"
    },
    "neutral": {
      "ink": "#0b1220",
      "slate-900": "#0f172a",
      "slate-600": "#475569",
      "slate-400": "#94a3b8",
      "slate-200": "#e2e8f0",
      "light-gray": "#f8fafc",
      "white": "#ffffff",
      "black": "#000000"
    },
    "functional": {
      "success": "#16a34a",
      "warning": "#f59e0b",
      "error": "#dc2626",
      "info": "#0ea5e9"
    }
  },
  "typography": {
    "fontFamily": {
      "primary": "Inter, sans-serif",
      "secondary": "Sora, sans-serif"
    }
  },
  "spacing": {
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem",
    "2xl": "3rem",
    "3xl": "4rem"
  },
  "borderRadius": {
    "sm": "0.125rem",
    "md": "0.25rem",
    "lg": "0.5rem",
    "xl": "1rem",
    "full": "9999px"
  }
}
```
