import { useEffect } from 'react'

export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} — RePlato` : 'RePlato — Buen comer. Cero desperdicio.'
  }, [title])
}

