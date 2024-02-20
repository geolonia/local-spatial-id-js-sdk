import assert from 'node:assert';
import test, { describe } from 'node:test';

import { TranslateScaleVectorTransform } from './georeference';

describe('TranslateScaleVectorTransform', () => {
  test('Identity transform', () => {
    const origin = { x: 0, y: 0 }; // the origin is 0,0, which means there will be no translation
    const scale = 1;
    const angle = 0; // degrees

    const transformer = new TranslateScaleVectorTransform(origin, scale, angle);
    const inputPoint = { x: 10, y: 5 };
    const expectedOutput = { x: 10, y: 5 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Rotation only', () => {
    const origin = { x: 0, y: 0 }; // the origin is 0,0, which means there will be no translation
    const scale = 1;
    const angle = 180; // degrees

    const transformer = new TranslateScaleVectorTransform(origin, scale, angle);
    const inputPoint = { x: 10, y: 5 };
    const expectedOutput = { x: -10, y: -5 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Scaling only', () => {
    const origin = { x: 0, y: 0 }; // the origin is 0,0, which means there will be no translation
    const scale = 100; // 1 point in the source space will be 128 points in the destination space
    const angle = 0; // degrees

    const transformer = new TranslateScaleVectorTransform(origin, scale, angle);
    const inputPoint = { x: 10, y: 5 };
    const expectedOutput = { x: 1000, y: 500 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Translation only', () => {
    const origin = { x: 10, y: 10 };
    const scale = 1;
    const angle = 0; // degrees

    const transformer = new TranslateScaleVectorTransform(origin, scale, angle);
    const inputPoint = { x: 10, y: 5 };
    const expectedOutput = { x: 20, y: 15 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Scaling and rotation', () => {
    const origin = { x: 0, y: 0 }; // the origin is 0,0, which means there will be no translation
    const scale = 100; // 1 point in the source space will be 100 points in the destination space
    const angle = 180; // degrees

    const transformer = new TranslateScaleVectorTransform(origin, scale, angle);
    const inputPoint = { x: 10, y: 5 };
    const expectedOutput = { x: -1000, y: -500 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Scaling, rotation, and translation', () => {
    const origin = { x: 10, y: 10 };
    const scale = 100;
    const angle = 180; // degrees

    const transformer = new TranslateScaleVectorTransform(origin, scale, angle);
    const inputPoint = { x: 10, y: 5 };
    const expectedOutput = { x: -990, y: -490 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });
});
