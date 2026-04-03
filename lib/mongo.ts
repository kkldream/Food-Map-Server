import MongodbClient from '../models/mongodbMgr';

declare global {
  // eslint-disable-next-line no-var
  var mongodbClient: MongodbClient;
}

export async function connectMongo(url: string) {
  return new Promise<MongodbClient>((resolve) => {
    global.mongodbClient = new MongodbClient(url, () => resolve(global.mongodbClient));
  });
}
