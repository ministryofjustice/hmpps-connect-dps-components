import type bunyan from 'bunyan'
import superagent from 'superagent'
import TimeoutOptions from '../../types/TimeoutOptions'
import config from '../../config'
import { PrisonUser } from '../../types/HmppsUser'
import { AllocationJobResponsibility } from '../../types/AllocationJobResponsibility'

export default {
  async getStaffAllocationPolicies(
    user: PrisonUser,
    timeoutOptions: TimeoutOptions,
    log: bunyan | typeof console,
  ): Promise<{ policies: AllocationJobResponsibility[] }> {
    const result = await superagent
      .get(
        `${config.apis.allocationsApi.url}/prisons/${user.activeCaseLoadId}/staff/${user.userId}/job-classifications`,
      )
      .agent(this.agent)
      .retry(2, (err, _res) => {
        if (err) log.info(`Retry handler found API error with ${err.code} ${err.message}`)
        return undefined // retry handler only for logging retries, not to influence retry logic
      })
      .auth(user.token, { type: 'bearer' })
      .timeout(timeoutOptions)

    return result.body
  },
}
