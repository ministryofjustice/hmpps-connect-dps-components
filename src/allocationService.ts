import { type RequestHandler } from 'express'
import { ApiConfig, AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import config from './config'
import AllocationsApiClient from './data/allocationsApi/allocationsApiClient'
import { ConnectDpsComponentLogger } from './types/ConnectDpsComponentLogger'

export default class AllocationService {
  constructor(
    private readonly logger: ConnectDpsComponentLogger,
    private readonly allocationsApiClient: AllocationsApiClient,
  ) {}

  static create({
    logger = console,
    allocationsApiConfig,
    authenticationClient,
  }: {
    logger?: ConnectDpsComponentLogger
    allocationsApiConfig: ApiConfig
    authenticationClient: AuthenticationClient
  }) {
    return new AllocationService(logger, new AllocationsApiClient(logger, allocationsApiConfig, authenticationClient))
  }

  public retrieveAllocationJobResponsibilities(): RequestHandler {
    if (!config.apis.allocationsApi.url)
      throw new Error('Environment variable ALLOCATIONS_API_URL must be defined for this middleware to work correctly')

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
            this.logger.info(
              `Falling back to Allocations API to retrieve job responsibilities for: ${res.locals.user.username}`,
            )
            const allocationPolicies = await this.allocationsApiClient.getStaffAllocationPolicies(res.locals.user)
            req.session.allocationJobResponsibilities = allocationPolicies.policies
          }

          // Populate res.locals.user with values from cache
          res.locals.user.allocationJobResponsibilities = req.session.allocationJobResponsibilities
        } catch (error) {
          this.logger.error(
            error,
            `Failed to retrieve allocation job responsibilities for: ${res.locals.user.username}`,
          )
          return next(error)
        }
      }

      return next()
    }
  }
}
