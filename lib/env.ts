export interface EnvConfig {
  port: number;
  mongodbUrl: string;
  sessionSecret: string;
}

export function getEnv(): Readonly<EnvConfig> {
  return {
    port: Number(process.env.PORT || 3000),
    mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017',
    sessionSecret: process.env.SESSION_SECRET || 'dev-session-secret'
  };
}
