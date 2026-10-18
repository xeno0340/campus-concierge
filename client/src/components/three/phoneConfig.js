// Scroll progress (0 to 1) at which each text step begins.
// 0 = intro, 1 = Browse, 2 = Slot, 3 = Pay, 4 = Track
export const STEP_AT = [0, 0.38, 0.52, 0.66, 0.8]

export function stepFor(p) {
  let step = 0
  for (let i = 0; i < STEP_AT.length; i++) if (p >= STEP_AT[i]) step = i
  return step
}