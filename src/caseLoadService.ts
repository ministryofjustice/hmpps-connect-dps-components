import { type RequestHandler } from 'express'
import { ApiConfig } from '@ministryofjustice/hmpps-rest-client'
import CaseLoad from './types/CaseLoad'
import PrisonApiClient from './data/prisonApi/prisonApiClient'
import { ConnectDpsComponentLogger } from './types/ConnectDpsComponentLogger'

export default class CaseLoadService {
  constructor(
    private readonly logger: ConnectDpsComponentLogger,
    private readonly prisonApiClient: PrisonApiClient,
  ) {}

  static create({
    logger = console,
    prisonApiConfig,
  }: {
    logger?: ConnectDpsComponentLogger
    prisonApiConfig: ApiConfig
  }) {
    return new CaseLoadService(logger, new PrisonApiClient(logger, prisonApiConfig))
  }

  retrieveCaseLoadData(): RequestHandler {
    return async (req, res, next) => {
      if (!req.session) throw new Error('User session required in order to cache case loads')

      if (res.locals.user && res.locals.user.token && res.locals.user.authSource === 'nomis') {
        try {
          // Update cache with values from res.feComponents.sharedData if present
          if (res.locals.feComponents && res.locals.feComponents.sharedData) {
            req.session.caseLoads = res.locals.feComponents.sharedData.caseLoads
            req.session.activeCaseLoad = res.locals.feComponents.sharedData.activeCaseLoad
            req.session.activeCaseLoadId = res.locals.feComponents.sharedData.activeCaseLoad?.caseLoadId
          }

          // If cache is empty, fetch data from Prison API
          if (!req.session.caseLoads) {
            this.logger.info(`Falling back to Prison API to retrieve case loads for: ${res.locals.user.username}`)
            const userCaseLoads = await this.prisonApiClient.getUserCaseLoads(res.locals.user.token)
            const caseLoads = userCaseLoads.filter(caseload => caseload.type !== 'APP')
            const activeCaseLoad = caseLoads.find((caseLoad: CaseLoad) => caseLoad.currentlyActive)

            req.session.caseLoads = caseLoads
            req.session.activeCaseLoad = activeCaseLoad
            req.session.activeCaseLoadId = activeCaseLoad?.caseLoadId
          }

          // Populate res.locals.user with values from cache
          res.locals.user.caseLoads = req.session.caseLoads
          res.locals.user.activeCaseLoad = req.session.activeCaseLoad
          res.locals.user.activeCaseLoadId = req.session.activeCaseLoadId
        } catch (error) {
          this.logger.error(error, `Failed to retrieve case loads for: ${res.locals.user.username}`)
          return next(error)
        }
      }

      return next()
    }
  }
}
