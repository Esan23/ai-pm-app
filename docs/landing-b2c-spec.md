# Cairn — B2C SaaS Landing Page: Requirements & Copy Specification

> A Windsurf-ready build spec for a **B2C-style homepage** for **Cairn — the AI-native project management app** (the system of record for AI projects: enforced Portfolio → Project → Story → Task hierarchy + provider-agnostic AI attribution across Copilot, ChatGPT, Gemini, and Claude).
>
> **Sources of truth:** the Problem-Aware avatar (Daniel Okafor), the persona diary (overwhelm → calm competence), and the Cairn [Brand Identity & Design System](./brand-design-system.md). Everything below is specific to Cairn — its product, audience, voice, and design tokens.
>
> **How to use:** paste this whole document into Windsurf/Cursor as the build brief. Each section gives **Purpose → Copy (verbatim) → Layout & Component Spec → Visual/Interaction → Accessibility**. Read the Global Build Spec first.

---

## Product Requirement: Cairn — B2C SaaS Landing Page (Homepage)

**Purpose:** Convert individual AI builders and small-team leads through an emotional, fast-hitting narrative. The visitor feels the 2:47 a.m. overwhelm of holding every AI project in their own head, then is shown the relief of calm, legible control — and nudged to start free in under two minutes. Tone is conversational, confident, and human; visuals carry Cairn's "scattered chaos → one source of truth" transformation.

**Target reader (from Cairn avatar research):** A technical builder shipping AI products solo or on a small team — uses Copilot, ChatGPT, Gemini, and Claude daily; drowning in scattered context across Slack, chat tabs, and a stale board; quietly afraid a project is silently drifting the way the last one died; wants *calm competence* — high output without the burnout tax. Their language: "source of truth," "where does this live?," "who owns this?," "this doesn't scale," "ground truth," "good enough to ship."

**Emotional arc to land (from the diary):** Before — *overwhelm, dread, frustration; "my head is a terrible database; it crashes at 2:47 a.m."* → After — *control, pride, relief; "I open one view and see the truth of every project in under a minute; the system holds it, not my stamina."*

**UI Components (page order):**
- Sticky Navigation Bar (persistent CTA)
- Hero Section (emotional headline, subtext, transformation visual, CTA)
- Value Proposition / Benefits Snapshot (5 benefit cards)
- Social Proof (ratings + emotional testimonials)
- Product Showcase (capture → hierarchy → attribution, video/GIF)
- Mid-page CTA band
- Urgency / Honest Offer strip
- FAQ (objection handling)
- Footer
- Sticky mobile CTA bar (persistent)

**Visual Style:** Light theme with dark mode (system-detected + toggle, persisted). Calm, uncluttered, generous whitespace. Stone-neutral base + a single calm **signal teal** accent. Brand metaphor = a cairn (stacked trail-marker stones marking the path).

---

## GLOBAL BUILD SPEC (read first — every section references this)

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS v3 (`darkMode: 'class'`), Framer Motion (scroll reveals), Heroicons. Self-hosted **Inter** + **Sora** via `@fontsource`. (Matches the existing Cairn repo so output is consistent with the live app.)

**Brand tokens (use exactly — from the Cairn design system):**

| Token | Value | Use |
|---|---|---|
| `signal` (accent) | 500 `#14b8a6` · 600 `#0d9488` · 300 `#5be4d2` | CTAs, highlights, links, focus ring |
| `ink` (dark bg) | `#0b1220` | dark-mode background |
| Text | slate-900 `#0f172a` / slate-600 `#475569` | headings / body |
| Light surfaces | white `#ffffff` / slate-50 `#f8fafc` | alternating section backgrounds |
| Attribution (fixed per provider) | Claude `#f97316` · ChatGPT `#10b981` · Copilot `#8b5cf6` · Gemini `#0ea5e9` | provider badges only |
| Functional | success `#16a34a` · warning `#f59e0b` · error `#dc2626` | status indicators |

