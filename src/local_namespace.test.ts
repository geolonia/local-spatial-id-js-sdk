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
    // scaleHeight を指定しなかった場合は scale と同じになる
    assert.strictEqual(namespace.scaleHeight, 1);
  });

  test("Construction with custom scaleHeight", () => {
    const namespace = new LocalNamespace({
      scale: 1,
      scaleHeight: 2
    });
    assert.strictEqual(namespace.scale, 1);
    assert.strictEqual(namespace.scaleHeight, 2);
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
      const boundingSpaces = namespace.spacesFromGeoJSON(4, geojson.geometry);
      const zfxys = boundingSpaces.map((space) => space.zfxyStr);
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

    test("spacesFromGeoJSON with custom scaleHeight", () => {
      // scale = 1000, scaleHeight = 500 の場合のテスト
      // origin_altitude を 100 に設定しておく
      const namespace = new LocalNamespace({
        scale: 1000,
        scaleHeight: 500,
        origin_latitude: 35.0,
        origin_longitude: 135.0,
        origin_altitude: 100
      });
      // 簡単のため、GeoJSON は対象地点を示す Point とする
      const geojson: GeoJSON.Point = {
        type: 'Point',
        coordinates: [135.0, 35.0]
      };
      // zoom レベル 4 でタイル群を取得
      const spaces = namespace.spacesFromGeoJSON(4, geojson);
      // LocalSpatialId の toWGS84BBox() では、水平は namespace.scale、垂直は namespace.scaleHeight を用いて計算する
      // z = 0 の場合、tile2meters(scaleHeight, 0) = scaleHeight となるため、
      // タイル '/0/0/0/0' の場合、min altitude = origin_altitude + (0 * scaleHeight) = 100
      // max altitude = origin_altitude + (1 * scaleHeight) = 600
      // ※（実際のタイル計算では z や f の値により細かい値になるため、ここでは一例として検証）
      const found = spaces.some(space => {
        const bbox = space.toWGS84BBox();
        // bbox は [west, south, min_alt, east, north, max_alt]
        // ここでは、origin_altitude から scaleHeight の範囲になっているかを確認
        return bbox[2] === 100 && bbox[5] === 600;
      });
      assert.strictEqual(found, true, "Expected to find a space with altitude range [100,600] based on custom scaleHeight");
    });
  });
});
