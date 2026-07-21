import { Filter, Search, SlidersHorizontal, X } from 'lucide-react'
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../components/common/StatusState.jsx'
import { FoodPackCard } from '../components/food/FoodPackCard.jsx'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'
import { useDocumentTitle } from '../hooks/useDocumentTitle.js'
import { useFoodPacks } from '../hooks/useFoodPacks.js'
import { useIntersectionObserver } from '../hooks/useIntersectionObserver.js'

const categories = [
  ['', 'Todas'], ['bakery', 'Panadería'], ['prepared_food', 'Comida preparada'],
  ['produce', 'Fruta y verdura'], ['breakfast', 'Desayuno'], ['vegan', 'Vegano'], ['mixed', 'Sorpresa'],
]
const cities = ['', 'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Málaga', 'Bilbao', 'Zaragoza', 'Alicante']

export default function ExplorePage() {
  useDocumentTitle('Explorar ofertas')
  const [params, setParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(params.get('search') || '')
  const deferredInput = useDeferredValue(searchInput)
  const debouncedSearch = useDebouncedValue(deferredInput)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    const next = new URLSearchParams(params)
    if (debouncedSearch) next.set('search', debouncedSearch)
    else next.delete('search')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [debouncedSearch, params, setParams])

  const filters = useMemo(() => ({
    search: params.get('search') || '',
    category: params.get('category') || '',
    city: params.get('city') || '',
    sort: params.get('sort') || 'pickup',
  }), [params])
  const query = useFoodPacks(filters)
  const packs = useMemo(() => query.data?.pages.flatMap((page) => page.data) || [], [query.data])
  const total = query.data?.pages[0]?.meta.total || 0

  const updateFilter = useCallback((key, value) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }, [params, setParams])

  const loadNext = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage()
  }, [query.fetchNextPage, query.hasNextPage, query.isFetchingNextPage])
  const sentinelRef = useIntersectionObserver(loadNext, query.hasNextPage)

  return (
    <section className="page-section explore-page">
      <div className="container">
        <header className="page-heading explore-heading">
          <div><p className="eyebrow">Explora tu ciudad</p><h1>Algo bueno te está esperando.</h1></div>
          <p>Ofertas reales, preparadas hoy y listas para recoger cerca de ti.</p>
        </header>
        <div className="explore-toolbar">
          <label className="search-control">
            <Search size={19} /><span className="sr-only">Buscar ofertas</span>
            <input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Busca un pack o comercio" />
            {searchInput && <button type="button" onClick={() => setSearchInput('')} aria-label="Limpiar búsqueda"><X size={17} /></button>}
          </label>
          <button className="button button-secondary filter-toggle" type="button" onClick={() => setFiltersOpen((value) => !value)}><Filter size={17} /> Filtros</button>
          <select aria-label="Ordenar ofertas" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)}>
            <option value="pickup">Recogida más próxima</option><option value="price">Precio más bajo</option><option value="newest">Más recientes</option>
          </select>
        </div>

        <div className={`filter-panel ${filtersOpen ? 'is-open' : ''}`}>
          <div className="filter-title"><SlidersHorizontal size={18} /><strong>Filtrar resultados</strong></div>
          <label>Ciudad<select value={filters.city} onChange={(event) => updateFilter('city', event.target.value)}>{cities.map((city) => <option value={city} key={city || 'all'}>{city || 'Todas las ciudades'}</option>)}</select></label>
          <label>Categoría<select value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>{categories.map(([value, label]) => <option value={value} key={value || 'all'}>{label}</option>)}</select></label>
          <button className="text-button" type="button" onClick={() => { setSearchInput(''); setParams({}) }}>Limpiar filtros</button>
        </div>

        <div className="results-heading"><p aria-live="polite"><strong>{total}</strong> packs encontrados</p></div>
        {query.isLoading && <LoadingState label="Buscando comida disponible…" />}
        {query.isError && <ErrorState message={query.error.message} onRetry={query.refetch} />}
        {!query.isLoading && !query.isError && packs.length === 0 && <EmptyState title="No hay packs con estos filtros" text="Prueba otra ciudad o una búsqueda más amplia." />}
        {packs.length > 0 && <div className="food-grid">{packs.map((pack) => <FoodPackCard pack={pack} key={pack._id} />)}</div>}
        <div className="load-more" ref={sentinelRef}>
          {query.hasNextPage && <button className="button button-secondary" type="button" onClick={loadNext} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? 'Cargando…' : 'Cargar más'}</button>}
        </div>
      </div>
    </section>
  )
}

