import { Request, Response } from 'express'
import Logger from 'bunyan'
import { PrisonUser } from './types/HmppsUser'
import AllocationService from './allocationService'
import AllocationsApiClient from './data/allocationsApi/allocationsApiClient'
import { AllocationJobResponsibility } from './types/AllocationJobResponsibility'

describe('retrieveCaseLoadData', () => {
  let req: Request
  let res: Response
  let allocationsApiClientMock: AllocationsApiClient
  let allocationService: AllocationService

  const next = jest.fn()

  const prisonUser = { token: 'token', authSource: 'nomis' } as PrisonUser

  const allocationJobResponsibilities: AllocationJobResponsibility[] = ['KEY_WORKER']

  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger

  beforeEach(() => {
    jest.resetAllMocks()

    allocationsApiClientMock = {
      getStaffAllocationPolicies: jest.fn(),
    } as unknown as AllocationsApiClient

    allocationService = new AllocationService(loggerMock, allocationsApiClientMock)
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

    await allocationService.retrieveAllocationJobResponsibilities()(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)
    expect(req.session?.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)
    expect(allocationsApiClientMock.getStaffAllocationPolicies).not.toHaveBeenCalled()
  })

  it('Should use cached data where feComponents.sharedData is not available', async () => {
    req = { session: { allocationJobResponsibilities } } as unknown as Request
    res = {
      locals: {
        user: prisonUser,
      },
    } as unknown as Response

    await allocationService.retrieveAllocationJobResponsibilities()(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)
    expect(allocationsApiClientMock.getStaffAllocationPolicies).not.toHaveBeenCalled()
  })

  it('Should call Allocations API when there is no cached data available', async () => {
    req = { session: {} } as unknown as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    allocationsApiClientMock.getStaffAllocationPolicies = jest.fn(async () => ({
      policies: allocationJobResponsibilities,
    }))

    await allocationService.retrieveAllocationJobResponsibilities()(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)
    expect(req.session?.allocationJobResponsibilities).toEqual(allocationJobResponsibilities)

    expect(allocationsApiClientMock.getStaffAllocationPolicies).toHaveBeenCalledWith(prisonUser)
  })

  it('Should propagate error from Allocations API client', async () => {
    req = { session: {} } as unknown as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    const error = new Error('Error')

    allocationsApiClientMock.getStaffAllocationPolicies = jest.fn().mockRejectedValue(error)

    await allocationService.retrieveAllocationJobResponsibilities()(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('Should do nothing if user is not a NOMIS user', async () => {
    req = { session: {} } as unknown as Request
    res = { locals: { user: { authSource: 'external', token: 'TOKEN' } } } as unknown as Response

    await allocationService.retrieveAllocationJobResponsibilities()(req, res, next)

    expect(allocationsApiClientMock.getStaffAllocationPolicies).not.toHaveBeenCalled()
  })

  it('Should throw an error if user session is not available', async () => {
    req = {} as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    await expect(allocationService.retrieveAllocationJobResponsibilities()(req, res, next)).rejects.toThrow(
      'User session required in order to cache allocation job responsibilities',
    )
  })
})
