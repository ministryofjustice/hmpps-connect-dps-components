import nunjucks from 'nunjucks'
import { User } from '../types/User'
import RequestOptions from '../types/RequestOptions'

export function getFallbackHeader(user: User | null, requestOptions: RequestOptions): string {
  const { dpsUrl, environmentName, authUrl, supportUrl } = requestOptions

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

export function getFallbackFooter(user: User, requestOptions: RequestOptions): string {
  const { supportUrl, authUrl } = requestOptions
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
