#!/usr/bin/env -S npx tsx
/* eslint-disable no-console */
import { execSync } from 'node:child_process'
import { resolve } from 'node:path'

console.info('→ Installing @ministryofjustice/hmpps-connect-dps-components')
execSync('npm install --save-prod @ministryofjustice/hmpps-connect-dps-components')

console.info('→ Applying patch')
const patchFile = resolve(__dirname, 'patch.diff')
execSync(`git apply ${patchFile}`)

console.info('→ Connect DPS components have been installed')
console.info(
  'However, please consider whether you need the components for EVERY request; see README in hmpps-connect-dps-components.',
)
console.info(
  'Make sure to resolve merge conflicts and check the diff carefully (eg. for duplicate environment variables)',
)
