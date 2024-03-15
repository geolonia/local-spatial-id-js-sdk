import { ZFXY_1M_ZOOM_BASE, ZFXYTile as ZFXYTileObj } from "./zfxy";

/// x, y, z
export type XYZTile = [number, number, number];

/// x, y, f, z
export type XYFZTile = [number, number, number, number];

export type BBox2D = [number, number, number, number];
export type BBox3D = [number, number, number, number, number, number];
export type BBox = BBox2D | BBox3D;

export function xyfzTileAryToObj(tile: XYFZTile): ZFXYTileObj {
  return { x: tile[0], y: tile[1], f: tile[2], z: tile[3] };
}

const d2r = Math.PI / 180,
      r2d = 180 / Math.PI,
      MAX_ZOOM = 28;

export function getBboxZoom(bbox: BBox3D) {
  for (let z = 0; z < MAX_ZOOM; z++) {
    const mask = 1 << (32 - (z + 1));
    if (
      ((bbox[0] & mask) !== (bbox[3] & mask)) || // x
      ((bbox[1] & mask) !== (bbox[4] & mask)) || // y
      ((bbox[2] & mask) !== (bbox[5] & mask))    // f
    ) {
      return z;
    }
  }

  return MAX_ZOOM;
}

/**
 * Get the smallest tile to cover a bbox
 */
export function bboxToTile(bboxCoords: BBox3D, minZoom?: number): XYFZTile {
  const min = pointToTile(bboxCoords[0], bboxCoords[1], bboxCoords[2], 32);
  const max = pointToTile(bboxCoords[3], bboxCoords[4], bboxCoords[5], 32);
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
export function pointToTile(lon: number, lat: number, alt: number, z: number): XYFZTile {
  var tile = pointToTileFraction(lon, lat, alt, z);
  tile[0] = Math.floor(tile[0]);
  tile[1] = Math.floor(tile[1]);
  tile[2] = Math.floor(tile[2]);
  return tile;
}

/**
 * Get the precise fractional tile location for a point at a zoom level
 */
function pointToTileFraction(lon: number, lat: number, alt: number, z: number): XYFZTile {
  var sin = Math.sin(lat * d2r),
      z2 = Math.pow(2, z),
      x = z2 * (lon / 360 + 0.5),
      y = z2 * (0.5 - 0.25 * Math.log((1 + sin) / (1 - sin)) / Math.PI),
      f = (z2 * alt) / (2 ** ZFXY_1M_ZOOM_BASE);

  // Wrap Tile X
  x = x % z2;
  if (x < 0) x = x + z2;
  return [x, y, f, z];
}
