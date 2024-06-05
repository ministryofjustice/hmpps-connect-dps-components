[< Back](../README.md)
---

## Publishing to NPM

This library is [published to NPM](https://www.npmjs.com/package/@ministryofjustice/hmpps-connect-dps-components).

The process to publish a change is as follows:

* Create a branch from `main`
* Make the code changes
* Run `npm version <patch|minor|major> --no-git-tag-version` to bump the version number appropriately (for help with
  semantic versioning, see https://semver.org/)
* Commit the changes, push the branch and raise a PR
* Once the PR has been merged to `main`, [create a new release](https://github.com/ministryofjustice/hmpps-connect-dps-components/releases/new):
    * Select the `Choose a tag` dropdown and create a new tag entering the new version number (this must start with a `v`, e.g. `v0.0.1`)
    * Enter a release title with the following format `<version>: <short title>` e.g. `v0.0.1: First Release`
    * Enter a more detailed description of the release
    * Click `Publish release`

CircleCI is configured to trigger on the tagged release and publish to NPM.