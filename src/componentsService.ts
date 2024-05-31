import { type RequestHandler } from 'express'
import componentApiClient from './componentApiClient'
import { getFallbackFooter, getFallbackHeader } from './utils/fallbacks'
import RequestOptions from './types/RequestOptions'

const defaultOptions: Partial<RequestOptions> = {
  logger: console,
  timeoutOptions: { response: 2500, deadline: 2500 },
  includeMeta: false,
}

export default function getFrontendComponents(requestOptions?: RequestOptions): RequestHandler {
  const { logger, timeoutOptions, includeMeta } = {
    ...defaultOptions,
    ...requestOptions,
  }

  return async (_req, res, next) => {
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

      if (includeMeta) {
        res.locals.feComponentsMeta = meta
      }

      next()
    } catch (error) {
      logger.error('Failed to retrieve front end components, using fallbacks')

      res.locals.feComponents = {
        header: getFallbackHeader(res.locals.user, requestOptions),
        footer: getFallbackFooter(res.locals.user, requestOptions),
        cssIncludes: [],
        jsIncludes: [],
      }

      next()
    }
  }
}
