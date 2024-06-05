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
    } as undefined as Response

    updateCsp(res)

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
    } as undefined as Response

    updateCsp(res)

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
    } as undefined as Response

    updateCsp(res)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
    )
  })
})