**Typography:** Display/headings = **Sora** (600–700); body/UI = **Inter** (400–500). Scale: `display` 4.5rem/1.05 (hero only), `h1` 3rem/1.08, `h2` 2.25rem/1.15, `h3` 1.75rem/1.25, `h4` 1.375rem/1.30, `h5` 1.125rem/1.40, body 1rem/1.6, small 0.875rem/1.5.

**Spacing & radius:** 8px base scale; section padding `py-16 sm:py-20 lg:py-28`; cards `rounded-2xl`; buttons `rounded-xl`.

**Shared components to build/reuse:**
- `Button` — primary: `bg-signal-600` white text, hover `bg-signal-500`, ≥48px touch target, `rounded-xl`; secondary: ghost/outline (`border-slate-300`, transparent bg).
- `Card` — `rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]`; optional `card-hover` (`-translate-y-1` + larger shadow).
- `Reveal` — Framer Motion fade-up on scroll into view (opacity 0→1, y 18→0, 0.5s ease, `viewport={{ once: true, margin: '-80px' }}`), accepts `delay`.
- `Container` — max-width 1140px, `mx-auto px-5 sm:px-8`.

**Voice rules:** Plain, peer-to-peer, no hype words ("revolutionary," "supercharge," "10x"). Emotional through *truth*, not exclamation. Second person ("you," "your projects"). Short sentences. Never claim AI providers endorse Cairn.

**Motion:** 150ms micro-interactions / 300ms standard transitions; honor `prefers-reduced-motion` (snap, no animation).

**Accessibility:** WCAG 2.1 AA contrast (≥4.5:1 body, ≥3:1 large), semantic landmarks, visible `focus-visible` ring (`signal-400`, 2px, offset), full keyboard navigation, alt text / `aria-hidden` on imagery as appropriate.

**Honesty constraint:** All testimonials, ratings, and compliance lines are **illustrative / roadmap** and must stay labeled as such. Cairn is a concept project (course ISM6427c) — do not claim real customers or achieved certifications. Keep the footer disclaimer.

---

## 1. Navigation Bar

**Purpose:** Stay out of the way but keep "Start free" one click from anywhere.

**Copy:**
- Logo: **Cairn** (stacked-stones mark)
- Links: `How it works` · `Features` · `Pricing` · `FAQ`
- Persistent CTA button: **Start free**
- Secondary text link: **Sign in**

**Layout & Component Spec:**
- Component `Navbar`. `sticky top-0 z-50`. Height 60px mobile / 72px desktop. Content in `Container`.
- Transparent over hero; on `window.scrollY > 8` add `bg-white/80 dark:bg-ink/80 backdrop-blur` + bottom border (state `scrolled`).
- Desktop: logo left; links right; then theme toggle + **Sign in** + **Start free**.
- Mobile (<1024px): logo + hamburger → slide-down drawer with links + full-width **Start free**.
- Theme toggle: sun/moon button → `useTheme()`.

**Visual/Interaction:** CTA = primary button. Links `text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300`. Smooth-scroll to anchors.

**Accessibility:** `aria-expanded` on hamburger; drawer keyboard-closable; `aria-label` on icon buttons.

---

## 2. Hero Section

**Purpose:** In one breath, name the visitor's private pain and the calm on the other side — personal, aspirational, instantly relatable to a Cairn builder.

**Copy (primary):**
- Eyebrow pill: `✦ For everyone building with AI`
- **Headline (H1):** **Your AI projects, finally in one place you can trust.**
- **Subheadline:** *Stop holding the whole thing in your head. Cairn turns the chaos across Copilot, ChatGPT, Gemini, and Claude into one clear plan — portfolio to task — so you stop rebuilding the picture every morning and start shipping calm.*
- Primary CTA: **Start free — today**
- Secondary CTA (ghost): **Watch the 2-min demo**
- Microcopy under CTAs: *Free for solo builders · No credit card · Set up in minutes*

**A/B headline alternates (for testing):**
1. *Stop being the human source of truth.*
2. *See everything you're building with AI — calm, current, in one view.*
3. *Get your mornings back from chasing project status.*

