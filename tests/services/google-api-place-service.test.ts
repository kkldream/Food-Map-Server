import {beforeEach, describe, expect, it, vi} from 'vitest';
import axios from 'axios';
import {googleStatusEnum} from '../../models/dataStruct/originalGoogleResponse/pubilcItem';

vi.mock('axios');
vi.mock('../../models/service/googleApiLogService', () => ({
  insertGoogleApiAutocompleteLog: vi.fn(),
  insertGoogleApiDetailLog: vi.fn(),
  insertGoogleApiPlaceLog: vi.fn()
}));

import {callGoogleApiAutocomplete, callGoogleApiNearBySearch} from '../../models/service/googleApi/placeService';

describe('google place service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('surfaces denied autocomplete responses with the Google status and message', async () => {
    vi.mocked(axios).mockResolvedValue({
      data: {
        predictions: [],
        status: googleStatusEnum.REQUEST_DENIED,
        error_message: 'This IP, site or mobile application is not authorized to use this API key.'
      }
    } as never);

    await expect(callGoogleApiAutocomplete('麥當', {lat: 25.0516, lng: 121.5604}, undefined)).rejects.toMatchObject({
      status: -1,
      text: expect.stringContaining('Google Places API 錯誤: REQUEST_DENIED')
    });
  });

  it('retries paginated nearby search responses when next_page_token is not ready yet', async () => {
    vi.mocked(axios)
      .mockResolvedValueOnce({
        data: {
          results: [{place_id: 'p1', geometry: {location: {lat: 25.05, lng: 121.56}, viewport: {northeast: {lat: 0, lng: 0}, southwest: {lat: 0, lng: 0}}}, icon: '', icon_background_color: '', icon_mask_base_uri: '', name: 'A', photos: [], plus_code: {compound_code: '', global_code: ''}, rating: 0, reference: '', scope: '', types: ['restaurant'], user_ratings_total: 0, vicinity: '', business_status: 'OPERATIONAL'}],
          status: googleStatusEnum.OK,
          next_page_token: 'next-token'
        }
      } as never)
      .mockResolvedValueOnce({
        data: {
          results: [],
          status: googleStatusEnum.INVALID_REQUEST,
          error_message: 'next_page_token is not ready'
        }
      } as never)
      .mockResolvedValueOnce({
        data: {
          results: [{place_id: 'p2', geometry: {location: {lat: 25.06, lng: 121.57}, viewport: {northeast: {lat: 0, lng: 0}, southwest: {lat: 0, lng: 0}}}, icon: '', icon_background_color: '', icon_mask_base_uri: '', name: 'B', photos: [], plus_code: {compound_code: '', global_code: ''}, rating: 0, reference: '', scope: '', types: ['restaurant'], user_ratings_total: 0, vicinity: '', business_status: 'OPERATIONAL'}],
          status: googleStatusEnum.OK,
          next_page_token: undefined
        }
      } as never);

    const result = await callGoogleApiNearBySearch(2, {lat: 25.0516, lng: 121.5604}, 'restaurant', -1);

    expect(result).toHaveLength(2);
    expect(vi.mocked(axios)).toHaveBeenCalledTimes(3);
  });
});
