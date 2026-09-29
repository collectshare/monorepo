# axi

An AXI (Agent eXperience Interface) CLI, scaffolded by [axi-axi](https://github.com/CodyEngel/axi-axi) against AXI spec `axi/1.0-2026-07` (see [axi.md](https://axi.md)).

TODO: describe what axi does.

## Develop

```sh
npm install
npm run build
node bin/axi.js        # home view (live content, AXI principle 8)
npm test                    # AXI contract smoke tests
npm run skill:gen           # regenerate skills/axi/SKILL.md (commit it)
```

Check compliance any time:

```sh
npx -y axi-axi validate "node bin/axi.js" --dir .
npx -y axi-axi checklist --phase implement
```

## Agent integration

Two complementary paths (both optional):

- **Session hook** (ambient, live state): `npx -y axi-axi setup hooks --dir .` installs a SessionStart hook that loads the home view at session start.
- **Skill** (on-demand, broader support): `skills/axi/SKILL.md` is generated from the same content as the home view; CI runs `npm run skill:check` so it cannot go stale.

## Structure

- `src/cli/`, `src/output/` — shared AXI plumbing (strict flag parsing, TOON output, structured errors), copied verbatim from axi-axi. To refresh after an axi-axi upgrade: `npx -y axi-axi new axi --dir . --force` (review the diff first).
- `src/skill/content.ts` — single source for the home view and SKILL.md.
- `src/commands/` — your commands. `items.ts` is a worked example; replace it.
