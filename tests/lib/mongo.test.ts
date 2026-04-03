import {describe, expect, it, vi} from 'vitest';

describe('connectMongo', () => {
  it('rejects when mongodb bootstrap fails', async () => {
    vi.resetModules();

    const connectError = new Error('mongo connect failed');

    vi.doMock('../../models/mongodbMgr', () => ({
      __esModule: true,
      default: class MockMongoClient {
        constructor(_url: string, _onConnected: () => void, onError: (error: Error) => void) {
          onError(connectError);
        }
      }
    }));

    const {connectMongo} = await import('../../lib/mongo');
    await expect(connectMongo('mongodb://example')).rejects.toThrow(connectError.message);
  });
});
