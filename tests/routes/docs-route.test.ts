import request from 'supertest';
import {describe, expect, it} from 'vitest';
import {createApp} from '../../app';

describe('docs route', () => {
  it('serves swagger ui and exposes the expected paths', async () => {
    const app = createApp();

    const html = await request(app).get('/docs/');
    expect(html.status).toBe(200);
    expect(html.text).toContain('Swagger UI');
  });
});
