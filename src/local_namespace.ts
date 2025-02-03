import { ConversionNotPossibleError } from "./lib/errors";
import { CoordinateTransformer, OriginGeodesicTransformer } from "./lib/georeference";
import { BBox3D } from "./lib/tilebelt";
import { getChildrenAtZoom } from "./lib/zfxy";
import { LocalSpatialId, LocalSpatialIdInput } from "./local_spatial_id";

import turfBBox from "@turf/bbox";

export type LocalNamespaceOptions = {
  /// 任意な一意な文字列。他のローカル空間と識別するために使います。
  /// 存在しない場合は、ランダムなUUIDで生成されます。
  id?: string

  /// 水平方向のローカル空間全体の１軸の最大長さ（メートル）。
  /// 例えば 1 の場合、該当のローカル空間の最大収容可能な地物は 1m×1m 程度の大きさとなります。
  scale: number

  /**
   * 高さ方向のローカル空間全体の最大長さ（メートル）。
   * 指定しない場合は scale と同じ値が使用されます。
   **/
  scaleHeight?: number

  name?: string
  description?: string

  /**
   * ローカル空間をグローバル空間とマッピングする場合、基準点を指定しなければなりません。
   * `altitude` または `angle` はデフォルトで `0` となります。
   * 設定する場合、最低でも `latitude` と `longitude` は必須です。
   * 基準点を設定する場合、基準点は空間の中央点として扱われます。
   **/
  origin_latitude?: number
  origin_longitude?: number
  origin_altitude?: number
  origin_angle?: number
};

type OriginSettings = {
  latitude: number
  longitude: number
  altitude: number
  angle: number
}

export class LocalNamespace {
  id: string
  scale: number
  scaleHeight: number
  name?: string
  description?: string
  origin?: OriginSettings

  georeferencer?: CoordinateTransformer;

  constructor(options: LocalNamespaceOptions) {
    this.id = options.id ?? crypto.randomUUID();
    this.scale = options.scale;
    this.scaleHeight = options.scaleHeight ?? options.scale;
    this.name = options.name;
    this.description = options.description;
    if (options.origin_latitude && options.origin_longitude) {
      this.origin = {
        latitude: options.origin_latitude,
        longitude: options.origin_longitude,
        altitude: options.origin_altitude || 0,
        angle: options.origin_angle || 0
      };

      this.georeferencer = new OriginGeodesicTransformer(
        { x: this.origin.longitude, y: this.origin.latitude },
        this.origin.angle,
      );
    }
  }

  space(input: LocalSpatialIdInput): LocalSpatialId {
    return new LocalSpatialId(this, input);
  }

  spacesFromGeoJSON(zoom: number, input: GeoJSON.Geometry): LocalSpatialId[] {
    if (!this.origin) {
      throw new ConversionNotPossibleError("The namespace this spatial ID is contained within does not have an origin set.");
    }
    // 入力ジオメトリを含むローカル空間の境界範囲を取得
    const boundingSpace = this.boundingSpaceFromGeoJSON(input);
    // 指定された zoom レベルで、boundingSpace を覆うタイル群を取得する
    const coveringSpaces = getChildrenAtZoom(zoom, boundingSpace.zfxy).map((tile) => new LocalSpatialId(this, tile));
    // 各タイルが実際に入力ジオメトリと交差しているかチェックする
    return coveringSpaces.filter((space) => space.intersects(input));
  }

  boundingSpaceFromGeoJSON(input: GeoJSON.Geometry): LocalSpatialId {
    if (!this.georeferencer) {
      throw new ConversionNotPossibleError("The namespace this spatial ID is contained within does not have an origin set.");
    }
    // 入力ジオメトリのバウンディングボックスを取得
    const bbox = turfBBox(input);

    // WGS84 のバウンディングボックスの座標をローカル空間に変換
    const nw = this.georeferencer.transformInverse({ x: bbox[0], y: bbox[1] });
    const se = this.georeferencer.transformInverse({ x: bbox[2], y: bbox[3] });
    // Y 軸は符号を反転（NorthWest/SouthEast の関係による）
    // 高さ方向は、ローカル空間全体の高さ scaleHeight を使用する
    const localBBox3D: BBox3D = [nw.x, -nw.y, 0, se.x, -se.y, this.scaleHeight];

    // 変換されたバウンディングボックスからローカル空間IDを生成
    return new LocalSpatialId(this, localBBox3D);
  }
}
