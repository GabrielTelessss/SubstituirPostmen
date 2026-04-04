import './StatusBadge.scss'

const STATUS = {
  aguardando: { label: 'Aguardando envio', className: 'statusBadge--pending' },
  enviando: { label: 'Enviando…', className: 'statusBadge--pending' },
  autorizada: { label: 'Autorizada', className: 'statusBadge--success' },
  avisos: { label: 'Processado com avisos', className: 'statusBadge--warning' },
  rejeitada: { label: 'Rejeitada / Erro', className: 'statusBadge--error' },
}

export default function StatusBadge({ status = 'aguardando' }) {
  const cfg = STATUS[status] || STATUS.aguardando
  return <div className={`statusBadge ${cfg.className}`}>{cfg.label}</div>
}
