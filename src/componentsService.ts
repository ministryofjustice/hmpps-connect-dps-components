import type { RequestHandler } from 'express'
import { ApiConfig } from '@ministryofjustice/hmpps-rest-client'
import ComponentApiClient from './data/componentApi/componentApiClient'
import { getFallbackFooter, getFallbackHeader } from './utils/fallbacks'
import updateCsp from './utils/updateCsp'
import { HmppsUser } from './types/HmppsUser'
import { ConnectDpsComponentLogger } from './types/ConnectDpsComponentLogger'

export interface FrontendComponentRequestOptions {
  authUrl?: string
  supportUrl?: string
  environmentName?: 'DEV' | 'PRE-PRODUCTION' | 'PRODUCTION'
  includeSharedData?: boolean
  useFallbacksByDefault?: boolean
  /**
   * Update Content-Security-Policy with directives returned by MFE components service
   * (instead of built-in fallback set); true by default
   */
  updateContentSecurityPolicy?: boolean
}

const defaultOptions: FrontendComponentRequestOptions = {
  includeSharedData: false,
  useFallbacksByDefault: false,
  updateContentSecurityPolicy: true,
}

export default class ComponentsService {
  constructor(
    private readonly logger: ConnectDpsComponentLogger,
    private readonly componentApiConfig: ApiConfig,
    private readonly componentApiClient: ComponentApiClient,
    private readonly dpsUrl: string,
  ) {}

  static create({
    logger = console,
    componentApiConfig,
    dpsUrl,
  }: {
    logger?: ConnectDpsComponentLogger
    componentApiConfig: ApiConfig
    dpsUrl: string
  }) {
    return new ComponentsService(logger, componentApiConfig, new ComponentApiClient(logger, componentApiConfig), dpsUrl)
  }

  getFrontendComponents(requestOptions?: FrontendComponentRequestOptions): RequestHandler {
    const requestOptionsWithDefaults = {
      ...defaultOptions,
      ...(requestOptions || {}),
    }
    const { includeSharedData, useFallbacksByDefault, updateContentSecurityPolicy } = requestOptionsWithDefaults

    return async (_req, res, next) => {
      const useFallbacks = (user: HmppsUser | null) => {
        res.locals.feComponents = {
          header: getFallbackHeader(user, this.dpsUrl, {
            environmentName: requestOptionsWithDefaults.environmentName,
            authUrl: requestOptionsWithDefaults.authUrl,
            supportUrl: requestOptionsWithDefaults.supportUrl,
          }),
          footer: getFallbackFooter(user, {
            authUrl: requestOptionsWithDefaults.authUrl,
            supportUrl: requestOptionsWithDefaults.supportUrl,
          }),
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

        updateCsp({
          directives: updateContentSecurityPolicy ? meta?.cspDirectives : undefined,
          feComponentsUrl: this.componentApiConfig.url,
          res,
        })

        return next()
      } catch {
        this.logger.error('Failed to retrieve front end components, using fallbacks')
        useFallbacks(res.locals.user)
        return next()
      }
    }
  }
}
