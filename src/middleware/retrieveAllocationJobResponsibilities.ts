import { type RequestHandler } from 'express'
import AllocationService from '../allocationService'

export default function retrieveAllocationJobResponsibilities({
  logger = console,
  allocationsApiConfig,
  authenticationClient,
}: Parameters<typeof AllocationService.create>[0]): RequestHandler {
  const service = AllocationService.create({ logger, allocationsApiConfig, authenticationClient })
  return service.retrieveAllocationJobResponsibilities()
}
