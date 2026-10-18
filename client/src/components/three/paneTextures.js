import * as THREE from 'three'

const W = 490
const H = 1000
const S = 1.5 // pixel density of the texture

const C = {
  bg: '#FAF7F2',
  surface: '#FFFFFF',
  surface2: '#F3EEE6',
  ink: '#1F2430',
  muted: '#5F6572',
  line: '#E7E0D4',
  primary: '#1E2A4A',
  onPrimary: '#FAF7F2',
  accent: '#B08D57',
  accentStrong: '#8A6A38',
  success: '#4F7F6B',
}
const SERIF = '"Instrument Serif", Georgia, serif'
const SANS = 'Inter, system-ui, sans-serif'

function rr(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  if (fill) {
    ctx.fillStyle = fill
    ctx.fill()
  }
  if (stroke) {
    ctx.strokeStyle = stroke
    ctx.lineWidth = 1.5
    ctx.stroke()
  }
}

function txt(ctx, str, x, y, { size = 16, weight = 400, color = C.ink, font = SANS, align = 'left' } = {}) {
  ctx.font = `${weight} ${size}px ${font}`
  ctx.fillStyle = color
  ctx.textAlign = align
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(str, x, y)
}

function header(ctx, title, sub) {
    txt(ctx, '9:41', 58, 60, { size: 16, weight: 600 })
  rr(ctx, W - 92, 46, 30, 14, 4, C.ink)
  txt(ctx, title, 32, 128, { size: 46, font: SERIF })
  txt(ctx, sub, 32, 158, { size: 16, color: C.muted })
}

function cta(ctx, label, y = 880) {
  rr(ctx, 32, y, W - 64, 64, 32, C.primary)
  txt(ctx, label, W / 2, y + 40, { size: 17, weight: 600, color: C.onPrimary, align: 'center' })
}

function paintBrowse(ctx) {
  header(ctx, 'Discover', 'Book a campus service')
  rr(ctx, 32, 184, W - 64, 48, 24, C.surface2)
  txt(ctx, 'Search labs, courts, halls', 56, 214, { size: 15, color: C.muted })

  let x = 32
  ;[['All', 56], ['Labs', 70], ['Sports', 82], ['Halls', 70]].forEach(([label, w], i) => {
    rr(ctx, x, 252, w, 36, 18, i === 0 ? C.primary : C.surface2)
    txt(ctx, label, x + w / 2, 275, {
      size: 14,
      weight: 500,
      color: i === 0 ? C.onPrimary : C.ink,
      align: 'center',
    })
    x += w + 10
  })

  const rows = [
    ['Computer Lab', 'CSE Block, Lab 3', 'Free', '#1E2A4A', '#3B4A74'],
    ['Basketball Court', 'Sports Complex', '100 / slot', '#8A6A38', '#C9A66B'],
    ['Meeting Hall', 'Admin Block', '500 / slot', '#4F6F99', '#8FAAD0'],
  ]
  rows.forEach(([name, place, price, c1, c2], i) => {
    const y = 316 + i * 148
    rr(ctx, 32, y, W - 64, 128, 22, C.surface, C.line)
    const g = ctx.createLinearGradient(44, y + 12, 148, y + 116)
    g.addColorStop(0, c1)
    g.addColorStop(1, c2)
    rr(ctx, 44, y + 12, 104, 104, 16, g)
    txt(ctx, name, 168, y + 52, { size: 27, font: SERIF })
    txt(ctx, place, 168, y + 80, { size: 14, color: C.muted })
    txt(ctx, price, 168, y + 108, { size: 15, weight: 600 })
  })

  rr(ctx, 32, 896, W - 64, 64, 32, C.primary)
  ;['Home', 'Bookings', 'Profile'].forEach((l, i) => {
    txt(ctx, l, 32 + (W - 64) * (i + 0.5) / 3, 934, {
      size: 14,
      weight: 500,
      color: i === 0 ? '#C9A66B' : '#9AA1AE',
      align: 'center',
    })
  })
}

function paintSlot(ctx) {
  header(ctx, 'Pick a slot', 'Basketball Court, 60 min')
  const days = [['Mon', 20], ['Tue', 21], ['Wed', 22], ['Thu', 23], ['Fri', 24]]
  const cw = (W - 64) / 5
  days.forEach(([d, n], i) => {
    const x = 32 + i * cw + 4
    const sel = i === 1
    rr(ctx, x, 190, cw - 8, 92, 20, sel ? C.primary : C.surface2)
    txt(ctx, d, x + (cw - 8) / 2, 222, { size: 13, color: sel ? '#C9A66B' : C.muted, align: 'center' })
    txt(ctx, String(n), x + (cw - 8) / 2, 262, { size: 30, font: SERIF, color: sel ? C.onPrimary : C.ink, align: 'center' })
  })

  txt(ctx, 'Available times', 32, 336, { size: 15, color: C.muted })
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00']
  const colW = (W - 64 - 12) / 2
  times.forEach((t, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = 32 + col * (colW + 12)
    const y = 352 + row * 76
    const disabled = i === 1 || i === 4
    const sel = i === 2
    rr(ctx, x, y, colW, 64, 20, sel ? C.accent : disabled ? C.surface2 : C.surface, sel ? null : C.line)
    txt(ctx, t, x + colW / 2, y + 40, {
      size: 18,
      weight: 600,
      color: sel ? '#FFFFFF' : disabled ? '#A8ADB8' : C.ink,
      align: 'center',
    })
  })

  txt(ctx, 'Held for 10 minutes while you pay', W / 2, 862, { size: 14, color: C.muted, align: 'center' })
  cta(ctx, 'Hold slot  10:00')
}

