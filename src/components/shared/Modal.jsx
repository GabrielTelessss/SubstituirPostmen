import { useEffect } from 'react'
import './Modal.scss'

export default function Modal({ open, title, children, onClose }) {
  useEffect(() => {
    if (!open) return

    function onKeyDown(e) {
      if (e.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title || 'Modal'}>
      <div className="modal__backdrop" onClick={() => onClose?.()} />
      <div className="modal__panel">
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button type="button" className="modal__close" onClick={() => onClose?.()}>
            Fechar
          </button>
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  )
}
