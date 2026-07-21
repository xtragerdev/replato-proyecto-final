import { Clock3, MapPin, PackageOpen, ShieldCheck } from 'lucide-react'
import { memo } from 'react'
import { Link } from 'react-router-dom'
import { categoryLabel, formatPickup } from '../../utils/format.js'
import { Price } from './Price.jsx'

export const FoodPackCard = memo(function FoodPackCard({ pack }) {
  return (
    <article className="food-card">
      <Link className="food-card-image" to={`/ofertas/${pack._id}`} aria-label={`Ver ${pack.title}`}>
        <img src={pack.image?.url} alt="" loading="lazy" decoding="async" width="560" height="400" />
        <span className="category-badge">{categoryLabel(pack.category)}</span>
        {pack.isFeatured && <span className="featured-badge">Recomendado</span>}
      </Link>
      <div className="food-card-body">
        <div className="food-card-business">
          <span>{pack.establishment?.name}</span>
          {pack.establishment?.isVerified && <ShieldCheck size={15} aria-label="Comercio verificado" />}
        </div>
        <h3><Link to={`/ofertas/${pack._id}`}>{pack.title}</Link></h3>
        <div className="food-card-meta">
          <span><Clock3 size={15} /> {formatPickup(pack.pickupStart, 'EEE · HH:mm')}</span>
          <span><MapPin size={15} /> {pack.establishment?.address?.city}</span>
          <span><PackageOpen size={15} /> {pack.stockRemaining} packs</span>
        </div>
        <div className="food-card-footer">
          <Price original={pack.originalPriceCents} current={pack.salePriceCents} />
          <Link className="circle-link" to={`/ofertas/${pack._id}`} aria-label={`Reservar ${pack.title}`}>→</Link>
        </div>
      </div>
    </article>
  )
})

