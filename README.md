# hmpps-connect-dps-components

`hmpps-connect-dps-components` is a Node.js client library to simplify the process of incorporating global components within DPS applications.

## Prerequisites

The package assumes adherance to the standard [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) project.
It requires:
 - a user object to be available on res.locals containing a token, displayName, and authSource.
 - nunjucks to be setup
 - an environment variable to be set for the micro frontend components api called `COMPONENT_API_URL`

## Installation

To install the package, run the following command:

```bash
npm install @ministryofjustice/hmpps-connect-dps-components
```

## Usage

Currently, the package provides the header and the footer component.

To incorporate use as middleware for appropriate routes within your Express application:

```javascript
    app.get('*', dpsComponents.get({
      dpsUrl: config.serviceUrls.digitalPrison,
      environmentName: 'DEV',
    })
  )
```

There are a [number of options](./src/index.ts) available depending on your requirements.

Add the `hmpps-connect-dps-components` path to the nunjucksSetup.ts file to enable css to be loaded:

```javascript
    const njkEnv = nunjucks.configure(
  [
    path.join(__dirname, '../../server/views'),
    'node_modules/govuk-frontend/dist/',
    'node_modules/govuk-frontend/dist/components/',
    'node_modules/@ministryofjustice/frontend/',
    'node_modules/@ministryofjustice/frontend/moj/components/',
    'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/',
  ],
  {
    autoescape: true,
    express: app,
  },
)
```

Include the package scss within the all.scss file
```scss
  @import 'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/footer';
  @import 'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/header-bar';
```

Ensure that the csp settings allows assets to be loaded from the fe components api. Example file:

```javascript
export default function setUpWebSecurity(): Router {
  const router = express.Router()

  // Secure code best practice - see:
  // 1. https://expressjs.com/en/advanced/best-practice-security.html,
  // 2. https://www.npmjs.com/package/helmet
  router.use((_req: Request, res: Response, next: NextFunction) => {
    res.locals.cspNonce = crypto.randomBytes(16).toString('hex')
    next()
  })

  // This nonce allows us to use scripts with the use of the `cspNonce` local, e.g (in a Nunjucks template):
  // <script nonce="{{ cspNonce }}">
  // or
  // <link href="http://example.com/" rel="stylesheet" nonce="{{ cspNonce }}">
  // This ensures only scripts we trust are loaded, and not anything injected into the
  // page by an attacker.
  const scriptSrc = ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`]
  const styleSrc = ["'self'", (_req: Request, res: Response) => `'nonce-${res.locals.cspNonce}'`]
  const imgSrc = ["'self'", 'data:']
  const fontSrc = ["'self'"]
  const formAction = [`'self' ${config.apis.hmppsAuth.externalUrl} ${config.digitalPrisonServiceUrl}`]

  if (config.apis.frontendComponents.url) {
    scriptSrc.push(config.apis.frontendComponents.url)
    styleSrc.push(config.apis.frontendComponents.url)
    imgSrc.push(config.apis.frontendComponents.url)
    fontSrc.push(config.apis.frontendComponents.url)
  }

  router.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc,
          styleSrc,
          fontSrc,
          imgSrc,
          formAction
        },
      },
      crossOriginEmbedderPolicy: true,
    }),
  )
  return router
}

```

Include reference to the components in your layout.njk file:

```typescript
{% for js in feComponents.jsIncludes %}
    <script src="{{ js }}" nonce="{{ cspNonce }}"></script>
{% endfor %}

{% for css in feComponents.cssIncludes %}
    <link href="{{ css }}" nonce="{{ cspNonce }}" rel="stylesheet" />
{% endfor %}
```
```typescript
{% block header %}
  {{ feComponents.header | safe }}
{% endblock %}
```
```typescript
{% block footer %}
    {{ feComponents.footer | safe }}
{% endblock %}
```

## Metadata

An optional parameter `includeMeta: true` can be passed into the `get` method. Setting this will result in a `feComponentsMeta` beind added to res.locals containing data the components have collected to render. This includes:

- activeCaseLoad (the active caseload of the user)
- caseLoads (all caseloads the user has access to)
- services (information on services the user has access to used for global navigation)

This can be useful e.g. for when your service needs access to activeCaseLoad information to prevent extra calls to the api and takes advantage of the caching that the micro frontend api does.

## Note

In the event of a failure to retrieve the components, the package will populate the html fields with fallback components. However, `feComponentsMeta` will not be populated. If you rely on the data from the micro frontend api, you should handle the data not being present within your application.