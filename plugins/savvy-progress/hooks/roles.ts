// Role resolver: which costume an agent wears is decided by what it is FOR.
//
// EXTEND ME: to add a role, add one entry to ROLES (name, type aliases, description
// keywords) and a costume with the same name in `ROLE_COSTUMES` (hooks/costumes.ts).
// Nothing else needs to change.
//
// Order of resolution (see `roleOf`):
//   1. the subagent type name, bare (after any `plugin:` prefix), against a role name or alias;
//   2. else keywords in the task description (English and Spanish, accent-insensitive,
//      whole words; a trailing `*` means "word starting with");
//   3. else no role: the caller falls back to the tier costume.

export type RoleDef = {
  name: string
  /** Type names (normalised, `-` separated) that mean this role outright. */
  aliases: string[]
  /** Weaker words in a type name (`software-engineer`): only tried when no alias matched. */
  generic?: string[]
  /**
   * Description keywords; `*` at the end makes a prefix (`dise*` matches diseno, disenar...).
   * A leading `~` marks a weak word (a generic verb or noun like `write` or `code`): it counts
   * half, so "write tests" is about tests, and it cannot make an Explore agent change costume alone.
   */
  words: string[]
}

export const ROLES: RoleDef[] = [
  {
    name: 'designer',
    aliases: ['designer', 'ui-designer', 'ux-designer', 'ui', 'ux', 'design', 'artist', 'illustrator', 'stylist', 'visual-designer', 'graphic-designer'],
    words: ['dise*', 'design*', 'paleta', 'palette*', 'ui', 'ux', 'estilo*', 'style*', 'styling', '~layout', 'maqueta*', 'mockup*', 'wireframe*', 'tipografia', 'typography', '~color*', '~colour*', 'branding', 'logo*', '~icon*'],
  },
  {
    name: 'developer',
    aliases: ['developer', 'frontend', 'front-end', 'frontend-developer', 'backend', 'back-end', 'backend-developer', 'fullstack', 'full-stack', 'programmer', 'coder', 'implementer', 'swe', 'software-engineer'],
    generic: ['dev', 'engineer', 'code'],
    words: ['~codigo', '~code', 'coding', 'html', 'css', 'js', 'ts', 'javascript', 'typescript', '~implement*', 'prototipo*', 'prototype*', 'refactor*', '~fix', '~fixes', '~fixing', 'bug', 'bugs', 'bugfix', '~program*', '~script*', '~function*', '~funcion*', '~component*', '~endpoint*', '~api'],
  },
  {
    name: 'writer',
    aliases: ['writer', 'copywriter', 'copy', 'editor', 'author', 'technical-writer', 'content-writer', 'content', 'docs', 'documentation', 'doc-writer', 'scribe'],
    words: ['texto*', 'textos', 'copy', 'copywriting', 'redact*', '~escrib*', '~write*', '~writing', '~content', '~contenido*', 'docs', 'doc', 'documenta*', '~document', 'readme', 'article*', 'articulo*', 'blog', '~draft*', '~borrador*'],
  },
  {
    name: 'reviewer',
    aliases: ['reviewer', 'code-reviewer', 'security-reviewer', 'auditor', 'critic', 'judge', 'review', 'linter', 'inspector'],
    words: ['revision', 'revisar', 'revisa*', 'review*', 'audit*', '~verify', '~verifica*', '~validar', '~valida*', '~validate*', 'inspec*', 'critique', 'critica*', 'lint*'],
  },
  {
    name: 'tester',
    aliases: ['tester', 'qa', 'qa-engineer', 'test', 'test-engineer', 'sdet', 'quality-assurance'],
    words: ['test', 'tests', 'testing', 'tested', 'qa', 'prueba*', 'probar', 'probando', 'e2e', 'coverage', 'cobertura', 'smoke', 'regression', 'regresion'],
  },
  {
    name: 'researcher',
    aliases: ['researcher', 'research', 'analyst', 'investigator', 'scout', 'explorer', 'librarian'],
    words: ['investiga*', 'research*', 'explor*', 'analiz*', 'analy*', 'analisis', '~busca*', '~search*', 'survey*', '~compar*', '~estudia*', '~study', 'findings', 'hallazgos', '~map', '~mapear', '~mapping', '~understand', '~entender'],
  },
  {
    name: 'devops',
    aliases: ['devops', 'sre', 'infra', 'infrastructure', 'platform', 'platform-engineer', 'deployer', 'release', 'release-manager'],
    words: ['deploy*', 'despliegue*', 'desplegar', 'ci', 'cd', 'pipeline*', 'docker*', 'container*', 'kubernetes', 'k8s', 'infra*', 'terraform', '~build', '~builds', 'release*'],
  },
  {
    name: 'data',
    aliases: ['data', 'data-analyst', 'data-scientist', 'data-engineer', 'analytics', 'bi'],
    words: ['datos', 'data', 'dataset*', 'sql', '~query', '~queries', 'chart*', 'grafico*', '~graph*', 'metric*', 'metrica*', 'dashboard*', 'csv', '~database', 'estadistic*', 'statistic*', '~plot*', 'kpi*'],
  },
]

