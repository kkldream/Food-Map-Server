import {beforeEach, describe, expect, it, vi} from 'vitest';
import axios from 'axios';
import {googleStatusEnum} from '../../models/dataStruct/originalGoogleResponse/pubilcItem';

vi.mock('axios');
vi.mock('../../models/service/googleApiLogService', () => ({
  insertGoogleApiComputeRoutesLog: vi.fn(),
  insertGoogleApiGeocodeAutocompleteLog: vi.fn()
}));

import {
  callGoogleApiComputeRoutes,
  callGoogleApiGeocodeLocation
} from '../../models/service/googleApi/geocodeService';

describe('google geocode service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces denied geocode responses with the Google status and message', async () => {
    vi.mocked(axios).mockResolvedValue({
      data: {
        results: [],
        status: googleStatusEnum.REQUEST_DENIED,
        error_message: 'API keys with referer restrictions cannot be used with this API.'
      }
    } as never);

    await expect(callGoogleApiGeocodeLocation('台北101')).rejects.toMatchObject({
      status: -1,
      text: expect.stringContaining('Google Geocoding API 錯誤: REQUEST_DENIED')
    });
  });

  it('builds routes requests with destination.lng instead of destination.lat', async () => {
    vi.mocked(axios).mockResolvedValue({
      data: {
        routes: [
          {
            distanceMeters: 123,
            duration: '45s',
            polyline: {encodedPolyline: 'abc'}
          }
        ]
      }
    } as never);

    await callGoogleApiComputeRoutes(
      {lat: 25.0516, lng: 121.5604, place_id: ''},
      {lat: 25.0339, lng: 121.5644, place_id: ''}
    );

    expect(vi.mocked(axios)).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        destination: {
          location: {
            latLng: {
              latitude: 25.0339,
              longitude: 121.5644
            }
          }
        }
      })
    }));
  });
});
