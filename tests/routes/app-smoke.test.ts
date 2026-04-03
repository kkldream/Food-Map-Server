import request from 'supertest';
import {describe, expect, it} from 'vitest';
import {createApp} from '../../app';

function installMongoClientStub() {
  const previousMongoClient = global.mongodbClient;

  global.mongodbClient = {
    foodMapDb: {
      routeApiLogCol: {
        insertOne: () => undefined
      }
    }
  } as any;

  return () => {
    global.mongodbClient = previousMongoClient;
  };
}

describe('app smoke', () => {
  it('still serves html root, docs, and api routes after bootstrap refactor', {timeout: 10000}, async () => {
    const restoreMongoClient = installMongoClientStub();
    const app = createApp({enableRequestLogging: false});

    try {
      expect((await request(app).get('/')).status).toBe(200);
      expect((await request(app).get('/docs/')).status).toBe(200);
      const apiResponse = await request(app).get('/api');
      expect(apiResponse.status).toBe(200);
      expect(apiResponse.body.status).toBe(0);
      expect(apiResponse.body.result.msg).toBe('api is ready');
    } finally {
      restoreMongoClient();
    }
  });
});
