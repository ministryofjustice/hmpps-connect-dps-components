# hmpps-connect-dps-components

`hmpps-connect-dps-components` is a Node.js client library to simplify the process of incorporating global components 
within DPS applications.

## Contents

1. [Publishing to NPM](readme/publishing.md)


## Implementation

## Prerequisites

The package assumes adherance to the standard [hmpps-template-typescript](https://github.com/ministryofjustice/hmpps-template-typescript) project.
It requires:
 - a user object to be available on `res.locals` containing a token, displayName, and authSource.
 - nunjucks to be setup
 - an environment variable to be set for the micro frontend components api called `COMPONENT_API_URL`
 - to be run after helmet middleware

## Installation

To install the package, run the following command:

```bash
npm install @ministryofjustice/hmpps-connect-dps-components
```

## Usage

Currently, the package provides the header and the footer component.

To incorporate use as middleware for appropriate routes within your Express application:

```javascript
    app.get('*', dpsComponents.getPageComponents({
      dpsUrl: config.serviceUrls.digitalPrison,
      logger,
    })
  )
```

Consider carefully the '*' above. This will load the components for every route. You may have routes that do not 
require the components, in which case you should be more specific about which to apply the middleware to. 

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

## Extra calls

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

## CSP

The package updates the content-security-middleware to include references to the fe-components API. This package should 
be run after Helmet to prevent this being overwritten.

## Shared Data 

An optional parameter `includeSharedData: true` can be passed into the `get` method. Setting this will result in a 
`sharedData` object being added to `res.locals.feComponents` containing data the components have collected to render. 
This includes:

- activeCaseLoad (the active caseload of the user)
- caseLoads (all caseloads the user has access to)
- services (information on services the user has access to used for global navigation)

This can be useful e.g. for when your service needs access to activeCaseLoad information to prevent extra calls to the 
api and takes advantage of the caching that the micro frontend api does.

## Populating res.locals.user with the shared case load data

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
app.use(dpsComponents.retrieveCaseLoadData({ logger }))
```

Again there are a [number of options](./src/index.ts) available depending on your requirements.

## Note

In the event of a failure to retrieve the components, the package will populate the html fields with fallback components.
The `feComponents.sharedData` will not be populated, but if you use the retrieveCaseLoadData middleware (see above) it 
will either take case load data from the cache or make a call to the Prison API to retrieve it.  