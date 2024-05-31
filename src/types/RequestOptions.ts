import type bunyan from 'bunyan'
import TimeoutOptions from './TimeoutOptions'

export default interface RequestOptions {
  dpsUrl: string
  authUrl?: string
  supportUrl?: string
  environmentName?: 'DEV' | 'PRE-PRODUCTION' | 'PRODUCTION'
  logger?: bunyan | typeof console
  includeMeta?: boolean
  timeoutOptions?: TimeoutOptions
}
