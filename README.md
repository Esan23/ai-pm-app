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

## Repository Structure

```
.
├── README.md                          # This file
├── LICENSE
├── .gitignore
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
- [ ] React MVP scaffold
- [ ] Azure DevOps + MCP integration spike

---

*Research assets reflect persona modeling and market analysis; placeholder metrics and archetypal selections are flagged inline and must be replaced with sourced data before external use.*
