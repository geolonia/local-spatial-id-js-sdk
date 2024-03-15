import geodesic from 'geographiclib-geodesic';

export type Point = { x: number, y: number }

export interface CoordinateTransformer {
  transform(point: Point): Point
  transformInverse(point: Point): Point
}

/**
 * TODO: Affine translation.
 * GCPを使って座標系変換を使う場合、こちらのクラスを実装してください。
 */



/**
 * Geodesic transformation. Requires the origin point, and angle (in degrees).
 * The origin point is in WGS84 coordinates.
 * The angle is in degrees, and is the angle of rotation around the origin point. Clockwise is positive, starting at 0, meaning north.
 */
export class OriginGeodesicTransformer implements CoordinateTransformer {
  private origin: Point; // WGS84 coordinates
  private angle: number; // degrees
  private geodesic: geodesic.GeodesicClass;

  constructor(origin: Point, angleDegrees: number) {
    this.origin = origin;
    this.angle = angleDegrees;
    this.geodesic = geodesic.Geodesic.WGS84;
  }

  /**
   * Transform a point from the local space to the WGS84 space.
   *
   * @param point Point in meters from the origin point.
   * @returns A WGS84 point in degrees.
   */
  transform(point: Point): Point {
    // 1. Calculate the length and angle of the vector from the source origin to the input point, in meters.
    // Because we're in cartesian coordinates, we can just calculate the pythonagorean distance between the two points.
    const srcPointLengthFromSrcOrgin = Math.sqrt(point.x * point.x + point.y * point.y);
    let srcPointAngleFromSrcOrgin = 90 - Math.atan2(point.y, point.x) * (180 / Math.PI);
    if (srcPointAngleFromSrcOrgin < 0) {
      srcPointAngleFromSrcOrgin += 360;
    }

    // 2. Add the angle of rotation to the angle of the vector.
    const totalRotationAngle = srcPointAngleFromSrcOrgin + this.angle;
    const normalizedRotationAngle = totalRotationAngle % 360;

    // 3. Use the geodesic library to calculate the destination point from the origin point, using the length and angle of the vector.
    const destinationPoint = this.geodesic.Direct(this.origin.y, this.origin.x, normalizedRotationAngle, srcPointLengthFromSrcOrgin);

    // 4. Return the destination point.
    return { x: destinationPoint.lon2, y: destinationPoint.lat2 };
  }

  /**
   * Transform a point from the WGS84 space to the local space.
   *
   * @param point A WGS84 point in degrees.
   * @returns A point in meters from the origin point.
   */
  transformInverse(point: Point): Point {
    // 1. Use the geodesic library to calculate the length and angle of the vector from the origin point to the input point.
    const geodesicResult = this.geodesic.Inverse(this.origin.y, this.origin.x, point.y, point.x);

    // 2. Subtract the angle of rotation from the angle of the vector.
    const srcPointAngleFromSrcOrgin = geodesicResult.azi1;
    const totalRotationAngle = srcPointAngleFromSrcOrgin - this.angle;
    const normalizedRotationAngle = totalRotationAngle % 360;

    // 3. Convert the angle to radians.
    const angleInRadians = normalizedRotationAngle * (Math.PI / 180);

    // 4. Use the length and angle of the vector to calculate the destination point from the origin point.
    const x = geodesicResult.s12 * Math.cos(angleInRadians);
    const y = geodesicResult.s12 * Math.sin(angleInRadians);

    // 5. Return the destination point.
    return { x, y };
  }
}
