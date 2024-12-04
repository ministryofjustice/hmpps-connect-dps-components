import CaseLoad from '../../types/CaseLoad'
import HeaderFooterSharedData from '../../types/HeaderFooterSharedData'
import { HmppsUser } from '../../types/HmppsUser'

// eslint-disable-next-line import/prefer-default-export
export declare global {
  namespace Express {
    interface SessionData {
      caseLoads?: CaseLoad[]
      activeCaseLoad?: CaseLoad
      activeCaseLoadId?: string
    }

    interface FeComponents {
      header: string
      footer: string
      cssIncludes: string[]
      jsIncludes: string[]
      sharedData?: HeaderFooterSharedData
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