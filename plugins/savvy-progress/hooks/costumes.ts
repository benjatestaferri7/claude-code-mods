// Pixel Clawd from DockCrab (Clawdy): a 24×18 crab on a 30×28 grid. One costume per
// model tier, plus one per ROLE (hooks/roles.ts). The body keeps the brand clay; the
// tier's colour lives in the costume's accent `t`, so a role costume still says which
// model tier is behind it.
//
// To add a role costume: add a function to ROLE_COSTUMES under the role's name, put
// the props that move in their own `cls` group, and add `.c-<role>.run .<cls>` rules
// to CRAB_CSS. Everything is plain SVG rects: no images, no scripts.

export const CRAB_BOX = 30

export const TIER_COLOR: Record<string, string> = {
  fable: '#7F77DD',
  heavy: '#D85A30',
  careful: '#BA7517',
  medium: '#378ADD',
  light: '#1D9E75',
  other: '#888780',
}

export const colorOf = (tier: string): string => TIER_COLOR[tier] ?? '#888780'

export const CLAY = '#D97757'
const INK = '#1F1E1D'

// `cls` puts a pixel in a named group: `bd` (the default) is the body and its
// costume, `la`/`lb` the leg pairs, anything else a prop with its own motion.
export type Fill = (x: number, y: number, w: number, h: number, c: string, cls?: string) => void

const stamp = (f: Fill, x: number, y: number, rows: string[], map: Record<string, string>, cls?: string): void =>
  rows.forEach((row, dy) => [...row].forEach((ch, dx) => map[ch] && f(x + dx, y + dy, 1, 1, map[ch] ?? '', cls)))

// A #rrggbb colour moved toward white (amount > 0) or black (amount < 0).
export const shade = (hex: string, amount: number): string => {
  const n = Number.parseInt(hex.slice(1), 16)
  const mix = (c: number) => Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount))
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(mix)
  return `#${[r, g, b].map(c => (c ?? 0).toString(16).padStart(2, '0')).join('')}`
}

// `armFront`/`leftFront` move a claw down (+) or up (-); the `Cls` args put a claw in
// a group of its own so it can travel with the prop it holds, or move on its own.
const crabBody = (f: Fill, armFront = 0, armCls?: string, leftFront = 0, leftCls?: string): void => {
  f(7, 10, 16, 12, CLAY)
  f(3, 14 + leftFront, 4, 4, CLAY, leftCls)
  f(23, 14 + armFront, 4, 4, CLAY, armCls)
  f(9, 12, 2, 2, INK)
  f(19, 12, 2, 2, INK)
  f(7, 22, 2, 4, CLAY, 'la')
  f(17, 22, 2, 4, CLAY, 'la')
  f(11, 22, 2, 4, CLAY, 'lb')
  f(21, 22, 2, 4, CLAY, 'lb')
}

