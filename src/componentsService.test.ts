import express from 'express'
import nunjucks from 'nunjucks'
import request from 'supertest'
import nock from 'nock'
import * as cheerio from 'cheerio'
import Logger from 'bunyan'
import ComponentsService from './componentsService'
import { HmppsUser, PrisonUser, ProbationUser } from './types/HmppsUser'

const prisonUser = { token: 'token', authSource: 'nomis', displayName: 'Edwin Shannon' } as PrisonUser
const probationUser = { token: 'token', authSource: 'delius', displayName: 'Edwin Shannon' } as ProbationUser
const apiResponse = {
  header: { html: 'header', css: ['header.css'], javascript: ['header.js'] },
  footer: { html: 'footer', css: ['footer.css'], javascript: ['footer.js'] },
  meta: { shared: 'data' },
}

function setupApp(
  {
    user,
    includeSharedData,
    useFallbacksByDefault,
  }: {
    user?: HmppsUser
    includeSharedData?: boolean
    useFallbacksByDefault?: boolean
  } = { user: prisonUser, includeSharedData: false, useFallbacksByDefault: false },
): express.Application {
  const app = express()
  app.use((req, res, next) => {
    res.locals.user = user as HmppsUser
    next()
  })

  app.set('view engine', 'njk')
  nunjucks.configure(
    ['src/assets', 'node_modules/govuk-frontend/dist/', 'node_modules/govuk-frontend/dist/components/'],
    { autoescape: true, express: app },
  )

  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
  } as unknown as Logger

  const componentsService = ComponentsService.create({
    logger: loggerMock,
    componentApiConfig: {
      url: 'http://fe-components',
      timeout: { deadline: 2500, response: 2500 },
      agent: { timeout: 2500 },
    },
    dpsUrl: 'http://dpsUrl',
  })

  app.use(
    componentsService.getFrontendComponents({
      authUrl: 'http://authUrl',
      supportUrl: 'http://supportUrl',
      includeSharedData,
      useFallbacksByDefault,
    }),
  )

  app.get('/', (_req, res) => res.send({ feComponents: res.locals.feComponents }))

  return app
}

let componentsApi: nock.Scope
let authApi: nock.Scope

beforeEach(() => {
  componentsApi = nock('http://fe-components')
  authApi = nock('http://authUrl')
  authApi.post('/oauth/token').reply(200, { access_token: 'token-1', expires_in: 300 })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('getFrontendComponents', () => {
  it('should call fe components api and attach header and footer html with all css and js combined', async () => {
    componentsApi.get('/components?component=header&component=footer').reply(200, apiResponse)

    return request(setupApp())
      .get('/')
      .expect('Content-Type', /json/)
      .expect(200, {
        feComponents: {
          header: 'header',
          footer: 'footer',
          cssIncludes: ['header.css', 'footer.css'],
          jsIncludes: ['header.js', 'footer.js'],
        },
      })
  })

  describe('fallbacks', () => {
    describe('when prison user', () => {
      it('should provide a fallback header', async () => {
        componentsApi
          .get('/components?component=header&component=footer')
          .reply(500)
          .get('/components?component=header&component=footer')
          .reply(500)

        return request(setupApp())
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

      it('should provide a fallback footer', async () => {
        componentsApi
          .get('/components?component=header&component=footer')
          .reply(500)
          .get('/components?component=header&component=footer')
          .reply(500)

        return request(setupApp())
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

    describe('when non-prison user', () => {
      it('should provide a fallback header', async () => {
        componentsApi
          .get('/components?component=header&component=footer')
          .reply(500)
          .get('/components?component=header&component=footer')
          .reply(500)

        return request(setupApp({ user: probationUser }))
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

      it('should provide a fallback footer', async () => {
        componentsApi
          .get('/components?component=header&component=footer')
          .reply(500)
          .get('/components?component=header&component=footer')
          .reply(500)

        return request(setupApp({ user: probationUser }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $header = cheerio.load(res.body.feComponents.footer)

            expect($header('a[href="http://authUrl/terms"]').text()).toContain('Terms and conditions')
            expect($header('a[href="http://supportUrl"]').text()).toContain('Feedback and support')

            expect(res.body.feComponents.cssIncludes).toEqual([])
            expect(res.body.feComponents.jsIncludes).toEqual([])
          })
      })
    })

    describe('when no user', () => {
      it('should provide a fallback header', async () => {
        return request(setupApp({ user: undefined }))
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

      it('should provide a fallback footer', async () => {
        return request(setupApp({ user: undefined }))
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

    describe('when configured to only use fallbacks', () => {
      it('should provide a fallback header', async () => {
        componentsApi.get('/components?component=header&component=footer').reply(200, apiResponse)

        return request(setupApp({ user: prisonUser, useFallbacksByDefault: true }))
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

      it('should provide a fallback footer', async () => {
        componentsApi.get('/components?component=header&component=footer').reply(200, apiResponse)

        return request(setupApp({ user: prisonUser, useFallbacksByDefault: true }))
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
    it('should include shared data if includeSharedData is true', async () => {
      componentsApi.get('/components?component=header&component=footer').reply(200, apiResponse)

      return request(setupApp({ user: prisonUser, includeSharedData: true }))
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200, {
          feComponents: {
            header: 'header',
            footer: 'footer',
            cssIncludes: ['header.css', 'footer.css'],
            jsIncludes: ['header.js', 'footer.js'],
            sharedData: { shared: 'data' },
          },
        })
    })
  })
})
