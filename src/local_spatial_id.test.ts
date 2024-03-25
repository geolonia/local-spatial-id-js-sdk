import assert from 'node:assert';
import test, { describe } from 'node:test';

import { LocalNamespace } from "./local_namespace";
import { BBox3D } from './lib/tilebelt';

import { namespaces } from './shared.test.ts';

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
    const namespace = namespaces.tokyo;
    const space = namespace.space('/0/0/0/0');
    const bbox = space.toWGS84BBox();

    // a bounding box of 10km2, with the center at 東京都庁
    // http://bboxfinder.com/#35.644424126412915,139.63645566328384,35.7345521481874,139.7469336572898
    const referenceBbox: BBox3D =  [ 139.63645566328384, 35.644424126412915, 0, 139.7469957955975, 35.7345521481874, 10000 ];
    assert.deepStrictEqual(bbox, referenceBbox);
  });

  test("conversion to WGS84 with rotation", () => {
    const namespace = namespaces.tokyo_45deg;
    const space = namespace.space('/0/0/0/0');
    const bbox = space.toWGS84BBox();

    // a bounding box of 10km2, with the center at 東京都庁
    // http://bboxfinder.com/#35.644424126412915,139.63645566328384,35.7345521481874,139.7469336572898
    const referenceBbox: BBox3D =  [ 139.61360603969516, 35.6257704895902, 0, 139.76984541918617, 35.753230793225924, 10000 ];
    assert.deepStrictEqual(bbox, referenceBbox);
  });

  test("toContainingGlobalSpatialId", () => {
    const namespace = namespaces.tokyo;
    const space = namespace.space('/0/0/0/0');
    const globalId = space.toContainingGlobalSpatialId();
    assert.strictEqual(globalId.zfxyStr, '/10/0/909/403');
  });

  test("toGlobalSpatialIds", () => {
    const namespace = namespaces.tokyo;
    const space = namespace.space('/0/0/0/0');
    const globalIds = space.toGlobalSpatialIds(11);
    assert.deepStrictEqual(globalIds.map((id) => id.zfxyStr), [
      '/11/0/1818/806',
      '/11/0/1819/806',
      '/11/0/1818/807',
      '/11/0/1819/807',
      '/11/1/1818/806',
      '/11/1/1819/806',
      '/11/1/1818/807',
      '/11/1/1819/807',
    ]);
  });
});
