import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import apiResponseBase from '../../models/dataStruct/apiResponseUserBase';
import placeMgr from '../../models/placeMgr';
import rootMgr from '../../models/rootMgr';
import {createApp} from '../../app';

vi.mock('../../models/rootMgr', () => ({
  default: {
    getGoogleApiKey: vi.fn()
  }
}));

vi.mock('../../models/placeMgr', () => ({
  default: {
    getPhoto: vi.fn()
  }
}));

function installMongoClientStub() {
  const previousMongoClient = global.mongodbClient;

  global.mongodbClient = {
    foodMapDb: {
      routeApiLogCol: {
        insertOne: vi.fn()
      }
    }
  } as any;

  return () => {
    global.mongodbClient = previousMongoClient;
  };
}

describe('root routes', () => {
  let restoreMongoClient: (() => void) | undefined;

  beforeEach(() => {
    restoreMongoClient = installMongoClientStub();

    vi.mocked(rootMgr.getGoogleApiKey).mockReturnValue({key: 'demo'});
    vi.mocked(placeMgr.getPhoto).mockResolvedValue({
      photoBase64: 'base64-image',
      format: 'jpeg'
    });
  });

  afterEach(() => {
    restoreMongoClient?.();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('returns the wrapped google api key response', async () => {
    const verifyRootSpy = vi.spyOn(apiResponseBase.prototype, 'verifyRoot').mockResolvedValue({
      msg: '驗證成功'
    });
    const app = createApp();

    const response = await request(app).post('/api/root/get_google_api_key').send({
      accessKey: 'root'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        key: 'demo'
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(verifyRootSpy).toHaveBeenCalledWith('root');
    expect(rootMgr.getGoogleApiKey).toHaveBeenCalledWith();
  });

  it('returns the wrapped photo response and passes destructured body fields', async () => {
    const verifyRootSpy = vi.spyOn(apiResponseBase.prototype, 'verifyRoot').mockResolvedValue({
      msg: '驗證成功'
    });
    const app = createApp();

    const response = await request(app).post('/api/root/get_photo').send({
      accessKey: 'root',
      photoId: 'photo-1',
      detail: 720
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        photoBase64: 'base64-image',
        format: 'jpeg'
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(verifyRootSpy).toHaveBeenCalledWith('root');
    expect(placeMgr.getPhoto).toHaveBeenCalledWith('photo-1', 720);
  });
});
