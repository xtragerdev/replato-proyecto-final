import { ArrowRight, Building2, Leaf, MapPin, Search, ShoppingBag, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorState, LoadingState } from '../components/common/StatusState.jsx'
import { FoodPackCard } from '../components/food/FoodPackCard.jsx'
import { useFeaturedPacks, useImpact } from '../hooks/useFoodPacks.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'

export default function HomePage() {
  useDocumentTitle('')
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const featured = useFeaturedPacks()
  const impact = useImpact()

  function handleSearch(event) {
    event.preventDefault()
    navigate(`/ofertas${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`)
  }

  return (
    <>
      <section className="home-hero">
        <div className="container hero-layout">
          <motion.div className="hero-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <p className="eyebrow"><Sparkles size={15} /> Comer bien también puede cambiar las cosas</p>
            <h1>Nada bueno termina en la basura.</h1>
            <p className="hero-lead">Encuentra packs de comida cerca de ti, ahorra y ayuda a los comercios de tu barrio a reducir el desperdicio.</p>
            <form className="hero-search" onSubmit={handleSearch}>
              <Search size={20} aria-hidden="true" />
              <label className="sr-only" htmlFor="home-search">Buscar comida o comercio</label>
              <input id="home-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pan, fruta, menú del día…" />
              <button className="button button-accent" type="submit">Buscar packs</button>
            </form>
            <div className="hero-proof">
              <span><span className="online-dot" /> Packs para hoy</span>
              <span><MapPin size={15} /> En ocho ciudades</span>
              <span><Leaf size={15} /> Impacto medible</span>
            </div>
          </motion.div>
          <motion.div className="hero-visual" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.65, delay: 0.12 }}>
            <img className="hero-image-main" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1100&q=85" alt="Puesto de frutas y verduras frescas" />
            <div className="hero-float-card">
              <span>Esta semana</span>
              <strong>{impact.data?.collectedReservations ?? 80} recogidas</strong>
              <small>Comida aprovechada, barrio a barrio.</small>
            </div>
            <div className="hero-round-label"><Leaf size={22} /><span>menos<br />desperdicio</span></div>
          </motion.div>
        </div>
      </section>

      <section className="section featured-section">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">Listos para rescatar</p><h2>Hoy sabe mejor.</h2></div>
            <Link className="text-link" to="/ofertas">Ver todas las ofertas <ArrowRight size={18} /></Link>
          </div>
          {featured.isLoading && <LoadingState label="Buscando packs cerca de ti…" />}
          {featured.isError && <ErrorState message={featured.error.message} onRetry={featured.refetch} />}
          {featured.data && <div className="food-grid">{featured.data.map((pack) => <FoodPackCard pack={pack} key={pack._id} />)}</div>}
        </div>
      </section>

      <section className="impact-section">
        <div className="container impact-grid">
          <div className="impact-intro"><p className="eyebrow">Impacto compartido</p><h2>Pequeños gestos.<br />Resultados que pesan.</h2></div>
          <div className="impact-stat"><strong>{Math.round((impact.data?.foodGrams || 68400) / 1000)}</strong><span>kg de comida<br />aprovechada</span></div>
          <div className="impact-stat"><strong>{impact.data?.collectedReservations || 80}</strong><span>recogidas<br />completadas</span></div>
          <div className="impact-stat"><strong>{Math.round((impact.data?.co2Grams || 129600) / 1000)}</strong><span>kg de CO₂<br />evitados</span></div>
        </div>
      </section>

      <section className="section how-section">
        <div className="container">
          <div className="section-heading centered"><div><p className="eyebrow">Así de fácil</p><h2>Tres pasos. Cero complicaciones.</h2></div></div>
          <div className="steps-grid">
            <article><span>01</span><Search size={27} /><h3>Encuentra</h3><p>Explora packs disponibles y filtra por ciudad, categoría o precio.</p></article>
            <article><span>02</span><ShoppingBag size={27} /><h3>Reserva</h3><p>Guarda tu pack en segundos y recibe tu código de recogida.</p></article>
            <article><span>03</span><MapPin size={27} /><h3>Recoge</h3><p>Acércate dentro de la franja indicada y disfruta salvando comida.</p></article>
          </div>
        </div>
      </section>

      <section className="partner-cta-section">
        <div className="container partner-cta">
          <div><p className="eyebrow"><Building2 size={15} /> Para comercios</p><h2>Convierte excedentes en oportunidades.</h2><p>Publica packs, gestiona reservas y mide el impacto real de tu negocio.</p></div>
          <Link className="button button-light" to="/login">Acceso para comercios <ArrowRight size={18} /></Link>
        </div>
      </section>
    </>
  )
}

