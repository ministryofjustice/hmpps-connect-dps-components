import type { RequestHandler } from 'express'
import { hasCaseloadChanged } from '../utils/caseloadChange'

/**
 * Drops the cached case load data when the user has just changed their active case load, so that
 * `retrieveCaseLoadData` and `retrieveAllocationJobResponsibilities` load it again for the new prison.
 *
 * Without this, a service that does not request `includeSharedData` keeps serving the case load it
 * cached the first time the user hit it, for the rest of their session. Allocation job responsibilities
 * are looked up per prison, so they go stale in the same way.
 *
 * Mount this *before* `retrieveCaseLoadData`:
 *
 * ```javascript
 * app.get('*allPaths', getFrontendComponents({ ... }))
 * app.use(invalidateCaseLoadCache())
 * app.use(retrieveCaseLoadData({ ... }))
 * ```
 */
export default function invalidateCaseLoadCache(): RequestHandler {
  return (req, _res, next) => {
    if (hasCaseloadChanged(req) && req.session) {
      delete req.session.caseLoads
      delete req.session.activeCaseLoad
      delete req.session.activeCaseLoadId
      delete req.session.allocationJobResponsibilities
    }

    return next()
  }
}
