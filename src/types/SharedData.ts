import type CaseLoad from './CaseLoad'
import type Service from './Service'
import type { AllocationJobResponsibility } from './AllocationJobResponsibility'
import type { CspDirectives } from './CspDirectives'

/**
 * Information about the current user and environment
 */
export default interface SharedData {
  /** Caseloads available to prison user */
  caseLoads: CaseLoad[]
  /** Currently active caseload for prison user */
  activeCaseLoad: CaseLoad | null
  /** Services available to prison user */
  services: Service[]
  /** Prison user allocated responsibilites */
  allocationJobResponsibilities: AllocationJobResponsibility[]
  /** Content-Security-Policy directives needed to use components from a different domain/origin */
  cspDirectives: CspDirectives
}