// Pure CSS, run by the compositor: no redraws. Periods divide one second, so the
// once-a-second redraw of a running row restarts them in phase. Every crab walks
// (the typists stand still); each costume adds its prop's own motion on top. A prop
// is a `<g>`, so the one reduced-motion rule at the end stops every animation here,
// and every prop's resting look (all checks shown, the ink line whole) is its static one.
export const CRAB_CSS = `<style>
.run .la{animation:st .5s steps(1) infinite}.run .lb{animation:st .5s steps(1) infinite -.25s}
.run .bd{animation:bob .5s steps(1) infinite -.125s}
.run g{transform-box:fill-box}
@keyframes st{50%{transform:translateY(-1px)}}@keyframes bob{50%{transform:translateY(1px)}}
.c-fable.run{animation:float 1s ease-in-out infinite}
.c-fable.run .la,.c-fable.run .lb,.c-fable.run .bd{animation:none}
.c-fable.run .ant{animation:blink 1s steps(1) infinite}
.c-fable.run .star{animation:blink .5s steps(1) infinite -.25s}
@keyframes float{50%{transform:translateY(-2px)}}@keyframes blink{50%{opacity:.15}}
.c-heavy.run .it{animation:scan 1s steps(1) infinite}
.c-heavy.run .gl{animation:blink 1s steps(1) infinite -.5s}
@keyframes scan{25%{transform:translate(-1px,1px)}50%{transform:translate(-2px,2px)}75%{transform:translate(-1px,1px)}}
.c-careful.run .it{transform-origin:100% 100%;animation:twist .5s ease-in-out infinite}
@keyframes twist{50%{transform:rotate(-35deg)}}
.c-medium.run .pan{transform-origin:0 50%;animation:tilt 1s ease-in-out infinite}
.c-medium.run .egg{animation:flip 1s ease-in-out infinite}
@keyframes tilt{20%,40%{transform:rotate(-12deg)}}@keyframes flip{30%{transform:translateY(-5px) scaleY(-1)}60%{transform:translateY(0)}}
.c-light.run .la{animation-duration:.25s}.c-light.run .lb{animation-duration:.25s;animation-delay:-.125s}
.c-light.run .flag{transform-origin:0 50%;animation:wave .25s steps(1) infinite}
@keyframes wave{50%{transform:skewY(-12deg) scaleX(.85)}}
.c-explore.run .it{transform-origin:50% 100%;animation:fence .5s ease-in-out infinite}
@keyframes fence{50%{transform:rotate(25deg)}}
.c-designer.run .it{transform-origin:50% 100%;animation:paint 1s ease-in-out infinite}
.c-designer.run .dab{animation:blink .5s steps(1) infinite}.c-designer.run .dbb{animation:blink .5s steps(1) infinite -.25s}
@keyframes paint{0%,100%{transform:rotate(-10deg)}50%{transform:rotate(12deg)}}
.c-developer.run .la,.c-developer.run .lb,.c-developer.run .bd{animation:none}
.c-developer.run .cl{animation:tap .25s steps(1) infinite}.c-developer.run .cr{animation:tap .25s steps(1) infinite -.125s}
.c-developer.run .l1{animation:blink 1s steps(1) infinite}.c-developer.run .l2{animation:blink 1s steps(1) infinite -.33s}.c-developer.run .l3{animation:blink 1s steps(1) infinite -.66s}
.c-developer.run .cur{animation:blink .5s steps(1) infinite}
@keyframes tap{50%{transform:translateY(2px)}}
.c-writer.run .la,.c-writer.run .lb,.c-writer.run .bd{animation:none}
.c-writer.run .it{animation:write .5s steps(1) infinite}
.c-writer.run .ink{transform-origin:0 50%;animation:grow 1s steps(5,jump-none) infinite}
@keyframes write{50%{transform:translate(-1px,1px)}}@keyframes grow{from{transform:scaleX(.1)}to{transform:scaleX(1)}}
.c-reviewer.run .c1{animation:k1 1s steps(1) infinite}.c-reviewer.run .c2{animation:k2 1s steps(1) infinite}.c-reviewer.run .c3{animation:k3 1s steps(1) infinite}
@keyframes k1{0%{opacity:0}25%{opacity:1}}@keyframes k2{0%,25%{opacity:0}50%{opacity:1}}@keyframes k3{0%,50%{opacity:0}75%{opacity:1}}
.c-tester.run .b1{animation:rise 1s steps(6) infinite}.c-tester.run .b2{animation:rise 1s steps(6) infinite -.33s}.c-tester.run .b3{animation:rise 1s steps(6) infinite -.66s}
@keyframes rise{0%{transform:translateY(0);opacity:1}80%{opacity:1}100%{transform:translateY(-6px);opacity:0}}
.c-researcher.run .it{animation:look 1s steps(1) infinite}
@keyframes look{25%{transform:translateX(-1px)}50%{transform:translateX(0)}75%{transform:translateX(1px)}}
.c-devops.run .gear{transform-origin:50% 50%;animation:spin .5s steps(4) infinite}
@keyframes spin{to{transform:rotate(90deg)}}
.c-data.run .b1,.c-data.run .b2,.c-data.run .b3,.c-data.run .b4,.c-data.run .b5{transform-origin:50% 100%;animation:bars 1s steps(4) infinite}
.c-data.run .b2{animation-delay:-.2s}.c-data.run .b3{animation-delay:-.4s}.c-data.run .b4{animation-delay:-.6s}.c-data.run .b5{animation-delay:-.8s}
@keyframes bars{0%,100%{transform:scaleY(.6)}50%{transform:scaleY(1.25)}}
@media (prefers-reduced-motion: reduce){.run,.run g{animation:none!important}}
</style>`

