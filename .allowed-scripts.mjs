import { configureAllowedScripts } from '@ministryofjustice/hmpps-npm-script-allowlist'

export default configureAllowedScripts({
   allowlist: {
     // Native solution to quickly resolve module paths, used by jest and eslint
     'node_modules/unrs-resolver@1.11.1': 'ALLOW',
   },
})
