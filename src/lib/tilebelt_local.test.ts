import assert from 'node:assert';
import test, { describe } from 'node:test';

import { tile2meters } from './tilebelt_local';

describe('tile2meters', () => {
  test('Basic test', () => {
    assert.strictEqual(tile2meters(1, 0), 1);
    assert.strictEqual(tile2meters(1, 1), 0.5);
    assert.strictEqual(tile2meters(1, 10), 0.0009765625);
  });
});
