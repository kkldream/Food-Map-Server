import MongodbClient from '../models/mongodbMgr';

declare global {
  // eslint-disable-next-line no-var
  var mongodbClient: MongodbClient;
}

export async function connectMongo(url: string) {
  return new Promise<MongodbClient>((resolve, reject) => {
    let mongodbClient: MongodbClient;

    mongodbClient = new MongodbClient(
      url,
      () => {
        global.mongodbClient = mongodbClient;
        resolve(mongodbClient);
      },
      (error) => reject(error)
    );
  });
}
