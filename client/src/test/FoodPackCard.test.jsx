import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { FoodPackCard } from '../components/food/FoodPackCard.jsx'

const pack = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Pack de pan artesano',
  category: 'bakery',
  pickupStart: '2030-05-18T18:30:00.000Z',
  stockRemaining: 3,
  originalPriceCents: 1000,
  salePriceCents: 400,
  isFeatured: true,
  image: { url: 'https://images.example.test/pan.webp' },
  establishment: {
    name: 'Horno del Barrio',
    isVerified: true,
    address: { city: 'Madrid' },
  },
}

describe('FoodPackCard', () => {
  it('presenta información, descuento y enlaces correctos de una oferta', () => {
    render(<MemoryRouter><FoodPackCard pack={pack} /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Pack de pan artesano' })).toBeInTheDocument()
    expect(screen.getByText('Panadería')).toBeInTheDocument()
    expect(screen.getByText('Recomendado')).toBeInTheDocument()
    expect(screen.getByText('Horno del Barrio')).toBeInTheDocument()
    expect(screen.getByText('-60%')).toBeInTheDocument()
    expect(screen.getByLabelText('Comercio verificado')).toBeInTheDocument()
    expect(screen.getAllByRole('link').every((link) => link.getAttribute('href') === `/ofertas/${pack._id}`)).toBe(true)
  })
})

