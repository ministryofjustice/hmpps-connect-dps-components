import type Logger from 'bunyan'
import * as cheerio from 'cheerio'
import express from 'express'
import nock from 'nock'
import nunjucks from 'nunjucks'
import request from 'supertest'
import { version } from '../package.json'
import type { ComponentsApiResponse } from './data/componentApi/componentApiClient'
import type { HmppsUser } from './types/HmppsUser'
import { activeCaseLoad, azureUser, externalUser, prisonUser, probationUser, services } from './utils/testMocks'
import ComponentsService, { type FrontendComponentRequestOptions } from './componentsService'

const apiResponse: ComponentsApiResponse = {
  header: { html: 'header', css: ['header.css'], javascript: ['header.js'] },
  footer: { html: 'footer', css: ['footer.css'], javascript: [] },
  meta: {
    caseLoads: [activeCaseLoad],
    activeCaseLoad,
    services,
    allocationJobResponsibilities: [],
    cspDirectives: { 'style-src': ['http://localhost'] },
  },
}

function setupApp(
  {
    user,
    includeSharedData = false,
    useFallbacksByDefault = false,
    updateContentSecurityPolicy = false,
    provideUrls = true,
  }: {
    user?: HmppsUser
    includeSharedData?: boolean
    useFallbacksByDefault?: boolean
    updateContentSecurityPolicy?: boolean
    provideUrls?: boolean
  } = { user: prisonUser },
): express.Application {
  const app = express()
  app.use((_req, res, next) => {
    res.locals.user = user as HmppsUser
    next()
  })

  app.set('view engine', 'njk')
  nunjucks.configure(
    ['src/assets', 'node_modules/govuk-frontend/dist/', 'node_modules/govuk-frontend/dist/components/'],
    { autoescape: true, express: app },
  )

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as jest.Mocked<Logger>

  const componentsService = ComponentsService.create({
    logger: loggerMock,
    componentApiConfig: {
      url: 'http://fe-components',
      timeout: { deadline: 100, response: 100 },
      agent: { timeout: 100 },
    },
    dpsUrl: 'http://dpsUrl',
  })

  const options: FrontendComponentRequestOptions = {
    includeSharedData,
    useFallbacksByDefault,
    updateContentSecurityPolicy,
  }
  if (provideUrls) {
    options.authUrl = 'http://authUrl'
    options.supportUrl = 'http://supportUrl'
  }
  app.use(componentsService.getFrontendComponents(options))

  app.get('/', (_req, res) => res.send({ feComponents: res.locals.feComponents }))

  return app
}

const componentsApi = nock('http://fe-components')
const authApi = nock('http://authUrl')

beforeEach(() => {
  authApi.post('/oauth/token').reply(200, { access_token: 'token-1', expires_in: 300 })
})

afterEach(() => {
  componentsApi.done()
  nock.cleanAll()
})

