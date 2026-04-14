import type { Response } from 'express'
import type { CspDirectives } from '../types/CspDirectives'

export interface UpdateCspOptions {
  /** Content-Security-Policy directives to merge into response’s header */
  directives?: CspDirectives
  /** Base URL of MFE components service for fallback Content-Security-Policy directives */
  feComponentsUrl: string
  /** The express response whose Content-Security-Policy header should be updated */
  res: Response
}

/**
 * Update Content-Security-Policy header in response to allow use of MFE components on another domain/origin
 * with given directives, falling back to predefined directives known to be required
 */
export default function updateCsp(options: UpdateCspOptions): void
/**
 * Update Content-Security-Policy header in response to allow use of MFE components on another domain/origin
 * using predefined directives known to be required
 * @deprecated provide options to `updateCsp` as a single object
 */
export default function updateCsp(feComponentsUrl: string, res: Response): void
export default function updateCsp(arg1: UpdateCspOptions | string, arg2?: Response): void {
  if (typeof arg1 === 'string') {
    // eslint-disable-next-line no-param-reassign
    arg1 = { feComponentsUrl: arg1, res: arg2! }
  }
  const { directives: providedDirectives, feComponentsUrl, res } = arg1

  const cspHeader = res.get('content-security-policy')
  const directives: CspDirectives = directivesFromHeader(cspHeader)
  const requiredDirectives = providedDirectives ?? fallbackDirectives(feComponentsUrl)
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
