import request from 'supertest';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createApp} from '../../app';

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
});

describe('docs route', () => {
  it('serves swagger ui and exposes the expected paths', async () => {
    const app = createApp();

    const html = await request(app).get('/docs/');
    expect(html.status).toBe(200);
    expect(html.text).toContain('Swagger UI');
  });

  it('registers docs without building the spec during app setup', async () => {
    vi.resetModules();

    vi.doMock('fs', async () => {
      const actual = await vi.importActual<any>('fs');
      const mockedFs = {
        ...actual,
        existsSync: vi.fn(() => false)
      };

      return {
        __esModule: true,
        ...mockedFs,
        default: mockedFs
      };
    });

    const setup = vi.fn(() => (_req: any, res: any) => res.status(200).send('ok'));
    const serve = ((_req: any, _res: any, next: any) => next()) as any;

    vi.doMock('swagger-ui-express', () => ({
      __esModule: true,
      default: {serve, setup},
      serve,
      setup
    }));

    const {default: express} = await import('express');
    const {registerSwagger} = await import('../../swagger');
    const app = express();

    expect(() => registerSwagger(app)).not.toThrow();
    expect(setup).not.toHaveBeenCalled();
  });
});
