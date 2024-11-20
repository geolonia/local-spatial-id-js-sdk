import assert from 'node:assert';
import test, { describe } from 'node:test';

import * as tb from './tilebelt_local';

describe('tile2meters', () => {
  test('Basic test', () => {
    assert.strictEqual(tb.tile2meters(1, 0), 1);
    assert.strictEqual(tb.tile2meters(1, 1), 0.5);
    assert.strictEqual(tb.tile2meters(1, 10), 0.0009765625);

    assert.strictEqual(tb.tile2meters(1024, 10), 1);
  });
});


// bboxToLocalTile
// describe('bboxToLocalTile', () => {
//   test('Basic test', () => {
//     assert.fail('Not implemented');
//   });
// });

// // calculateLocalZFXY
describe('calculateLocalZFXY', () => {
  test('Basic test, init with point', () => {
    // assert.deepStrictEqual(tb.calculateLocalZFXY(1, { x: 0, y: 0, alt: 0 }, 0), { z: 0, f: 0, x: 0, y: 0 });
    // assert.deepStrictEqual(tb.calculateLocalZFXY(1024, { x: 0, y: 0, alt: 0 }, 10), { z: 10, f: 0, x: 512, y: 512 });

    assert.deepStrictEqual(tb.calculateLocalZFXY(1, { x: 0, y: 0, alt: 0 }, 0), { z: 0, f: 0, x: 0, y: 0 });
    assert.deepStrictEqual(tb.calculateLocalZFXY(1024, { x: 0, y: 0, alt: 0 }, 10), { z: 10, f: 0, x: 0, y: 0 });
  });

  test('Basic test, init with bbox', () => {
    // assert.deepStrictEqual(tb.calculateLocalZFXY(1, [0, 0, 0, 0, 0, 0], 0), { z: 0, f: 0, x: 0, y: 0 });
    // assert.deepStrictEqual(tb.calculateLocalZFXY(1024, [0, 0, 0, 0, 0, 0], 10), { z: 10, f: 0, x: 512, y: 512 });

    assert.deepStrictEqual(tb.calculateLocalZFXY(1, { x: 0, y: 0, alt: 0 }, 0), { z: 0, f: 0, x: 0, y: 0 });
    assert.deepStrictEqual(tb.calculateLocalZFXY(1024, { x: 0, y: 0, alt: 0 }, 10), { z: 10, f: 0, x: 0, y: 0 });
  });
});

// // localBboxToTile
// describe('localBboxToTile', () => {
//   test('Basic test', () => {
//     assert.fail('Not implemented');
//   });
// });

// // pointToLocalTile
// describe('pointToLocalTile', () => {
//   test('Basic test', () => {
//     assert.fail('Not implemented');
//   });
// });

// pointToLocalTileFraction
describe('pointToLocalTileFraction', () => {
  test('Basic test', () => {
    // for center point
    // assert.deepStrictEqual(tb.pointToLocalTileFraction(1, 0, 0, 0, 0), [0.5, 0.5, 0, 0]);

    // assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 0, 0, 0, 10), [512, 512, 0, 10]);
    // assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 511, 0, 0, 10), [1023, 512, 0, 10]);
    // assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 511, 511, 0, 10), [1023, 1023, 0, 10]);

    // assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 511, 511, 0, 11), [2046, 2046, 0, 11]);
    // assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 511, 511, 0, 9), [511.5, 511.5, 0, 9]);

    // for top-left point
    assert.deepStrictEqual(tb.pointToLocalTileFraction(1, 0, 0, 0, 0), [0, 0, 0, 0]);

    assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 0, 0, 0, 10), [0, 0, 0, 10]);
    assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 511, 0, 0, 10), [511, 0, 0, 10]);
    assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 511, 511, 0, 10), [511, 511, 0, 10]);

    assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 511, 511, 0, 11), [1022, 1022, 0, 11]);
    assert.deepStrictEqual(tb.pointToLocalTileFraction(1024, 511, 511, 0, 9), [255.5, 255.5, 0, 9]);
  });
});
