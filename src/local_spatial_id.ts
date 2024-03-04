import type { LocalNamespace } from "./local_namespace";

import bboxPolygon from "@turf/bbox-polygon";
import booleanContains from "@turf/boolean-contains";

import { LngLatWithAltitude } from "./lib/types";
import { ZFXYTile, calculateZFXY, getChildren, getParent, isZFXYTile, parseZFXYString, zfxyWraparound } from "./lib/zfxy";
import { generateTilehash, parseZFXYTilehash } from "./lib/zfxy_tilehash";
import { ConversionNotPossibleError } from "./lib/errors";
import { tile2meters } from "./lib/tilebelt_local";

export type LocalSpatialIdInput = LngLatWithAltitude | ZFXYTile | string;

const DEFAULT_ZOOM = 25 as const;

export class LocalSpatialId {
  namespace: LocalNamespace;

  zfxy: ZFXYTile;

  id: string;
  zfxyStr: string;
  tilehash: string;

  constructor(namespace: LocalNamespace, input: LocalSpatialIdInput, zoom?: number) {
    this.namespace = namespace;
    if (typeof input === 'string') {
      // parse string
      let zfxy = parseZFXYString(input) || parseZFXYTilehash(input);
      if (zfxy) {
        this.zfxy = zfxy;
      } else {
        throw new Error(`parse ZFXY failed with input: ${input}`);
      }
    } else if (isZFXYTile(input)) {
      this.zfxy = input;
    } else {
      this.zfxy = calculateZFXY({
        ...input,
        zoom: (typeof zoom !== 'undefined') ? zoom : DEFAULT_ZOOM,
      });
    }

    this._regenerateAttributesFromZFXY();
  }

  /* - PUBLIC API - */

  up(by: number = 1) {
    return this.move({f: by});
  }

  down(by: number = 1) {
    return this.move({f: -by});
  }

  north(by: number = 1) {
    return this.move({y: by});
  }

  south(by: number = 1) {
    return this.move({y: -by});
  }

  east(by: number = 1) {
    return this.move({x: by});
  }

  west(by: number = 1) {
    return this.move({x: -by});
  }

  move(by: Partial<Omit<ZFXYTile, 'z'>>) {
    const newSpace = new LocalSpatialId(this.namespace, this.zfxy);
    newSpace.zfxy = zfxyWraparound({
      z: newSpace.zfxy.z,
      f: newSpace.zfxy.f + (by.f || 0),
      x: newSpace.zfxy.x + (by.x || 0),
      y: newSpace.zfxy.y + (by.y || 0),
    });
    newSpace._regenerateAttributesFromZFXY();
    return newSpace;
  }

  parent(atZoom?: number) {
    const steps = (typeof atZoom === 'undefined') ? 1 : this.zfxy.z - atZoom;
    return new LocalSpatialId(this.namespace, getParent(this.zfxy, steps));
  }

  children() {
    return getChildren(this.zfxy).map((tile) => new LocalSpatialId(this.namespace, tile));
  }

  contains(input: LocalSpatialId | GeoJSON.Geometry) {
    if (input instanceof LocalSpatialId) {
      if (input.namespace.id && this.namespace.id && input.namespace.id !== this.namespace.id) {
        return false;
      }
      const theirTilehash = input.tilehash;
      return theirTilehash.startsWith(this.tilehash);
    }
    // this is a GeoJSON.Geometry

    // Get the bounding box of our geometry
    const bbox = this.toWGS84BBox();

    // Check if the input geometry is within our bounding box
    if (input.type === 'GeometryCollection')
      throw new Error("GeometryCollection is not supported");

    return booleanContains(bboxPolygon(bbox), input);
  }

  toContainingGlobalSpatialId() {
    if (!this.namespace.origin) {
      throw new ConversionNotPossibleError("The namespace this spatial ID is contained within does not have an origin set.");
    }

    throw new Error("Not implemented yet");
  }

  toGlobalSpatialIds(zoom: number) {
    if (!this.namespace.origin) {
      throw new ConversionNotPossibleError("The namespace this spatial ID is contained within does not have an origin set.");
    }

    throw new Error("Not implemented yet");
  }

  toWGS84BBox(): [number, number, number, number] {
    if (!this.namespace.georeferencer) {
      throw new ConversionNotPossibleError("The namespace this spatial ID is contained within does not have an origin set.");
    }
    const meters = tile2meters(this.namespace.scale, this.zfxy.z);
    // The origin point is at the center of the tile, so we need to adjust the bounding box by half the tile size.
    const x0 = (this.zfxy.x * meters) - (meters / 2);
    const y0 = (this.zfxy.y * meters) - (meters / 2);
    const x1 = ((this.zfxy.x + 1) * meters) - (meters / 2);
    const y1 = ((this.zfxy.y + 1) * meters) - (meters / 2);
    const p0 = this.namespace.georeferencer.transform({ x: x0, y: y0 });
    const p1 = this.namespace.georeferencer.transform({ x: x1, y: y1 });
    return [p0.x, p0.y, p1.x, p1.y];
  }

  toGeoJSON(): GeoJSON.Polygon {
    const bbox = this.toWGS84BBox();
    return bboxPolygon(bbox).geometry;
  }

  private _regenerateAttributesFromZFXY() {
    this.id = this.tilehash = generateTilehash(this.zfxy);
    this.zfxyStr = `/${this.zfxy.z}/${this.zfxy.f}/${this.zfxy.x}/${this.zfxy.y}`;
  }
}