export type Costume = (f: Fill, t: string) => void

const TIER_COSTUMES: Record<string, Costume> = {
  // Fable: astronaut in a glass dome; floats instead of walking, the antenna and the star blink.
  fable: (f, t) => {
    crabBody(f)
    f(6, 7, 18, 1, '#E6E8EE'); f(5, 8, 1, 14, '#E6E8EE'); f(24, 8, 1, 14, '#E6E8EE'); f(6, 22, 18, 1, '#C9CCD2')
    f(6, 8, 18, 14, 'rgba(169,214,245,.32)'); f(8, 9, 2, 1, '#fff'); f(8, 10, 1, 2, '#fff')
    f(14, 4, 2, 3, '#C9CCD2'); f(14, 2, 2, 2, t, 'ant'); f(13, 18, 4, 2, t)
    f(27, 3, 1, 3, '#F5C542', 'star'); f(26, 4, 3, 1, '#F5C542', 'star')
  },
  // Heavy: detective with a deerstalker; the magnifier sweeps and glints.
  heavy: (f, t) => {
    crabBody(f, -4, 'it')
    stamp(f, 6, 3, ['......bbbbbb......', '....bbcbbcbbbb....', '...bbbbbbbbbbbb...', '..bcbbcbbcbbcbbb..', '.bbbbbbbbbbbbbbbb.', 'dddddddddddddddddd'], { b: '#7A4A26', c: '#A0703F', d: '#5A3519' })
    f(6, 9, 18, 1, t)
    stamp(f, 23, 1, ['.kkk.', 'k...k', 'k...k', 'k...k', '.kkk.'], { k: '#3A3A3C' }, 'it')
    f(24, 2, 3, 3, 'rgba(169,214,245,.7)', 'it'); f(25, 6, 1, 4, '#7A4A26', 'it'); f(24, 2, 1, 1, '#fff', 'gl')
  },
  // Careful: engineer in a hard hat; the wrench turns a bolt.
  careful: (f, t) => {
    crabBody(f)
    stamp(f, 6, 4, ['.....yyyyyyyy.....', '...yyyyyhhyyyyy...', '..yyyyyyhhyyyyyy..', '..yyyyyyhhyyyyyy..', '.yyyyyyyhhyyyyyyy.', 'dddddddddddddddddd'], { y: '#F5C542', h: '#FBE08A', d: '#C99A1E' })
    f(13, 5, 4, 2, t)
    stamp(f, 0, 10, ['.s.s', 'sss.', '.s..', '.s..'], { s: '#8E929A' }, 'it')
  },
  // Medium: chef, the toque traced from DockCrab's Sprites.chefHat; tosses the omelette.
  medium: (f, t) => {
    crabBody(f, -4, 'pan')
    stamp(f, 6, 0, ['........lll.......', '.......lllll......', '.wwwwgwwwwwwgwwwww', 'wwwwwwwwwwwwwwwwww', 'wwwwwwwwwwwwwwwwww', 'wwwwwgwwwwwggwwwww', '.wwwwgwwwwwggwwwww', '.dddbbbbbbbbbbbbb.', '.dddbbbbbbbbbbbbb.', '.dddbbbbbbbbbbbbb.'], { w: '#F4F3EE', l: '#F7F6F2', g: '#D2D1C8', b: t, d: '#B45F43' })
    f(22, 8, 7, 2, '#4A4A48', 'pan'); f(26, 10, 1, 1, '#4A4A48', 'pan'); f(24, 7, 3, 1, '#F5B731', 'egg')
  },
  // Light: racer in a helmet; runs at double pace, the checkered flag flutters.
  light: (f, t) => {
    crabBody(f, -4)
    stamp(f, 6, 5, ['....rrrrrrrrrr....', '..rrrrrrwwrrrrrr..', '.rrrrrrrwwrrrrrrr.', '.rrrrrrrwwrrrrrrr.', '.rrrrrrrwwrrrrrrr.', '.kkkkkkkkkkkkkkkkr'], { r: t, w: '#F8F6F1', k: INK })
    f(25, 1, 1, 9, '#8E929A')
    stamp(f, 26, 1, ['wkwk', 'kwkw', 'wkwk'], { w: '#F8F6F1', k: INK }, 'flag')
  },
  // Explore: pirate scouting the code; the cutlass fences.
  explore: f => {
    crabBody(f)
    stamp(f, 5, 3, ['.kk..............kk.', '.kkk....kkkk....kkk.', '..kkkkkkkwwkkkkkkk..', '..kkkkkkkkkkkkkkkk..', '.gggggggggggggggggg.'], { k: '#55514C', w: '#F8F6F1', g: '#F5C542' })
    f(7, 11, 11, 1, INK); f(18, 11, 4, 3, INK)
    f(27, 6, 1, 9, '#C9CCD2', 'it'); f(26, 15, 3, 1, '#7A4A26', 'it')
  },
  other: f => crabBody(f),
}

