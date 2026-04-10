import type { Response } from 'express'
import type { CspDirectives } from '../types/CspDirectives'

/** Update Content-Security-Policy header in response to allow use of MFE components on another domain/origin */
export default function updateCsp(feComponentsUrl: string, res: Response) {
  const cspHeader = res.get('content-security-policy')
  const directives: CspDirectives = directivesFromHeader(cspHeader)
  const requiredDirectives = fallbackDirectives(feComponentsUrl)
  mergeDirectives(directives, requiredDirectives)
  const newCspHeader = headerFromDirectives(directives)
  res.set('content-security-policy', newCspHeader)
}

/** Minimal known requirements to use MFE components on another domain/origin */
function fallbackDirectives(feComponentsUrl: string): CspDirectives {
  return {
    'script-src': [feComponentsUrl],
    'style-src': [feComponentsUrl],
    'img-src': [feComponentsUrl],
    'font-src': [feComponentsUrl],
  }
}

function directivesFromHeader(cspHeader: string | undefined): CspDirectives {
  const header = cspHeader || "default-src 'self'"
  return Object.fromEntries(
    (header.split(';') ?? []).map(line => {
      const [directive, ...values] = line.split(/\s+/)
      return [directive, values]
    }),
  )
}

function headerFromDirectives(directives: CspDirectives): string {
  return Object.entries(directives)
    .map(([directive, values]) => (values.length > 0 ? `${directive} ${values.join(' ')}` : directive))
    .join(';')
}

function mergeDirectives(directives: CspDirectives, overrides: Readonly<CspDirectives>): void {
  Object.entries(overrides).forEach(([directive, values]) => {
    if (directive in directives) {
      values.forEach(value => {
        if (!directives[directive].includes(value)) {
          directives[directive].push(value)
        }
      })
    } else {
      // eslint-disable-next-line no-param-reassign
      directives[directive] = ["'self'", ...values]
    }
  })
}
