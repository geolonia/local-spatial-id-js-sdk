import { BBox3D, XYFZTile, getBboxZoom } from "./tilebelt";
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
export function bboxToLocalTile(scale: number, bboxCoords: BBox3D, minZoom?: number): XYFZTile {
  const min = pointToLocalTile(scale, bboxCoords[0], bboxCoords[1], bboxCoords[2], 32);
  const max = pointToLocalTile(scale, bboxCoords[3], bboxCoords[4], bboxCoords[5], 32);
  const bbox: BBox3D = [min[0], min[1], min[2], max[0], max[1], max[2]];

  const z = Math.min(getBboxZoom(bbox), typeof minZoom !== 'undefined' ? minZoom : MAX_ZOOM);
  if (z === 0) return [0, 0, 0, 0];
  const x = bbox[0] >>> (32 - z);
  const y = bbox[1] >>> (32 - z);
  const f = bbox[2] >>> (32 - z);
  return [x, y, f, z];
}


export function calculateLocalZFXY(scale: number, input: XYPointWithAltitude | BBox3D, zoom: number): ZFXYTile {
  let bbox: BBox3D;
  if (Array.isArray(input) && input.length === 6) {
    bbox = input;
  } else {
    const i = input as XYPointWithAltitude;
    bbox = [i.x, i.y, i.alt, i.x, i.y, i.alt];
  }
  const tile = bboxToLocalTile(scale, bbox, zoom);
  return {
    z: tile[0],
    f: tile[1],
    x: tile[2],
    y: tile[3],
  };
}

/**
 * Get the smallest tile to cover a bbox
 */
export function localBboxToTile(scale: number, bboxCoords: BBox3D, minZoom?: number): XYFZTile {
  const min = pointToLocalTile(scale, bboxCoords[0], bboxCoords[1], bboxCoords[2], 32);
  const max = pointToLocalTile(scale, bboxCoords[3], bboxCoords[4], bboxCoords[5], 32);
  const bbox: BBox3D = [min[0], min[1], min[2], max[0], max[1], max[2]];

  const z = Math.min(getBboxZoom(bbox), typeof minZoom !== 'undefined' ? minZoom : MAX_ZOOM);
  if (z === 0) return [0, 0, 0, 0];
  const x = bbox[0] >>> (32 - z);
  const y = bbox[1] >>> (32 - z);
  const f = bbox[2] >>> (32 - z);
  return [x, y, f, z];
}

/**
 * Get the tile for a point at a specified zoom level
 */
export function pointToLocalTile(scale: number, x: number, y: number, alt: number, z: number): XYFZTile {
  var tile = pointToLocalTileFraction(scale, x, y, alt, z);
  tile[0] = Math.floor(tile[0]);
  tile[1] = Math.floor(tile[1]);
  tile[2] = Math.floor(tile[2]);
  return tile;
}

/**
 * Get the precise fractional tile location for a point at a zoom level
 */
function pointToLocalTileFraction(scale: number, xMeters: number, yMeters: number, altMeters: number, z: number): XYFZTile {
  let z2 = Math.pow(2, z),
      x = xMeters / scale * z2,
      y = yMeters / scale * z2,
      f = altMeters / scale * z2;
  // Wrap Tile X
  x = x % z2;
  if (x < 0) x = x + z2;
  return [x, y, f, z];
}
