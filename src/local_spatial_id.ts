import type { LocalNamespace } from "./local_namespace";

import * as SpatialId from "@spatial-id/javascript-sdk";

import turfBBox from "@turf/bbox";
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

type ToContainingGlobalSpatialIdOptions = {
  /// If true, the f value will be ignored when calculating the containing global spatial ID.
  ignoreF?: boolean;

  /// If set, the maximum zoom level to consider when calculating the containing global spatial ID.
  maxzoom?: number;
}

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
      // 文字列から ZFXY をパース
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
        this.namespace.scaleHeight,
        input,
        (typeof zoom !== 'undefined') ? zoom : DEFAULT_ZOOM,
        true, // clamp to valid coordinates
      );
    }

    this._regenerateAttributesFromZFXY();
  }

  /* - PUBLIC API - */

  up(by: number = 1) {
    return this.move({ f: by });
  }

  down(by: number = 1) {
    return this.move({ f: -by });
  }

  north(by: number = 1) {
    return this.move({ y: by });
  }

  south(by: number = 1) {
    return this.move({ y: -by });
  }

  east(by: number = 1) {
    return this.move({ x: by });
  }

  west(by: number = 1) {
    return this.move({ x: -by });
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
    if (steps < 0) {
      throw new Error(`Getting parent tile of ${this.zfxy} at zoom ${atZoom} is not possible`);
    }
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
    // GeoJSON.Geometry の場合

    // 自身のジオメトリを GeoJSON として取得
    const polygon = this.toGeoJSON();

    if (input.type === 'GeometryCollection')
      throw new Error("GeometryCollection is not supported");

    return booleanContains(polygon, input);
  }

  intersects(input: LocalSpatialId | GeoJSON.Geometry) {
    if (input instanceof LocalSpatialId) {
      throw new Error("not implemented");
    }
    // GeoJSON.Geometry の場合

    // 自身のジオメトリを GeoJSON として取得
    const polygon = this.toGeoJSON();

    if (input.type === 'GeometryCollection')
      throw new Error("GeometryCollection is not supported");

    return booleanIntersects(polygon, input);
  }

  toContainingGlobalSpatialId(options: ToContainingGlobalSpatialIdOptions = {}): SpatialId.Space {
    const bbox = this.toWGS84BBox();
    if (options.ignoreF) {
      bbox[2] = 0;
      bbox[5] = 0;
    }
    const xyzTile = bboxToTile(bbox);
    return new SpatialId.Space(xyfzTileAryToObj(xyzTile));
  }

  toGlobalSpatialIds(zoom: number) {
    const geometry = this.toGeoJSON();
    const bbox = this.toWGS84BBox();
    const xyzTile = bboxToTile(bbox);
    const tiles = getChildrenAtZoom(zoom, xyfzTileAryToObj(xyzTile));

    return tiles
      .map((tile) => new SpatialId.Space(tile))
      .filter((space) => {
        // 2Dジオメトリの交差判定
        const geomIntersects = booleanIntersects(space.toGeoJSON(), geometry);
        // 高さ（Z軸）の交差判定
        // bbox[2] が最小高度、bbox[5] が最大高度、space.altMin/altMax がタイルの高度範囲
        const heightIntersects = bbox[2] <= space.altMax && bbox[5] >= space.altMin;
        return geomIntersects && heightIntersects;
      });
  }

  toGeoJSON(): GeoJSON.Polygon {
    if (!this.namespace.georeferencer) {
      throw new ConversionNotPossibleError("The namespace this spatial ID is contained within does not have an origin set.");
    }

    const scale = this.namespace.scale;
    const meters = tile2meters(scale, this.zfxy.z);

    // タイルの左上を原点とした座標計算（Y軸は反転）
    const x0 = this.zfxy.x * meters;
    const y0 = 0 - (this.zfxy.y * meters);
    const x1 = (this.zfxy.x + 1) * meters;
    const y1 = 0 - ((this.zfxy.y + 1) * meters);

    const p0 = this.namespace.georeferencer.transform({ x: x0, y: y0 });
    const p1 = this.namespace.georeferencer.transform({ x: x0, y: y1 });
    const p2 = this.namespace.georeferencer.transform({ x: x1, y: y1 });
    const p3 = this.namespace.georeferencer.transform({ x: x1, y: y0 });

    return {
      type: 'Polygon',
      coordinates: [[
        [p0.x, p0.y],
        [p1.x, p1.y],
        [p2.x, p2.y],
        [p3.x, p3.y],
        [p0.x, p0.y],
      ]]
    };
  }

  toWGS84BBox(): BBox3D {
    const bbox = this.toWGS84BBox2D();

    // 修正ポイント: 高さ方向は scaleHeight を用いて変換する
    const verticalMeters = tile2meters(this.namespace.scaleHeight, this.zfxy.z);
    const f0 = this.namespace.origin.altitude + (this.zfxy.f * verticalMeters);
    const f1 = this.namespace.origin.altitude + ((this.zfxy.f + 1) * verticalMeters);

    return [
      bbox[0], bbox[1], f0, // min: [west, south, bottom]
      bbox[2], bbox[3], f1, // max: [east, north, top]
    ];
  }

  toWGS84BBox2D(): BBox2D {
    const globalGeoJSON = this.toGeoJSON();
    const bbox = turfBBox(globalGeoJSON);
    return [bbox[0], bbox[1], bbox[2], bbox[3]];
  }

  private _regenerateAttributesFromZFXY() {
    this.id = this.tilehash = generateTilehash(this.zfxy);
    this.zfxyStr = `/${this.zfxy.z}/${this.zfxy.f}/${this.zfxy.x}/${this.zfxy.y}`;
  }
}
