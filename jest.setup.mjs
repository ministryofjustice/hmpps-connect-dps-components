import packageInfo from './package.json' with { type: 'json' }

global.DPS_COMPONENTS_VERSION = packageInfo.version
