import superagent from 'superagent'
import type bunyan from 'bunyan'
import AvailableComponent from '../../types/AvailableComponent'
import config from '../../config'
import Component from '../../types/Component'
import TimeoutOptions from '../../types/TimeoutOptions'
import { ComponentsSharedData } from '../../types/HeaderFooterSharedData'

export type ComponentsApiResponse<T extends AvailableComponent[]> = Record<T[number], Component> & {
  meta: ComponentsSharedData[T[number]] // TODO: rename 'meta' in the API response
}

export default {
  async getComponents<T extends AvailableComponent[]>(
    userToken: string,
    timeoutOptions: TimeoutOptions,
    log: bunyan | typeof console,
  ): Promise<ComponentsApiResponse<T>> {
    const result = await superagent
      .get(`${config.apis.feComponents.url}/components`)
      .retry(1, (err, _res) => {
        if (err) log.info(`Retry handler found API error with ${err.code} ${err.message}`)
        return undefined // retry handler only for logging retries, not to influence retry logic
      })
      .query('component=header&component=footer')
      .set({ 'x-user-token': userToken })
      .timeout(timeoutOptions)

    return result.body
  },
}
