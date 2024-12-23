import { BBox3D, XYFZTile, getBboxZoom, xyfzTileAryToObj } from "./tilebelt";
import { XYPointWithAltitude } from "./types";
import { ZFXYTile } from "./zfxy";

const MAX_ZOOM = 28;

/**
 * Calculate the length of a tile in meters at a given zoom level and scale.
 * The scale refers to the length of a tile in meters at zoom level 0.
 */
export function tile2meters(scale: number, z: number): number {
  return scale / Math.pow(2, z);
}

/**
 * Get the smallest tile to cover a bbox
 */
export function bboxToLocalTile(scale: number, bboxCoords: BBox3D, minZoom?: number, clamp?: boolean): XYFZTile {
  const min = pointToLocalTile(scale, bboxCoords[0], bboxCoords[1], bboxCoords[2], 32, clamp);
  const max = pointToLocalTile(scale, bboxCoords[3], bboxCoords[4], bboxCoords[5], 32, clamp);
  const bbox: BBox3D = [min[0], min[1], min[2], max[0], max[1], max[2]];

  const z = Math.min(getBboxZoom(bbox), typeof minZoom !== 'undefined' ? minZoom : MAX_ZOOM);
  if (z === 0) return [0, 0, 0, 0];
  const x = bbox[0] >>> (32 - z);
  const y = bbox[1] >>> (32 - z);
  const f = bbox[2] >>> (32 - z);
  return [x, y, f, z];
}


export function calculateLocalZFXY(scale: number, input: XYPointWithAltitude | BBox3D, zoom: number, clamp?: boolean): ZFXYTile {
  let bbox: BBox3D;
  if (Array.isArray(input) && input.length === 6) {
    bbox = input;
  } else {
    const i = input as XYPointWithAltitude;
    bbox = [i.x, i.y, i.alt, i.x, i.y, i.alt];
  }
  const tile = bboxToLocalTile(scale, bbox, zoom, clamp);
  return xyfzTileAryToObj(tile);
}

/**
 * Get the smallest tile to cover a bbox
 * not used right now
 */
// export function localBboxToTile(scale: number, bboxCoords: BBox3D, minZoom?: number): XYFZTile {
//   const min = pointToLocalTile(scale, bboxCoords[0], bboxCoords[1], bboxCoords[2], 32);
//   const max = pointToLocalTile(scale, bboxCoords[3], bboxCoords[4], bboxCoords[5], 32);
//   const bbox: BBox3D = [min[0], min[1], min[2], max[0], max[1], max[2]];

//   const z = Math.min(getBboxZoom(bbox), typeof minZoom !== 'undefined' ? minZoom : MAX_ZOOM);
//   if (z === 0) return [0, 0, 0, 0];
//   const x = bbox[0] >>> (32 - z);
//   const y = bbox[1] >>> (32 - z);
//   const f = bbox[2] >>> (32 - z);
//   return [x, y, f, z];
// }

/**
 * Get the tile for a point at a specified zoom level
 * Set `clamp` to `true` to prevent out-of-bounds coordinates
 */
export function pointToLocalTile(scale: number, x: number, y: number, alt: number, z: number, clamp?: boolean): XYFZTile {
  var tile = pointToLocalTileFraction(scale, x, y, alt, z, clamp);
  tile[0] = Math.floor(tile[0]);
  tile[1] = Math.floor(tile[1]);
  tile[2] = Math.floor(tile[2]);
  return tile;
}

/**
 * Get the precise fractional tile location for a point at a zoom level
 * Set `clamp` to `true` to prevent out-of-bounds coordinates
 */
export function pointToLocalTileFraction(scale: number, xMeters: number, yMeters: number, altMeters: number, z: number, clamp?: boolean): XYFZTile {
  const z2 = Math.pow(2, z);
  // const z2_1 = Math.pow(2, z - 1);

  // transform input points (in meters) to tile coordinates at the zoom level `z`
  // note that the origin point is at the center of the tile in the x/y plane, so we have to add z2/2 to the x and y coordinates
  // const x = (z2 * (xMeters / scale)) + z2_1;
  // const y = (z2 * (yMeters / scale)) + z2_1;

  let x = z2 * (xMeters / scale);
  let y = z2 * (yMeters / scale);
  let f = z2 * (altMeters / scale);

  if (!clamp) {
    // Detect out-of-bounds coordinates
    if (x < 0 || x >= z2 || y < 0 || y >= z2 || f < 0 || f >= z2) {
      throw new Error(`Point out of bounds: (${xMeters}, ${yMeters}, ${altMeters}) with scale ${scale}m (Point would have been (x=${x}, y=${y}, f=${f}, z=${z}) and maximum for this zoom is ${z2}).`);
    }
  } else {
    // Clamp to bounds
    x = Math.max(0, Math.min(z2 - 1, x));
    y = Math.max(0, Math.min(z2 - 1, y));
    f = Math.max(0, Math.min(z2 - 1, f));
  }
  return [x, y, f, z];
}
