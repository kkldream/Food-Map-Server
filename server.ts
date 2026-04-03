import {Server} from 'http';
import dotenv from 'dotenv';
import {createApp} from './app';
import {getEnv} from './lib/env';
import {connectMongo} from './lib/mongo';

dotenv.config();

let server: Server | undefined;
let isShuttingDown = false;

export function closeServer(httpServer: Server) {
  return new Promise<void>((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

export async function main() {
  const env = getEnv();
  await connectMongo(env.mongodbUrl);
  console.log('mongo client is connected');

  const app = createApp();
  server = app.listen(env.port, () => {
    console.log(`server is running on http://localhost:${env.port}/`);
  });
}

export async function shutdown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  try {
    if (server) {
      await closeServer(server);
    }

    await global.mongodbClient?.close?.();
    process.exit(0);
  } catch (error) {
    console.error('Failed to shut down cleanly', error);
    process.exit(1);
  }
}

export function handleStartupError(error: unknown) {
  console.error('Failed to start server', error);
  process.exit(1);
}

export function registerSignalHandlers(onSignal: () => Promise<void> | void = shutdown) {
  process.on('SIGINT', () => {
    void onSignal();
  });

  process.on('SIGTERM', () => {
    void onSignal();
  });
}

export async function startServer() {
  registerSignalHandlers();

  try {
    await main();
  } catch (error) {
    handleStartupError(error);
  }
}

if (require.main === module) {
  void startServer();
}
