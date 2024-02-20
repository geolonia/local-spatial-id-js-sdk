import assert from 'node:assert';
import test, { describe } from 'node:test';

import { OriginGeodesicTransformer } from './georeference';

describe('OriginGeodesicTransformer', () => {
  test('Identity transform', () => {
    const origin = { x: 0, y: 0 }; // the origin is 0,0, which means there will be no translation
    const scale = 1;
    const angle = 0; // degrees

    const transformer = new OriginGeodesicTransformer(origin, scale, angle);
    const inputPoint = { x: 0, y: 0 };
    const expectedOutput = { x: 0, y: 0 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Rotation only', () => {
    const origin = { x: 0, y: 0 };
    const scale = 1;
    const angle = 180; // degrees

    const transformer = new OriginGeodesicTransformer(origin, scale, angle);
    const inputPoint = { x: 0, y: 5 };
    const expectedOutput = { x: 0, y: -0.000045218473852519004 }; // approx. 5 meters south of the equator.

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Scaling only, big units', () => {
    // 東京都庁: 35.68950097945576, 139.69172572944066
    const origin = { x: 139.69172572944066, y: 35.68950097945576 };
    const scale = 1000; // 1000 meters per unit
    const angle = 0; // degrees

    const transformer = new OriginGeodesicTransformer(origin, scale, angle);
    const inputPoint = { x: 50, y: 0 }; // 50km east of the Tokyo Metropolitan Government Building
    const expectedOutput = { x: 140.24410964480927, y: 35.68823368342168 }; // 50km east of the Tokyo Metropolitan Government Building

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Scaling only, small units', () => {
    const origin = { x: 139.69172572944066, y: 35.68950097945576 };
    const scale = 0.0001; // 0.0001 meters per unit (1mm per unit)
    const angle = 0; // degrees

    const transformer = new OriginGeodesicTransformer(origin, scale, angle);
    const inputPoint = { x: 100, y: 100 }; // 100mm east, 100mm north of the Tokyo Metropolitan Government Building
    const expectedOutput = { x: 139.6917258399186, y: 35.689501069583805 }; // 50km east of the Tokyo Metropolitan Government Building

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });

  test('Scaling and rotation', () => {
    const origin = { x: 139.69172572944066, y: 35.68950097945576 };
    const scale = 100; // 100 meters per unit
    const angle = 90; // degrees

    const transformer = new OriginGeodesicTransformer(origin, scale, angle);
    const inputPoint = { x: 100, y: 100 }; // 100*100 meters east, 100*100 meters north of the Tokyo Metropolitan Government Building
    const expectedOutput = { x: 139.8020795846941, y: 35.59932165909691 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);
  });
});
