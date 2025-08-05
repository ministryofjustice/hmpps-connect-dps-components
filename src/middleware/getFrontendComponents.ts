import { type RequestHandler } from 'express'
import ComponentsService, { FrontentComponentRequestOptions } from '../componentsService'

export default function getFrontendComponents({
  logger = console,
  componentApiConfig,
  authenticationClient,
  dpsUrl,
}: Parameters<typeof ComponentsService.create>[0]): (
  requestOptions: FrontentComponentRequestOptions,
) => RequestHandler {
  const service = ComponentsService.create({ logger, componentApiConfig, authenticationClient, dpsUrl })
  return requestOptions => service.getFrontendComponents(requestOptions)
}
