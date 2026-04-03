import dotenv from 'dotenv';
import {createApp} from './app';
import MongodbClient from './models/mongodbMgr';

dotenv.config();

const app = createApp();
const port = process.env.PORT || 3000;
const mongodbUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017';

global.mongodbClient = new MongodbClient(mongodbUrl, () => {
  console.log('mongo client is connected');
  app.listen(port, () => {
    console.log(`server is running on http://localhost:${port}/`);
  });
});

process.on('SIGINT', async () => {
  await global.mongodbClient.close?.();
  process.exit(0);
});
