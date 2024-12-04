import { type RequestHandler } from 'express'
import CaseLoadOptions from './types/CaseLoadOptions'
import CaseLoad from './types/CaseLoad'
import prisonApiClient from './data/prisonApi/prisonApiClient'

const defaultOptions: CaseLoadOptions = {
  logger: console,
  timeoutOptions: { response: 2500, deadline: 2500 },
}

export default function retrieveCaseLoadData(caseLoadOptions?: CaseLoadOptions): RequestHandler {
  const { logger, timeoutOptions } = {
    ...defaultOptions,
    ...caseLoadOptions,
  }

  return async (req, res, next) => {
    if (!req.session) throw new Error('User session required in order to cache case loads')

    if (res.locals.user && res.locals.user.authSource === 'nomis') {
      try {
        // Update cache with values from res.feComponents.sharedData if present
        if (res.locals.feComponents && res.locals.feComponents.sharedData) {
          req.session.caseLoads = res.locals.feComponents.sharedData.caseLoads
          req.session.activeCaseLoad = res.locals.feComponents.sharedData.activeCaseLoad
          req.session.activeCaseLoadId = res.locals.feComponents.sharedData.activeCaseLoad?.caseLoadId
        }

        // If cache is empty, fetch data from Prison API
        if (!req.session.caseLoads) {
          logger.info(`Falling back to Prison API to retrieve case loads for: ${res.locals.user.username}`)
          const userCaseLoads = await prisonApiClient.getUserCaseLoads(res.locals.user.token, timeoutOptions, logger)
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
        logger.error(error, `Failed to retrieve case loads for: ${res.locals.user.username}`)
        return next(error)
      }
    }

    return next()
  }
}
