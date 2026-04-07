import { type Response } from 'express'

export default function updateCsp(feComponentsUrl: string, res: Response) {
  const csp = res.get('content-security-policy')
  const allDirectives = csp?.split(';') ?? []
  const directivesToUpdate = ['script-src', 'style-src', 'img-src', 'font-src']

  const updatedCspDirectives = allDirectives.map(directive => {
    // if directive is not in cspToUpdate or includes fe components url already return as is
    if (directive.includes(feComponentsUrl) || !directivesToUpdate.some(p => directive.startsWith(`${p} `)))
      return directive

    // if directive is in cspToUpdate and does not have fe components url, add in
    return `${directive} ${feComponentsUrl}`
  })

  const requiredAndNotPresent = directivesToUpdate
    .filter(p => !updatedCspDirectives.find(directive => directive.startsWith(`${p} `)))
    .map(p => `${p} 'self' ${feComponentsUrl}`)

  res.set('content-security-policy', [...updatedCspDirectives, ...requiredAndNotPresent].join(';'))
}
