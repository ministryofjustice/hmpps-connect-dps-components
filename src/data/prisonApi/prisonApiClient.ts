import superagent from 'superagent'
import type bunyan from 'bunyan'
import config from '../../config'
import TimeoutOptions from '../../types/TimeoutOptions'
import CaseLoad from '../../types/CaseLoad'

export default {
  async getUserCaseLoads(
    userToken: string,
    timeoutOptions: TimeoutOptions,
    log: bunyan | typeof console,
  ): Promise<CaseLoad[]> {
    const result = await superagent
      .get(`${config.apis.prisonApi.url}/api/users/me/caseLoads`)
      .agent(this.agent)
      .retry(2, (err, _res) => {
        if (err) log.info(`Retry handler found API error with ${err.code} ${err.message}`)
        return undefined // retry handler only for logging retries, not to influence retry logic
      })
      .query('allCaseloads=true')
      .auth(userToken, { type: 'bearer' })
      .timeout(timeoutOptions)

    return result.body
  },
}
