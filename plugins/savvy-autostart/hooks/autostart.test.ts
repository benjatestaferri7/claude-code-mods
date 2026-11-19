import type { Engine } from 'claude-code/testing'
import { expect, test } from 'claude-code/testing'
import type { On } from 'claude-code'

const PREFIX = '/savvy-flow:savvy-flow '
const START = { cwd: '/tmp', surface: 'terminal', isInteractive: true } as const
const DONE = { answer: '', durationMs: 1, isAborted: false, turnId: 't1', reason: 'answer' } as const

type Stubs = { box: { text: string; cursor: number }; fills: string[]; suggests: string[]; store: Map<string, unknown> }

const run = ($: Engine, args = '') =>
  $.command.run({ command: 'autostart', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })

/** Stubs the world beneath the plugin: a prompt box, the command list, the store. */
function world(on: On, opts: { commands?: string[]; refusal?: boolean } = {}): Stubs {
  const s: Stubs = { box: { text: '', cursor: 0 }, fills: [], suggests: [], store: new Map() }
  on('store.get', (_$, e) => ({ value: s.store.get(e.key) }))
  on('store.set', (_$, e) => {
    s.store.set(e.key, e.value)
    return { value: undefined }
  })
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('turn.complete', () => ({ text: '' }))
  on('command.register', () => ({ value: { command: 'autostart' } }))
  on('command.list', () => ({
    value: (opts.commands ?? ['savvy-flow:savvy-flow']).map(name => ({ name, description: '', source: 'plugin' as const })),
  }))
  on('prompt.read', () => ({ value: s.box }))
  on('prompt.fill', (_$, e) => {
    if (opts.refusal) return { isFilled: false }
    s.fills.push(e.text)
    s.box = { text: e.text, cursor: e.text.length }
    return { isFilled: true }
  })
  on('prompt.suggest', (_$, e) => {
    s.suggests.push(e.text)
    return { isShown: true }
  })
  return s
}

test('prefills the empty prompt box when the session starts', async ($, on) => {
  const s = world(on)
  await $.session.start(START)
  expect(s.fills).toEqual([PREFIX])
  expect(s.box).toEqual({ text: PREFIX, cursor: PREFIX.length })
})

test('never overwrites what the person typed', async ($, on) => {
  const s = world(on)
  s.box = { text: 'fix the bug', cursor: 11 }
  await $.session.start(START)
  await $.turn.complete(DONE)
  expect(s.fills).toEqual([])
  expect(s.box.text).toBe('fix the bug')
})

test('does not run for subagents', async ($, on) => {
  const s = world(on)
  await $.turn.complete({ ...DONE, agentId: 'agent-1' })
  expect(s.fills).toEqual([])
})

test('refills after a main-loop turn ends', async ($, on) => {
  const s = world(on)
  await $.session.start(START)
  s.box = { text: '', cursor: 0 }
  await $.turn.complete(DONE)
  expect(s.fills).toEqual([PREFIX, PREFIX])
})

test('does not prefill when the command is not installed', async ($, on) => {
  const s = world(on, { commands: ['compact'] })
  await $.session.start(START)
  expect(s.fills).toEqual([])
})

// The `no_composer` cause is stamped by the engine itself and a test's hook cannot set it, so the
// suggestion fallback is not exercised here; this checks that an unexplained refusal stays silent.
test('a refused fill does not fall back to a suggestion', async ($, on) => {
  const s = world(on, { refusal: true })
  await $.session.start(START)
  expect(s.suggests).toEqual([])
})

test('/autostart off stops prefilling, clears its own prefix and persists', async ($, on) => {
  const s = world(on)
  await $.session.start(START)
  const off = await run($, 'off')
  expect(off.text).toBe('autostart off')
  expect(s.box.text).toBe('')

  await $.turn.complete(DONE)
  expect(s.fills).toEqual([PREFIX, ''])
  expect(s.store.get('enabled')).toBe(false)
  expect((await run($, 'status')).text).toContain('off')
})

test('a persisted off survives a new session', async ($, on) => {
  const s = world(on)
  s.store.set('enabled', false)
  await $.session.start(START)
  expect(s.fills).toEqual([])
})

test('/autostart with no argument toggles; on prefills at once', async ($, on) => {
  const s = world(on)
  expect((await run($)).text).toContain('autostart off')
  expect((await run($)).text).toContain('autostart on')
  expect(s.box.text).toBe(PREFIX)
  expect((await run($, 'bogus')).text).toContain('Usage')
})

test('off keeps text the person typed', async ($, on) => {
  const s = world(on)
  s.box = { text: 'hello', cursor: 5 }
  await run($, 'off')
  expect(s.box.text).toBe('hello')
})

test('does not prefill a command that is not installed under the configured name', async ($, on) => {
  const s = world(on, { commands: ['review'] })
  await $.session.start(START)
  expect(s.fills).toEqual([])
})

test('custom command option', { options: { command: '/review' } }, async ($, on) => {
  const s = world(on, { commands: ['review'] })
  await $.session.start(START)
  expect(s.fills).toEqual(['/review '])
})

test('custom command option without slash', { options: { command: 'review' } }, async ($, on) => {
  const s = world(on, { commands: ['review'] })
  await $.session.start(START)
  expect(s.fills).toEqual(['/review '])
})
