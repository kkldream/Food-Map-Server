import request from 'supertest';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import apiResponseBase from '../../models/dataStruct/apiResponseUserBase';
import geocodeMgr from '../../models/geocodeMgr';
import placeMgr from '../../models/placeMgr';
import {createApp} from '../../app';

vi.mock('../../models/placeMgr', () => ({
  default: {
    searchByDistance: vi.fn(),
    searchByKeyword: vi.fn(),
    detailsByPlaceId: vi.fn(),
    drawCard: vi.fn(),
    getPhoto: vi.fn(),
    getHtmlPhoto: vi.fn(),
    autocomplete: vi.fn()
  }
}));

vi.mock('../../models/geocodeMgr', () => ({
  default: {
    autocomplete: vi.fn(),
    getLocationByAddress: vi.fn(),
    getRoutePolyline: vi.fn()
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

describe('place and geocode routes', () => {
  let restoreMongoClient: (() => void) | undefined;

  beforeEach(() => {
    restoreMongoClient = installMongoClientStub();

    vi.spyOn(apiResponseBase.prototype, 'verifyUser').mockResolvedValue({
      msg: '驗證成功'
    });

    vi.mocked(placeMgr.searchByDistance).mockResolvedValue({
      updated: false,
      placeCount: 1,
      placeList: [{place_id: 'p1', name: 'demo'}]
    } as any);
    vi.mocked(placeMgr.detailsByPlaceId).mockResolvedValue({
      updated: false,
      isFavorite: false,
      place: {name: 'demo', place_id: 'p1'}
    } as any);
    vi.mocked(geocodeMgr.autocomplete).mockResolvedValue({
      updated: false,
      placeCount: 1,
      placeList: [{place_id: 'g1', description: '台北市'}]
    } as any);
    vi.mocked(geocodeMgr.getLocationByAddress).mockResolvedValue({
      updated: false,
      place: {
        place_id: 'g1',
        address: '台北市信義區',
        location: {lat: 25.033, lng: 121.5654}
      }
    } as any);
  });

  afterEach(() => {
    restoreMongoClient?.();
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('wraps the search_by_distance response and forwards destructured body fields', async () => {
    const app = createApp();

    const response = await request(app).post('/api/place/search_by_distance').send({
      userId: 'u1',
      accessKey: 'k1',
      location: {lat: 25, lng: 121},
      distance: 1000,
      skip: 0,
      limit: 10
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        updated: false,
        placeCount: 1,
        placeList: expect.arrayContaining([
          expect.objectContaining({place_id: 'p1'})
        ])
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(apiResponseBase.prototype.verifyUser).toHaveBeenCalledWith('u1', 'k1');
    expect(placeMgr.searchByDistance).toHaveBeenCalledWith('u1', {lat: 25, lng: 121}, 1000, 0, 10);
  });

  it('wraps the details_by_place_id response and forwards destructured body fields', async () => {
    const app = createApp();

    const response = await request(app).post('/api/place/details_by_place_id').send({
      userId: 'u1',
      accessKey: 'k1',
      place_id: 'place-1'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        updated: false,
        isFavorite: false,
        place: expect.objectContaining({
          name: 'demo',
          place_id: 'p1'
        })
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(apiResponseBase.prototype.verifyUser).toHaveBeenCalledWith('u1', 'k1');
    expect(placeMgr.detailsByPlaceId).toHaveBeenCalledWith('u1', 'place-1');
  });

  it('wraps the geocode autocomplete response and forwards destructured body fields', async () => {
    const app = createApp();

    const response = await request(app).post('/api/geocode/autocomplete').send({
      userId: 'u1',
      accessKey: 'k1',
      location: {lat: 25.033, lng: 121.5654},
      input: '台北'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        updated: false,
        placeCount: 1,
        placeList: expect.arrayContaining([
          expect.objectContaining({place_id: 'g1'})
        ])
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(apiResponseBase.prototype.verifyUser).toHaveBeenCalledWith('u1', 'k1');
    expect(geocodeMgr.autocomplete).toHaveBeenCalledWith({lat: 25.033, lng: 121.5654}, '台北');
  });

  it('wraps the get_location_by_address response and forwards destructured body fields', async () => {
    const app = createApp();

    const response = await request(app).post('/api/geocode/get_location_by_address').send({
      userId: 'u1',
      accessKey: 'k1',
      address: '台北市信義區'
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({
      status: 0,
      result: expect.objectContaining({
        updated: false,
        place: expect.objectContaining({
          place_id: 'g1',
          address: '台北市信義區',
          location: {lat: 25.033, lng: 121.5654}
        })
      })
    }));
    expect(response.body).not.toHaveProperty('errMsg');
    expect(apiResponseBase.prototype.verifyUser).toHaveBeenCalledWith('u1', 'k1');
    expect(geocodeMgr.getLocationByAddress).toHaveBeenCalledWith('台北市信義區');
  });

  it('returns a failure envelope when a route manager throws', async () => {
    vi.mocked(placeMgr.searchByDistance).mockRejectedValueOnce(new Error('boom'));
    const app = createApp();

    const response = await request(app).post('/api/place/search_by_distance').send({
      userId: 'u1',
      accessKey: 'k1',
      location: {lat: 25, lng: 121},
      distance: 1000,
      skip: 0,
      limit: 10
    });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(-1);
    expect(response.body.errMsg).toBeTruthy();
    expect(placeMgr.searchByDistance).toHaveBeenCalledWith('u1', {lat: 25, lng: 121}, 1000, 0, 10);
  });

  it('returns the api fallback envelope for missing routes', async () => {
    const app = createApp();

    const response = await request(app).get('/api/not_found');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe(-1);
    expect(response.body.errMsg).toContain('Not found');
  });
});
