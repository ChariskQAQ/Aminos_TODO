import type { ReactNode } from 'react'

interface Props {
  text: string
  query: string
}

export function Highlight({ text, query }: Props) {
  if (!query.trim()) return <>{text}</>

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  const nodes: ReactNode[] = []
  let i = 0
  for (const part of parts) {
    if (part.toLowerCase() === query.toLowerCase()) {
      nodes.push(<mark key={i} className="highlight-mark">{part}</mark>)
    } else if (part) {
      nodes.push(<span key={i}>{part}</span>)
    }
    i++
  }

  return <>{nodes}</>
}
