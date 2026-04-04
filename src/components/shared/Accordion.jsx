import { useId, useState } from 'react'
import './Accordion.scss'

export default function Accordion({ title, children, defaultOpen = false }) {
  const reactId = useId()
  const panelId = `accordion-panel-${reactId}`
  const buttonId = `accordion-button-${reactId}`
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="accordion">
      <button
        type="button"
        className="accordion__trigger"
        aria-expanded={open}
        aria-controls={panelId}
        id={buttonId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="accordion__title">{title}</span>
        <span className="accordion__icon" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        className={open ? 'accordion__panel accordion__panel--open' : 'accordion__panel'}
      >
        <div className="accordion__content">{children}</div>
      </div>
    </div>
  )
}
