# Change log

## 8.1.0

Adds an opt-in `caseloadChangeNotification` request option. When set to `true`, the MFE is asked to notify (via the
change caseload link) when the user changes caseload. Defaults to `false`, so existing requests are unchanged.

## 8.0.0

Drops official support for node 22 because testing pipeline no longer ensures it works.

## 7.0.0

Fallback components, used when the micro-frontend components service cannot be accessed, have been updated.
Client applications based on `hmpps-template-typescript` using this library to render components
should not need any updates.

Template context variable `name` was changed to `initialisedName` and
`authUrl` & `supportUrl` have hard-coded defaults when not provided.

## 6.4.2

Maintenance release with minor change to node type dependency.

## 6.4.1 and older

Change log was not maintained here. See github releases.
