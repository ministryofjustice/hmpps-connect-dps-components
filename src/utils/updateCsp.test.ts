import type { Response } from 'express'
import updateCsp from './updateCsp'

const mockResponse = (cspHeader?: string): Response =>
  ({
    get: jest.fn(() => cspHeader),
    set: jest.fn(),
  }) as unknown as Response

describe('updateCsp', () => {
  describe.each([
    {
      scenario: 'using new options parameter',
      test: (res: Response) => updateCsp({ feComponentsUrl: 'http://fe-components', res }),
    },
    {
      scenario: 'using deprecated parameter syntax',
      test: (res: Response) => updateCsp('http://fe-components', res),
    },
  ])('$scenario', ({ test }) => {
    it('should add fe-components url to CSP directives', () => {
      const res = mockResponse("default-src 'self';script-src 'self';style-src 'self';img-src 'self';font-src 'self'")

      test(res)

      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
      )
    })

    it('should add required directives when CSP header is not set', () => {
      const res = mockResponse()

      test(res)

      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
      )
    })

    it('should add required directives that are not present', () => {
      const res = mockResponse("default-src 'self'")

      test(res)

      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
      )
    })

    it('should not change any with existing reference to fe-components', () => {
      const res = mockResponse(
        "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self'",
      )

      test(res)

      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
      )
    })

    it('should not confuse values that look like directive names', () => {
      const res = mockResponse("default-src 'self' http://script-src http://localhost")

      test(res)

      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        "default-src 'self' http://script-src http://localhost;script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
      )
    })
  })
})
