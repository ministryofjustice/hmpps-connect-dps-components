import { type RequestHandler } from 'express'
import CaseLoadService from '../caseLoadService'

export default function retrieveCaseLoadData({
  logger = console,
  prisonApiConfig,
  authenticationClient,
}: Parameters<typeof CaseLoadService.create>[0]): RequestHandler {
  const service = CaseLoadService.create({ logger, prisonApiConfig, authenticationClient })
  return service.retrieveCaseLoadData()
}