**Layout & Component Spec:**
- Component `Hero`. Section `min-h-[90vh]`, `surface-gradient` background (subtle teal radial wash).
- Two-column on `lg` (`grid lg:grid-cols-[1.05fr_1fr]`), stacks to single column < 1024px (copy first).
- Left: eyebrow → H1 (`text-h2 sm:text-h1 lg:text-display`) with "one place you can trust" in a teal gradient text clip → subhead (`text-lg text-slate-600`) → CTA row → microcopy.
- Right: **transformation visual** — animated "scattered tool-chips (Slack thread, ChatGPT spec, Copilot PR, stale board) → tidy Portfolio→Project→Story→Task hierarchy card." Float two small metric-overlay cards ("calmer mornings" / "100% work attributed").
- Entrance: staggered Framer Motion fade-up (delays 0 / .05 / .12 / .18 / .28).

**Visual/Interaction:** Primary CTA opens signup (hash `#start` → modal) or routes to `/app`. Buttons ≥48px (`btn-lg`). Secondary scrolls to Product Showcase.

**Accessibility:** Exactly one H1. Decorative visual `aria-hidden`. Gradient text keeps AA contrast against its solid fallback.

---

## 3. Value Proposition / Benefits Snapshot

**Purpose:** Answer "what do I get?" in a 10-second scan. Each benefit = an emotional payoff tied to a real Cairn capability, not a feature dump.

**Copy:**
- Eyebrow: `Why builders switch`
- Heading (H2): **Less wrangling. More shipping.**
- Benefit cards (icon + bold + one line):
  1. 🌙 **Get your mornings back** — Cairn keeps every project current, so you stop reconciling status by hand at 2:47 a.m.
  2. 🧭 **Never lose the thread** — One legible view from portfolio to task. See drift *before* it quietly kills a project.
  3. 🏷️ **Know what your AI actually shipped** — Every task tagged with the tool that made it — Copilot, ChatGPT, Gemini, or Claude.
  4. 🎙️ **Brain-dump to plan in seconds** — Talk or paste the mess; Cairn turns it into stories and tasks instantly.
  5. 🌿 **Calm, not cluttered** — Built for the sprawling, multi-model way AI work *actually* moves.

**Layout & Component Spec:**
- Component `Benefits`. `Container`, alternating bg (`bg-slate-50 dark:bg-white/[0.02]`).
- Heading centered; cards in responsive grid: 1 col mobile → 2 col `sm` → 3 col `lg` (5 cards via `auto-fit minmax(240px,1fr)` or 3+2).
- Each `Card` with `card-hover`: icon chip (`h-12 w-12 rounded-xl bg-signal-500/10 text-signal-600`), title (`text-h5 font-display font-semibold`), one-line body (`text-slate-600`).
- `Reveal` with staggered `delay = i * 0.08`.

**Visual/Interaction:** Hover lifts card. Heroicons line icons (2px stroke, signal accent) in build — the emoji above are content cues, replace with icons.

**Accessibility:** Icons decorative (`aria-hidden`); meaning lives in text. Don't rely on emoji for meaning.

---

## 4. Social Proof (Ratings + Testimonials)

**Purpose:** Fast trust through people-like-me emotion, not case studies. Mirror the diary's emotional payoff.

**Copy:**
- Eyebrow: `Loved by builders`
- Heading (H2): **You're not the only one who was drowning in tabs.**
- Rating strip: **★★★★½** · *"Calmest my projects have ever felt"* · used by builders shipping with every major AI model
- Testimonials (short, emotional, first name + role — **illustrative**):
  - *"The 2:47 a.m. ceiling-staring stopped. I open one view and just… know."* — **Daniel O., AI Eng Lead**
  - *"I finally see what Copilot vs ChatGPT actually shipped. That alone is worth it."* — **Priya N., Indie dev**
  - *"My partner said I seem like myself again. The system holds it now, not my stamina."* — **Marcus T., Founder**
- Trust line: *Your data stays yours · GDPR-aligned (compliance roadmap)*

**Layout & Component Spec:**
- Component `SocialProof`. Centered rating band; 3 testimonial `Card`s in a grid (1→3 cols), equal height (flex), star row in `warning` color, quote, name/role footer.
- Carousel only if >6 testimonials (swipeable + dots); otherwise static grid.
- Italic disclaimer: *Names, quotes, and ratings illustrative.*