// Role costumes: the same crab, dressed for the job. The tier colour `t` is always
// part of the outfit (a hat, a lens ring, liquid, bars), so the model tier stays visible.
export const ROLE_COSTUMES: Record<string, Costume> = {
  // Designer: tilted beret, a palette in one claw and a brush that strokes in the other.
  designer: (f, t) => {
    crabBody(f, -4, 'it')
    const d = shade(t, -0.3)
    const h = shade(t, 0.4)
    stamp(f, 7, 3, ['...........dd..', '.....bbbbbbbb..', '..bhhbbbbbbbbb.', '.bhbbbbbbbbbbbb', 'bbbbbbbbbbbbbb.', 'dddddddddddd...', '.dddddd........'], { b: t, h, d })
    stamp(f, 0, 9, ['..wwww.', '.wrwyww', 'wwwwwbw', 'wgwkwww', '.wwwww.'], { w: '#D8A867', r: '#E5484D', y: '#F5C542', b: '#3E7BD9', g: '#3FAE6A', k: '#6B4521' })
    // Brush: bristles in the tier colour, silver ferrule, wooden handle.
    f(24, 5, 2, 5, '#8A5A2B', 'it'); f(24, 3, 2, 2, '#C9CCD2', 'it')
    f(24, 1, 2, 2, t, 'it'); f(25, 0, 1, 1, t, 'it')
    f(27, 4, 1, 1, t, 'dab'); f(28, 6, 1, 1, '#E5484D', 'dbb'); f(27, 8, 1, 1, '#F5C542', 'dab')
  },
  // Developer: beanie, an open laptop with a glowing screen, claws that tap on the base.
  developer: (f, t) => {
    crabBody(f, 3, 'cr', 3, 'cl')
    const h = shade(t, 0.5)
    const d = shade(t, -0.3)
    stamp(f, 7, 3, ['.......hh.......', '.......hh.......', '...bbbbbbbbbb...', '..bbbbbbbbbbbb..', '.bbbbbbbbbbbbbb.', 'bbbbbbbbbbbbbbbb', 'dbdbdbdbdbdbdbdb'], { b: t, h, d })
    f(8, 14, 15, 7, '#2B2D33'); f(9, 15, 13, 5, '#0E1B24')
    f(6, 21, 19, 1, '#C9CCD2'); f(14, 21, 3, 1, '#8E929A')
    f(10, 15, 6, 1, t, 'l1'); f(12, 17, 9, 1, '#7EE2B8', 'l2'); f(10, 19, 5, 1, '#F5C542', 'l3'); f(16, 19, 1, 1, '#fff', 'cur')
  },
  // Writer: newsboy cap, a sheet of paper and a quill; the ink line grows as it writes.
  writer: (f, t) => {
    crabBody(f, 3, 'it')
    const h = shade(t, 0.4)
    const d = shade(t, -0.3)
    stamp(f, 7, 6, ['....hbbbbbbbbb....', '..bbbbbbbbbbbbbb..', '.bbbbbbbbbbbbbbbb.', 'dddddddddddddddddd'], { b: t, h, d })
    f(5, 9, 5, 1, d)
    f(9, 14, 13, 8, '#F8F6F1'); f(9, 21, 13, 1, '#D8D6CC'); f(21, 14, 1, 8, '#E6E4DB')
    f(11, 16, 8, 1, '#B9B7AE'); f(11, 18, 6, 1, '#B9B7AE'); f(11, 20, 9, 1, t, 'ink')
    // Quill: a feather blade up top, a bare shaft below, the nib at the paper's edge.
    const qx = (y: number) => 22 + Math.round(((20 - y) * 6) / 17)
    for (let y = 20; y >= 4; y--) {
      const x = qx(y)
      if (y > 12) f(x, y, 1, 1, y === 20 ? '#2A2A2C' : '#5A4630', 'it')
      else {
        f(x - 1, y, 1, 1, shade(t, 0.55), 'it'); f(x, y, 1, 1, shade(t, -0.35), 'it'); f(x + 1, y, 1, 1, t, 'it')
        if (y >= 5 && y <= 10 && x + 2 <= 29) f(x + 2, y, 1, 1, shade(t, 0.3), 'it')
      }
    }
    f(qx(3), 3, 1, 1, t, 'it')
  },
  // Reviewer: eyeshade, round glasses, a clipboard whose checks appear one by one.
  reviewer: (f, t) => {
    crabBody(f, -4)
    f(9, 7, 13, 1, '#6DBE8A'); f(7, 8, 17, 1, '#6DBE8A'); f(6, 9, 19, 1, '#3F8C5E')
    const ring = ['.##.', '#..#', '#..#', '.##.']
    stamp(f, 8, 11, ring, { '#': t }); stamp(f, 18, 11, ring, { '#': t })
    f(12, 12, 6, 1, t); f(7, 12, 1, 1, t); f(22, 12, 1, 1, t)
    f(23, 1, 7, 9, '#B07A45'); f(24, 3, 5, 6, '#F8F6F1'); f(25, 0, 3, 2, '#C9CCD2')
    ;[3, 5, 7].forEach((y, i) => {
      f(24, y, 1, 1, '#2F9E5B', `c${i + 1}`); f(26, y, 1, 1, '#2F9E5B', `c${i + 1}`); f(25, y + 1, 1, 1, '#2F9E5B', `c${i + 1}`)
      f(27, y + 1, 2, 1, '#B9B7AE')
    })
  },
  // Tester: surgical cap, safety goggles, a flask whose bubbles rise.
  tester: (f, t) => {
    crabBody(f, -4)
    stamp(f, 7, 6, ['...cccccccccc...', '.cccccccchcccccc.', 'cccccccccccccccc.', 'dddddddddddddddd.'], { c: '#BFDDF2', h: '#E4F2FB', d: '#8FB8D6' })
    const lens = 'rgba(190,230,250,.7)'
    for (const x of [8, 17]) {
      f(x, 11, 5, 1, t); f(x, 14, 5, 1, t); f(x, 12, 1, 2, t); f(x + 4, 12, 1, 2, t); f(x + 1, 12, 3, 2, lens)
    }
    f(13, 12, 4, 2, t); f(7, 12, 1, 2, '#3A3A3C'); f(22, 12, 1, 2, '#3A3A3C')
    stamp(f, 23, 2, ['..eee..', '..e.e..', '..e.e..', '.eqqqe.', 'eqqqqqe', 'eqqqqqe', 'eqqqqqe', 'eeeeeee'], { e: '#DCE6EE', q: t })
    f(26, 3, 1, 2, 'rgba(169,214,245,.45)')
    f(24, 6, 1, 2, shade(t, 0.5))
    ;[1, 2, 3].forEach(i => f(26, 7, 1, 1, '#7CCBF0', `b${i}`))
  },
  // Researcher: pith helmet and binoculars that scan from side to side.
  researcher: (f, t) => {
    crabBody(f)
    f(13, 3, 5, 1, '#D9BC82'); f(10, 4, 11, 1, '#C9A66B'); f(11, 4, 3, 1, '#E0C48C'); f(9, 5, 13, 1, '#C9A66B')
    f(8, 6, 15, 1, '#C9A66B'); f(7, 7, 17, 1, '#C9A66B'); f(7, 8, 17, 1, t); f(5, 9, 21, 1, '#9C7B45')
    const dark = '#33343A'
    for (const x of [7, 18]) {
      f(x, 10, 6, 1, dark, 'it'); f(x, 15, 6, 1, t, 'it'); f(x, 11, 1, 4, dark, 'it'); f(x + 5, 11, 1, 4, dark, 'it')
      f(x + 1, 11, 4, 4, 'rgba(150,205,240,.5)', 'it'); f(x + 1, 11, 1, 1, '#fff', 'it')
    }
    f(13, 11, 5, 3, dark, 'it'); f(14, 12, 3, 1, t, 'it')
  },
  // DevOps: one-ear headset with a mic, and a gear that turns (4-fold symmetric, so a quarter turn loops).
  devops: (f, t) => {
    crabBody(f, -4)
    const dk = '#5A5C66'
    f(7, 8, 17, 1, dk); f(9, 7, 13, 1, dk); f(22, 9, 2, 2, dk); f(5, 8, 3, 5, dk); f(5, 9, 2, 3, t)
    f(7, 13, 1, 1, dk); f(8, 14, 1, 1, dk); f(9, 15, 1, 1, dk); f(10, 15, 3, 2, dk); f(12, 15, 1, 2, t)
    const body = ['.......', '..ggg..', '.ggggg.', '.gg.gg.', '.ggggg.', '..ggg..', '.......']
    stamp(f, 23, 3, body, { g: '#A9ADB5' }, 'gear')
    for (const [x, y] of [[26, 3], [26, 9], [23, 6], [29, 6]] as const) f(x, y, 1, 1, '#A9ADB5', 'gear')
    f(26, 6, 1, 1, t, 'gear')
  },
  // Data: mortarboard with a tassel, and a bar chart whose bars rise and fall.
  data: (f, t) => {
    crabBody(f)
    const d = shade(t, -0.25)
    f(10, 5, 11, 1, '#6A6A74'); f(6, 6, 19, 1, '#4A4A52'); f(9, 7, 13, 3, '#4A4A52'); f(15, 4, 1, 1, t)
    f(24, 7, 1, 4, t); f(23, 11, 3, 1, d)
    f(6, 14, 19, 8, '#F4F3EE'); f(6, 21, 19, 1, '#CFCDC2'); f(7, 20, 17, 1, '#7D7D79')
    ;[[9, 2], [12, 4], [15, 3], [18, 4], [21, 2]].forEach(([x, h], i) => f(x ?? 0, 20 - (h ?? 0), 2, h ?? 0, i % 2 ? shade(t, 0.35) : t, `b${i + 1}`))
  },
}

