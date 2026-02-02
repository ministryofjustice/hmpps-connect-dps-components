import { type Response } from 'express'
import updateCsp from './updateCsp'

describe('updateCsp', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should add fe-components url to csp directives', () => {
    const res = {
      getHeaders: jest.fn().mockReturnValue({
        'content-security-policy':
          "default-src 'self';script-src 'self';style-src 'self';img-src 'self';font-src 'self'",
      }),
      set: jest.fn(),
    } as unknown as Response

    updateCsp('http://fe-components', res)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
    )
  })

  it('should add required directives that are not present', () => {
    const res = {
      getHeaders: jest.fn().mockReturnValue({
        'content-security-policy': "default-src 'self'",
      }),
      set: jest.fn(),
    } as unknown as Response

    updateCsp('http://fe-components', res)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
    )
  })

  it('should not change any with existing reference to fe-components', () => {
    const res = {
      getHeaders: jest.fn().mockReturnValue({
        'content-security-policy':
          "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self'",
      }),
      set: jest.fn(),
    } as unknown as Response

    updateCsp('http://fe-components', res)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
    )
  })

  it('should add azure app insights urls to connect-src', () => {
    const res = {
      getHeaders: jest.fn().mockReturnValue({
        'content-security-policy':
          "default-src 'self';script-src 'self';style-src 'self';img-src 'self';font-src 'self'",
      }),
      set: jest.fn(),
    } as unknown as Response

    const enableAppInsightsCspUpdate = true
    updateCsp('http://fe-components', res, enableAppInsightsCspUpdate)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components;" +
      "connect-src 'self' https://northeurope-0.in.applicationinsights.azure.com *.monitor.azure.com",
    )
  })

  it('should not duplicate or overwrite existing connect-src', () => {
    const res = {
      getHeaders: jest.fn().mockReturnValue({
        'content-security-policy':
          "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components;" +
          "connect-src 'self' *.something.com https://northeurope-0.in.applicationinsights.azure.com *.monitor.azure.com",
      }),
      set: jest.fn(),
    } as unknown as Response

    const enableAppInsightsCspUpdate = true
    updateCsp('http://fe-components', res, enableAppInsightsCspUpdate)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components;" +
      "connect-src 'self' *.something.com https://northeurope-0.in.applicationinsights.azure.com *.monitor.azure.com",
    )
  })
})
