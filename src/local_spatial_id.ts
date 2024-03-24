import type { LocalNamespace } from "./local_namespace";

import * as SpatialId from "@spatial-id/javascript-sdk";

import bboxPolygon from "@turf/bbox-polygon";
import booleanContains from "@turf/boolean-contains";
import booleanIntersects from "@turf/boolean-intersects";

import { XYPointWithAltitude } from "./lib/types";
import { ZFXYTile, getChildren, getChildrenAtZoom, getParent, isZFXYTile, parseZFXYString, zfxyWraparound } from "./lib/zfxy";
import { generateTilehash, parseZFXYTilehash } from "./lib/zfxy_tilehash";
import { ConversionNotPossibleError } from "./lib/errors";
import { tile2meters, calculateLocalZFXY } from "./lib/tilebelt_local";
import { BBox2D, BBox3D, bboxToTile, xyfzTileAryToObj } from "./lib/tilebelt";

export type LocalSpatialIdInput = XYPointWithAltitude | BBox3D | ZFXYTile | string;

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
      this.zfxy = calculateLocalZFXY(
        this.namespace.scale,
        input,
        (typeof zoom !== 'undefined') ? zoom : DEFAULT_ZOOM,
      );
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
    return this.childrenAtZoom(this.zfxy.z + 1);
  }

  childrenAtZoom(zoom: number) {
    return getChildrenAtZoom(zoom, this.zfxy).map((tile) => new LocalSpatialId(this.namespace, tile));
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
    const bbox = this.toWGS84BBox2D();

    // Check if the input geometry is within our bounding box
    if (input.type === 'GeometryCollection')
      throw new Error("GeometryCollection is not supported");

    return booleanContains(bboxPolygon(bbox), input);
  }

  intersects(input: LocalSpatialId | GeoJSON.Geometry) {
    if (input instanceof LocalSpatialId) {
      throw new Error("not implemented");
    }
    // this is a GeoJSON.Geometry

    // Get the bounding box of our geometry
    const bbox = this.toWGS84BBox2D();

    // Check if the input geometry intersects our bounding box
    if (input.type === 'GeometryCollection')
      throw new Error("GeometryCollection is not supported");

    console.log('bbox', JSON.stringify(bboxPolygon(bbox)));

    return booleanIntersects(bboxPolygon(bbox), input);
  }

  toContainingGlobalSpatialId(): SpatialId.Space {
    const bbox = this.toWGS84BBox();
    const xyzTile = bboxToTile(bbox);
    return new SpatialId.Space(xyfzTileAryToObj(xyzTile));
  }

  toGlobalSpatialIds(zoom: number) {
    const bbox = this.toWGS84BBox();
    const xyzTile = bboxToTile(bbox);
    const tiles = getChildrenAtZoom(zoom, xyfzTileAryToObj(xyzTile));
    return tiles.map((tile) => new SpatialId.Space(tile));
  }

  toWGS84BBox(): BBox3D {
    if (!this.namespace.georeferencer) {
      throw new ConversionNotPossibleError("The namespace this spatial ID is contained within does not have an origin set.");
    }

    const scale = this.namespace.scale;
    const meters = tile2meters(scale, this.zfxy.z);

    // The origin point is the center of the root tile
    const x0 = (this.zfxy.x * meters) - (scale / 2);
    const y0 = 0 - ((this.zfxy.y * meters) - (scale / 2)); // flip Y-axis: 0/0 is top-left
    const x1 = ((this.zfxy.x + 1) * meters) - (scale / 2);
    const y1 = 0 - (((this.zfxy.y + 1) * meters) - (scale / 2));
    const p0 = this.namespace.georeferencer.transform({ x: x0, y: y0 });
    const p1 = this.namespace.georeferencer.transform({ x: x1, y: y1 });
    const f0 = this.zfxy.f * scale;
    const f1 = (this.zfxy.f + 1) * scale;
    return [
      p0.x, p1.y, f0, // reminder: Y-axis is flipped
      p1.x, p0.y, f1
    ];
  }

  toWGS84BBox2D(): BBox2D {
    const bbox3d = this.toWGS84BBox();
    return [bbox3d[0], bbox3d[1], bbox3d[3], bbox3d[4]];
  }

  toGeoJSON(): GeoJSON.Polygon {
    const bbox = this.toWGS84BBox2D();
    return bboxPolygon(bbox).geometry;
  }

  private _regenerateAttributesFromZFXY() {
    this.id = this.tilehash = generateTilehash(this.zfxy);
    this.zfxyStr = `/${this.zfxy.z}/${this.zfxy.f}/${this.zfxy.x}/${this.zfxy.y}`;
  }
}
