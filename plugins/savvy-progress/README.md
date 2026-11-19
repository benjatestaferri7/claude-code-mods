# savvy-progress

A Claude Code mod: a progress bar above the prompt and a live panel of subagents. Made for the savvy-flow skill from [johnnyvizz/claude-kit](https://github.com/johnnyvizz/claude-kit), and useful with any subagents.

This is a fork of `savvy-progress` 1.2.1 by [johnnyvizz](https://github.com/johnnyvizz) (MIT). The original progress bar, panel, tools and cost estimate are his. The fork (`1.3.0-roles`) adds the role costumes described below. It keeps the plugin name on purpose: savvy-flow workers call `mcp__savvy-progress__step` and `mcp__savvy-progress__progress`. Do not enable it together with the original `savvy-progress@claude-kit`; both draw the same panel and register the same tools.

Install: `/plugin install savvy-progress@claude-code-mods` (after `/plugin marketplace add benjatestaferri7/claude-code-mods`).

- **Progress bar**: the flow's title, phase, accepted tasks out of planned, and a button with the crew size that opens the panel. It appears once something reports progress (savvy-flow does) or a `savvy-*` worker starts.
- **Agents panel** (`/agents-info` toggles it; `/agents-info open` opens it or brings it forward without toggling): running, finished and planned subagents with model, effort, task progress, context, estimated cost and time. Working crabs walk, and each savvy tier animates its prop (see [Role costumes](#role-costumes) for the per-role outfits that replace them when the task has a clear role): the astronaut floats, the detective sweeps the magnifier, the engineer turns the wrench, the chef tosses the omelette, the racer runs with a fluttering flag. `prefers-reduced-motion` stops them.

## Tools it adds

- `mcp__savvy-progress__progress`: the orchestrator reports the plan, phase and accepted tasks. Only the main session can: a call from a subagent is ignored, so a worker cannot rename, finish or reset the flow.
- `mcp__savvy-progress__step`: a worker reports its own steps (`done`, `total`, `note`). A worker that does not report shows its context fill in grey instead. The tool is listed up front rather than behind ToolSearch, and each `savvy-*` worker gets one line at the end of its brief asking for these reports.

Cost is a rough estimate from token counts and a built-in per-model price table (`PRICES` in `hooks/register.tsx`, list prices as of 2026-10-10), not a bill. Cache writes are priced at the 1-hour rate, which is what Claude Code writes on a subscription; a session that writes 5-minute entries is overestimated there.

## Role costumes

Each agent also wears a costume for its **role**, so you can tell a designer from a developer at a glance. The crab keeps its tier colour as the accent (beret, beanie, lens ring, flask liquid, chart bars), so the model tier stays visible.

| Role | Costume | Animation |
| --- | --- | --- |
| designer | tilted beret, palette, brush | the brush strokes, paint dabs blink |
| developer | beanie, open laptop | claws tap, code lines flicker |
| writer | newsboy cap, paper, quill | the quill writes, the ink line grows |
| reviewer | eyeshade, round glasses, clipboard | check marks appear one by one |
| tester | surgical cap, goggles, flask | bubbles rise |
| researcher | pith helmet, binoculars | the binoculars scan side to side |
| devops | headset with mic, gear | the gear turns |
| data | mortarboard, bar chart | the bars rise and fall |

How the role is resolved (`roleOf` in `hooks/roles.ts`), first match wins:

1. The subagent type name, without any `plugin:` prefix, against a role name or alias (`designer`, `ui-designer`, `frontend-developer`, `qa`, `test-engineer`...).
2. Keywords in the task description, English and Spanish, ignoring accents and case, as whole words (`diseño`, `design`, `paleta`, `fix`, `redactar`, `revisión`, `deploy`, `datos`...). The role with the highest score wins; a generic word like `write` or `code` counts half, and a tie goes to the word that comes first.
3. Otherwise the tier costume, as before. The `Explore` type stays the pirate unless a strong role word matches (never "researcher").

The role is resolved once, when the agent spawns, and stored on its run (`role` in `types/index.d.ts`), so the costume does not change later. Runs stored by older versions have no role and keep their tier costume. Planned tasks that have not started yet use their title. The panel shows it next to the tier ("designer · fable") when it fits; the terminal panel shows it as text.

To add a role: add an entry to `ROLES` in `hooks/roles.ts` (name, type aliases, description words), add a costume with the same name to `ROLE_COSTUMES` in `hooks/costumes.ts` (SVG rects on the 30×28 grid, props that move in their own `cls` group), add its `.c-<role>.run .<cls>` animation to `CRAB_CSS`, and a case to `hooks/roles.test.ts`. `prefers-reduced-motion` stops every costume animation.

## Settings

`language`: `auto` (default), `en`, `ru` or `he`. Hebrew draws the bar and the panel right to left. `auto` follows Claude Code's `language` setting, then the system locale, and falls back to English. Set it in `/config`, or, for a mod loaded by hand, in `~/.claude/settings.json`:

```json
{ "pluginConfigs": { "savvy-progress": { "options": { "language": "ru" } } } }
```

`autoOpen`: `savvy` (default) or `any`. With `savvy` the panel opens by itself when a `savvy-*` worker starts or a plan is reported. With `any` it also opens, once per session, when any other subagent starts. `/agents-info` toggles it either way.

Full install steps are in the [repository README](../../README.md). License: [MIT](LICENSE), original notice kept.
