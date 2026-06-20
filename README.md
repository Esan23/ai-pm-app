# AI-Native Project Management Platform

> The system of record for AI projects — track what every model and tool actually shipped, from user story to deployed agent.

A project management application purpose-built for the **AI-product lifecycle** (web app → autonomous agent), with a portfolio → project → user story → task hierarchy, AI-assisted user-story generation, a Kanban execution surface, Azure DevOps pipeline sync, and **provider-agnostic attribution** of work produced by Copilot, ChatGPT, Gemini, and Claude.

**Stack (planned):** React front end · backend + integration layer TBD (ADO / LLM providers via MCP).

---

## Why This Exists

Market research (June 2026) confirms that *agentic PM* is now commoditized across Jira, Linear, ClickUp, Monday, and Notion. **No incumbent** combines, in one system:

1. An enforced portfolio → project → story → task hierarchy
2. Multi-provider AI attribution (which model/tool produced which artifact, with cost/token visibility)
3. Azure DevOps pipeline / work-item sync
4. Templates built for how AI work actually moves (experimentation, RAG eval, agent orchestration, deployment)

Azure DevOps + Copilot is the closest overlap but is locked to the Microsoft/GitHub ecosystem. That gap is the product thesis. See [`docs/research/competitive-teardown.md`](docs/research/competitive-teardown.md).

---

## Marketing Landing Page

A front-end marketing site for Cairn lives at the repo root, built with **Vite + React 18 + TypeScript + Tailwind CSS** (self-hosted Inter + Sora fonts, Framer Motion, Heroicons, light/dark mode). Copy is grounded in the Problem-Aware avatar (Daniel Okafor) and the product concept.

```bash
npm install
npm run dev      # local dev server (Vite)
npm run build    # type-check + production build → dist/
npm run preview  # preview the production build
```

Sections: hero (with a "scattered context → one legible plan" animation), the daily-tax problem, how it works (capture → deconstruct → track → next), features (incl. provider-agnostic AI attribution + Azure DevOps sync), social proof, pricing (Free / Pro / Enterprise), and a final CTA. The sign-up flow is front-end-only (simulated) — wire it to real auth / a waitlist before launch.

## App Workspace (`/app`)

A working MVP of the product, reachable from the landing "Open app" / "Start free" CTAs and code-split into its own bundle:

- **Portfolio → Project → User Story → Task** hierarchy with a project sidebar.
- **Execution board** — a drag-and-drop Kanban (To do / In progress / Done) where every task carries **provider attribution** (Human / Claude / ChatGPT / Copilot / Gemini), the product's core differentiator. An **AI attribution** panel summarizes who/what shipped the work.
- **Capture** — describe what you're building and Cairn deconstructs it into user stories + tasks. The deconstruction is a deterministic, client-side demo heuristic (`src/lib/capture.ts`) with no API key required; swap it for a real LLM call (e.g. a Netlify function) without touching the UI.
- Runs entirely in **guest mode**, persisted to `localStorage` (`src/lib/store.ts`), so it's demoable with no backend. A "Reset" button restores the seed demo workspace.

Routing is `react-router-dom` v7: `/` (landing) and `/app` (workspace, lazy-loaded).

**Deploy:** `netlify.toml` is configured (`npm run build` → publish `dist/`, SPA fallback, asset caching). Connect the repo to Netlify or drag-drop `dist/`.

## Repository Structure

```
.
├── README.md                          # This file
├── LICENSE
├── .gitignore
├── index.html · vite.config.ts · tailwind.config.js · netlify.toml
├── src/
│   ├── App.tsx · main.tsx · index.css
│   ├── hooks/useTheme.ts
│   └── components/                     # Navbar, Hero, Problem, HowItWorks, Features,
│       │                              # SocialProof, Pricing, FinalCTA, Footer, SignUpModal…
│       └── ContextCollapseVisual.tsx   # signature hero animation
└── docs/
    └── research/
        ├── avatar-problem-aware.md     # Problem-Aware customer avatar (Schwartz framework)
        ├── diary-problem-aware.md      # Persona-voice diary: before / during / after product use
        └── competitive-teardown.md     # MECE competitive analysis + whitespace map
```

---

## Research Foundation

| Document | Purpose |
|---|---|
| [Problem-Aware Avatar](docs/research/avatar-problem-aware.md) | Target buyer profile, language, fears, and triggers (Eugene Schwartz market-awareness framework). |
| [Problem-Aware Diary](docs/research/diary-problem-aware.md) | First-person persona narrative across the product journey — source for VOC copy and messaging. |
| [Competitive Teardown](docs/research/competitive-teardown.md) | Scored feature matrix of 7 incumbents/adjacents; whitespace map; positioning and SWOT. |

---

## Status

**Phase: Research & Discovery** — customer and market research complete; product spec and architecture pending.

### Roadmap (stub)
- [x] Problem-Aware customer avatar
- [x] Competitive teardown + whitespace analysis
- [x] Persona-voice diary (messaging input)
- [ ] Remaining awareness-stage avatars (Schwartz set)
- [ ] Product spec / PRD (feature set, MoSCoW scope)
- [ ] Data model (hierarchy + provider-attribution schema)
- [x] Marketing landing page (Vite + React + Tailwind)
- [x] App MVP scaffold — /app workspace (hierarchy, Kanban, AI capture, attribution) in guest mode
- [ ] Real auth + persistence (Supabase) and a server-side LLM capture function
- [ ] Azure DevOps + MCP integration spike

---

*Research assets reflect persona modeling and market analysis; placeholder metrics and archetypal selections are flagged inline and must be replaced with sourced data before external use.*
