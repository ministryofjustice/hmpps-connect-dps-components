import nunjucks from 'nunjucks'
import { HmppsUser } from '../types/HmppsUser'

export interface FallbackHeaderOptions {
  /** The tag to display in fallback headers to indicate non-production environments */
  environmentName?: string
  authUrl?: string
  supportUrl?: string
}

export function getFallbackHeader(
  user: HmppsUser | null,
  dpsUrl: string,
  { environmentName, authUrl, supportUrl }: FallbackHeaderOptions,
): string {
  return nunjucks.render('dpsComponents/header-bar.njk', {
    isPrisonUser: !user || user.authSource === 'nomis',
    user,
    dpsUrl,
    environmentName,
    authUrl,
    supportUrl,
    name: initialiseName(user?.displayName),
  })
}

export interface FallbackFooterOptions {
  authUrl?: string
  supportUrl?: string
}

export function getFallbackFooter(user: HmppsUser | null, { authUrl, supportUrl }: FallbackFooterOptions): string {
  return nunjucks.render('dpsComponents/footer.njk', {
    isPrisonUser: !user || user.authSource === 'nomis',
    supportUrl,
    authUrl,
  })
}

function initialiseName(fullName?: string): string | null {
  if (!fullName) return null

  const array = fullName.split(' ')
  return `${array[0][0]}. ${array.reverse()[0]}`
}
