const { readFileSync } = require('fs')

const { version } = JSON.parse(readFileSync('./package.json', 'utf8'))

global.DPS_COMPONENTS_VERSION = version
