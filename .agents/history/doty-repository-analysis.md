# Repository analysis

Inspected: 2026-09-21

## Existing environment

- The Git repository was clean on `master` before harness work began.
- The application is Astro 7 with Starlight and uses npm (`package-lock.json`).
- Existing application content is under `src/content/docs/`; that directory is not the DeepLearn knowledge base.
- Existing scripts are limited to Astro development, build, preview, and CLI commands.
- The root `AGENTS.md` already contained Astro development and documentation guidance.
- No `.doty/`, `.agents/`, root `docs/`, or `scripts/` directory existed.
- No repository-local custom skill existed.

## Integration decision

The harness adds only root-level `AGENTS.md` guidance, `.agents/skills/deep-learn/`, `.doty/`, `scripts/`, and `docs/`. It does not modify `src/`, `public/`, `astro.config.mjs`, `package.json`, `package-lock.json`, `tsconfig.json`, or existing application documentation.

Codex officially discovers repository skills at `$REPO_ROOT/.agents/skills`, so `.agents/skills/deep-learn/SKILL.md` is the functional entrypoint. `.doty/` remains tool-neutral methodology and is deliberately not presented as an automatically discovered skill.

## Available local capabilities

- Local filesystem reads and writes
- Shell and Node.js execution
- Git inspection
- npm-based temporary example testing when justified
- Web and GitHub access when exposed by the active agent session

Web search and GitHub access are session capabilities, not guaranteed repository dependencies. Each research run must detect them and record any downgrade rather than inventing results.

## Safe addition boundary

The harness may add or update:

- `.doty/**`
- `.agents/skills/deep-learn/**`
- `scripts/deep-learn.mjs` and its tests
- `docs/**`
- the DeepLearn section of root `AGENTS.md`

Any application change requires a separate user request.
