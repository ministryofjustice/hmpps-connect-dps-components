import { type Response } from 'express'

export default function updateCsp(feComponentsUrl: string, res: Response, enableAppInsightsCspUpdate?: boolean) {
  const csp = res.getHeaders()['content-security-policy']
  const allDirectives = csp?.split(';') ?? []
  const directivesToUpdate = ['script-src', 'style-src', 'img-src', 'font-src']

  const updatedCspDirectives = allDirectives.map(directive => {
    // if directive is not in cspToUpdate or includes fe components url already return as is
    if (directive.includes(feComponentsUrl as string) || !directivesToUpdate.some(p => directive.includes(`${p} `)))
      return directive

    // if directive is in cspToUpdate and does not have fe components url, add in
    return `${directive} ${feComponentsUrl}`
  })

  const requiredAndNotPresent = directivesToUpdate
    .filter(p => !updatedCspDirectives.find(directive => directive.includes(`${p} `)))
    .map(p => `${p} 'self' ${feComponentsUrl}`)

  if (enableAppInsightsCspUpdate) {
    const azureDomains = [
      'https://northeurope-0.in.applicationinsights.azure.com',
      '*.monitor.azure.com',
    ]

    let cspWithAppInsights = [...updatedCspDirectives, ...requiredAndNotPresent]
    const connectIndex = cspWithAppInsights.findIndex(d => d.includes('connect-src'))
    if (connectIndex > -1) {
      azureDomains.forEach(domain => {
        if (!cspWithAppInsights[connectIndex].includes(domain)) {
          cspWithAppInsights[connectIndex] += ` ${domain}`
        }
      })
    } else {
      cspWithAppInsights.push(`connect-src 'self' ${azureDomains.join(' ')}`)
    }

    res.set('content-security-policy', cspWithAppInsights.join(';'))
  } else {
    res.set('content-security-policy', [...updatedCspDirectives, ...requiredAndNotPresent].join(';'))
  }

}
