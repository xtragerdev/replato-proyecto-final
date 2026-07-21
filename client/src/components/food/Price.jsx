import { formatPrice } from '../../utils/format.js'

export function Price({ original, current, large = false }) {
  const saving = Math.max(0, Math.round((1 - current / original) * 100))
  return (
    <div className={`price ${large ? 'price-large' : ''}`}>
      <strong>{formatPrice(current)}</strong>
      <span>{formatPrice(original)}</span>
      <em>-{saving}%</em>
    </div>
  )
}

