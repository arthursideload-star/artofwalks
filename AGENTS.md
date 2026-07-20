# AGENTS.md

Guidelines for AI coding agents working in this repository.

## Marketing Skills

This project has [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) installed:

- **`.claude/skills/`** — the 47 marketing skills (CRO, copywriting, SEO, ads, pricing, referrals, etc.), installed in the format Claude Code loads automatically. Trigger phrases are documented in each skill's `SKILL.md`.
- **`marketingskills/`** — full upstream clone: CLI tools for 50+ marketing platforms (`marketingskills/tools/clis/`), integration guides (`marketingskills/tools/integrations/`), and the Agent Skills spec docs. Read `marketingskills/AGENTS.md` for details on using the CLI tools and the Composio integration layer.

Agents that read the universal [Agent Skills spec](https://agentskills.io) (Codex, Cursor, Windsurf, etc.) should treat `marketingskills/skills/` as the canonical skill source; Claude Code reads `.claude/skills/` instead.
