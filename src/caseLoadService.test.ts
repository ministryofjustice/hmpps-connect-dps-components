import { Request, Response } from 'express'
import { PrisonUser } from './types/HmppsUser'
import retrieveCaseLoadData from './caseLoadService'
import prisonApiClient from './data/prisonApi/prisonApiClient'
import config from './config'

jest.mock('./data/prisonApi/prisonApiClient')

describe('retrieveCaseLoadData', () => {
  let req: Request
  let res: Response
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

  const prisonApiClientMock = prisonApiClient as jest.Mocked<typeof prisonApiClient>

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

    await retrieveCaseLoadData({})(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.caseLoads).toEqual(caseLoads)
    expect(localsUser.activeCaseLoad).toEqual(activeCaseLoad)
    expect(localsUser.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(req.session.caseLoads).toEqual(caseLoads)
    expect(req.session.activeCaseLoad).toEqual(activeCaseLoad)
    expect(req.session.activeCaseLoadId).toEqual(activeCaseLoadId)

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

    await retrieveCaseLoadData({})(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.caseLoads).toEqual(caseLoads)
    expect(localsUser.activeCaseLoad).toBeUndefined()
    expect(localsUser.activeCaseLoadId).toBeUndefined()

    expect(req.session.caseLoads).toEqual(caseLoads)
    expect(req.session.activeCaseLoad).toBeUndefined()
    expect(req.session.activeCaseLoadId).toBeUndefined()

    expect(prisonApiClientMock.getUserCaseLoads).not.toHaveBeenCalled()
  })

  it('Should use cached data where feComponents.sharedData is not available', async () => {
    req = { session: { caseLoads, activeCaseLoad, activeCaseLoadId } } as Request
    res = {
      locals: {
        user: prisonUser,
      },
    } as unknown as Response

    await retrieveCaseLoadData({})(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.caseLoads).toEqual(caseLoads)
    expect(localsUser.activeCaseLoad).toEqual(activeCaseLoad)
    expect(localsUser.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(prisonApiClientMock.getUserCaseLoads).not.toHaveBeenCalled()
  })

  it('Should call Prison API when there is no cached data available', async () => {
    req = { session: {} } as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    prisonApiClientMock.getUserCaseLoads.mockResolvedValue(caseLoads)

    await retrieveCaseLoadData({})(req, res, next)

    const localsUser = res.locals.user as PrisonUser
    expect(localsUser.caseLoads).toEqual(caseLoads)
    expect(localsUser.activeCaseLoad).toEqual(activeCaseLoad)
    expect(localsUser.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(req.session.caseLoads).toEqual(caseLoads)
    expect(req.session.activeCaseLoad).toEqual(activeCaseLoad)
    expect(req.session.activeCaseLoadId).toEqual(activeCaseLoadId)

    expect(prisonApiClientMock.getUserCaseLoads).toHaveBeenCalledWith(
      prisonUser.token,
      expect.anything(),
      expect.anything(),
    )
  })

  it('Should propagate error from Prison API client', async () => {
    req = { session: {} } as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    const error = new Error('Error')

    prisonApiClientMock.getUserCaseLoads.mockRejectedValue(error)

    await retrieveCaseLoadData({})(req, res, next)

    expect(next).toHaveBeenCalledWith(error)
  })

  it('Should do nothing if user is not a NOMIS user', async () => {
    req = { session: {} } as Request
    res = { locals: { user: { authSource: 'external' } } } as unknown as Response

    await retrieveCaseLoadData({})(req, res, next)

    expect(prisonApiClientMock.getUserCaseLoads).not.toHaveBeenCalled()
  })

  it('Should throw an error if user session is not available', async () => {
    req = {} as Request
    res = { locals: { user: prisonUser } } as unknown as Response

    await expect(retrieveCaseLoadData({})(req, res, next)).rejects.toThrow(
      'User session required in order to cache case loads',
    )
  })

  it('Should throw an error if Prison API URL is not defined', async () => {
    configMock.apis = {
      ...configMock.apis,
      prisonApi: { url: undefined },
    }

    expect(retrieveCaseLoadData).toThrow(
      'Environment variable PRISON_API_URL must be defined for this middleware to work correctly',
    )
  })
})
