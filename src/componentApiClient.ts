import superagent from 'superagent'
import type bunyan from 'bunyan'
import AvailableComponent from './types/AvailableComponent'
import config from './config'
import Component from './types/Component'
import TimeoutOptions from './types/TimeoutOptions'
import { ComponentsMeta } from './types/HeaderFooterMeta'

export type ComponentsApiResponse<T extends AvailableComponent[]> = Record<T[number], Component> & {
  meta: ComponentsMeta[T[number]]
}

export default {
  async getComponents<T extends AvailableComponent[]>(
    userToken: string,
    timeoutOptions: TimeoutOptions,
    log: bunyan | typeof console,
  ): Promise<ComponentsApiResponse<T>> {
    const result = await superagent
      .get(`${config.apis.feComponents.url}/components`)
      .agent(this.agent)
      .retry(2, (err, _res) => {
        if (err) log.info(`Retry handler found API error with ${err.code} ${err.message}`)
        return undefined // retry handler only for logging retries, not to influence retry logic
      })
      .query('component=header&component=footer')
      .auth(this.token, { type: 'bearer' })
      .set({ 'x-user-token': userToken })
      .timeout(timeoutOptions)

    return result.body
  },
}