**Visual/Interaction:** Cards `card-hover`. Carousel (if used): autoplay off, pause on hover/focus, arrow + dot controls, keyboard arrows.

**Accessibility:** Star rating has a text equivalent ("4.5 out of 5"). Carousel = `aria-roledescription="carousel"`, live region on slide change, labeled controls.

---

## 5. Product Showcase (Visual / Video)

**Purpose:** Let the visitor mentally test-drive Cairn — show chaos becoming a clean, attributed plan.

**Copy:**
- Eyebrow: `See it work`
- Heading (H2): **Watch the chaos become a plan.**
- Body: *Dump three messy AI projects in — Slack threads, half-finished chats, a stale board. Cairn assembles them into a portfolio, attributes every artifact, and shows you the truth in under a minute.*
- Video chapters: `0:00 The 2:47 problem` · `0:45 Capture → hierarchy` · `1:30 Attribution ledger` · `2:20 Drift detection`
- Below video: *Ready to feel this for yourself?* → **Start free**

**Layout & Component Spec:**
- Component `ProductShowcase`. Centered, max-width 900px.
- 16:9 container (`aspect-video rounded-2xl`), poster + large play overlay; **lazy-load** the embed (load iframe/`<video>` only on click via `loadVideo` state). Provide MP4/WebM + captions track.
- Fallback if no video asset: animated GIF or a 3-step before/after sequence (scattered tabs → hierarchy card → attributed tasks).
- Chapter chips row beneath (grid 2→4 cols).

**Visual/Interaction:** Play button scales on hover; `surface-gradient` poster. A text summary is always present — never gate value behind the video.

**Accessibility:** Captions/subtitles required; play button `aria-label`; reduced-motion users get a static frame of the GIF.

---

## 6. Mid-Page CTA Band

**Purpose:** Catch the already-convinced before they scroll on. Repeat the offer.

**Copy:**
- Heading (H3): **Stop carrying it all in your head.**
- Sub: *Start free in under two minutes. Keep the free plan forever, or upgrade when you're ready.*
- Primary CTA: **Start free — today**
- Trust row: *No credit card · Cancel anytime · Your data stays yours*

**Layout & Component Spec:**
- Component `MidCTA`. Full-width band, `bg-gradient-to-br from-signal-600 to-signal-800` with white text (or `surface-gradient`). Centered, max-width 720px, `py-16 lg:py-20`.
- Single prominent button (same wording as hero for consistency).

**Visual/Interaction:** High-contrast white button on teal; `Reveal` fade-in.

**Accessibility:** Verify white-on-teal contrast ≥4.5:1; focus ring visible on the colored background.

---

## 7. Urgency / Honest Offer Strip

