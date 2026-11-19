# savvy-autostart

Starts every session ready to run the `savvy-flow` skill. It pre-fills the prompt box with `/savvy-flow:savvy-flow ` (cursor at the end), at session start and again after each main-loop turn. Type the task and press Enter: the native slash command runs. For a trivial prompt, delete the prefix.

## Why a prefill and not a rewrite

`savvy-flow` is `disable-model-invocation: true`, so the model cannot invoke it, and a `prompt.submit` hook cannot turn a submitted prompt into a slash command (by then it is a user message and `command` is set by the engine). The only way to get a real slash command is for the person to submit one, so the plugin writes it into the box for them.

## Behaviour

- Fills only when the box is empty; never overwrites typed text.
- Main session only; subagent turns are ignored.
- Skips the fill if the command is not in `$.command.list()` (savvy-flow not installed). If the list cannot be read, it fills anyway.
- Uses `$.prompt.fill`. Where the surface draws its own composer (the engine answers `no_composer`), it falls back to `$.prompt.suggest`: a dim suggestion accepted with Tab. Anywhere neither works (headless, under a dialog) it does nothing, silently.
- No model calls, no network.
- After `/clear` the box is refilled at the end of the next turn, not immediately.

## Commands

`/autostart [on|off|status]`. With no argument it toggles. The setting is stored in the plugin's store and persists across sessions. Default: on. `off` also removes the prefix if it is still untouched in the box.

## Configuration

| Option    | Default                 | Meaning                                                    |
| --------- | ----------------------- | ---------------------------------------------------------- |
| `command` | `/savvy-flow:savvy-flow` | Slash command to pre-fill; the leading slash is optional. |

Set it in the `/config` menu or under `pluginConfigs` in settings.

## Requirement

`savvy-flow@claude-kit` must be installed. To stop the prefill, run `/autostart off` or disable the plugin.

## Install

```
/plugin install savvy-autostart --marketplace benjatestaferri7/claude-code-mods
```

From a shell: `claude plugin install savvy-autostart@claude-code-mods --scope user` after `claude plugin marketplace add benjatestaferri7/claude-code-mods`. See the [repository README](../../README.md) for the full setup.
