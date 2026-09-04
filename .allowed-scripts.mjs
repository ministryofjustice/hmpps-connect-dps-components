import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
  allowlist: {
    // Needed by rollup for watching files
    'node_modules/@parcel/watcher@2.6.0': 'ALLOW',
    // Native solution to quickly resolve module paths, used by jest and eslint
    'node_modules/unrs-resolver@1.12.2': 'ALLOW',
  },
})
