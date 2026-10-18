import { motion } from 'framer-motion'

export default function SplitText({ text, as: Tag = 'h1', className = '', delay = 0 }) {
  const words = text.split(' ')

  return (
    <Tag className={className} aria-label={text.replaceAll('*', '')}>
      {words.map((raw, i) => {
        const em = raw.startsWith('*') && raw.endsWith('*')
        const word = em ? raw.slice(1, -1) : raw
        return (
          <span
            key={i}
            aria-hidden="true"
            className="-mb-[0.14em] mr-[0.22em] inline-block overflow-hidden pb-[0.14em] align-bottom"
          >
            <motion.span
              className={`inline-block ${em ? 'text-accent italic' : ''}`}
              initial={{ y: '115%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.95, delay: delay + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            >
              {word}
            </motion.span>
          </span>
        )
      })}
    </Tag>
  )
}