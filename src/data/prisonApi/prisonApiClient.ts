import { ApiConfig, asUser, RestClient } from '@ministryofjustice/hmpps-rest-client'
import CaseLoad from '../../types/CaseLoad'
import { ConnectDpsComponentLogger } from '../../types/ConnectDpsComponentLogger'

export default class PrisonApiClient extends RestClient {
  constructor(logger: ConnectDpsComponentLogger, config: ApiConfig) {
    super('Prison API Client', config, logger)
  }

  async getUserCaseLoads(userToken: string): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>(
      {
        path: '/api/users/me/caseLoads',
        query: 'allCaseloads=true',
      },
      asUser(userToken),
    )
  }
}
