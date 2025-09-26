import { ApiConfig, asSystem, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import { PrisonUser } from '../../types/HmppsUser'
import { AllocationJobResponsibility } from '../../types/AllocationJobResponsibility'
import { ConnectDpsComponentLogger } from '../../types/ConnectDpsComponentLogger'

export default class AllocationsApiClient extends RestClient {
  constructor(logger: ConnectDpsComponentLogger, config: ApiConfig, authenticationClient: AuthenticationClient) {
    super('Allocations API Client', config, logger, authenticationClient)
  }

  async getStaffAllocationPolicies(user: PrisonUser): Promise<{ policies: AllocationJobResponsibility[] }> {
    return this.get(
      {
        path: `/prisons/${user.activeCaseLoadId}/staff/${user.userId}/job-classifications`,
      },
      asSystem(),
    )
  }
}
