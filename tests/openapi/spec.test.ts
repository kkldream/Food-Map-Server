import {describe, expect, it} from 'vitest';
import {getOpenApiSpec} from '../../swagger';

describe('openApiSpec', () => {
  it('contains the existing route groups', () => {
    const openApiSpec = getOpenApiSpec();

    expect(openApiSpec.paths?.['/api/user/login']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/place/search_by_distance']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/geocode/autocomplete']).toBeTruthy();
    expect(openApiSpec.paths?.['/api/root/get_photo']).toBeTruthy();
  });

  it('documents get_html_photo as image/jpeg binary', () => {
    const openApiSpec = getOpenApiSpec();
    const getHtmlPhotoPath = openApiSpec.paths?.['/api/place/get_html_photo/{photoId}'] as any;

    expect(getHtmlPhotoPath.get.responses['200'].content['image/jpeg'].schema)
      .toEqual({
        type: 'string',
        format: 'binary'
      });
  });
});
