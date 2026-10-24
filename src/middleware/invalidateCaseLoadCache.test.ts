import { Request, Response } from 'express'
import invalidateCaseLoadCache from './invalidateCaseLoadCache'

describe('invalidateCaseLoadCache', () => {
  const next = jest.fn()
  const res = {} as Response

  const cachedSession = () => ({
    caseLoads: [{ caseLoadId: 'BFI' }],
    activeCaseLoad: { caseLoadId: 'BFI' },
    activeCaseLoadId: 'BFI',
    allocationJobResponsibilities: ['KEY_WORKER'],
    somethingElse: 'left alone',
  })

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('clears the cached case load data when the case load has changed', () => {
    const req = { query: { caseloadChanged: 'true' }, session: cachedSession() } as unknown as Request

    invalidateCaseLoadCache()(req, res, next)

    expect(req.session).toEqual({ somethingElse: 'left alone' })
    expect(next).toHaveBeenCalled()
  })

  it('leaves the cache alone without the marker', () => {
    const session = cachedSession()
    const req = { query: {}, session } as unknown as Request

    invalidateCaseLoadCache()(req, res, next)

    expect(req.session).toEqual(session)
    expect(next).toHaveBeenCalled()
  })

  it('does not fail when there is no session', () => {
    const req = { query: { caseloadChanged: 'true' } } as unknown as Request

    expect(() => invalidateCaseLoadCache()(req, res, next)).not.toThrow()
    expect(next).toHaveBeenCalled()
  })
})
