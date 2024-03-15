import assert from 'node:assert';
import test, { describe } from 'node:test';

import { LocalNamespace } from "./local_namespace";

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

});
