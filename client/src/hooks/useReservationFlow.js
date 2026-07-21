import { useReducer } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../api/apiClient.js'

const initialState = { quantity: 1, step: 'ready', message: '' }

function reducer(state, action) {
  switch (action.type) {
    case 'quantity': return { ...state, quantity: action.value }
    case 'submitting': return { ...state, step: 'submitting', message: '' }
    case 'success': return { ...state, step: 'success', message: 'Reserva confirmada' }
    case 'error': return { ...state, step: 'error', message: action.message }
    case 'reset': return initialState
    default: return state
  }
}

export function useReservationFlow(packId) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: () => apiRequest('/reservations', {
      method: 'POST',
      body: JSON.stringify({ packId, quantity: state.quantity }),
    }),
    onMutate: () => dispatch({ type: 'submitting' }),
    onSuccess: () => {
      dispatch({ type: 'success' })
      queryClient.invalidateQueries({ queryKey: ['food-pack', packId] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: (error) => dispatch({ type: 'error', message: error.message }),
  })
  return { state, dispatch, reserve: mutation.mutate }
}

