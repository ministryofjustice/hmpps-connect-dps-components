import express from 'express'
import nunjucks from 'nunjucks'
import request from 'supertest'
import nock from 'nock'
import * as cheerio from 'cheerio'
import getFrontendComponents from './componentsService'
import config from './config'

const prisonUser = { token: 'token', authSource: 'nomis', displayName: 'Edwin Shannon' }
const apiResponse = {
  header: { html: 'header', css: ['header.css'], javascript: ['header.js'] },
  footer: { html: 'footer', css: ['footer.css'], javascript: ['footer.js'] },
  meta: { meta: 'data' },
}

function setupApp(user = prisonUser, includeMeta = false): express.Application {
  const app = express()
  app.use((req, res, next) => {
    res.locals.user = user
    next()
  })

  app.set('view engine', 'njk')
  nunjucks.configure(
    ['src/assets', 'node_modules/govuk-frontend/dist/', 'node_modules/govuk-frontend/dist/components/'],
    { autoescape: true, express: app },
  )

  app.use(
    getFrontendComponents({
      dpsUrl: 'http://dpsUrl',
      authUrl: 'http://authUrl',
      supportUrl: 'http://supportUrl',
      includeMeta,
    }),
  )

  app.get('/', (_req, res) => res.send({ feComponents: res.locals.feComponents, meta: res.locals.feComponentsMeta }))

  return app
}

let componentsApi: nock.Scope

beforeEach(() => {
  componentsApi = nock(config.apis.feComponents.url)
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
          })
      })
    })

    describe('when external user', () => {
      it('should provide a fallback header', async () => {
        componentsApi
          .get('/components?component=header&component=footer')
          .reply(500)
          .get('/components?component=header&component=footer')
          .reply(500)

        return request(setupApp({ token: 'token', authSource: 'delius', displayName: 'Edwin Shannon' }))
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

        return request(setupApp({ token: 'token', authSource: 'delius', displayName: 'Edwin Shannon' }))
          .get('/')
          .expect('Content-Type', /json/)
          .expect(200)
          .expect(res => {
            const $header = cheerio.load(res.body.feComponents.footer)

            expect($header('a[href="http://authUrl/terms"]').text()).toContain('Terms and conditions')
            expect($header('a[href="http://supportUrl"]').text()).toContain('Feedback and support')
          })
      })
    })

    describe('when no user', () => {
      it('should provide a fallback header', async () => {
        return request(setupApp(null))
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
    })
  })

  describe('meta data', () => {
    it('should include meta data if includeMeta is true', async () => {
      componentsApi.get('/components?component=header&component=footer').reply(200, apiResponse)

      return request(setupApp(prisonUser, true))
        .get('/')
        .expect('Content-Type', /json/)
        .expect(200, {
          feComponents: {
            header: 'header',
            footer: 'footer',
            cssIncludes: ['header.css', 'footer.css'],
            jsIncludes: ['header.js', 'footer.js'],
          },
          meta: { meta: 'data' },
        })
    })
  })
})
