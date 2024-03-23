import assert from 'node:assert';
import test, { describe } from 'node:test';

import { LocalNamespace } from "./local_namespace";

import { namespaces, geoJsons } from './shared.test.ts';

describe('LocalNamespace', () => {
  test("Basic construction", () => {
    const namespace = new LocalNamespace({
      scale: 1
    });
    assert.strictEqual(namespace.scale, 1);
  });

  test("Construction with origin", () => {
    const namespace = new LocalNamespace({
      scale: 1,
      origin_latitude: 35.0,
      origin_longitude: 135.0,
    });
    assert.strictEqual(namespace.scale, 1);
    assert.strictEqual(namespace.origin?.latitude, 35.0);
    assert.strictEqual(namespace.origin?.longitude, 135.0);
  });

  describe.skip("Georeferencing (origin)", () => {
    test("boundingSpaceFromGeoJSON", () => {
      const namespace = namespaces.tokyo;
      const geojson = geoJsons["tokyo/shinjuku-gyoen"];
      const boundingSpace = namespace.boundingSpaceFromGeoJSON(geojson.geometry);
      assert.strictEqual(boundingSpace.zfxyStr, '/2/0/1/2');
    });

    test("spacesFromGeoJSON", () => {
      const namespace = namespaces.tokyo;
      const geojson = geoJsons["tokyo/shinjuku-gyoen"];
      const spaces = namespace.spacesFromGeoJSON(3, geojson.geometry);
      assert.deepStrictEqual(spaces.map((space) => space.zfxyStr), [
        '/3/0/0/2',
      ]);
    });
  });
});
