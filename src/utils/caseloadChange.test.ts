import { Request } from 'express'
import {
  hasCaseloadChanged,
  requestUrlWithoutCaseloadChangedParam,
  withoutCaseloadChangedParam,
} from './caseloadChange'

describe('hasCaseloadChanged', () => {
  it.each([
    ['marker present', { caseloadChanged: 'true' }, true],
    ['marker present but empty', { caseloadChanged: '' }, true],
    ['other parameters only', { page: '2' }, false],
    ['no parameters', {}, false],
  ])('%s', (_scenario, query, expected) => {
    expect(hasCaseloadChanged({ query } as unknown as Request)).toEqual(expected)
  })

  it('copes with a request that has no query', () => {
    expect(hasCaseloadChanged({} as Request)).toEqual(false)
  })
})

describe('withoutCaseloadChangedParam', () => {
  it.each([
    ['relative url, marker only', '/prison/BFI?caseloadChanged=true', '/prison/BFI'],
    [
      'relative url, keeps other parameters',
      '/prison/BFI?status=ACTIVE&caseloadChanged=true',
      '/prison/BFI?status=ACTIVE',
    ],
    ['relative url without the marker', '/prison/BFI?status=ACTIVE', '/prison/BFI?status=ACTIVE'],
    ['relative url with no query', '/prison/BFI', '/prison/BFI'],
    [
      'absolute url stays absolute',
      'https://example.service.justice.gov.uk/prison/BFI?caseloadChanged=true',
      'https://example.service.justice.gov.uk/prison/BFI',
    ],
    ['repeated markers all removed', '/prison/BFI?caseloadChanged=true&caseloadChanged=true', '/prison/BFI'],
  ])('%s', (_scenario, url, expected) => {
    expect(withoutCaseloadChangedParam(url)).toEqual(expected)
  })

  it('preserves a fragment on a relative url', () => {
    expect(withoutCaseloadChangedParam('/prison/BFI?caseloadChanged=true#results')).toEqual('/prison/BFI#results')
  })
})

describe('requestUrlWithoutCaseloadChangedParam', () => {
  it('strips the marker from the requested url', () => {
    const req = { originalUrl: '/prison/BFI?status=ACTIVE&caseloadChanged=true' } as Request

    expect(requestUrlWithoutCaseloadChangedParam(req)).toEqual('/prison/BFI?status=ACTIVE')
  })
})
