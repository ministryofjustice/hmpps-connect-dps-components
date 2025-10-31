# hmpps-connect-dps-components

[![repo standards badge](https://img.shields.io/badge/endpoint.svg?&style=flat&logo=github&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-connect-dps-components)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-report/hmpps-connect-dps-components "Link to report")
[![Test, lint & publish](https://github.com/ministryofjustice/hmpps-connect-dps-components/actions/workflows/pipeline.yml/badge.svg?branch=main)](https://github.com/ministryofjustice/hmpps-connect-dps-components/actions/workflows/pipeline.yml)

`hmpps-connect-dps-components` is a Node.js client library to simplify the process of incorporating global components
within DPS applications. We welcome feedback on this README [here](https://moj.enterprise.slack.com/archives/C04JFG3QJE6)
in order to improve it.

## Contents

1. [Using the library](#using-the-library)
2. [For library developers](#for-library-developers)


## Using the library

### Prerequisites

The package assumes adherance to the standard [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) project.
It requires:
 - a user object to be available on `res.locals` containing a token, displayName, and authSource.
 - nunjucks to be setup
 - to be run AFTER helmet middleware
 - API configs defined for the following:
   - [Component API](https://github.com/ministryofjustice/hmpps-micro-frontend-components)
   - (If using the [caseload data middleware](./src/middleware/retrieveCaseLoadData.ts)) - Prison API
   - (If using the [allocation job responsibilities middleware](./src/middleware/retrieveAllocationJobResponsibilities.ts)) - Allocations API config
 - IF you are using the `retrieveAllocationJobResponsibilities` middleware you will need the
   `@ministryofjustice/hmpps-auth-clients` [package](https://github.com/ministryofjustice/hmpps-typescript-lib/tree/main/packages/auth-clients)
to be installed and setup so that you are able to create `AuthenticationClient` objects.

### Installation

To install the package, run the following command:

```bash
npm install @ministryofjustice/hmpps-connect-dps-components
```

### Usage

Currently, the package provides the header and the footer component.

#### Automatic installation

You can use this script to attempt to automatically install DPS components. It is designed to work with the latest
[hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) file layout.

```shell
npx @ministryofjustice/hmpps-connect-dps-components
```

Do take care to check the diff carefully, in case your repository has diverged from the template.

#### Manual installation

To incorporate, use the middleware for appropriate routes within your Express application:

```javascript
    import { getFrontendComponents } from '@ministryofjustice/hmpps-connect-dps-components'

    ...

    app.use(getFrontendComponents({
      logger,
      componentApiConfig: config.apis.componentApi,
      dpsUrl: config.serviceUrls.digitalPrison,
      requestOptions: { includeSharedData: true },
    }))
```

**However, please 🙏 consider carefully whether you need the components for EVERY request.**

It may be sufficient for you app to only request components for GET requests for example, in which case

```javascript
    app.get('*', getFrontendComponents({
      logger,
      componentApiConfig: config.apis.componentApi,
      dpsUrl: config.serviceUrls.digitalPrison,
      requestOptions: { includeSharedData: true },
    })
  )
```

may be more appropriate, especially if you use the [PRG pattern](https://en.wikipedia.org/wiki/Post/Redirect/Get) to
handle form submission. This will help us to reduce the load on the micro frontend components API. You may wish to
go even further, for example avoiding routes that don't need components - the Prisoner Profile does
something like this to avoid the component API call for the following routes: `/api` (provides prisoner images) and `/`
(a redirect only route).

```javascript
    app.get(
      /^(?!\/api|^\/$).*/,
      getFrontendComponents({
        logger,
        componentApiConfig: config.apis.componentApi,
        dpsUrl: config.serviceUrls.digitalPrison,
      }),
      (req, res) => {
        res.render('prisonerProfile')
      },
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
@import '@ministryofjustice/hmpps-connect-dps-components/dist/assets/footer';
@import '@ministryofjustice/hmpps-connect-dps-components/dist/assets/header-bar';
```

Include reference to the components in your layout.njk file:

```nunjucks
{% for js in feComponents.jsIncludes %}
    <script src="{{ js }}" nonce="{{ cspNonce }}"></script>
{% endfor %}

{% for css in feComponents.cssIncludes %}
    <link href="{{ css }}" nonce="{{ cspNonce }}" rel="stylesheet" />
{% endfor %}
```
```nunjucks
{% block header %}
  {{ feComponents.header | safe }}
{% endblock %}
```
```nunjucks
{% block footer %}
    {{ feComponents.footer | safe }}
{% endblock %}
```

### Extra calls

It may be that you need to add some extra requests for the page components for pages that do not fit the normal flow
of routes. e.g. in `setUpAuthentication.ts` on the `/autherror` path:

```javascript
     router.get(
      '/autherror',
      getFrontendComponents({
        logger,
        componentApiConfig: config.apis.componentApi,
        dpsUrl: config.serviceUrls.digitalPrison,
        requestOptions: { includeSharedData: true },
      }),
      (req, res) => {
        res.status(401)
        return res.render('autherror')
      },
    )
```

This will provide a stripped down header for if there is no user object on `res.locals`.

### CSP

The package updates the content-security-middleware to include references to the fe-components API. This package should
be run after Helmet to prevent this being overwritten.

### Shared Data

An optional parameter `includeSharedData: true` can be passed into the `get` methods request options. Setting this will result in a
`sharedData` object being added to `res.locals.feComponents` containing data the components have collected to render.
This includes:

- activeCaseLoad (the active caseload of the user)
- caseLoads (all caseloads the user has access to)
- services (information on services the user has access to used for global navigation)
- allocationJobResponsibilities (the allocation policy codes the user has the associated job responsibility for. Allocation policy codes are: `KEY_WORKER`, meaning the user is a key worker and `PERSONAL_OFFICER`, meaning the user is a personal officer.)

This can be useful e.g. for when your service needs access to activeCaseLoad information to prevent extra calls to the
api and takes advantage of the caching that the micro frontend api does.

### Populating res.locals.user with the shared case load data

Many services typically add case load information to the user object on `res.locals`. This library provides some
optional middleware which populates:
- `res.locals.user.caseLoads` with all case loads the user has access to
- `res.locals.user.activeCaseLoad` with the active case load of the user
- `res.locals.user.activeCaseLoadId` with the id of the active case load

It uses the `sharedData` object if it is present and caches in `req.session` so that any subsequent routes that do not
use the component middleware can still use the data. If there is no data in the cache, it will fall back to making a
call to Prison API to retrieve the data using the user token.

To enable this, add the middleware after the component middleware as follows:

```javascript
import { retrieveCaseLoadData } from '@ministryofjustice/hmpps-connect-dps-components'

app.use(retrieveCaseLoadData({
    logger,
    prisonApiConfig: config.apis.prisonApi,
  }),
)
```

This middleware checks the `res.locals.user.authSource` so ensure that any mock auth data used in tests includes
`auth_source: 'nomis'` in the response.

### Populating res.locals.user with the shared allocation job responsibilities

This library also provides an optional middleware which populates:
- `res.locals.user.allocationJobResponsibilities` the allocation policy codes the user has the associated job responsibility for. Allocation policy codes are: `KEY_WORKER`, meaning the user is a key worker and `PERSONAL_OFFICER`, meaning the user is a personal officer.

Similar to shared case load data, it uses the `sharedData` object if it is present and caches in `req.session` so that any subsequent routes that do not
use the component middleware can still use the data. If there is no data in the cache, it will fall back to making a
call to Allocations API to retrieve the data using the user token.

To enable this, add the middleware after the component middleware as follows:

```javascript
import { retrieveAllocationJobResponsibilities } from '@ministryofjustice/hmpps-connect-dps-components'
app.use(retrieveAllocationJobResponsibilities({
  logger,
  authenticationClient: new AuthenticationClient(config.apis.hmppsAuth, logger, services.dataAccess.tokenStore),
  allocationsApiConfig: config.apis.allocationsApi,
}))
```

This should go after `retrieveCaseLoadData` so that `res.locals.user.activeCaseLoadId` will be populated.

This middleware checks the `res.locals.user.authSource` so ensure that any mock auth data used in tests includes
`auth_source: 'nomis'` in the response. It also checks the `res.locals.user.activeCaseLoadId`, which is required for retrieving allocation job responsibilities.

Your service will need to be set up with client credentials in order to use this middleware, although it currently
does not need any specific role.

### Note

In the event of a failure to retrieve the components, the package will populate the html fields with fallback components.
The `feComponents.sharedData` will not be populated, but if you use the retrieveCaseLoadData middleware (see above) it
will either take case load data from the cache or make a call to the Prison API to retrieve it.


## For library developers:

1. [Publishing to NPM](readme/publishing.md)
