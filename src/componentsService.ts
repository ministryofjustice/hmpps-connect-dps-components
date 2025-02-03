import { type RequestHandler } from 'express'
import componentApiClient from './data/componentApi/componentApiClient'
import { getFallbackFooter, getFallbackHeader } from './utils/fallbacks'
import RequestOptions from './types/RequestOptions'
import updateCsp from './utils/updateCsp'
import { HmppsUser } from './types/HmppsUser'

const defaultOptions: Partial<RequestOptions> = {
  logger: console,
  timeoutOptions: { response: 2500, deadline: 2500 },
  includeSharedData: false,
  useFallbacksByDefault: false,
}

export default function getFrontendComponents(requestOptions?: RequestOptions): RequestHandler {
  const { logger, timeoutOptions, includeSharedData, useFallbacksByDefault } = {
    ...defaultOptions,
    ...requestOptions,
  }

  return async (_req, res, next) => {
    const useFallbacks = (user: HmppsUser) => {
      res.locals.feComponents = {
        header: getFallbackHeader(user, requestOptions),
        footer: getFallbackFooter(user, requestOptions),
        cssIncludes: [],
        jsIncludes: [],
      }
    }

    if (!res.locals.user) {
      logger.info('Using fallback frontend components when no user in context')
      useFallbacks(null)
      return next()
    }

    if (useFallbacksByDefault) {
      logger.info('Using fallback frontend components by default')
      useFallbacks(res.locals.user)
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
      useFallbacks(res.locals.user)
      return next()
    }
  }
}
