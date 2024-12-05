import getPageComponents from './componentsService'
import retrieveCaseLoadData from './caseLoadService'

export default {
  /**
   * Returns a request handler for adding header and footer frontend components to res.locals
   *
   * Adds stringified html for each component along with lists of css javascript links.
   *
   * Expects nunjucks and res.locals.user to be set up inline with the hmpps-template-typescript project
   *
   * @param requestOptions - config object for request
   * @param requestOptions.dpsUrl - url to the dps homepage to be used in the header
   * @param requestOptions.authUrl - if your service has users with non-nomis auth sources, pass in the url to the auth service for the home link
   * @param requestOptions.supportUrl - if your service has users with non-nomis auth sources, pass in the support url for the support link
   * @param requestOptions.environmentName - if you require environment tags on the fallback banner "DEV", "PRE-PRODUCTION" or "PRODUCTION" can be passed in
   * @param requestOptions.logger - pass in the bunyen logger if you want to use it. Falls back to console if not provided
   * @param requestOptions.timeoutOptions - timeout object for superagent. Defaults to 2500ms
   * @param requestOptions.includeSharedData - adds sharedData to res.locals.feComponents if true. Contains data that the components have collected in order to render, including: activeCaseLoad, caseLoads and available services for user
   */
  getPageComponents,

  /**
   * Ensures that:
   * - `res.locals.user.caseLoads`
   * - `res.locals.user.activeCaseLoad`
   * - `res.locals.user.activeCaseLoadId`
   * are set for NOMIS users (or will propagate an error).  It will also attempt to cache in `req.session.caseLoads`,
   * `req.session.activeCaseLoad` and `req.session.activeCaseLoadId` (this is so that extra requests to Prison API
   * are not required for routes that do not need frontend components, such as image data, or if the frontend component
   * API errors or is temporarily down).
   *
   * It will do the following in priority order, and will attempt the next if the previous fails:
   *
   *  * Use values from `res.feComponents.sharedData` if present (and cache in `req.session`)
   *  * Use cached data from `req.session`
   *  * Fetch data from Prison API as a fallback and cache in `req.session`
   *
   * Expects res.locals.user to be set up inline with the hmpps-template-typescript project
   *
   * @param caseLoadOptions - config object for request
   * @param caseLoadOptions.logger - pass in the bunyen logger if you want to use it. Falls back to console if not provided
   * @param caseLoadOptions.timeoutOptions - timeout object for superagent. Defaults to 2500ms
   */
  retrieveCaseLoadData,
}
