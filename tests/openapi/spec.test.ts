import {describe, expect, it} from 'vitest';
import {openApiSpec} from '../../swagger';

describe('openApiSpec', () => {
  it('contains the existing route groups', () => {
    expect(openApiSpec.paths?.['/api/user/login']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/place/search_by_distance']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/geocode/autocomplete']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/root/get_photo']).toBeTruthy();
  });
});
