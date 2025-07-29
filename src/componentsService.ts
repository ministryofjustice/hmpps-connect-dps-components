import { type RequestHandler } from 'express'
import { ApiConfig, AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import ComponentApiClient from './data/componentApi/componentApiClient'
import { getFallbackFooter, getFallbackHeader } from './utils/fallbacks'
import RequestOptions from './types/RequestOptions'
import updateCsp from './utils/updateCsp'
import { HmppsUser } from './types/HmppsUser'
import { ConnectDpsComponentLogger } from './types/ConnectDpsComponentLogger'

const defaultOptions: Partial<RequestOptions> = {
  logger: console,
  timeoutOptions: { response: 2500, deadline: 2500 },
  includeSharedData: false,
  useFallbacksByDefault: false,
}

export default class ComponentsService {
  constructor(
    private readonly logger: ConnectDpsComponentLogger,
    private readonly componentApiConfig: ApiConfig,
    private readonly componentApiClient: ComponentApiClient,
  ) {}

  static create({
    logger = console,
    componentApiConfig,
    authenticationClient,
  }: {
    logger?: ConnectDpsComponentLogger
    componentApiConfig: ApiConfig
    authenticationClient: AuthenticationClient
  }) {
    return new ComponentsService(
      logger,
      componentApiConfig,
      new ComponentApiClient(logger, componentApiConfig, authenticationClient),
    )
  }

  getFrontendComponents(requestOptions: RequestOptions): RequestHandler {
    const requestOptionsWithDefaults = {
      ...defaultOptions,
      ...requestOptions,
    }
    const { includeSharedData, useFallbacksByDefault } = {
      ...defaultOptions,
      ...requestOptions,
    }

    return async (_req, res, next) => {
      const useFallbacks = (user: HmppsUser | null) => {
        res.locals.feComponents = {
          header: getFallbackHeader(user, requestOptionsWithDefaults),
          footer: getFallbackFooter(user, requestOptionsWithDefaults),
          cssIncludes: [],
          jsIncludes: [],
        }
      }

      if (!res.locals.user) {
        this.logger.info('Using fallback frontend components when no user in context')
        useFallbacks(null)
        return next()
      }

      if (useFallbacksByDefault) {
        this.logger.info('Using fallback frontend components by default')
        useFallbacks(res.locals.user)
        return next()
      }

      try {
        const { header, footer, meta } = await this.componentApiClient.getComponents(res.locals.user.token as string)

        res.locals.feComponents = {
          header: header.html,
          footer: footer.html,
          cssIncludes: [...header.css, ...footer.css],
          jsIncludes: [...header.javascript, ...footer.javascript],
        }

        if (includeSharedData) {
          res.locals.feComponents.sharedData = meta
        }

        updateCsp(this.componentApiConfig.url, res)

        return next()
      } catch (_error) {
        this.logger.error('Failed to retrieve front end components, using fallbacks')
        useFallbacks(res.locals.user)
        return next()
      }
    }
  }
}
