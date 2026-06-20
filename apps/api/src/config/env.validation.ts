const REQUIRED_VARS = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'] as const;
const JWT_MIN_SECRET_LENGTH = 32;

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const missing = REQUIRED_VARS.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (typeof config['JWT_SECRET'] === 'string' && config['JWT_SECRET'].length < JWT_MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be at least ${JWT_MIN_SECRET_LENGTH} characters`);
  }

  if (typeof config['JWT_REFRESH_SECRET'] === 'string' && config['JWT_REFRESH_SECRET'].length < JWT_MIN_SECRET_LENGTH) {
    throw new Error(`JWT_REFRESH_SECRET must be at least ${JWT_MIN_SECRET_LENGTH} characters`);
  }

  return config;
}