**Purpose:** Gentle nudge from "maybe later" to "now" — without false scarcity (Cairn's voice is no-BS).

**Copy (honest framing):**
- Inline near a CTA: **Free for solo builders — start in under 2 minutes.**
- FOMO, truthful: *Join the builders who stopped working at 2:47 a.m.*
- If a real promo ever exists: **New: Pro free for 30 days — no card required.** (Only if true.)

**Layout & Component Spec:**
- Component `OfferStrip`. Either a thin dismissible top banner (`localStorage` remembers dismissal) **or** a single line above the mid-page CTA button.
- Subtle: small text + icon, signal accent.

**Visual/Interaction:** No fake countdowns; only show a deadline if one genuinely exists.

**Accessibility:** Dismiss button labeled; not a focus trap; never the only place key info lives.

---

## 8. FAQ (Objection Handling)

**Purpose:** Remove last doubts in a friendly, plain Cairn voice.

**Copy (Q/A):**
- Eyebrow: `Good questions`
- Heading (H2): **Everything you're probably wondering.**
1. **Is my data private?** — Yes. Your workspace is yours; we don't train on it. GDPR-aligned (full certifications on our roadmap).
2. **Will I be charged after a trial?** — No. Stay on the free plan forever, or upgrade only when you choose. No surprise charges.
3. **Can I cancel anytime?** — Anytime, in one click. No lock-in.
4. **Which AI tools does it work with?** — Copilot, ChatGPT, Gemini, and Claude — Cairn tracks what each one actually shipped, and connects via MCP.
5. **Do I have to rip out Jira/Notion?** — No. Start free alongside what you use; many builders just… stop opening the old board.
6. **Is it really built for solo devs?** — Yes — solo builders are who we built the free plan for. Teams and enterprises scale up from there.

**Layout & Component Spec:**
- Component `FAQ`. Max-width 720px, centered. Accordion with `openIndex` state; `ChevronDown` rotates on open; first item open by default. Built on `<button>` + region with smooth height/opacity transition.

**Visual/Interaction:** Divider between items; question `font-medium`, answer `text-slate-600`.

**Accessibility:** `aria-expanded` per trigger, `aria-controls` to panel; fully keyboard operable.

---

## 9. Footer

**Purpose:** Calm close, light navigation, honesty, one last CTA.

**Copy:**
- Logo + tagline: *Cairn — one calm home for everything you build with AI.*
- Newsletter: **Get calm-building tips and product updates** · email field + **Subscribe** · *Occasional, useful, no spam.*
- Columns: **Product** (How it works, Features, Pricing, Demo) · **Resources** (Blog, Help, Docs) · **Company** (About, Contact) · **Legal** (Privacy, Terms, Cookies, GDPR)
- Social: LinkedIn · X · GitHub · YouTube
- Bottom line: *© [year] Cairn. A concept project — not affiliated with any named tool. Built for ISM6427c.*

**Layout & Component Spec:**
- Component `Footer`. `bg-slate-50 dark:bg-ink`, top border. Newsletter row on top (stacks on mobile), then 4–5 column link grid (2 cols mobile → 5 cols `lg`), then copyright row.
- Newsletter form: controlled `email` state + simple success state ("Thanks — you're subscribed").

**Visual/Interaction:** Link hover → `signal-600`. Subscribe = primary button.

**Accessibility:** Email `type="email"` + label; labeled social links; columns as nav landmarks.

---

## 10. Sticky Mobile CTA Bar (Persistent)

**Purpose:** On mobile, keep the action one thumb-tap away at all times.

**Copy:** Button **Start free** (full-width); optional left text *Free · no card.*

**Layout & Component Spec:**
- Component `StickyCTA`. `fixed bottom-0 inset-x-0 z-40 lg:hidden`, white/ink bg + top border + backdrop blur. Appears after scrolling past the hero (`scrollY > heroHeight`). Respect safe-area inset (`pb-[env(safe-area-inset-bottom)]`).

**Visual/Interaction:** Slide-up entrance; hide when the footer or any signup form is in view (avoid double CTA).

**Accessibility:** Doesn't overlap focusable content; never traps focus.

---

## Visual Style (summary)

- **Theme:** Light default; dark mode via `class` strategy, system-detected on first load + persisted toggle.
- **Palette:** white/slate-50 surfaces, ink dark bg, single **signal teal** accent; provider colors only on attribution badges; functional colors for status.
- **Type:** Sora display + Inter body (scale above).
- **Feel:** calm, airy, generous whitespace, `rounded-2xl` cards, soft shadows; one accent color — never rainbow.
- **Motion:** subtle scroll reveals + micro-interactions; `prefers-reduced-motion` honored everywhere.
- **Imagery:** the cairn (stacked stones) metaphor; "scattered → assembled" transformation as the recurring visual idea.

---

## Build sequencing (suggested for Windsurf)

1. Global setup: Tailwind tokens, fonts, `Container`/`Button`/`Card`/`Reveal`, theme toggle.
2. Navbar + Hero (first impression + transformation visual).
3. Benefits snapshot + Social proof (value + trust).
4. Product showcase + Mid-page CTA.
5. FAQ + Offer strip.
6. Footer + sticky mobile CTA.
7. Polish: scroll animations, dark mode pass, responsive QA, accessibility audit, Lighthouse ≥ 90.

**Definition of done:** all sections responsive (mobile/tablet/desktop), light + dark consistent, every CTA wired to the signup flow, no console errors, illustrative content labeled, footer disclaimer intact.
