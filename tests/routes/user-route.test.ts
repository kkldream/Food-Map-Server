import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import apiResponseBase from '../../models/dataStruct/apiResponseUserBase';
import userMgr from '../../models/userMgr';
import {createApp} from '../../app';

vi.mock('../../models/userMgr', () => ({
  default: {
    register: vi.fn(),
    loginByDevice: vi.fn(),
    logoutByDevice: vi.fn()
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

describe('user routes', () => {
  let restoreMongoClient: (() => void) | undefined;

  beforeEach(() => {
    restoreMongoClient = installMongoClientStub();

    vi.mocked(userMgr.register).mockResolvedValue({
      msg: '註冊成功',
      userId: 'u1',
      accessKey: 'k1'
    });
    vi.mocked(userMgr.loginByDevice).mockResolvedValue({
      msg: '登入成功',
      userId: 'u1',
      accessKey: 'k1',
      deviceId: 'web'
    });
    vi.mocked(userMgr.logoutByDevice).mockResolvedValue({
      msg: '登出成功'
    });
  });

  afterEach(() => {
    restoreMongoClient?.();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('wraps the register response and passes the destructured body fields', async () => {
    const app = createApp();

    const response = await request(app).post('/api/user/register').send({
      username: 'demo',
      password: 'pass',
      deviceId: 'web'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        msg: '註冊成功',
        userId: 'u1',
        accessKey: 'k1'
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(userMgr.register).toHaveBeenCalledWith('demo', 'pass', 'web');
  });

  it('wraps the login response and passes the destructured body fields', async () => {
    const app = createApp();

    const response = await request(app).post('/api/user/login').send({
      username: 'demo',
      password: 'pass',
      deviceId: 'web'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        msg: '登入成功',
        userId: 'u1',
        accessKey: 'k1',
        deviceId: 'web'
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(userMgr.loginByDevice).toHaveBeenCalledWith('demo', 'pass', 'web');
  });

  it('persists login session fields for later api requests', async () => {
    const verifyUserSpy = vi.spyOn(apiResponseBase.prototype, 'verifyUser').mockResolvedValue({
      msg: '驗證成功'
    });
    const app = createApp();
    const agent = request.agent(app);

    const loginResponse = await agent.post('/api/user/login').send({
      username: 'demo',
      password: 'pass',
      deviceId: 'web'
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers['set-cookie']).toEqual(expect.arrayContaining([
      expect.stringContaining('user=')
    ]));

    const logoutResponse = await agent.post('/api/user/logout').send({
      deviceId: 'web'
    });

    expect(logoutResponse.status).toBe(200);
    expect(verifyUserSpy).toHaveBeenCalledWith('u1', 'k1');
    expect(userMgr.logoutByDevice).toHaveBeenCalledWith('u1', 'web');
  });

  it('verifies the user and wraps the logout response', async () => {
    const verifyUserSpy = vi.spyOn(apiResponseBase.prototype, 'verifyUser').mockResolvedValue({
      msg: '驗證成功'
    });
    const app = createApp();

    const response = await request(app).post('/api/user/logout').send({
      userId: 'u1',
      accessKey: 'k1',
      deviceId: 'web'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        msg: '登出成功'
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(verifyUserSpy).toHaveBeenCalledWith('u1', 'k1');
    expect(userMgr.logoutByDevice).toHaveBeenCalledWith('u1', 'web');
  });
});
