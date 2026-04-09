import type { AllocationJobResponsibility } from '../../types/AllocationJobResponsibility'
import type CaseLoad from '../../types/CaseLoad'
import type { HmppsUser } from '../../types/HmppsUser'
import type SharedData from '../../types/SharedData'

export default {}

export declare global {
  namespace Express {
    interface SessionData {
      caseLoads?: CaseLoad[]
      activeCaseLoad?: CaseLoad
      activeCaseLoadId?: string
      allocationJobResponsibilities?: AllocationJobResponsibility[]
    }

    interface FeComponents {
      header: string
      footer: string
      cssIncludes: string[]
      jsIncludes: string[]
      sharedData?: SharedData
    }

    interface Request {
      session?: SessionData
    }

    interface Locals {
      user: HmppsUser
      feComponents: FeComponents
    }
  }
}