const COSTUMES: Record<string, Costume> = { ...TIER_COSTUMES, ...ROLE_COSTUMES }

/** The costume key for an agent: its role's if there is one, else Explore's pirate, else its tier's. */
export const costumeKey = (type: string, tier: string, role?: string): string =>
  role && Object.hasOwn(ROLE_COSTUMES, role) ? role : type === 'Explore' ? 'explore' : tier

// Body and props nest inside `bd` so a prop rides the bob and adds its own motion;
// legs stay outside it and step on their own. `mirror` flips the crab inside its
// own box (x .. x + CRAB_BOX * scale) so it faces left. `tint` is the tier colour.
export const crab = (x: number, y: number, costume: string, tint: string, dim: boolean, isWalking: boolean, scale: number, mirror: boolean): string => {
  const groups = new Map<string, string[]>([['bd', []]])
  const f: Fill = (cx, cy, w, h, c, cls = 'bd') => {
    if (!groups.has(cls)) groups.set(cls, [])
    groups.get(cls)?.push(`<rect x="${cx}" y="${cy}" width="${w}" height="${h}" fill="${c}"/>`)
  }
  const draw = COSTUMES[costume] ?? ((g: Fill) => crabBody(g))
  draw(f, tint)
  const group = (cls: string) => `<g class="${cls}">${(groups.get(cls) ?? []).join('')}</g>`
  const props = [...groups.keys()].filter(k => k !== 'bd' && k !== 'la' && k !== 'lb')
  const body = `<g class="bd">${(groups.get('bd') ?? []).join('')}${props.map(group).join('')}</g>`
  const place = mirror ? `translate(${x + CRAB_BOX * scale},${y}) scale(${-scale},${scale})` : `translate(${x},${y}) scale(${scale})`
  return `<g transform="${place}" opacity="${dim ? 0.45 : 1}" shape-rendering="crispEdges"><g class="c-${costume}${isWalking ? ' run' : ''}">${body}${group('la')}${group('lb')}</g></g>`
}
