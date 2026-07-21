import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatPrice(cents) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100)
}

export function formatPickup(value, pattern = "EEE d MMM · HH:mm") {
  return format(new Date(value), pattern, { locale: es })
}

export function categoryLabel(value) {
  const labels = {
    bakery: 'Panadería', prepared_food: 'Comida preparada', produce: 'Fruta y verdura',
    breakfast: 'Desayuno', vegan: 'Vegano', mixed: 'Sorpresa', greengrocer: 'Frutería',
    restaurant: 'Restaurante', cafe: 'Cafetería', supermarket: 'Supermercado',
  }
  return labels[value] || value
}

export function reservationStatusLabel(value) {
  return { pending: 'Pendiente', confirmed: 'Confirmada', collected: 'Recogida', cancelled: 'Cancelada' }[value] || value
}
