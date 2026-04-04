function decodeEntities(input) {
  if (!input) return ''
  const textarea = document.createElement('textarea')
  textarea.innerHTML = input
  return textarea.value
}

function formatXml(xml) {
  const withoutWhitespace = xml
    .replace(/\r/g, '')
    .replace(/>\s+</g, '><')
    .trim()

  const parts = withoutWhitespace.split(/(?=<)/g).filter(Boolean)
  let indent = 0
  const lines = []

  for (const part of parts) {
    const trimmed = part.trim()
    const isClosingTag = /^<\//.test(trimmed)
    const isSelfClosing = /\/>$/.test(trimmed) || /^<\?/.test(trimmed) || /^<!/.test(trimmed)
    if (isClosingTag) indent = Math.max(0, indent - 1)
    lines.push(`${'  '.repeat(indent)}${trimmed}`)
    if (!isClosingTag && !isSelfClosing && /^<[^!?/][^>]*>$/.test(trimmed)) indent += 1
  }

  return lines.join('\n')
}

export default function decodeXml(input) {
  const decoded = decodeEntities(input)
  if (!decoded.trim()) return ''
  return formatXml(decoded)
}
