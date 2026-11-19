import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'

import { ROLES, roleOf } from './roles'

const PLUGIN = 'savvy-progress'
const pane = { title: '', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} } as const

// 1. The subagent type name.
test('roles: a type name that is a role name or alias wins', () => {
  expect(roleOf('designer')).toBe('designer')
  expect(roleOf('ui-designer')).toBe('designer')
  expect(roleOf('plugin:frontend-developer')).toBe('developer')
  expect(roleOf('copywriter')).toBe('writer')
  expect(roleOf('code-reviewer')).toBe('reviewer')
  expect(roleOf('qa')).toBe('tester')
  expect(roleOf('test-engineer')).toBe('tester')
  expect(roleOf('software-engineer')).toBe('developer')
  expect(roleOf('devops-engineer')).toBe('devops')
  expect(roleOf('data-scientist')).toBe('data')
})

test('roles: the type name beats the description', () => {
  expect(roleOf('designer', 'Write the unit tests')).toBe('designer')
})

// 2. Keywords in the description, Spanish and English.
test('roles: Spanish keywords in the description', () => {
  expect(roleOf('general-purpose', 'Armar la paleta de colores')).toBe('designer')
  expect(roleOf('general-purpose', 'Redactar los textos de la landing')).toBe('writer')
  expect(roleOf('general-purpose', 'Revisión de la propuesta')).toBe('reviewer')
  expect(roleOf('general-purpose', 'Investigar alternativas de hosting')).toBe('researcher')
  expect(roleOf('general-purpose', 'Escribir pruebas del parser')).toBe('tester')
  expect(roleOf('general-purpose', 'Desplegar a producción')).toBe('devops')
  expect(roleOf('general-purpose', 'Graficar las métricas de uso')).toBe('data')
  expect(roleOf('general-purpose', 'Implementar el prototipo')).toBe('developer')
})

test('roles: English keywords in the description', () => {
  expect(roleOf('general-purpose', 'Design the dashboard UI')).toBe('designer')
  expect(roleOf('general-purpose', 'Fix the bug in the parser')).toBe('developer')
  expect(roleOf('general-purpose', 'Write the docs')).toBe('writer')
  expect(roleOf('general-purpose', 'Audit the auth flow')).toBe('reviewer')
  expect(roleOf('general-purpose', 'Add tests for the cart')).toBe('tester')
  expect(roleOf('general-purpose', 'Research vector databases')).toBe('researcher')
  expect(roleOf('general-purpose', 'Set up the CI pipeline')).toBe('devops')
  expect(roleOf('general-purpose', 'Query the sales data')).toBe('data')
})

test('roles: accents and case do not matter', () => {
  expect(roleOf('general-purpose', 'DISEÑO de la página')).toBe('designer')
  expect(roleOf('general-purpose', 'diseno de la pagina')).toBe('designer')
  expect(roleOf('general-purpose', 'Revisión DE código')).toBe('reviewer')
  expect(roleOf('general-purpose', 'código')).toBe('developer')
})

test('roles: keywords are whole words, not fragments', () => {
  // "circular" holds "ci", "metadata" holds "data", "xdesign" is no design.
  expect(roleOf('general-purpose', 'Circular reference in metadata')).toBeUndefined()
  expect(roleOf('general-purpose', 'Rename the files')).toBeUndefined()
})

test('roles: most hits win, a tie goes to the first mention, deterministically', () => {
  expect(roleOf('general-purpose', 'Design the page, then write the CSS, HTML and JS')).toBe('developer')
  expect(roleOf('general-purpose', 'Design and review')).toBe('designer')
  expect(roleOf('general-purpose', 'Review and design')).toBe('reviewer')
  // A generic verb counts half: "write tests" is about tests.
  expect(roleOf('general-purpose', 'Write the unit tests')).toBe('tester')
  expect(roleOf('general-purpose', 'Implement and design')).toBe('designer')
  // A code review is a review, not code.
  expect(roleOf('general-purpose', 'Code review of the auth module')).toBe('reviewer')
})

// 3. No role: the caller falls back to the tier costume.
test('roles: nothing recognisable falls back to no role', () => {
  expect(roleOf('general-purpose', 'Tidy up')).toBeUndefined()
  expect(roleOf('general-purpose', '')).toBeUndefined()
  expect(roleOf('savvy-light', '')).toBeUndefined()
  expect(roleOf('savvy-heavy')).toBeUndefined()
})

test('roles: savvy tier workers still get a role from their task', () => {
  expect(roleOf('savvy-fable', 'Diseño del sistema de estilos')).toBe('designer')
})

test('roles: Explore stays the pirate unless another role keyword matches', () => {
  expect(roleOf('Explore', 'Explore the repo and research the options')).toBeUndefined()
  expect(roleOf('Explore', 'Mapear el repo')).toBeUndefined()
  expect(roleOf('Explore', 'Find where tests are configured')).toBe('tester')
  // A bare "code" is too weak to take the pirate's costume.
  expect(roleOf('Explore', 'Explore the code')).toBeUndefined()
})

test('roles: every role has a unique name and at least one alias and keyword', () => {
  expect(new Set(ROLES.map(r => r.name)).size).toBe(ROLES.length)
  for (const r of ROLES) {
    expect(r.aliases.length).toBeGreaterThan(0)
    expect(r.words.length).toBeGreaterThan(0)
  }
})

// Spawning records the role on the run, and the panel draws that role's costume.
const spawn = async ($: Engine, on: On, subagentType: string, description: string) => {
  mock.clock(on)
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('agent.spawn', () => ({ model: 'claude-opus-5-5', agentId: 'a1' }))
  await $.agent.spawn({ tool_use_id: 't1', prompt: 'p', description, subagentType, provider: 'engine', parentModel: 'claude-opus-5-5', background: false, fork: false } as never)
}

const drawn = async ($: Engine, surface: 'desktop' | 'terminal') => {
  const ui = await $.ui.mount({ plugin: PLUGIN, surface, component: 'Pane', requestId: 'savvy-agents', props: pane })
  return ui
}

test('spawn: the role is recorded and its costume drawn (desktop)', async ($, on) => {
  await spawn($, on, 'general-purpose', 'Diseño de la paleta')
  const ui = await drawn($, 'desktop')
  const source = (await ui.findAll({ type: 'Svg' })).map(el => String(el.props.source)).join('')
  expect(source).toContain('class="c-designer run"')
  expect(source).not.toContain('c-other')
})

test('spawn: the role shows next to the tier (terminal)', async ($, on) => {
  await spawn($, on, 'savvy-careful', 'Write the unit tests')
  const ui = await drawn($, 'terminal')
  expect(await ui.find({ type: 'Text', text: /tester · careful/i })).toBeDefined()
})

test('spawn: no role keyword keeps the tier costume', async ($, on) => {
  await spawn($, on, 'savvy-heavy', 'Tidy up')
  const ui = await drawn($, 'desktop')
  const source = (await ui.findAll({ type: 'Svg' })).map(el => String(el.props.source)).join('')
  expect(source).toContain('class="c-heavy run"')
})

test('spawn: Explore keeps the pirate', async ($, on) => {
  await spawn($, on, 'Explore', 'Explore the code')
  const ui = await drawn($, 'desktop')
  const source = (await ui.findAll({ type: 'Svg' })).map(el => String(el.props.source)).join('')
  expect(source).toContain('class="c-explore run"')
})
