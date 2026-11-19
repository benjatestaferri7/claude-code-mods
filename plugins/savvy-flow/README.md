# savvy-flow (inherit fork)

Fork of [savvy-flow](https://github.com/johnnyvizz/claude-kit/tree/main/plugins/savvy-flow) by johnnyvizz (MIT). The only change: every worker runs on the **session's model and effort** instead of a fixed one per tier.

Run `/savvy-flow:savvy-flow <task>`. The session model plans, owns design, delegates implementation to worker subagents and adversarially reviews what they return.

## What changed from upstream

| | Upstream 1.2.0 | This fork |
| --- | --- | --- |
| Worker model | fixed per tier (Fable or Opus) | `model: inherit` (the session's) |
| Worker effort | fixed per tier (low to xhigh) | not set, so the session's |
| Tiers | differ in model, effort and instructions | differ in instructions and scope only |

If your session runs on Fable at medium effort, every worker runs on Fable at medium effort. Change the session's model or effort before starting a flow to change what the workers use.

Cost scales with the session model: on Fable, five parallel workers all bill at Fable rates.

## What ships

- **Skill** `savvy-flow`: the orchestrator's playbook, with the tier table updated to say workers inherit the session.
- **Agents**: `savvy-fable`, `savvy-heavy`, `savvy-careful`, `savvy-medium`, `savvy-light`. Names are unchanged so the [savvy-progress](../savvy-progress) panel and its tools keep working.

## Install

Disable the upstream plugin first; both register the same skill and agent names.

```
claude plugin disable savvy-flow@claude-kit --scope user
claude plugin install savvy-flow@claude-code-mods --scope user
```

Full setup is in the [repository README](../../README.md).