describe('getFrontendComponents', () => {
  it('should call fe components api and attach header and footer html with all css and js combined', () => {
    componentsApi.get(`/components?component=header&component=footer&library=${version}`).reply(200, apiResponse)

    return request(setupApp())
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200, {
        feComponents: {
          header: 'header',
          footer: 'footer',
          cssIncludes: ['header.css', 'footer.css'],
          jsIncludes: ['header.js'],
        },
      })
  })

  describe('fallbacks', () => {
    describe.each([
      { scenario: 'prison user', user: prisonUser, useFallbacksByDefault: undefined },
      { scenario: 'configured to only use fallbacks', user: prisonUser, useFallbacksByDefault: true },
    ])('when $scenario', ({ user, useFallbacksByDefault }) => {
      beforeEach(() => {
        if (!useFallbacksByDefault) {
          componentsApi.get(`/components?component=header&component=footer&library=${version}`).times(2).reply(500)
        }
      })

      it('should provide a fallback header', () => {
        return request(setupApp({ user, useFallbacksByDefault }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $header = cheerio.load(res.body.feComponents.header)

            expect($header('[data-qa="header-user-name"]').text()).toContain('E. Shannon')
            expect($header('a[href="http://dpsUrl"]').text()).toContain('Digital Prison Services')
            expect($header('a[href="/sign-out"]').text()).toContain('Sign out')

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
          })
      })

      it('should provide a fallback footer', () => {
        return request(setupApp({ user, useFallbacksByDefault }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body.feComponents.footer.trim()).toEqual(
              '<footer class="govuk-footer govuk-!-display-none-print"></footer>',
            )

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
          })
      })
    })

    describe.each([
      { scenario: 'Azure AD / Entra ID', user: azureUser },
      { scenario: 'external', user: externalUser },
      { scenario: 'probation', user: probationUser },
    ])('when $scenario user', ({ user }) => {
      beforeEach(() => {
        componentsApi.get(`/components?component=header&component=footer&library=${version}`).times(2).reply(500)
      })

      it('should provide a fallback header', () => {
        return request(setupApp({ user }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $header = cheerio.load(res.body.feComponents.header)

            expect($header('[data-qa="header-user-name"]').text()).toContain('E. Shannon')
            expect($header('a[href="http://authUrl"]').text()).toContain('HMPPS')
            expect($header('a[href="/sign-out"]').text()).toContain('Sign out')

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
          })
      })

      it('should provide a fallback footer', () => {
        return request(setupApp({ user }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $footer = cheerio.load(res.body.feComponents.footer)

            expect($footer('a[href="http://authUrl/terms"]').text()).toContain('Terms and conditions')
            expect($footer('a[href="http://supportUrl"]').text()).toContain('Feedback and support')

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
          })
      })

      it('should have a default URLs for HMPPS Auth and feedback/support pages', () => {
        return request(setupApp({ user, provideUrls: false }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $header = cheerio.load(res.body.feComponents.header)
            expect($header('a.fallback-dps-header__title__organisation-name').attr('href')).toEqual(
              'https://sign-in.hmpps.service.justice.gov.uk/auth',
            )
            expect($header('a.fallback-dps-header__title__service-name').attr('href')).toEqual(
              'https://sign-in.hmpps.service.justice.gov.uk/auth',
            )

            const $footer = cheerio.load(res.body.feComponents.footer)
            expect(
              $footer('.govuk-footer__inline-list a')
                .map((_, anchor) => anchor.attribs.href)
                .toArray(),
            ).toEqual([
              'https://www.smartsurvey.co.uk/s/43EWY0/',
              'https://sign-in.hmpps.service.justice.gov.uk/auth/terms',
            ])
          })
      })
    })

    describe('when no user', () => {
      const user: HmppsUser | undefined = undefined

      it('should provide a fallback header', () => {
        return request(setupApp({ user }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $header = cheerio.load(res.body.feComponents.header)

            expect($header('[data-qa="header-user-name"]').length).toEqual(0)
            expect($header('a[href="http://dpsUrl"]').text()).toContain('Digital Prison Services')
            expect($header('a[href="/sign-out"]').length).toEqual(0)

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
          })
      })

      it('should provide a fallback footer', () => {
        return request(setupApp({ user }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            expect(res.body.feComponents.footer.trim()).toEqual(
              '<footer class="govuk-footer govuk-!-display-none-print"></footer>',
            )

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
          })
      })
    })
  })

  describe('shared data', () => {
    it('should include shared data if includeSharedData is true', () => {
      componentsApi.get(`/components?component=header&component=footer&library=${version}`).reply(200, apiResponse)

      return request(setupApp({ user: prisonUser, includeSharedData: true }))
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200, {
          feComponents: {
            header: 'header',
            footer: 'footer',
            cssIncludes: ['header.css', 'footer.css'],
            jsIncludes: ['header.js'],
            sharedData: {
              caseLoads: [activeCaseLoad],
              activeCaseLoad,
              services,
              allocationJobResponsibilities: [],
              cspDirectives: { 'style-src': ['http://localhost'] },
            },
          },
        })
    })
  })

  describe('Content-Security-Policy header', () => {
    it.each([
      { scenario: 'not be updated', updateContentSecurityPolicy: false },
      { scenario: 'be updated', updateContentSecurityPolicy: true },
    ])(
      'should $scenario from MFE response if updateContentSecurityPolicy is $updateContentSecurityPolicy',
      ({ updateContentSecurityPolicy }) => {
        componentsApi.get(`/components?component=header&component=footer&library=${version}`).reply(200, apiResponse)

        return request(setupApp({ user: prisonUser, updateContentSecurityPolicy }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200, {
            feComponents: {
              header: 'header',
              footer: 'footer',
              cssIncludes: ['header.css', 'footer.css'],
              jsIncludes: ['header.js'],
            },
          })
          .expect(res => {
            expect(res.headers).toHaveProperty(
              'content-security-policy',
              updateContentSecurityPolicy
                ? // from MFE response
                  "default-src 'self';style-src 'self' http://localhost"
                : // using built-in fallback
                  "default-src 'self';script-src 'self' http://fe-components;style-src 'self' http://fe-components;img-src 'self' http://fe-components;font-src 'self' http://fe-components",
            )
          })
      },
    )
  })
})
