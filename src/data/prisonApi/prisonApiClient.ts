import { ApiConfig, asUser, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import CaseLoad from '../../types/CaseLoad'
import { ConnectDpsComponentLogger } from '../../types/ConnectDpsComponentLogger'

export default class PrisonApiClient extends RestClient {
  constructor(logger: ConnectDpsComponentLogger, config: ApiConfig, authenticationClient: AuthenticationClient) {
    super('Prison API Client', config, logger, authenticationClient)
  }

  async getUserCaseLoads(userToken: string): Promise<CaseLoad[]> {
    return this.get<CaseLoad[]>(
      {
        path: '/api/users/me/caseloads',
        query: 'allCaseloads=true',
      },
      asUser(userToken),
    )
  }
}
