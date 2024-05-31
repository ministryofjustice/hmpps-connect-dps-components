import CaseLoad from './CaseLoad'

export default interface Component {
  html: string
  css: string[]
  javascript: string[]
}

export interface Service {
  id: string
  heading: string
  description: string
  href: string
  navEnabled: boolean
}

export interface HeaderFooterMeta {
  activeCaseLoad: CaseLoad
  caseLoads: CaseLoad[]
  services: Service[]
}

export interface ComponentsMeta {
  header: HeaderFooterMeta
  footer: HeaderFooterMeta
}
