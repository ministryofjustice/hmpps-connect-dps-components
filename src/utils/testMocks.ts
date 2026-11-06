import type { AzureADUser, ExternalUser, PrisonUser, ProbationUser } from '../types/HmppsUser'
import type Service from '../types/Service'

const baseUser = {
  displayName: 'Edwin Shannon',
  name: 'Edwin Shannon',
  userId: '123',
  username: 'ed123',
  token: 'token-1',
}

export const azureUser: AzureADUser = { authSource: 'azuread', ...baseUser }
export const externalUser: ExternalUser = { authSource: 'external', ...baseUser }
export const probationUser: ProbationUser = { authSource: 'delius', ...baseUser }

export const activeCaseLoadId = 'KMI'
export const activeCaseLoad = {
  caseLoadId: activeCaseLoadId,
  description: 'Kirkham (HMP)',
  type: 'INST',
  caseloadFunction: 'GENERAL',
  currentlyActive: true,
}
export const services: Service[] = [
  {
    id: 'check-my-diary',
    heading: 'Check my diary',
    description: 'View your prison staff detail (staff rota) from home.',
    href: 'http://localhost:3001',
    navEnabled: true,
  },
]

export const prisonUser: PrisonUser = {
  authSource: 'nomis',
  ...baseUser,
  staffId: 123,
  activeCaseLoadId,
  activeCaseLoad,
  caseLoads: [activeCaseLoad],
  allocationJobResponsibilities: [],
}
