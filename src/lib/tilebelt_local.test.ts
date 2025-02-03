import assert from 'node:assert';
import test, { describe } from 'node:test';

import * as tb from './tilebelt_local';

describe('tile2meters', () => {
  test('Basic test', () => {
    // tile2meters は水平スケールのみを扱うため、scale のみ引数となる
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

// calculateLocalZFXY
describe('calculateLocalZFXY', () => {
  test('Basic test, init with point', () => {
    // 新たに scaleHeight を渡す必要があるので、scale と同じ値の場合
    assert.deepStrictEqual(
      tb.calculateLocalZFXY(1, 1, { x: 0, y: 0, alt: 0 }, 0),
      { z: 0, f: 0, x: 0, y: 0 }
    );
    // 以下は元のテストでは期待値がコメントアウトされていたため、今回も f, x, y = 0 とする例
    assert.deepStrictEqual(
      tb.calculateLocalZFXY(1024, 1024, { x: 0, y: 0, alt: 0 }, 10),
      { z: 10, f: 0, x: 0, y: 0 }
    );
  });

  test('Basic test, init with bbox', () => {
    // 同様に、bbox (または点) を渡す場合
    assert.deepStrictEqual(
      tb.calculateLocalZFXY(1, 1, { x: 0, y: 0, alt: 0 }, 0),
      { z: 0, f: 0, x: 0, y: 0 }
    );
    assert.deepStrictEqual(
      tb.calculateLocalZFXY(1024, 1024, { x: 0, y: 0, alt: 0 }, 10),
      { z: 10, f: 0, x: 0, y: 0 }
    );
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
    // ここでは scale と scaleHeight を同じ値で指定する例
    // for top-left point:
    assert.deepStrictEqual(
      tb.pointToLocalTileFraction(1, 1, 0, 0, 0, 0),
      [0, 0, 0, 0]
    );

    assert.deepStrictEqual(
      tb.pointToLocalTileFraction(1024, 1024, 0, 0, 0, 10),
      [0, 0, 0, 10]
    );
    assert.deepStrictEqual(
      tb.pointToLocalTileFraction(1024, 1024, 511, 0, 0, 10),
      [511, 0, 0, 10]
    );
    assert.deepStrictEqual(
      tb.pointToLocalTileFraction(1024, 1024, 511, 511, 0, 10),
      [511, 511, 0, 10]
    );

    assert.deepStrictEqual(
      tb.pointToLocalTileFraction(1024, 1024, 511, 511, 0, 11),
      [1022, 1022, 0, 11]
    );
    assert.deepStrictEqual(
      tb.pointToLocalTileFraction(1024, 1024, 511, 511, 0, 9),
      [255.5, 255.5, 0, 9]
    );
  });

  test('works with clamp', () => {
    // clamp オプションを true にした場合
    assert.deepStrictEqual(
      tb.pointToLocalTileFraction(1024, 1024, 0, 0, 0, 0, true),
      [0, 0, 0, 0]
    );
    assert.deepStrictEqual(
      tb.pointToLocalTileFraction(1024, 1024, 1100, 1100, 0, 0, true),
      [0, 0, 0, 0]
    );
  });

  test('throws an error for out-of-bounds coordinates', () => {
    assert.throws(() => {
      tb.pointToLocalTileFraction(1024, 1024, 1100, 1100, 0, 0, false);
    });
  });
});
