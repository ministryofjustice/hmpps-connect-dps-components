import { Request, Response } from 'express'
import handleCaseloadChange from './handleCaseloadChange'
import { PrisonUser, ProbationUser } from '../types/HmppsUser'

describe('handleCaseloadChange', () => {
  const next = jest.fn()
  const redirect = jest.fn()

  const prisonUser = { authSource: 'nomis', activeCaseLoadId: 'CFI' } as PrisonUser

  const responseFor = (user?: PrisonUser | ProbationUser) => ({ locals: { user }, redirect }) as unknown as Response

  const requestFor = (originalUrl: string, query: Record<string, string> = {}) =>
    ({ originalUrl, query }) as unknown as Request

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('does nothing without the marker', () => {
    const req = requestFor('/prison/BFI?status=ACTIVE')

    handleCaseloadChange()(req, responseFor(prisonUser), next)

    expect(next).toHaveBeenCalled()
    expect(redirect).not.toHaveBeenCalled()
  })

  it('strips the marker when no rewrite is supplied', () => {
    const req = requestFor('/prison/BFI?status=ACTIVE&caseloadChanged=true', {
      status: 'ACTIVE',
      caseloadChanged: 'true',
    })

    handleCaseloadChange()(req, responseFor(prisonUser), next)

    expect(redirect).toHaveBeenCalledWith('/prison/BFI?status=ACTIVE')
    expect(next).not.toHaveBeenCalled()
  })

  it('redirects to the rewritten url, given the new active case load', () => {
    const req = requestFor('/prison/BFI?caseloadChanged=true', { caseloadChanged: 'true' })
    const rewriteUrl = jest.fn((_req, { activeCaseLoadId }) => `/prison/${activeCaseLoadId}`)

    handleCaseloadChange({ rewriteUrl })(req, responseFor(prisonUser), next)

    expect(rewriteUrl).toHaveBeenCalledWith(req, { activeCaseLoadId: 'CFI' })
    expect(redirect).toHaveBeenCalledWith('/prison/CFI')
  })

  it('falls back to the current url when the rewrite returns nothing', () => {
    const req = requestFor('/somewhere?caseloadChanged=true', { caseloadChanged: 'true' })

    handleCaseloadChange({ rewriteUrl: () => undefined })(req, responseFor(prisonUser), next)

    expect(redirect).toHaveBeenCalledWith('/somewhere')
  })

  it('strips the marker from a rewritten url so it cannot redirect forever', () => {
    const req = requestFor('/prison/BFI?caseloadChanged=true', { caseloadChanged: 'true' })

    handleCaseloadChange({ rewriteUrl: () => '/prison/CFI?caseloadChanged=true' })(req, responseFor(prisonUser), next)

    expect(redirect).toHaveBeenCalledWith('/prison/CFI')
  })

  it('passes no active case load for a non-prison user', () => {
    const req = requestFor('/somewhere?caseloadChanged=true', { caseloadChanged: 'true' })
    const rewriteUrl = jest.fn(() => undefined as string | undefined)

    handleCaseloadChange({ rewriteUrl })(req, responseFor({ authSource: 'delius' } as ProbationUser), next)

    expect(rewriteUrl).toHaveBeenCalledWith(req, { activeCaseLoadId: undefined })
    expect(redirect).toHaveBeenCalledWith('/somewhere')
  })

  it('does not fail when there is no user', () => {
    const req = requestFor('/somewhere?caseloadChanged=true', { caseloadChanged: 'true' })

    expect(() => handleCaseloadChange()(req, responseFor(undefined), next)).not.toThrow()
    expect(redirect).toHaveBeenCalledWith('/somewhere')
  })
})
