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

  describe("Georeferencing (origin)", () => {
    test("spacesFromGeoJSON", () => {
      const namespace = namespaces.tokyo;
      const geojson = geoJsons["tokyo/shinjuku-gyoen"];
      const boundingSpace = namespace.spacesFromGeoJSON(4, geojson.geometry);
      const zfxys = boundingSpace.map((space) => space.zfxyStr);
      assert.deepStrictEqual(zfxys, [
        '/4/0/8/6',
        '/4/0/9/6',
        '/4/0/8/7',
        '/4/0/9/7',
        '/4/1/8/6',
        '/4/1/9/6',
        '/4/1/8/7',
        '/4/1/9/7',
      ]);
    });
  });
});
