import { describe, expect, it } from 'vitest'
import { ApiError, buildQuery, toApiError } from '@/services/api'

function response(body: string, status: number) {
  return new Response(body, { status, statusText: 'Bad Request' })
}

describe('toApiError', () => {
  it('reads a plain string body (domain errors)', async () => {
    const e = await toApiError(response('"Email provided is occupied."', 400))
    expect(e).toBeInstanceOf(ApiError)
    expect(e.status).toBe(400)
    expect(e.message).toBe('Email provided is occupied.')
  })

  it('reads plain text that is not JSON', async () => {
    const e = await toApiError(response('Rating not found', 404))
    expect(e.message).toBe('Rating not found')
  })

  it('reads validation errors', async () => {
    const e = await toApiError(
      response(
        JSON.stringify({
          message: 'Invalid request data',
          errors: [{ field: 'username', message: 'Invalid value' }],
        }),
        400,
      ),
    )
    expect(e.message).toBe('Invalid request data')
    expect(e.fieldErrors).toEqual([{ field: 'username', message: 'Invalid value' }])
  })

  it('falls back to the status text for an empty body', async () => {
    const e = await toApiError(response('', 400))
    expect(e.message).toBe('Bad Request')
  })
})

describe('buildQuery', () => {
  it('skips empty values and repeats arrays', () => {
    expect(
      buildQuery({ page: 1, search: '', tags: undefined, reason: ['a', 'b'], exact: false }),
    ).toBe('?page=1&reason=a&reason=b&exact=false')
    expect(buildQuery({})).toBe('')
  })
})
