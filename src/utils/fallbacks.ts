import nunjucks from 'nunjucks'
import type { HmppsUser } from '../types/HmppsUser'
import { initialiseName, isPrisonUser } from './utils'

export interface FallbackHeaderOptions {
  /** The tag to display in fallback headers to indicate non-production environments */
  environmentName?: string
  /** URL of HMPPS Auth */
  authUrl?: string
  /** URL of feedback and support page for external users */
  supportUrl?: string
}

export function getFallbackHeader(
  user: HmppsUser | null,
  dpsUrl: string,
  { environmentName, authUrl, supportUrl }: FallbackHeaderOptions,
): string {
  return nunjucks.render('dpsComponents/header-bar.njk', {
    isPrisonUser: !user || isPrisonUser(user),
    user,
    dpsUrl,
    environmentName,
    authUrl,
    supportUrl,
    initialisedName: initialiseName(user?.displayName),
  })
}

export interface FallbackFooterOptions {
  /** URL of HMPPS Auth */
  authUrl?: string
  /** URL of feedback and support page for external users */
  supportUrl?: string
}

export function getFallbackFooter(user: HmppsUser | null, { authUrl, supportUrl }: FallbackFooterOptions): string {
  return nunjucks.render('dpsComponents/footer.njk', {
    isPrisonUser: !user || isPrisonUser(user),
    supportUrl,
    authUrl,
  })
}
