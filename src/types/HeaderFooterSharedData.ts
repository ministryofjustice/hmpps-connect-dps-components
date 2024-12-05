import CaseLoad from './CaseLoad'
import Service from './Service'

export default interface HeaderFooterSharedData {
  activeCaseLoad?: CaseLoad
  caseLoads: CaseLoad[]
  services: Service[]
}

export interface ComponentsSharedData {
  header: HeaderFooterSharedData
  footer: HeaderFooterSharedData
}
