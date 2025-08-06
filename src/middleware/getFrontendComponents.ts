import { type RequestHandler } from 'express'
import ComponentsService, { FrontendComponentRequestOptions } from '../componentsService'

type MiddlewareOptions = {
  requestOptions?: FrontendComponentRequestOptions
} & Parameters<typeof ComponentsService.create>[0]

export default function getFrontendComponents({
  logger = console,
  componentApiConfig,
  authenticationClient,
  dpsUrl,
  requestOptions,
}: MiddlewareOptions): RequestHandler {
  const service = ComponentsService.create({ logger, componentApiConfig, authenticationClient, dpsUrl })
  return service.getFrontendComponents(requestOptions)
}
