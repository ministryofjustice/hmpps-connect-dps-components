import type { Request } from 'express'

/**
 * Query parameter that DPS appends to the return url after a user changes their active case load,
 * to tell the service they came back to that its url may describe the prison they have just left.
 *
 * It is a hint only: anyone can put it in a url, so it must never be used to decide which prison to
 * show. Use the user’s active case load for that.
 */
export const CASELOAD_CHANGED_PARAM = 'caseloadChanged'

/** Base used to parse relative urls; never appears in the values returned to callers */
const RELATIVE_URL_BASE = 'http://relative.invalid'

/** Whether the request carries the case load change marker */
export function hasCaseloadChanged(req: Request): boolean {
  return Boolean(req.query && CASELOAD_CHANGED_PARAM in req.query)
}

/**
 * The given url with the case load change marker removed, preserving all other query parameters.
 * Relative urls stay relative. Used to make sure a redirect can never carry the marker onwards,
 * which would redirect forever.
 */
export function withoutCaseloadChangedParam(url: string): string {
  const parsed = new URL(url, RELATIVE_URL_BASE)
  parsed.searchParams.delete(CASELOAD_CHANGED_PARAM)
  return parsed.origin === RELATIVE_URL_BASE ? `${parsed.pathname}${parsed.search}${parsed.hash}` : parsed.href
}

/** The url this request was made to, with the case load change marker removed */
export function requestUrlWithoutCaseloadChangedParam(req: Request): string {
  return withoutCaseloadChangedParam(req.originalUrl)
}
