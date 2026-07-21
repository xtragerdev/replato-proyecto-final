import { RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Logo({ compact = false }) {
  return (
    <Link className="logo" to="/" aria-label="RePlato, página de inicio">
      <span className="logo-mark" aria-hidden="true"><RotateCcw size={19} /></span>
      {!compact && <span>replato</span>}
    </Link>
  )
}

