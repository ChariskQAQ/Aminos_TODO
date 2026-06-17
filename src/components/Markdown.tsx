import { useState, useEffect, useMemo } from 'react'

interface Props {
  text: string
}

let _marked: typeof import('marked').marked | null = null
let _DOMPurify: typeof import('dompurify').default | null = null
let _ready = false
let _pending: Promise<void> | null = null

function ensureLibs(): Promise<void> {
  if (_ready) return Promise.resolve()
  if (!_pending) {
    _pending = Promise.all([
      import('marked'),
      import('dompurify'),
    ]).then(([m, d]) => {
      _marked = m.marked
      _DOMPurify = d.default
      m.marked.setOptions({ breaks: true, gfm: true })
      _ready = true
    })
  }
  return _pending
}

export function Markdown({ text }: Props) {
  const [ready, setReady] = useState(_ready)

  useEffect(() => {
    if (!_ready) {
      ensureLibs().then(() => setReady(true))
    }
  }, [])

  const html = useMemo(() => {
    if (!_marked || !_DOMPurify || !text.trim()) return ''
    const raw = _marked.parse(text) as string
    return _DOMPurify.sanitize(raw)
  }, [text, ready])

  if (!html) return null

  return (
    <div
      className="md-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
