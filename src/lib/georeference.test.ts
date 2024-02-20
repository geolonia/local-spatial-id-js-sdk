import assert from 'node:assert';
import test, { describe } from 'node:test';

import { OriginGeodesicTransformer } from './georeference';

describe('OriginGeodesicTransformer', () => {
  test('Identity transform', () => {
    const origin = { x: 0, y: 0 }; // the origin is 0,0, which means there will be no translation
    const angle = 0; // degrees

    const transformer = new OriginGeodesicTransformer(origin, angle);
    const inputPoint = { x: 0, y: 0 };
    const expectedOutput = { x: 0, y: 0 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Rotation only', () => {
    const origin = { x: 0, y: 0 };
    const angle = 180; // degrees

    const transformer = new OriginGeodesicTransformer(origin, angle);
    const inputPoint = { x: 0, y: 5 };
    const expectedOutput = { x: 0, y: -0.000045218473852519004 }; // approx. 5 meters south of the equator.

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Scaling and rotation', () => {
    const origin = { x: 139.69172572944066, y: 35.68950097945576 };
    const angle = 90; // degrees

    const transformer = new OriginGeodesicTransformer(origin, angle);
    const inputPoint = { x: 10_000, y: 10_000 }; // 10,000 meters east, 10,000 meters north of the Tokyo Metropolitan Government Building
    const expectedOutput = { x: 139.8020795846941, y: 35.59932165909691 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });
});
