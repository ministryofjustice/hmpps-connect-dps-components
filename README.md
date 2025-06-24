# hmpps-connect-dps-components

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
 - an environment variable to be set for the micro frontend components api called `COMPONENT_API_URL`
 - to be run AFTER helmet middleware

### Installation

To install the package, run the following command:

```bash
npm install @ministryofjustice/hmpps-connect-dps-components
```

### Usage

Currently, the package provides the header and the footer component.

To incorporate use the middleware for appropriate routes within your Express application:

```javascript
    import dpsComponents from '@ministryofjustice/hmpps-connect-dps-components'

    ...

    app.use(dpsComponents.getPageComponents({
      dpsUrl: config.serviceUrls.digitalPrison,
      logger,
    })
  )
```

**However, please 🙏 consider carefully whether you need the components for EVERY request.**

It may be sufficient for you app to only request components for GET requests for example, in which case

```javascript
    app.get('*', dpsComponents.getPageComponents({
      dpsUrl: config.serviceUrls.digitalPrison,
      logger,
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
      dpsComponents.getPageComponents({
        dpsUrl: config.serviceUrls.digitalPrison,
        logger,
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
  @import 'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/footer';
  @import 'node_modules/@ministryofjustice/hmpps-connect-dps-components/dist/assets/header-bar';
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

### Extra calls

It may be that you need to add some extra requests for the page components for pages that do not fit the normal flow 
of routes. e.g. in `setUpAuthentication.ts` on the `/autherror` path:

```javascript
     router.get(
      '/autherror',
      dpsComponents.getPageComponents({ dpsUrl: config.serviceUrls.digitalPrison }),
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

An optional parameter `includeSharedData: true` can be passed into the `get` method. Setting this will result in a 
`sharedData` object being added to `res.locals.feComponents` containing data the components have collected to render. 
This includes:

- activeCaseLoad (the active caseload of the user)
- caseLoads (all caseloads the user has access to)
- services (information on services the user has access to used for global navigation)

This can be useful e.g. for when your service needs access to activeCaseLoad information to prevent extra calls to the 
api and takes advantage of the caching that the micro frontend api does.

### Populating res.locals.user with the shared case load data

Many services typically add case load information to the user object on `res.locals`. This library provides some 
optional middleware which populates:
- `res.locals.user.caseLoads` with all case loads the user has access to
- `res.locals.user.activeCaseLoad` with the active case load of the user
- `res.locals.user.activeCaseLoadId` with the id of the active case load
- `res.locals.user.allocationJobResponsibilities` with the job responsibilities for which the user may have prisoners allocated to them, such as `KEY_WORKER` and `PERSONAL_OFFICER` responsibilities
 
It uses the `sharedData` object if it is present and caches in `req.session` so that any subsequent routes that do not 
use the component middleware can still use the data. If there is no data in the cache, it will fall back to making a 
call to Prison API to retrieve the data using the user token.

To enable this, add the middleware after the component middleware as follows:

```javascript
app.use(dpsComponents.retrieveCaseLoadData({ logger }))
```

Again there are a [number of options](./src/index.ts) available depending on your requirements.

This middleware checks the `res.locals.user.authSource` so ensure that any mock auth data used in tests includes 
`auth_source: 'nomis'` in the response.

### Note

In the event of a failure to retrieve the components, the package will populate the html fields with fallback components.
The `feComponents.sharedData` will not be populated, but if you use the retrieveCaseLoadData middleware (see above) it 
will either take case load data from the cache or make a call to the Prison API to retrieve it.  


## For library developers:

1. [Publishing to NPM](readme/publishing.md)
