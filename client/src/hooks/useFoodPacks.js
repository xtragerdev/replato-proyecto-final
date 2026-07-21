import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../api/apiClient.js'

function buildQuery(filters, page) {
  const params = new URLSearchParams({ page: String(page), limit: '12' })
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value)
  })
  return params.toString()
}

export function useFoodPacks(filters) {
  return useInfiniteQuery({
    queryKey: ['food-packs', filters],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => apiRequest(`/food-packs?${buildQuery(filters, pageParam)}`, { signal }),
    getNextPageParam: (lastPage) => lastPage.meta.page < lastPage.meta.pages
      ? lastPage.meta.page + 1
      : undefined,
  })
}

export function useFeaturedPacks() {
  return useQuery({
    queryKey: ['food-packs', 'featured'],
    queryFn: ({ signal }) => apiRequest('/food-packs/featured', { signal }).then((response) => response.data),
  })
}

export function useFoodPack(id) {
  return useQuery({
    queryKey: ['food-pack', id],
    queryFn: ({ signal }) => apiRequest(`/food-packs/${id}`, { signal }).then((response) => response.data),
    enabled: Boolean(id),
  })
}

export function useImpact() {
  return useQuery({
    queryKey: ['impact'],
    queryFn: ({ signal }) => apiRequest('/food-packs/impact', { signal }).then((response) => response.data),
  })
}

