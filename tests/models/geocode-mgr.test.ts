import {beforeEach, describe, expect, it, vi} from 'vitest';
import {errorCodes} from '../../models/dataStruct/throwError';
import {googleStatusEnum} from '../../models/dataStruct/originalGoogleResponse/pubilcItem';

vi.mock('../../models/service/placeService', () => ({
  getAutocompleteHistory: vi.fn(),
  getGeocodeAutocompleteHistory: vi.fn()
}));

vi.mock('../../models/service/geocodeService', () => ({
  getGeocodeAutocompleteHistory: vi.fn()
}));

vi.mock('../../models/service/googleApi/geocodeService', () => ({
  callGoogleApiGeocodeAddress: vi.fn(),
  callGoogleApiGeocodeLocation: vi.fn(),
  callGoogleApiComputeRoutes: vi.fn()
}));

vi.mock('../../models/service/googleApi/placeService', () => ({
  callGoogleApiAutocomplete: vi.fn()
}));

import geocodeMgr from '../../models/geocodeMgr';
import {getAutocompleteHistory} from '../../models/service/placeService';
import {getGeocodeAutocompleteHistory} from '../../models/service/geocodeService';
import {callGoogleApiGeocodeLocation} from '../../models/service/googleApi/geocodeService';
import {callGoogleApiAutocomplete} from '../../models/service/googleApi/placeService';

describe('geocodeMgr', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses the default Google autocomplete radius instead of forcing 1 meter', async () => {
    vi.mocked(getAutocompleteHistory).mockResolvedValue([]);
    vi.mocked(callGoogleApiAutocomplete).mockResolvedValue({
      predictions: [],
      status: googleStatusEnum.OK
    });

    await geocodeMgr.autocomplete({lat: 25.0516, lng: 121.5604}, '麥當');

    expect(callGoogleApiAutocomplete).toHaveBeenCalledWith(
      '麥當',
      {lat: 25.0516, lng: 121.5604},
      undefined
    );
  });

  it('returns placeNotFound when geocode lookup has no matches', async () => {
    vi.mocked(getGeocodeAutocompleteHistory).mockResolvedValue([]);
    vi.mocked(callGoogleApiGeocodeLocation).mockResolvedValue({
      results: [],
      status: googleStatusEnum.ZERO_RESULTS
    });

    await expect(geocodeMgr.getLocationByAddress('not-found')).rejects.toMatchObject({
      status: errorCodes.placeNotFound,
      text: '查無符合地址'
    });
  });
});
