import geodesic from 'geographiclib-geodesic';

export type Point = { x: number, y: number }

export type TransformOptions = {
  inverse?: boolean
}
export interface CoordinateTransformer {
  transform(point: Point, options?: TransformOptions): Point
}

/**
 * TODO: Affine translation.
 * GCPを使って座標系変換を使う場合、こちらのクラスを実装してください。
 */



/**
 * Translate-scale-vector transformation. Requires the origin point, scale factor, and angle (in degrees).
 * The origin point is in WGS84 coordinates.
 * The scale factor is defined as the number of meters in the destination space per unit in the source space.
 * The angle is in degrees, and is the angle of rotation around the origin point. Clockwise is positive, starting at 0, meaning north.
 */
export class OriginGeodesicTransformer implements CoordinateTransformer {
  private origin: Point; // WGS84 coordinates
  private scale: number; // meters
  private angle: number; // degrees
  private geodesic: geodesic.GeodesicClass;

  constructor(origin: Point, scale: number, angleDegrees: number) {
    this.origin = origin;
    this.scale = scale;
    this.angle = angleDegrees;
    this.geodesic = geodesic.Geodesic.WGS84;
  }

  transform(point: Point, option: TransformOptions = {}): Point {
    // 1. Calculate the length and angle of the vector from the source origin to the input point, in source coordinates.
    // Because we're in cartesian coordinates, we can just calculate the pythonagorean distance between the two points.
    const srcPointLengthFromSrcOrgin = Math.sqrt(point.x * point.x + point.y * point.y);
    let srcPointAngleFromSrcOrgin = 90 - Math.atan2(point.y, point.x) * (180 / Math.PI);
    if (srcPointAngleFromSrcOrgin < 0) {
      srcPointAngleFromSrcOrgin += 360;
    }

    // 2. Add the angle of rotation to the angle of the vector.
    const totalRotationAngle = srcPointAngleFromSrcOrgin + this.angle;
    const normalizedRotationAngle = totalRotationAngle % 360;

    // 3. Calculate the length in meters of the vector length in the source space.
    const srcPointLengthInMeters = srcPointLengthFromSrcOrgin * this.scale;

    // 4. Use the geodesic library to calculate the destination point from the origin point, using the length and angle of the vector.
    const destinationPoint = this.geodesic.Direct(this.origin.y, this.origin.x, normalizedRotationAngle, srcPointLengthInMeters);

    // 5. Return the destination point.
    return { x: destinationPoint.lon2, y: destinationPoint.lat2 };
  }
}
