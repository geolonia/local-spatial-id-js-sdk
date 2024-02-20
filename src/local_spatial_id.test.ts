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
    const referenceBbox = [ 139.69172572944066, 35.68950097945576, 139.8023281380773, 35.77957756239187 ];
    assert.deepStrictEqual(bbox, referenceBbox);
  });
});
