import { describe, expect, it, vi } from 'vitest'
import { usePagedList } from '@/composables/usePagedList'

describe('usePagedList', () => {
  it('appends pages and stops on a short page', async () => {
    const fetchPage = vi.fn<(page: number) => Promise<number[]>>(async (page) =>
      page === 1 ? [1, 2] : [3],
    )
    const list = usePagedList(fetchPage, 2, (n) => n)

    await list.loadMore()
    expect(list.items.value).toEqual([1, 2])
    expect(list.done.value).toBe(false)

    await list.loadMore()
    expect(list.items.value).toEqual([1, 2, 3])
    expect(list.done.value).toBe(true)

    await list.loadMore()
    expect(fetchPage).toHaveBeenCalledTimes(2)
  })

  it('ignores a second call while loading and skips duplicates', async () => {
    let resolve!: (v: number[]) => void
    const fetchPage = vi
      .fn<(page: number) => Promise<number[]>>()
      .mockImplementationOnce(() => new Promise((r) => (resolve = r)))
      .mockResolvedValueOnce([2, 3])
    const list = usePagedList(fetchPage, 2, (n) => n)

    const first = list.loadMore()
    void list.loadMore()
    resolve([1, 2])
    await first
    expect(fetchPage).toHaveBeenCalledTimes(1)

    await list.loadMore()
    expect(list.items.value).toEqual([1, 2, 3])
  })

  it('keeps the error until retry', async () => {
    const fetchPage = vi
      .fn<() => Promise<number[]>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce([1])
    const list = usePagedList(fetchPage, 2)

    await list.loadMore()
    expect(list.error.value).toBeInstanceOf(Error)
    await list.loadMore()
    expect(fetchPage).toHaveBeenCalledTimes(1)

    await list.retry()
    expect(list.items.value).toEqual([1])
    expect(list.error.value).toBeNull()
  })
})