function paintPay(ctx) {
  header(ctx, 'Confirm & pay', 'Review your booking')
  rr(ctx, 32, 184, W - 64, 214, 24, C.surface, C.line)
  txt(ctx, 'Basketball Court', 56, 232, { size: 30, font: SERIF })
  txt(ctx, 'Tue 21 Oct, 10:00 to 11:00', 56, 260, { size: 15, color: C.muted })
  ctx.fillStyle = C.line
  ctx.fillRect(56, 282, W - 112, 1.5)
  txt(ctx, 'Slot fee', 56, 316, { size: 15, color: C.muted })
  txt(ctx, '100', W - 56, 316, { size: 15, align: 'right' })
  txt(ctx, 'Convenience', 56, 346, { size: 15, color: C.muted })
  txt(ctx, '0', W - 56, 346, { size: 15, align: 'right' })
  txt(ctx, 'Total', 56, 382, { size: 17, weight: 600 })
  txt(ctx, '100', W - 56, 382, { size: 20, weight: 700, align: 'right' })

  rr(ctx, 32, 418, W - 64, 46, 16, '#F6EBD7')
  txt(ctx, 'Held for you  09:42', W / 2, 447, { size: 15, weight: 600, color: C.accentStrong, align: 'center' })

  txt(ctx, 'Pay with', 32, 512, { size: 15, color: C.muted })
  ;['UPI', 'Card', 'Net banking'].forEach((m, i) => {
    const y = 530 + i * 80
    rr(ctx, 32, y, W - 64, 64, 20, C.surface, i === 0 ? C.accent : C.line)
    rr(ctx, 54, y + 21, 22, 22, 11, null, i === 0 ? C.accent : '#C9C2B4')
    if (i === 0) rr(ctx, 59, y + 26, 12, 12, 6, C.accent)
    txt(ctx, m, 92, y + 40, { size: 17, weight: 500 })
  })

  cta(ctx, 'Pay securely', 800)
  txt(ctx, 'Razorpay, test mode', W / 2, 892, { size: 13, color: C.muted, align: 'center' })
}

function paintTrack(ctx) {
  header(ctx, 'Confirmed', 'Show this code at the venue')
  rr(ctx, 32, 184, W - 64, 330, 28, C.surface, C.line)

  let seed = 7
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  const n = 21
  const cell = 11
  const ox = (W - n * cell) / 2
  const oy = 206
  const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c > 13) || (r > 13 && c < 7)
  ctx.fillStyle = C.ink
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!inFinder(r, c) && rnd() > 0.52) ctx.fillRect(ox + c * cell, oy + r * cell, cell - 1, cell - 1)
    }
  }
  ;[[0, 0], [14, 0], [0, 14]].forEach(([c0, r0]) => {
    ctx.fillStyle = C.ink
    ctx.fillRect(ox + c0 * cell, oy + r0 * cell, 7 * cell - 1, 7 * cell - 1)
    ctx.fillStyle = C.surface
    ctx.fillRect(ox + (c0 + 1) * cell, oy + (r0 + 1) * cell, 5 * cell - 1, 5 * cell - 1)
    ctx.fillStyle = C.ink
    ctx.fillRect(ox + (c0 + 2) * cell, oy + (r0 + 2) * cell, 3 * cell - 1, 3 * cell - 1)
  })
  txt(ctx, 'CC-4F7K2A', W / 2, 486, { size: 22, weight: 600, align: 'center' })

  const steps = [
    ['Requested', '09:12', true],
    ['Approved', '09:20', true],
    ['Paid', '09:24', true],
    ['Checked in', 'Pending', false],
  ]
  ctx.fillStyle = C.line
  ctx.fillRect(59, 568, 2, 3 * 90)
  steps.forEach(([label, time, done], i) => {
    const y = 568 + i * 90
    if (done) rr(ctx, 48, y - 12, 24, 24, 12, C.success)
    else rr(ctx, 48, y - 12, 24, 24, 12, C.bg, C.accent)
    txt(ctx, label, 94, y + 2, { size: 20, font: SERIF })
    txt(ctx, time, 94, y + 26, { size: 14, color: C.muted })
  })
}

const PAINT = { browse: paintBrowse, slot: paintSlot, pay: paintPay, track: paintTrack }

function paint(ctx, kind) {
  ctx.save()
  ctx.scale(S, S)
  ctx.clearRect(0, 0, W, H)
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 66)
  ctx.clip()
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)
    PAINT[kind](ctx)
  // soft edge so the sheet reads against the dark background
  ctx.beginPath()
  ctx.roundRect(0, 0, W, H, 66)
  ctx.strokeStyle = 'rgba(31,36,48,0.22)'
  ctx.lineWidth = 5
  ctx.stroke()
  ctx.restore()
}

export function createPaneTexture(kind) {
  const canvas = document.createElement('canvas')
  canvas.width = W * S
  canvas.height = H * S
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  const redraw = () => {
    paint(ctx, kind)
    texture.needsUpdate = true
  }
  redraw()
  return { texture, redraw }
}