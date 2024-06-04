import CaseLoad from './CaseLoad'
import Service from './Service'

export default interface HeaderFooterMeta {
  activeCaseLoad: CaseLoad
  caseLoads: CaseLoad[]
  services: Service[]
}

export interface ComponentsMeta {
  header: HeaderFooterMeta
  footer: HeaderFooterMeta
}
