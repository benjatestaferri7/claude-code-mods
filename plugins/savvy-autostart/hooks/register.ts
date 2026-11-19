import type { EngineInterface, Register } from 'claude-code'

type Engine = EngineInterface

const DEFAULT_COMMAND = 'savvy-flow:savvy-flow'
const STORE_KEY = 'enabled'

/** Normalises the configured command to a bare name, without the slash. */
export function commandName(option: unknown): string {
  const raw = typeof option === 'string' ? option.trim().replace(/^\/+/, '') : ''
  return /^[\w:.-]+$/.test(raw) ? raw : DEFAULT_COMMAND
}

async function isEnabled($: Engine): Promise<boolean> {
  return (await $.store.get(STORE_KEY)) !== false
}

/** True unless the command list is readable and lacks the command. */
async function commandExists($: Engine, name: string): Promise<boolean> {
  try {
    return (await $.command.list()).some(c => c.name === name)
  } catch {
    // Cannot verify: prefill anyway; a missing command is reported by the engine on submit.
    return true
  }
}

/**
 * Puts `/<name> ` in the prompt box when the box is empty. Falls back to a dim
 * Tab-to-accept suggestion on surfaces that draw their own composer.
 * Never throws: a failure only means no prefill.
 */
async function prefill($: Engine, name: string): Promise<void> {
  try {
    if (!(await isEnabled($)) || !(await commandExists($, name))) return
    const box = await $.prompt.read()
    if (box.text !== '') return
    const text = `/${name} `
    const filled = await $.prompt.fill({ text, mode: 'replace' })
    if (filled.isFilled || filled.refusal !== 'no_composer') return
    await $.prompt.suggest({ text })
  } catch {
    // Unsupported surface or a hook refused: degrade silently.
  }
}

const USAGE = 'Usage: /autostart [on|off|status]  (no argument toggles)'

export const register: Register = (on, options) => {
  const name = commandName(options.command)

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'autostart',
      description: `Toggle pre-filling the prompt box with /${name}`,
      argumentHint: '[on|off|status]',
    })
    await prefill($, name)
    return next(e)
  })

  // Main loop only: a subagent's end must not touch the person's prompt box.
  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await prefill($, name)
    return next(e)
  })

  on('command.run', { command: 'autostart' }, async ($, e) => {
    const arg = (e.args ?? '').trim().toLowerCase()
    const current = await isEnabled($)
    if (arg === 'status') return { text: `autostart is ${current ? 'on' : 'off'} (prefix: /${name})` }

    const next = arg === '' ? !current : arg === 'on' ? true : arg === 'off' ? false : undefined
    if (next === undefined) return { text: USAGE }

    await $.store.set(STORE_KEY, next)
    if (next) {
      await prefill($, name)
      return { text: `autostart on: the prompt box will start with /${name}` }
    }
    // Remove our own untouched prefix, never anything the person typed.
    const box = await $.prompt.read().catch(() => ({ text: '', cursor: 0 }))
    if (box.text === `/${name} `) await $.prompt.fill({ text: '', mode: 'replace' }).catch(() => undefined)
    return { text: 'autostart off' }
  })
}
