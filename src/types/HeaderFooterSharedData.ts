import CaseLoad from './CaseLoad'
import Service from './Service'
import { AllocationJobResponsibility } from './AllocationJobResponsibility'

export default interface HeaderFooterSharedData {
  activeCaseLoad?: CaseLoad
  caseLoads: CaseLoad[]
  services: Service[]
  allocationJobResponsibilities: AllocationJobResponsibility[]
}

export interface ComponentsSharedData {
  header: HeaderFooterSharedData
  footer: HeaderFooterSharedData
}
