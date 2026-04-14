import type { Response } from 'express'
import updateCsp from './updateCsp'

const mockResponse = (cspHeader?: string): Response =>
  ({
    get: jest.fn(() => cspHeader),
    set: jest.fn(),
  }) as unknown as Response

describe('updateCsp', () => {
  describe('using new options parameter with explicit directives', () => {
    it('should do nothing if directives are provided but empty (fallbacks are not used)', () => {
      const res = mockResponse("default-src 'self';script-src 'self' 'nonce-1234'")
      updateCsp({ directives: {}, feComponentsUrl: 'http://fe-components', res })
      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        // nothing changes
        "default-src 'self';script-src 'self' 'nonce-1234'",
      )
    })

    it('should update CSP header if given directives already existed', () => {
      const res = mockResponse(
        "default-src 'self';style-src 'self' http://localhost/assets;script-src 'self' 'nonce-1234';object-src 'none'",
      )
      updateCsp({
        directives: {
          'script-src': ['https://justice.gov.uk'],
          'style-src': ['https://justice.gov.uk', 'https://gov.uk'],
        },
        feComponentsUrl: 'http://fe-components',
        res,
      })
      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        // 1 url appended to script-src; 2 urls to style-src
        "default-src 'self';style-src 'self' http://localhost/assets https://justice.gov.uk https://gov.uk;script-src 'self' 'nonce-1234' https://justice.gov.uk;object-src 'none'",
      )
    })

    it('should update CSP header if directives did not exist', () => {
      const res = mockResponse("default-src 'self';upgrade-insecure-requests")
      updateCsp({
        directives: {
          'script-src': ['https://justice.gov.uk'],
          'style-src': ['https://justice.gov.uk', 'https://gov.uk'],
        },
        feComponentsUrl: 'http://fe-components',
        res,
      })
      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        // script-src created with 'self' and 1 url; style-src with 'self' and 2 urls
        "default-src 'self';upgrade-insecure-requests;script-src 'self' https://justice.gov.uk;style-src 'self' https://justice.gov.uk https://gov.uk",
      )
    })

    it('should create CSP header when none was set (including adding default-src)', () => {
      const res = mockResponse()
      updateCsp({
        directives: {
          'script-src': ['https://justice.gov.uk'],
          'style-src': ['https://justice.gov.uk', 'https://gov.uk'],
        },
        feComponentsUrl: 'http://fe-components',
        res,
      })
      expect(res.set).toHaveBeenCalledWith(
        'content-security-policy',
        // default-src created with 'self'; script-src created with 'self' and 1 url; style-src with 'self' and 2 urls
        "default-src 'self';script-src 'self' https://justice.gov.uk;style-src 'self' https://justice.gov.uk https://gov.uk",
      )
    })
  })

  describe.each([
    {
      scenario: 'using new options parameter without explicit directives',
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