/** Lower-case, accents removed, anything that is not a letter or digit becomes one space. */
export const flatten = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// One compiled matcher per role and weight: the words as whole words (or prefixes) of flattened text.
const compile = (words: string[]): RegExp | undefined =>
  words.length
    ? new RegExp(`(?<![a-z0-9])(?:${words.map(w => (w.endsWith('*') ? `${escape(flatten(w.slice(0, -1)))}[a-z0-9]*` : escape(flatten(w)))).join('|')})(?![a-z0-9])`, 'g')
    : undefined

const WEAK = 0.5
const MATCHERS = ROLES.map(r => ({
  name: r.name,
  strong: compile(r.words.filter(w => !w.startsWith('~'))),
  weak: compile(r.words.filter(w => w.startsWith('~')).map(w => w.slice(1))),
}))

const ROLE_NAMES = new Set(ROLES.map(r => r.name))

/** The role a subagent type name says outright, or undefined. */
const roleOfType = (type: string): string | undefined => {
  const bare = flatten(type.replace(/^[^:]*:/, '')).replace(/ /g, '-')
  if (!bare || bare.startsWith('savvy-')) return undefined
  if (ROLE_NAMES.has(bare)) return bare
  const whole = ROLES.find(r => r.aliases.includes(bare))
  if (whole) return whole.name
  const tokens = bare.split('-')
  // Specific words first, first to last (`test-engineer` is a tester, `ui-designer` a designer).
  for (const tok of tokens) {
    const hit = ROLES.find(r => r.aliases.includes(tok))
    if (hit) return hit.name
  }
  for (const tok of tokens) {
    const hit = ROLES.find(r => r.generic?.includes(tok))
    if (hit) return hit.name
  }
  return undefined
}

/**
 * The role whose keywords score highest (a strong word 1, a weak word 0.5); a tie goes to
 * the one that hit first in the text, then to the order of ROLES. `skip` leaves a role out
 * and `min` is the score a role needs to count at all.
 */
const roleOfText = (description: string, skip?: string, min = WEAK): string | undefined => {
  // "code review" is a review, not code: collapse the phrase before counting words.
  const text = flatten(description).replace(/\bcode review\w*|\brevision(?:es)? de codigo\b/g, 'review')
  if (!text) return undefined
  let best: { name: string; score: number; first: number } | undefined
  for (const { name, strong, weak } of MATCHERS) {
    if (name === skip) continue
    let score = 0
    let first = Infinity
    for (const [re, weight] of [[strong, 1], [weak, WEAK]] as const) {
      if (!re) continue
      re.lastIndex = 0
      for (const m of text.matchAll(re)) {
        score += weight
        first = Math.min(first, m.index ?? 0)
      }
    }
    if (score < min) continue
    if (!best || score > best.score || (score === best.score && first < best.first)) best = { name, score, first }
  }
  return best?.name
}

/**
 * Role of an agent from its subagent type and task description, or undefined when
 * nothing says (the panel then wears the model tier's costume). The `Explore` type is
 * already the pirate scout: it never becomes a researcher, and only a strong role word
 * (not a bare "code" or "write") takes it out of the pirate costume.
 */
export const roleOf = (type: string, description = ''): string | undefined => {
  const byType = roleOfType(type)
  if (byType) return byType
  const bare = flatten(type.replace(/^[^:]*:/, ''))
  // The scout needs a real role word (score 1), and is never a researcher: that is the pirate's job.
  return bare === 'explore' ? roleOfText(description, 'researcher', 1) : roleOfText(description)
}
