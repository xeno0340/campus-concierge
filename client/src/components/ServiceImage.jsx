import { useState } from 'react'
import CategoryArt from './CategoryArt.jsx'

// [pattern, file]. Name is checked first, then category. First match wins.
const RULES = [
  [/basketball/i, 'basketball'],
  [/badminton/i, 'badminton'],
  [/yoga|fitness|gym/i, 'yoga'],
  [/cricket|turf|football|tennis/i, 'sports'],
  [/\bai\b|research/i, 'ai-lab'],
  [/computer lab|\blab\b|laborator/i, 'lab'],
  [/meeting hall|meeting room|conference/i, 'meeting'],
  [/auditorium/i, 'auditorium'],
  [/seminar|\bhall\b|event/i, 'hall'],
  [/mentor|career|counsel/i, 'mentoring'],
  [/discussion|library|study|reading/i, 'study'],
  [/camera|dslr|projector|equipment/i, 'equipment'],
  [/studio|podcast|recording/i, 'studio'],
  [/health|wellness|clinic/i, 'health'],
]

function pickImage(category = '', name = '') {
  for (const text of [name, category]) {
    for (const [re, file] of RULES) if (re.test(text)) return file
  }
  return 'default'
}

export default function ServiceImage({ category, name, image, className = '' }) {
  const [failed, setFailed] = useState(false)
  const src = image || `/images/services/${pickImage(category, name)}.jpg`

  if (failed) return <CategoryArt category={category} />

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={name || category || 'Campus service'}
        loading="lazy"
        onError={() => setFailed(true)}
        className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-primary/10 mix-blend-multiply" />
    </div>
  )
}