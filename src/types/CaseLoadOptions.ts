import type bunyan from 'bunyan'
import TimeoutOptions from './TimeoutOptions'

export default interface RequestOptions {
  logger?: bunyan | typeof console
  timeoutOptions?: TimeoutOptions
}
