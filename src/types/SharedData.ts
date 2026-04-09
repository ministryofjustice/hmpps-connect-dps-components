import type CaseLoad from './CaseLoad'
import type Service from './Service'
import type { AllocationJobResponsibility } from './AllocationJobResponsibility'

export default interface SharedData {
  caseLoads: CaseLoad[]
  activeCaseLoad: CaseLoad | null
  services: Service[]
  allocationJobResponsibilities: AllocationJobResponsibility[]
}
