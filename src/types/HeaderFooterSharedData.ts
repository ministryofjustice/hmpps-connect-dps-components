import type SharedData from './SharedData'

/** @deprecated: use `SharedData` directly */
export type HeaderFooterSharedData = SharedData

/** @deprecated: use `SharedData` directly */
export default HeaderFooterSharedData

/** @deprecated: use `SharedData` directly, the meta information is the same for all components */
export interface ComponentsSharedData {
  header: SharedData
  footer: SharedData
}
