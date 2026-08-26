# Referenz-Repos für Claude Code

Acht Repos, mit denen Claude Code arbeiten können soll. Sie gehören nicht zu
dieser Website — sie liegen hier nur, damit das Setup nachvollziehbar bleibt.

## Einrichten

```bash
./.claude/setup-reference-repos.sh              # nach ~/claude-repos
./.claude/setup-reference-repos.sh ~/dev/refs   # eigener Ort
FULL=1 ./.claude/setup-reference-repos.sh       # volle History statt --depth 1
```

Das Skript ist idempotent: vorhandene Clones werden per Fast-Forward
aktualisiert. Ein Ordner mit fremdem Remote wird übersprungen, nicht
überschrieben.

## Die Repos

| Repo | Was | Default-Branch | Größe (shallow) |
|---|---|---|---|
| `cathrynlavery/diagram-design` | Claude-Code-**Plugin**: 39 editorial Diagrammtypen als HTML/SVG | `main` | 16 MB |
| `basecamp/omarchy` | DHHs Linux-Distribution (Arch/Hyprland), Bash | `quattro` | 146 MB |
| `coollabsio/coolify` | Self-hosted Heroku/Vercel-Alternative, PHP/Laravel + Livewire | `main` | 79 MB |
| `getmaxun/maxun` | No-Code Web-Scraping-Plattform, TypeScript | `develop` | 4,9 MB |
| `Stirling-Tools/Stirling-PDF` | PDF-Toolbox mit 50+ Tools, Java/Gradle | `main` | 311 MB |
| `langgenius/dify` | LLM-App-Plattform (Workflows, RAG, Agents), Python + Next.js | `main` | 201 MB |
| `MVCoconut/coconut.ui` | View-Layer für Haxe, React-ähnliche API | `master` | 808 KB |
| `bklit/bklit-ui` | Open-Source Chart-Komponenten (shadcn-Registry), bringt einen Skill mit | `main` | 29 MB |

Drei Repos haben **keinen** `main`-Branch — `omarchy` nutzt `quattro`,
`maxun` nutzt `develop`, `coconut.ui` nutzt `master`. Wer dort hart `main`
auscheckt, läuft ins Leere.

`omarchy`, `coolify`, `Stirling-PDF` und `dify` bringen eine eigene
`CLAUDE.md` mit — die liest Claude Code automatisch, sobald man in dem
jeweiligen Repo arbeitet.

## Die beiden mit Claude-Code-Erweiterungen

**`diagram-design`** ist ein vollständiges Plugin (`.claude-plugin/marketplace.json`,
Version 2.6.6) mit dem Skill `diagram-design` und den Commands `/doctor`,
`/export-diagram`, `/import-drawio`, `/import-mermaid`, `/profile`. Installation
in Claude Code:

```
/plugin marketplace add cathrynlavery/diagram-design
/plugin install diagram-design@diagram-design
```

**`bklit-ui`** hat kein Plugin-Manifest, aber einen Skill unter
`skills/bklit-ui/`. Der wird per Kopie installiert:

```bash
cp -r ~/claude-repos/bklit-ui/skills/bklit-ui ~/.claude/skills/
```

Beides landet in `~/.claude/` und gilt damit benutzerweit — also gleichermaßen
in der Claude-Desktop-App und in Claude Code in VS Code. Einmal installieren
reicht.
