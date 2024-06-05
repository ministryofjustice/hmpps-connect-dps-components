import getFrontendComponents from './componentsService'

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
   * @param requestOptions.includeMeta - adds feComponentsMeta to res.locals if true. Contains metadata for components including activeCaseLoad, caseLoads and available services for user
   */
  getPageComponents: getFrontendComponents,
}
