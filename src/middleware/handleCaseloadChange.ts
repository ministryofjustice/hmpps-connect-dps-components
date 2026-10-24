import type { Request, RequestHandler } from 'express'
import {
  hasCaseloadChanged,
  requestUrlWithoutCaseloadChangedParam,
  withoutCaseloadChangedParam,
} from '../utils/caseloadChange'

export interface CaseloadChangeContext {
  /** The user’s active case load after the change, or undefined if they are not a prison user */
  activeCaseLoadId?: string
}

export interface HandleCaseloadChangeOptions {
  /**
   * Where to send the user now their active case load has changed. Supply this when your urls contain
   * a prison id, e.g. `` (req, { activeCaseLoadId }) => `/prison/${activeCaseLoadId}` ``.
   *
   * Return nothing to fall back to the url the user is already on. The case load change marker is
   * always stripped from whatever is returned.
   */
  rewriteUrl?: (req: Request, context: CaseloadChangeContext) => string | undefined | null
}

/**
 * Sends the user on to a url that reflects the case load they have just switched to, and takes the
 * marker back out of the address bar.
 *
 * A service cannot work out on its own that a switch has happened — a request for another prison’s
 * page looks identical whether the user just switched or deliberately followed a link — so DPS tells
 * it, and this middleware acts on that.
 *
 * Mount this *after* `retrieveCaseLoadData`, so that `activeCaseLoadId` describes the new prison:
 *
 * ```javascript
 * app.use(retrieveCaseLoadData({ ... }))
 * app.use(handleCaseloadChange({
 *   rewriteUrl: (req, { activeCaseLoadId }) => `/prison/${activeCaseLoadId}`,
 * }))
 * ```
 *
 * Requests without the marker are untouched, so this is a no-op on all normal traffic.
 */
export default function handleCaseloadChange({ rewriteUrl }: HandleCaseloadChangeOptions = {}): RequestHandler {
  return (req, res, next) => {
    if (!hasCaseloadChanged(req)) return next()

    const { user } = res.locals
    const activeCaseLoadId = user?.authSource === 'nomis' ? user.activeCaseLoadId : undefined

    const rewritten = rewriteUrl?.(req, { activeCaseLoadId })

    // Strip the marker from the target too: a rewrite that kept it would redirect forever
    return res.redirect(rewritten ? withoutCaseloadChangedParam(rewritten) : requestUrlWithoutCaseloadChangedParam(req))
  }
}
