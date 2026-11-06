import type { HmppsUser, PrisonUser } from '../types/HmppsUser'

export function initialiseName(displayName: string | null | undefined): string | null {
  const fullName = displayName?.trim()
  if (!fullName) {
    return null
  }

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}

export function isPrisonUser(user: HmppsUser | null | undefined): user is PrisonUser {
  return user?.authSource === 'nomis'
}
