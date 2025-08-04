import { type RequestHandler } from 'express'
import { ApiConfig, AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import { ConnectDpsComponentLogger } from '../types/ConnectDpsComponentLogger'
import ComponentsService from '../componentsService'
import RequestOptions from '../types/RequestOptions'

export default function getFrontendComponents({
  logger = console,
  componentApiConfig,
  authenticationClient,
}: {
  logger?: ConnectDpsComponentLogger
  componentApiConfig: ApiConfig
  authenticationClient: AuthenticationClient
}): (requestOptions: RequestOptions) => RequestHandler {
  const service = ComponentsService.create({ logger, componentApiConfig, authenticationClient })
  return requestOptions => service.getFrontendComponents(requestOptions)
}
