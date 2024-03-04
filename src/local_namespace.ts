import { ConversionNotPossibleError } from "./lib/errors";
import { CoordinateTransformer, OriginGeodesicTransformer } from "./lib/georeference";
import { LocalSpatialId, LocalSpatialIdInput } from "./local_spatial_id";

export type LocalNamespaceOptions = {
  /// 任意な一意な文字列。他のローカル空間と識別するために使います。
  /// 存在しない場合は、ランダムなUUIDで生成されます。
  id?: string

  /// ローカル空間全体の１軸の最大長さ。メートルで指定。例えば 1 の場合、該当のローカル空間の最大収容可能な地物は 1m×1m×1m の 1m3 となります。
  scale: number

  name?: string
  description?: string

  /**
   * ローカル空間をグローバル空間とマッピングする場合、基準点をしていしなければなりません。 `altitude` または `angle` はデフォルトで `0` となります。
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
  name?: string
  description?: string
  origin?: OriginSettings

  georeferencer?: CoordinateTransformer;

  constructor(options: LocalNamespaceOptions) {
    this.id = options.id ?? crypto.randomUUID();
    this.scale = options.scale;
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
    throw new Error("Not implemented yet");
  }

  boundingSpaceFromGeoJSON(input: GeoJSON.Geometry): LocalSpatialId {
    if (!this.origin) {
      throw new ConversionNotPossibleError("The namespace this spatial ID is contained within does not have an origin set.");
    }
    throw new Error("Not implemented yet");
  }
}
