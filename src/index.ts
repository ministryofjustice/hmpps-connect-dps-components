import getFrontendComponents from './componentsService'

export default {
  /**
   * Returns a request handler for adding frontend components to res.locals
   *
   * Adds stringified html for each component along with lists of css javascript links.
   *
   * Expects nunjucks and res.locals.user to be set up inline with the hmpps-template-typescript project
   *
   * @param requestOptions - config object for request
   * @param requestOptions.dpsUrl - url to the dps homepage to be used in the header
   * @param requestOptions.authUrl - if your service has users with non-nomis auth sources, pass in the url to the auth service for their home link
   * @param requestOptions.supportUrl - if your service has users with non-nomis auth sources, pass in the support url their support link
   * @param requestOptions.environmentName - "DEV", "PRE-PRODUCTION" or "PRODUCTION" to be used in the header
   * @param requestOptions.logger - pass in the bunyen logger if you want to use it. Falls back to console if not provided
   * @param requestOptions.timeoutOptions - timeout object for superagent. Defaults to 2500ms
   * @param requestOptions.includeMeta - adds feComponentsMeta to res.locals if true. Contains metadata for components including activeCaseLoad, caseLoads and available services for user
   */
  get: getFrontendComponents,
}
