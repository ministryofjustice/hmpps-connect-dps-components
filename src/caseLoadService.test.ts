import { Request, Response } from 'express'
import Logger from 'bunyan'
import { PrisonUser } from './types/HmppsUser'
import CaseLoadService from './caseLoadService'
import PrisonApiClient from './data/prisonApi/prisonApiClient'

describe('retrieveCaseLoadData', () => {
  let req: Request
  let res: Response
  let prisonApiClientMock: PrisonApiClient
  let caseLoadService: CaseLoadService
  let loggerMock: Logger

  const next = jest.fn()

  const prisonUser = { token: 'token', authSource: 'nomis' } as PrisonUser

  const activeCaseLoadId = 'KMI'

  const activeCaseLoad = {
    caseLoadId: activeCaseLoadId,
    description: 'Kirkham (HMP)',
    type: 'INST',
    caseloadFunction: 'GENERAL',
    currentlyActive: true,
  }

  const caseLoads = [
    activeCaseLoad,
    {
      caseLoadId: 'LEI',
      description: 'Leeds (HMP)',
      type: 'INST',
      caseloadFunction: 'GENERAL',
      currentlyActive: false,
    },
  ]

  beforeEach(() => {
    jest.resetAllMocks()

    loggerMock = {
      info: jest.fn(),
      error: jest.fn(),
    } as unknown as Logger

    prisonApiClientMock = {
      getUserCaseLoads: jest.fn(),
    } as unknown as PrisonApiClient

    caseLoadService = new CaseLoadService(loggerMock, prisonApiClientMock)
  })

  it('Should use shared data from feComponents and refresh the cache', async () => {
    req = { session: {} } as Request
    res = {
      locals: {
        user: prisonUser,
        feComponents: {
          sharedData: {
            caseLoads,
            activeCaseLoad,
          },
        },
      },
    } as unknown as Response

    await caseLoadService.retrieveCaseLoadData()(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.caseLoads).toEqual(caseLoads)
    expect(localsUser.activeCaseLoad).toEqual(activeCaseLoad)
    expect(localsUser.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(req.session?.caseLoads).toEqual(caseLoads)
    expect(req.session?.activeCaseLoad).toEqual(activeCaseLoad)
    expect(req.session?.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(prisonApiClientMock.getUserCaseLoads).not.toHaveBeenCalled()
  })

  it('Should handle no activeCaseLoad', async () => {
    req = { session: {} } as Request
    res = {
      locals: {
        user: prisonUser,
        feComponents: {
          sharedData: {
            caseLoads,
          },
        },
      },
    } as unknown as Response

    await caseLoadService.retrieveCaseLoadData()(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.caseLoads).toEqual(caseLoads)
    expect(localsUser.activeCaseLoad).toBeUndefined()
    expect(localsUser.activeCaseLoadId).toBeUndefined()

    expect(req.session?.caseLoads).toEqual(caseLoads)
    expect(req.session?.activeCaseLoad).toBeUndefined()
    expect(req.session?.activeCaseLoadId).toBeUndefined()

    expect(prisonApiClientMock.getUserCaseLoads).not.toHaveBeenCalled()
  })

  it('Should use cached data where feComponents.sharedData is not available', async () => {
    req = { session: { caseLoads, activeCaseLoad, activeCaseLoadId } } as Request
    res = {
      locals: {
        user: prisonUser,
      },
    } as unknown as Response

    await caseLoadService.retrieveCaseLoadData()(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.caseLoads).toEqual(caseLoads)
    expect(localsUser.activeCaseLoad).toEqual(activeCaseLoad)
    expect(localsUser.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(prisonApiClientMock.getUserCaseLoads).not.toHaveBeenCalled()
  })

  it('Should call Prison API when there is no cached data available', async () => {
    req = { session: {} } as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    prisonApiClientMock.getUserCaseLoads = jest.fn(async () => caseLoads)

    await caseLoadService.retrieveCaseLoadData()(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.caseLoads).toEqual(caseLoads)
    expect(localsUser.activeCaseLoad).toEqual(activeCaseLoad)
    expect(localsUser.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(req.session?.caseLoads).toEqual(caseLoads)
    expect(req.session?.activeCaseLoad).toEqual(activeCaseLoad)
    expect(req.session?.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(prisonApiClientMock.getUserCaseLoads).toHaveBeenCalledWith(prisonUser.token)
  })

  it('Should propagate error from Prison API client', async () => {
    req = { session: {} } as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    const error = new Error('Error')

    prisonApiClientMock.getUserCaseLoads = jest.fn().mockRejectedValue(error)

    await caseLoadService.retrieveCaseLoadData()(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('Should do nothing if user is not a NOMIS user', async () => {
    req = { session: {} } as Request
    res = { locals: { user: { authSource: 'external' } } } as unknown as Response

    await caseLoadService.retrieveCaseLoadData()(req, res, next)

    expect(prisonApiClientMock.getUserCaseLoads).not.toHaveBeenCalled()
  })

  it('Should throw an error if user session is not available', async () => {
    req = {} as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    await expect(caseLoadService.retrieveCaseLoadData()(req, res, next)).rejects.toThrow(
      'User session required in order to cache case loads',
    )
  })
})
