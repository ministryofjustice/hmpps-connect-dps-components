import { Request, Response } from 'express'
import { PrisonUser } from './types/HmppsUser'
import retrieveAllocationJobResponsibilities from './allocationService'
import allocationsApiClient from './data/allocationsApi/allocationsApiClient'
import { AllocationJobResponsibility } from './types/AllocationJobResponsibility'
import config from './config'

jest.mock('./data/allocationsApi/allocationsApiClient')
jest.mock('./config')

describe('retrieveCaseLoadData', () => {
  let req: Request
  let res: Response
  const next = jest.fn()

  const prisonUser = { token: 'token', authSource: 'nomis' } as PrisonUser

  const allocationsApiClientMock = allocationsApiClient as jest.Mocked<typeof allocationsApiClient>

  const allocationJobResponsibilities: AllocationJobResponsibility[] = ['KEY_WORKER']

  const configMock = config as jest.Mocked<typeof config>

  beforeEach(() => {
    jest.resetAllMocks()
    configMock.apis = {
      feComponents: { url: 'url' },
      prisonApi: { url: 'url' },
      allocationsApi: { url: 'url' },
    }
  })

  it('Should use shared data from feComponents and refresh the cache', async () => {
    req = { session: {} } as unknown as Request
    res = {
      locals: {
        user: prisonUser,
        feComponents: {
          sharedData: {
            allocationJobResponsibilities,
          },
        },
      },
    } as unknown as Response

    await retrieveAllocationJobResponsibilities({})(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)
    expect(req.session.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)
    expect(allocationsApiClient.getStaffAllocationPolicies).not.toHaveBeenCalled()
  })

  it('Should use cached data where feComponents.sharedData is not available', async () => {
    req = { session: { allocationJobResponsibilities } } as unknown as Request
    res = {
      locals: {
        user: prisonUser,
      },
    } as unknown as Response

    await retrieveAllocationJobResponsibilities({})(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)
    expect(allocationsApiClient.getStaffAllocationPolicies).not.toHaveBeenCalled()
  })

  it('Should call Allocations API when there is no cached data available', async () => {
    req = { session: {} } as unknown as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    allocationsApiClientMock.getStaffAllocationPolicies.mockResolvedValue({ policies: allocationJobResponsibilities })

    await retrieveAllocationJobResponsibilities({})(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)
    expect(req.session.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)

    expect(allocationsApiClient.getStaffAllocationPolicies).toHaveBeenCalledWith(
      prisonUser,
      expect.anything(),
      expect.anything(),
    )
  })

  it('Should propagate error from Allocations API client', async () => {
    req = { session: {} } as unknown as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    const error = new Error('Error')

    allocationsApiClientMock.getStaffAllocationPolicies.mockRejectedValue(error)

    await retrieveAllocationJobResponsibilities({})(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('Should do nothing if user is not a NOMIS user', async () => {
    req = { session: {} } as unknown as Request
    res = { locals: { user: { authSource: 'external', token: 'TOKEN' } } } as unknown as Response

    await retrieveAllocationJobResponsibilities({})(req, res, next)

    expect(allocationsApiClient.getStaffAllocationPolicies).not.toHaveBeenCalled()
  })

  it('Should throw an error if user session is not available', async () => {
    req = {} as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    await expect(retrieveAllocationJobResponsibilities({})(req, res, next)).rejects.toThrow(
      'User session required in order to cache allocation job responsibilities',
    )
  })
})
