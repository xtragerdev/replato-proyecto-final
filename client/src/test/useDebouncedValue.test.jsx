import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from '../hooks/useDebouncedValue.js'

describe('useDebouncedValue', () => {
  it('mantiene el valor anterior hasta que termina el retardo', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: 'pan' },
    })

    rerender({ value: 'panadería' })
    act(() => vi.advanceTimersByTime(299))
    expect(result.current).toBe('pan')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('panadería')
  })

  it('descarta temporizadores anteriores cuando el valor cambia varias veces', () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 250), {
      initialProps: { value: '' },
    })

    rerender({ value: 'ma' })
    act(() => vi.advanceTimersByTime(200))
    rerender({ value: 'madrid' })
    act(() => vi.advanceTimersByTime(249))
    expect(result.current).toBe('')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('madrid')
  })
})

