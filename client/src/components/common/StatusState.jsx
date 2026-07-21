import { AlertCircle, Inbox, LoaderCircle, RotateCcw } from 'lucide-react'

export function LoadingState({ label = 'Cargando…' }) {
  return (
    <div className="status-state" role="status">
      <LoaderCircle className="spin" size={28} />
      <p>{label}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="status-state status-error" role="alert">
      <AlertCircle size={30} />
      <div><strong>Algo no ha salido bien</strong><p>{message}</p></div>
      {onRetry && <button className="button button-secondary" type="button" onClick={onRetry}><RotateCcw size={16} /> Reintentar</button>}
    </div>
  )
}

export function EmptyState({ title = 'Todavía no hay nada aquí', text, action }) {
  return (
    <div className="status-state status-empty">
      <Inbox size={31} />
      <strong>{title}</strong>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

