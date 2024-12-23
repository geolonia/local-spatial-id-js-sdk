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
    const referenceBbox: BBox3D =  [ 139.64657, 35.63581115931438, 0, 139.7570982609969, 35.72599000000001, 10000 ];
    assert.deepStrictEqual(bbox, referenceBbox);
  });

  test("conversion to WGS84 with rotation", () => {
    const namespace = namespaces.tokyo_45deg;
    const space = namespace.space('/0/0/0/0');
    const bbox = space.toWGS84BBox();

    // a bounding box of 10km2, with the center at 東京都庁
    const referenceBbox: BBox3D =  [ 139.61377266711673, 35.61310942775181, 0, 139.76998733288326, 35.74057, 10000 ];
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
    ]);
  });

  test("toGlobalSpatialIds with namespace elevation set", () => {
    const namespace = namespaces.tokyo_tocho_300m;
    const space = namespace.space('/3/0/0/0');
    const globalIds = space.toGlobalSpatialIds(20);
    assert.deepStrictEqual(globalIds.map((id) => id.zfxyStr), [
      '/20/9/931167/412874',
      '/20/9/931168/412874',
    ]);
    const localBBox = space.toWGS84BBox();
    assert.strictEqual(localBBox[2], 300);
    assert.strictEqual(localBBox[5], 318.75);

    const global = globalIds[0];
    assert.strictEqual(global.zfxy.z, 20);
    assert.strictEqual(global.altMin, 288);
    assert.strictEqual(global.altMax, 320);
  });
});
