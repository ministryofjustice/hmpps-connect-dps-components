const production = process.env.NODE_ENV === 'production'

function get(name: string, fallback: string, options = { requireInProduction: false }) {
  const envVarValue = process.env[name]
  if (envVarValue !== undefined) {
    return envVarValue
  }
  if (fallback !== undefined && (!production || !options.requireInProduction)) {
    return fallback
  }
  throw new Error(`Missing env var ${name}`)
}

const requiredInProduction = { requireInProduction: true }

export default {
  apis: {
    feComponents: {
      url: get('COMPONENT_API_URL', 'http://fe-components', requiredInProduction),
    },
    prisonApi: {
      url: get('PRISON_API_URL', null),
    },
    allocationsApi: {
      url: get('ALLOCATIONS_API_URL', null),
    },
  },
}
