import { initialiseName, isPrisonUser } from './utils'
import type { AzureADUser, ExternalUser, PrisonUser, ProbationUser } from '../types/HmppsUser'

const baseUser = { displayName: 'Edwin Shannon', name: 'Edwin Shannon', userId: '123', username: 'ed123' }
const azureUser: AzureADUser = { authSource: 'azuread', ...baseUser }
const externalUser: ExternalUser = { authSource: 'external', ...baseUser }
const probationUser: ProbationUser = { authSource: 'delius', ...baseUser }
const activeCaseLoadId = 'KMI'
const activeCaseLoad = {
  caseLoadId: activeCaseLoadId,
  description: 'Kirkham (HMP)',
  type: 'INST',
  caseloadFunction: 'GENERAL',
  currentlyActive: true,
}
const prisonUser: PrisonUser = {
  authSource: 'nomis',
  ...baseUser,
  staffId: 123,
  activeCaseLoadId,
  activeCaseLoad,
  caseLoads: [activeCaseLoad],
  allocationJobResponsibilities: [],
}

describe('initialiseName', () => {
  it.each([
    [undefined, null],
    [null, null],
    ['', null],
    [' ', null],
    ['Edwin Shannon', 'E. Shannon'],
    ['robert', 'r. robert'],
    [' robert james ', 'r. james'],
    ['Robert James', 'R. James'],
    ['Robert James Smith', 'R. Smith'],
    ['Robert-John Smith-Jones-Wilson', 'R. Smith-Jones-Wilson'],
  ])('should initialise name %j as %j', (displayName, expected) => {
    expect(initialiseName(displayName)).toEqual(expected)
  })
})

describe('isPrisonUser', () => {
  it.each([undefined, null, {}] as never[])('should return false for a %j user', user => {
    expect(isPrisonUser(user)).toBe(false)
  })

  it.each([
    ['Azure AD / Entra ID', azureUser],
    ['External', externalUser],
    ['Probation', probationUser],
  ])('should return false for a %s user', (_, user) => {
    expect(isPrisonUser(user)).toBe(false)
  })

  it('should return true for a prison user', () => {
    expect(isPrisonUser(prisonUser)).toBe(true)
  })
})
