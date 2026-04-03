import {afterEach, describe, expect, it, vi} from 'vitest';

describe('server lifecycle', () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    Reflect.deleteProperty(globalThis, 'mongodbClient');
  });

  it('connects mongo before listening on the configured port', async () => {
    const connectMongo = vi.fn().mockResolvedValue(undefined);
    const mockHttpServer = {
      close: vi.fn((callback?: (error?: Error | undefined) => void) => callback?.())
    };
    const listen = vi.fn((port: number, callback?: () => void) => {
      callback?.();
      return mockHttpServer;
    });
    const createApp = vi.fn(() => ({listen}));

    vi.doMock('../lib/env', () => ({
      getEnv: () => ({
        port: 4321,
        mongodbUrl: 'mongodb://example',
        sessionSecret: 'secret'
      })
    }));
    vi.doMock('../lib/mongo', () => ({connectMongo}));
    vi.doMock('../app', () => ({createApp}));

    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const {main} = await import('../server');

    await main();

    expect(connectMongo).toHaveBeenCalledWith('mongodb://example');
    expect(createApp).toHaveBeenCalledWith();
    expect(listen).toHaveBeenCalledWith(4321, expect.any(Function));
    expect(logSpy).toHaveBeenCalledWith('mongo client is connected');
    expect(logSpy).toHaveBeenCalledWith('server is running on http://localhost:4321/');
  });

  it('shuts down http server before closing mongo client', async () => {
    const lifecycle: string[] = [];
    const connectMongo = vi.fn().mockResolvedValue(undefined);
    const mockHttpServer = {
      close: vi.fn((callback?: (error?: Error | undefined) => void) => {
        lifecycle.push('http');
        callback?.();
      })
    };
    const listen = vi.fn((_port: number, callback?: () => void) => {
      callback?.();
      return mockHttpServer;
    });

    vi.doMock('../lib/env', () => ({
      getEnv: () => ({
        port: 3000,
        mongodbUrl: 'mongodb://example',
        sessionSecret: 'secret'
      })
    }));
    vi.doMock('../lib/mongo', () => ({connectMongo}));
    vi.doMock('../app', () => ({
      createApp: () => ({listen})
    }));

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => code as never) as typeof process.exit);
    global.mongodbClient = {
      close: vi.fn(async () => {
        lifecycle.push('mongo');
      })
    } as any;

    const {main, shutdown} = await import('../server');

    await main();
    await shutdown();

    expect(lifecycle).toEqual(['http', 'mongo']);
    expect(global.mongodbClient.close).toHaveBeenCalledTimes(1);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('registers SIGINT and SIGTERM handlers that trigger shutdown', async () => {
    const onSpy = vi.spyOn(process, 'on');
    const shutdown = vi.fn().mockResolvedValue(undefined);
    const {registerSignalHandlers} = await import('../server');

    registerSignalHandlers(shutdown);

    const sigintHandler = onSpy.mock.calls.find(([signal]) => signal === 'SIGINT')?.[1];
    const sigtermHandler = onSpy.mock.calls.find(([signal]) => signal === 'SIGTERM')?.[1];

    expect(sigintHandler).toBeTypeOf('function');
    expect(sigtermHandler).toBeTypeOf('function');

    sigintHandler?.();
    sigtermHandler?.();

    expect(shutdown).toHaveBeenCalledTimes(2);
  });
});
