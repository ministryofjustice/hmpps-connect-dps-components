import { type RequestHandler } from 'express'
import CaseLoadOptions from './types/CaseLoadOptions'
import allocationsApiClient from './data/allocationsApi/allocationsApiClient'

const defaultOptions: CaseLoadOptions = {
  logger: console,
  timeoutOptions: { response: 2500, deadline: 2500 },
}

export default function retrieveAllocationJobResponsibilities(options?: CaseLoadOptions): RequestHandler {
  const { logger, timeoutOptions } = {
    ...defaultOptions,
    ...options,
  }

  return async (req, res, next) => {
    if (!req.session) throw new Error('User session required in order to cache allocation job responsibilities')
    if (!res.locals.user.token)
      throw new Error(
        'Caseload details needs to be populated before retrieving allocation job responsibilities. Please run retrieveCaseLoadData before retrieveAllocationJobResponsibilities.',
      )

    if (res.locals.user && res.locals.user.authSource === 'nomis') {
      try {
        // Update cache with values from res.feComponents.sharedData if present
        if (res.locals.feComponents && res.locals.feComponents.sharedData) {
          req.session.allocationJobResponsibilities = res.locals.feComponents.sharedData.allocationJobResponsibilities
        }

        // If cache is empty, fetch data from Prison API
        if (!req.session.allocationJobResponsibilities) {
          logger.info(
            `Falling back to Allocations API to retrieve job responsibilities for: ${res.locals.user.username}`,
          )
          const allocationPolicies = await allocationsApiClient.getStaffAllocationPolicies(
            res.locals.user,
            timeoutOptions,
            logger,
          )
          req.session.allocationJobResponsibilities = allocationPolicies.policies
        }

        // Populate res.locals.user with values from cache
        res.locals.user.allocationJobResponsibilities = req.session.allocationJobResponsibilities
      } catch (error) {
        logger.error(error, `Failed to retrieve allocation job responsibilities for: ${res.locals.user.username}`)
        return next(error)
      }
    }

    return next()
  }
}
