import assert from 'node:assert';
import test, { describe } from 'node:test';

import { OriginGeodesicTransformer, Point } from './georeference';

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
    const angleMap: [number, Point][] = [
      [0,   { x: 0,                       y: 0.000045218473852519004  }], // approx. 5 meters north of the equator.
      [45,  { x: 0.00003176024145222496,  y: 0.000031974289496021165  }],
      [90,  { x: 0.00004491576420597608,  y: 0                        }],
      [135, { x: 0.00003176024145222496,  y: -0.000031974289496021165 }],
      [180, { x: 0,                       y: -0.000045218473852519004 }], // approx. 5 meters south of the equator.
      [225, { x: -0.00003176024145222496, y: -0.000031974289496021165 }],
      [270, { x: -0.00004491576420597608, y: 0                        }],
      [315, { x: -0.00003176024145222496, y: 0.000031974289496021165  }],
    ];
    for (const [angle, expectedOutput] of angleMap) {
      const transformer = new OriginGeodesicTransformer(origin, angle);
      const inputPoint = { x: 0, y: 5 }; // 5 meters north of the origin

      const result = transformer.transform(inputPoint);
      assert.deepStrictEqual(result, expectedOutput, `Failed at angle ${angle}`);

      const inverseResult = transformer.transformInverse(result);
      // we can't use strictEqual here because -0 is not equal to 0
      assert.deepEqual(inverseResult, inputPoint, `Inverse failed at angle ${angle}`);
    }
  });

  test('Rotation, with inverse', () => {
    const origin = { x: 139.69172572944066, y: 35.68950097945576 };
    // angle is in degrees from 0 north
    const angle = 90;

    const transformer = new OriginGeodesicTransformer(origin, angle);
    const inputPoint = { x: 10_000, y: 10_000 }; // 10,000 meters east, 10,000 meters north of the Tokyo Metropolitan Government Building
    const expectedOutput = { x: 139.8020795846941, y: 35.59932165909691 };

    const result = transformer.transform(inputPoint);
    assert.deepStrictEqual(result, expectedOutput);

    const inverseResult = transformer.transformInverse(result);
    assert.deepStrictEqual(inverseResult, inputPoint);
  });

  test('More rotation', () => {
    const origin = { x: 139.69172572944066, y: 35.68950097945576 };

    const points: GeoJSON.Feature[] = [];
    for (let angle = 0; angle < 360; angle += 1) {
      const transformer = new OriginGeodesicTransformer(origin, angle);
      const inputPoint = { x: 0, y: 1_000 }; // at 0 degrees, the point is 1,000 meters north of the origin
      const result = transformer.transform(inputPoint);
      points.push({
        "type": "Feature",
        "properties": {
          "angle": angle,
        },
        "geometry": {
          "type": "Point",
          "coordinates": [result.x, result.y]
        }
      });
      const inverseResult = transformer.transformInverse(result);
      assert.deepEqual(inverseResult, inputPoint); // we can't use strictEqual here because -0 is not equal to 0
    }

    // points should now be an array of points that form a circle around the origin.
    // let's check that they are indeed a circle.
    // console.log('points geojson:', JSON.stringify({
    //   "type": "FeatureCollection",
    //   "features": points,
    // }));

    assert(points.length === 360);
  });
});
