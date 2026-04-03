import dotenv from 'dotenv';
import {createApp} from './app';
import {getEnv} from './lib/env';
import {connectMongo} from './lib/mongo';

dotenv.config();

async function main() {
  const env = getEnv();
  await connectMongo(env.mongodbUrl);
  console.log('mongo client is connected');

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`server is running on http://localhost:${env.port}/`);
  });
}

main();

process.on('SIGINT', async () => {
  await global.mongodbClient.close?.();
  process.exit(0);
});
