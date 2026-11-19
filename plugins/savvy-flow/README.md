# savvy-flow (session-capped fork)

Fork of [savvy-flow](https://github.com/johnnyvizz/claude-kit/tree/main/plugins/savvy-flow) by johnnyvizz (MIT). The session model orchestrates. Workers run on cheaper models per tier, never on one stronger than the session's, and always at **medium effort**.

Run `/savvy-flow:savvy-flow <task>`. The session model plans, owns design, delegates implementation to worker subagents and adversarially reviews what they return.

## Models per tier

Each tier has a model cap. A worker runs on the cap or on the session model, whichever is cheaper (fable > opus > sonnet > haiku):

| Session | savvy-fable | savvy-heavy | savvy-careful | savvy-medium | savvy-light |
| --- | --- | --- | --- | --- | --- |
| Fable | Fable | Opus | Opus | Sonnet | Haiku |
| Opus | Opus | Opus | Opus | Sonnet | Haiku |
| Sonnet | Sonnet | Sonnet | Sonnet | Sonnet | Haiku |
| Haiku | Haiku | Haiku | Haiku | Haiku | Haiku |

Someone without access to Fable can pick Opus or Sonnet for the session, and the flow still delegates downward from there.

The orchestrator passes the model when it spawns each worker (the Agent tool's `model` parameter). The worker definitions keep `model: inherit` as a fallback and set `effort: medium`.

## What changed from upstream

| | Upstream 1.2.0 | This fork |
| --- | --- | --- |
| Worker model | fixed per tier (Fable or Opus) | per tier, capped at the session model |
| Worker effort | fixed per tier (low to xhigh) | always medium |
| Orchestrator | expects Fable | any session model |

## What ships

- **Skill** `savvy-flow`: the orchestrator's playbook, with the model-per-tier table.
- **Agents**: `savvy-fable`, `savvy-heavy`, `savvy-careful`, `savvy-medium`, `savvy-light`. The names are unchanged, so the [savvy-progress](../savvy-progress) panel and its tools keep working. The panel shows the model and effort each run actually used.

## Install

Disable the upstream plugin first; both register the same skill and agent names.

```
claude plugin disable savvy-flow@claude-kit --scope user
claude plugin install savvy-flow@claude-code-mods --scope user
```

Full setup is in the [repository README](../../README.md).
