import { ApiConfig, RestClient } from '@ministryofjustice/hmpps-rest-client'
import type AvailableComponent from '../../types/AvailableComponent'
import type Component from '../../types/Component'
import type { ConnectDpsComponentLogger } from '../../types/ConnectDpsComponentLogger'
import type SharedData from '../../types/SharedData'

export type ComponentsApiResponse<T extends AvailableComponent[] = AvailableComponent[]> = Record<
  T[number],
  Component
> & {
  meta: SharedData
}

export default class ComponentApiClient extends RestClient {
  constructor(logger: ConnectDpsComponentLogger, config: ApiConfig) {
    super('Component API Client', config, logger)
  }

  async getComponents<T extends AvailableComponent[]>(userToken: string): Promise<ComponentsApiResponse<T>> {
    return this.get({
      path: '/components',
      query: 'component=header&component=footer',
      headers: { 'x-user-token': userToken },
    })
  }
}
