import { ApiConfig, asSystem, AuthenticationClient, RestClient } from '@ministryofjustice/hmpps-rest-client'
import AvailableComponent from '../../types/AvailableComponent'
import Component from '../../types/Component'
import { ConnectDpsComponentLogger } from '../../types/ConnectDpsComponentLogger'
import { ComponentsSharedData } from '../../types/HeaderFooterSharedData'

export type ComponentsApiResponse<T extends AvailableComponent[]> = Record<T[number], Component> & {
  meta: ComponentsSharedData[T[number]] // TODO: rename 'meta' in the API response
}

export default class ComponentApiClient extends RestClient {
  constructor(logger: ConnectDpsComponentLogger, config: ApiConfig, authenticationClient: AuthenticationClient) {
    super('Component API Client', config, logger, authenticationClient)
  }

  async getComponents<T extends AvailableComponent[]>(userToken: string): Promise<ComponentsApiResponse<T>> {
    return this.get<ComponentsApiResponse<T>>(
      {
        path: `/components`,
        query: 'component=header&component=footer',
        headers: { 'x-user-token': userToken },
      },
      asSystem(),
    )
  }
}
