import { type RequestHandler } from 'express'
import ComponentsService, { FrontendComponentRequestOptions } from '../componentsService'

export type FrontendComponentsMiddlewareOptions = {
  requestOptions?: FrontendComponentRequestOptions
} & Parameters<typeof ComponentsService.create>[0]

export default function getFrontendComponents({
  logger = console,
  componentApiConfig,
  dpsUrl,
  requestOptions,
}: FrontendComponentsMiddlewareOptions): RequestHandler {
  const service = ComponentsService.create({ logger, componentApiConfig, dpsUrl })
  return service.getFrontendComponents(requestOptions)
}
