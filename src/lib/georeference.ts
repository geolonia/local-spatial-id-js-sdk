import { mat3 } from 'gl-matrix'

export type Point = { x: number, y: number }
export type GCP = { src: Point, dest: Point }

export interface MatrixTransformer {}

/**
 * Translate-scale-vector transformation. Requires the origin point, scale factor, and angle (in degrees).
 */
export class TranslateScaleVectorTransform implements MatrixTransformer {
  private origin: Point;
  private matrix: mat3;

  constructor(origin: Point, scale: number, angleDegrees: number) {
    this.origin = origin;

    const angleRadians = (angleDegrees * Math.PI) / 180;

    // Translation to origin matrix
    const toOrigin = mat3.fromValues( 1, 0, 0,
                                      0, 1, 0,
                                      -this.origin.x, -this.origin.y, 1);

    // Translation back (inverse of toOrigin)
    const fromOrigin = mat3.fromValues( 1, 0, 0,
                                        0, 1, 0,
                                        this.origin.x, this.origin.y, 1);


    // Rotation matrix (https://en.wikipedia.org/wiki/Rotation_matrix)
    const rotation = mat3.fromValues(
      Math.cos(angleRadians), -Math.sin(angleRadians), 0,
      Math.sin(angleRadians), Math.cos(angleRadians),  0,
      0,                      0,                      1
    );

    // Scaling matrix
    const scaling = mat3.fromValues(scale, 0,     0,
                                    0,     scale, 0,
                                    0,     0,     1);

    // Combine transformations (translate to origin -> rotate -> scale)
    this.matrix = mat3.create();
    mat3.multiply(this.matrix, fromOrigin, scaling);
    mat3.multiply(this.matrix, this.matrix, rotation);
    // mat3.multiply(this.matrix, this.matrix, toOrigin);
  }

  transform(point: Point, option: { inverse?: boolean } = {}): Point {
    const inputMat3 = mat3.create()
    const outputMat3 = mat3.create()
    mat3.set(inputMat3, ...[
      point.x, 0, 0,
      point.y, 0, 0,
      1,       0, 0,
    ])
    mat3.transpose(inputMat3, inputMat3)

    const lefter_multiplier = mat3.create()
    mat3.copy(lefter_multiplier, this.matrix)
    if(option.inverse) {
      mat3.invert(lefter_multiplier, lefter_multiplier)
    }
    mat3.multiply(outputMat3, lefter_multiplier, inputMat3)
    const x = outputMat3[0]
    const y = outputMat3[1]
    return { x, y };
  }
}
