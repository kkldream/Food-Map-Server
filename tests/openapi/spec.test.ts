import {describe, expect, it} from 'vitest';
import {openApiSpec} from '../../swagger';

describe('openApiSpec', () => {
  it('contains the existing route groups', () => {
    expect(openApiSpec.paths?.['/api/user/login']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/place/search_by_distance']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/geocode/autocomplete']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/root/get_photo']).toBeTruthy();
  });

  it('wraps get_html_photo responses with ApiResponse', () => {
    const getHtmlPhotoPath = openApiSpec.paths?.['/api/place/get_html_photo/{photoId}'] as any;

    expect(getHtmlPhotoPath.get.responses['200'].content['application/json'].schema.$ref)
      .toBe('#/components/schemas/ApiResponse');
  });
});
