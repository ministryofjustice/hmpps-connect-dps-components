import { type Response } from 'express'
import updateCsp from './updateCsp'

describe('updateCsp', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should add fe-components url to CSP directives', () => {
    const res = {
      get: jest.fn(() => "default-src 'self';script-src 'self';style-src 'self';img-src 'self';font-src 'self'"),
      set: jest.fn(),
    } as unknown as Response

    updateCsp('http://fe-components', res)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
    )
  })

  it('should add required directives when CSP header is not set', () => {
    const res = {
      get: jest.fn(),
      set: jest.fn(),
    } as unknown as Response

    updateCsp('http://fe-components', res)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
    )
  })

  it('should add required directives that are not present', () => {
    const res = {
      get: jest.fn(() => "default-src 'self'"),
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
      get: jest.fn(
        () =>
          "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self'",
      ),
      set: jest.fn(),
    } as unknown as Response

    updateCsp('http://fe-components', res)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
    )
  })

  it('should not confuse values that look like directive names', () => {
    const res = {
      get: jest.fn(() => "default-src 'self' http://script-src http://localhost"),
      set: jest.fn(),
    } as unknown as Response

    updateCsp('http://fe-components', res)

    expect(res.set).toHaveBeenCalledWith(
      'content-security-policy',
      "default-src 'self' http://script-src http://localhost;script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
    )
  })
})
