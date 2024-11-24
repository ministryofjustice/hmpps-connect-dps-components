import { type RequestHandler } from 'express'
import componentApiClient from './data/componentApi/componentApiClient'
import { getFallbackFooter, getFallbackHeader } from './utils/fallbacks'
import RequestOptions from './types/RequestOptions'
import updateCsp from './utils/updateCsp'
import config from './config'
import CaseLoad from './types/CaseLoad'
import prisonApiClient from './data/prisonApi/prisonApiClient'

const defaultOptions: Partial<RequestOptions> = {
  logger: console,
  timeoutOptions: { response: 2500, deadline: 2500 },
  includeSharedData: false,
}

export default function getFrontendComponents(requestOptions?: RequestOptions): RequestHandler {
  const { logger, timeoutOptions, includeSharedData } = {
    ...defaultOptions,
    ...requestOptions,
  }

  return async (_req, res, next) => {
    if (!res.locals.user) {
      logger.info('Using logged out user header')
      res.locals.feComponents = {
        header: getFallbackHeader(null, requestOptions),
        footer: getFallbackFooter(null, requestOptions),
        cssIncludes: [],
        jsIncludes: [],
      }
      return next()
    }

    try {
      const { header, footer, meta } = await componentApiClient.getComponents(
        res.locals.user.token,
        timeoutOptions,
        logger,
      )

      res.locals.feComponents = {
        header: header.html,
        footer: footer.html,
        cssIncludes: [...header.css, ...footer.css],
        jsIncludes: [...header.javascript, ...footer.javascript],
      }

      if (includeSharedData) {
        res.locals.feComponents.sharedData = meta
      }

      updateCsp(res)

      return next()
    } catch (error) {
      logger.error('Failed to retrieve front end components, using fallbacks')

      res.locals.feComponents = {
        header: getFallbackHeader(res.locals.user, requestOptions),
        footer: getFallbackFooter(res.locals.user, requestOptions),
        cssIncludes: [],
        jsIncludes: [],
      }

      if (includeSharedData && config.apis.prisonApi.url && res.locals.user.authSource === 'nomis') {
        try {
          const userCaseLoads = await prisonApiClient.getUserCaseLoads(res.locals.user.token, timeoutOptions, logger)

          if (userCaseLoads && Array.isArray(userCaseLoads)) {
            const caseLoads = userCaseLoads.filter(caseload => caseload.type !== 'APP')
            const activeCaseLoad = caseLoads.filter((caseLoad: CaseLoad) => caseLoad.currentlyActive)[0]

            res.locals.feComponents.sharedData = {
              activeCaseLoad,
              caseLoads,
              services: [],
            }
          }
        } catch (err) {
          logger.error(err, `Failed to retrieve case loads for: ${res.locals.user.username}`)
          next(error)
        }
      }

      return next()
    }
  }
}
