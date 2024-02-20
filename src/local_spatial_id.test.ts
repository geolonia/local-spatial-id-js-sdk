import assert from 'node:assert';
import test, { describe } from 'node:test';

import { LocalNamespace } from "./local_namespace";

describe('LocalSpatialId', () => {
  test("Basic construction", () => {
    const namespace = new LocalNamespace({
      scale: 1
    });
    assert.strictEqual(namespace.scale, 1);
    const space = namespace.space('/0/0/0/0');
    assert.strictEqual(space.zfxyStr, '/0/0/0/0');
  });

  test("Conversion to WGS84", () => {
    // 東京都庁: 35.68950097945576, 139.69172572944066
    const namespace = new LocalNamespace({
      scale: 10e3, // 10km
      origin_latitude: 35.68950097945576,
      origin_longitude: 139.69172572944066,
    });
    const space = namespace.space('/0/0/0/0');
    const bbox = space.toWGS84BBox();

    // a bounding box of 10km2, with the center at 東京都庁
    // http://bboxfinder.com/#35.644424,139.636518,35.734552,139.746996
    const referenceBbox = [ 139.63651780159154, 35.644424126412915, 139.7469957955975, 35.7345521481874 ];
    assert.deepStrictEqual(bbox, referenceBbox);
  });
});
