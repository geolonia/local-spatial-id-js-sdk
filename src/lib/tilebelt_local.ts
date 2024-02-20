/**
 * Calculate the length of a tile in meters at a given zoom level and scale.
 * The scale refers to the length of a tile in meters at zoom level 0.
 */
export function tile2meters(scale: number, z: number): number {
  return scale / Math.pow(2, z);
}

/**
 * Calculate the
 */
