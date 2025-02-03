import { BBox3D, XYFZTile, getBboxZoom, xyfzTileAryToObj } from "./tilebelt";
import { XYPointWithAltitude } from "./types";
import { ZFXYTile } from "./zfxy";

const MAX_ZOOM = 28;

/**
 * Calculate the length of a tile in meters at a given zoom level and scale.
 * The scale refers to the length of a tile in meters at zoom level 0.
 * ※ 水平方向の計算に使用するので、tile2meters は scale（horizontal scale）を使います。
 */
export function tile2meters(scale: number, z: number): number {
  return scale / Math.pow(2, z);
}

/**
 * Get the smallest tile to cover a bbox.
 * ここでは水平スケールと高さ方向スケールの両方を受け取ります。
 */
export function bboxToLocalTile(
  scale: number,
  scaleHeight: number,
  bboxCoords: BBox3D,
  minZoom?: number,
  clamp?: boolean
): XYFZTile {
  const min = pointToLocalTile(scale, scaleHeight, bboxCoords[0], bboxCoords[1], bboxCoords[2], 32, clamp);
  const max = pointToLocalTile(scale, scaleHeight, bboxCoords[3], bboxCoords[4], bboxCoords[5], 32, clamp);
  const bbox: BBox3D = [min[0], min[1], min[2], max[0], max[1], max[2]];

  const z = Math.min(getBboxZoom(bbox), typeof minZoom !== 'undefined' ? minZoom : MAX_ZOOM);
  if (z === 0) return [0, 0, 0, 0];
  const x = bbox[0] >>> (32 - z);
  const y = bbox[1] >>> (32 - z);
  const f = bbox[2] >>> (32 - z);
  return [x, y, f, z];
}

/**
 * Calculate the local ZFXY tile for an input point or bbox.
 * 修正点: 第二引数に scaleHeight を追加して高さ方向の計算に使用する。
 */
export function calculateLocalZFXY(
  scale: number,
  scaleHeight: number,
  input: XYPointWithAltitude | BBox3D,
  zoom: number,
  clamp?: boolean
): ZFXYTile {
  let bbox: BBox3D;
  if (Array.isArray(input) && input.length === 6) {
    bbox = input;
  } else {
    const i = input as XYPointWithAltitude;
    bbox = [i.x, i.y, i.alt, i.x, i.y, i.alt];
  }
  const tile = bboxToLocalTile(scale, scaleHeight, bbox, zoom, clamp);
  return xyfzTileAryToObj(tile);
}

/**
 * Get the tile for a point at a specified zoom level.
 * scale と scaleHeight の両方を受け取るように変更。
 */
export function pointToLocalTile(
  scale: number,
  scaleHeight: number,
  x: number,
  y: number,
  alt: number,
  z: number,
  clamp?: boolean
): XYFZTile {
  const tile = pointToLocalTileFraction(scale, scaleHeight, x, y, alt, z, clamp);
  tile[0] = Math.floor(tile[0]);
  tile[1] = Math.floor(tile[1]);
  tile[2] = Math.floor(tile[2]);
  return tile;
}

/**
 * Get the precise fractional tile location for a point at a zoom level.
 * 修正点: 高さ方向の計算は scaleHeight を使用するように変更。
 */
export function pointToLocalTileFraction(
  scale: number,
  scaleHeight: number,
  xMeters: number,
  yMeters: number,
  altMeters: number,
  z: number,
  clamp?: boolean
): XYFZTile {
  const z2 = Math.pow(2, z);
  let x = z2 * (xMeters / scale);
  let y = z2 * (yMeters / scale);
  let f = z2 * (altMeters / scaleHeight);

  if (!clamp) {
    // 座標が範囲外の場合はエラー
    if (x < 0 || x >= z2 || y < 0 || y >= z2 || f < 0 || f >= z2) {
      throw new Error(`Point out of bounds: (${xMeters}, ${yMeters}, ${altMeters}) with scales ${scale} (horizontal) and ${scaleHeight} (vertical) (Computed: x=${x}, y=${y}, f=${f}, z=${z} with maximum ${z2}).`);
    }
  } else {
    // 範囲内にクランプ
    x = Math.max(0, Math.min(z2 - 1, x));
    y = Math.max(0, Math.min(z2 - 1, y));
    f = Math.max(0, Math.min(z2 - 1, f));
  }
  return [x, y, f, z];
}
