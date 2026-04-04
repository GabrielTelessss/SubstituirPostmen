import { useState } from 'react'
import './CopyButton.scss'

export default function CopyButton({ text, label = 'Copiar', disabled }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      type="button"
      className="copyButton"
      onClick={handleCopy}
      disabled={disabled || !text}
    >
      {copied ? 'Copiado' : label}
    </button>
  )
}
