# 3D 空間 ID 共通ライブラリ (ローカル空間ID用)

注意：このライブラリはまだ設計段階です。それぞれのクラス名・メソッド名は変わる可能性があるのでご注意ください。

## このライブラリの内容

## `LocalSpace`

### コンストラクタ

```
new LocalSpace( options: LocalSpaceOptions )
```

ローカル空間をインスタンス化します。新しい空間を作るときに使います。

```
interface LocalSpaceOptions {
  /// ローカル空間全体の１軸の最大長さ。メートルで指定。例えば 1 の場合、該当のローカル空間の最大収容可能な地物は 1m×1m×1m の 1m3 となります。
  scale: number
  /// ローカル空間全体の高さ。メートルで指定。指定がなければ、 `scale` と同じ値が使われます。
  scale_height?: number
  /// ローカル空間をグローバル空間とマッピングする場合、基準点を指定しなければなりません。 `altitude` または `angle` はデフォルトで `0` となります。
  origin_latitude?: number
  origin_longitude?: number
  origin_altitude?: number
  origin_angle?: number
}
```

### メソッド

`LocalSpace` をインスタンス化されたあとで、その空間内のローカル空間IDを操作することができます。

##### `.space(input)` -> `LocalSpatialId`

`input` 座標及び高度または空間 ID を以下のフォーマットで指定することができます。

* XYZObject: XYZ座標を含むオブジェクト。単位はメートル。 （例: `{ x: number, y: number, z: number }`）
* ZFXYTile: ZFXY（3次元タイル番号）を示す文字列。（例: `/15/6/2844/17952`）
* TileHash: ZFXY をハッシュ化した値。（例: `100213200122640`）

`XYZObject` で指定された座標がローカル空間により外の場合、例外が発生します。


##### `.spacesFromGeoJSON(zoom: number, input: GeoJSON.Geometry)` -> `LocalSpatialId[]`

* GeoJSON Feature がインプットとし、内包する指定のズームレベルのローカル空間IDを算出します。
* 基準点の設定が未設定の場合、例外が発生します。

##### `.boundingSpaceFromGeoJSON(input: GeoJSON.Geometry)` -> `LocalSpatialId`

* GeoJSON Feature がインプットとし、内包する最小のローカル空間IDを算出します。
* 基準点の設定が未設定の場合、例外が発生します。

## `LocalSpatialId`

`LocalSpatialId` は基本的に `LocalSpace#space` で作成します。

### メソッド

[グローバル空間IDのメソッド](https://github.com/spatial-id/javascript-sdk?tab=readme-ov-file#%E3%83%A1%E3%82%BD%E3%83%83%E3%83%89) と同等な機能を持たしております。該当するメソッドを、下記に引用しております。

#### `.center` -> `{x: number, y: number, z: number}`

* 現在の空間オブジェクトの中央点 (3Dの `{x: number, y: number, z: number}` 型)

#### `.vertices` -> `[x, y, z][8]`

* 現在の空間オブジェクトの8頂点がそれぞれ配列として返す。

#### `.alt` -> `number`

* 現在の空間オブジェクトの最低高さ (floor)

#### `.zoom` -> `number`

* 現在の空間オブジェクトのズームレベル（分解能）

#### `.zfxy` -> `{ z: number, f: number, x: number, y: number }`

* 現在の空間オブジェクトが表現している ZFXY を ZFXYTile 型 (`{ z: number, f: number, x: number, y: number }`)

#### `.id`, `.tilehash` -> `string`

* 現在の空間オブジェクトが表現している ZFXY の tilehash の文字列

#### `.zfxyStr` -> `string`

* 現在の空間オブジェクトが表現している ZFXY を URL のパス型に変換したもの

#### `.up(by?: number)` -> `LocalSpace`

![up](https://user-images.githubusercontent.com/309946/168220328-47e09300-c4dc-4ad1-adae-2cb17aff23ab.png)

* パラメータがない場合は、現在の空間オブジェクトのひとつ上の空間オブジェクトを返す
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す

#### `.down(by?: number)` -> `LocalSpace`

![down](https://user-images.githubusercontent.com/309946/168220818-f89a73b1-b99c-462d-9fcb-5eae0eac03eb.png)

* パラメータがない場合は現在の空間オブジェクトのひとつ下の空間オブジェクトを返す
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す

#### `.north(by?: number), .east(by?: number), south(by?: number), .west(by?: number)` -> `LocalSpace`

![north](https://user-images.githubusercontent.com/309946/168221234-b03809ef-6c69-442b-98d3-583b4391108e.png)

* こちらの東西南北はローカル座標系内の方位となります。
* パラメータがない場合は、現在の空間オブジェクトの隣のオブジェクトを返す
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す

#### `.move(by: Partial<Omit<ZFXYTile, 'z'>>)` -> `LocalSpace`

* 現在の空間オブジェクトから相対的な新しいオブジェクトを返す。 `by` は少なくとも `x, y, f` の一つ以上を含めてください

```
space.move({x: 1, y: 5, f: -1})
```

上記の例の場合では、返り値は西1マス、北5マス、下1マスにある空間オブジェクト

#### `.surroundings()` -> `LocalSpace[]`

![surroundings](https://user-images.githubusercontent.com/309946/168221371-b1ec30c7-f501-4a6b-ad64-5a6345fb9665.png)

* 現在の空間オブジェクトのまわりにあるすべての空間オブジェクトを配列で返す。

#### `.parent(atZoom?: number)` -> `LocalSpace`

* 現在の空間オブジェクトから、分解能（ズームレベル）を `atZoom` のズームレベルまで下げる。デフォルトでは1段階下げます。

#### `.children()` -> `LocalSpace[]`

* 現在の空間オブジェクトから、分解能（ズームレベル）を一つ上げて、そこに含まれるすべての空間オブジェクトを返す。

#### `.contains(input: LocalSpatialId | GeoJSON.Geometry)` -> `bool`

* 指定されたローカル空間IDまたは任意なGeoJSONが、指定されたボクセル内に含まれるかどうかを判定して bool 値を返す。
* input の ローカル空間ID が違うローカル空間で作られたものの場合、例外が発生します。
* input が GeoJSON かつ、基準点の設定が未設定の場合、例外が発生します。

#### `.toContainingGlobalSpatialId()` -> `Space`

* 現在の空間オブジェクトがすべて内包できるグローバル空間IDを返します。
* 基準点の設定が未設定の場合、例外が発生します。

#### `.toGlobalSpatialIds(zoom: number)` -> `Space[]`

* 現在の空間オブジェクトを内包できるグローバル空間IDを、指定のズームレベルのグローバル空間オブジェクトを配列で返します。
* 基準点の設定が未設定の場合、例外が発生します。

#### `.toGeoJSON()` -> `GeoJSON.Geometry`

* 現在の空間オブジェクトをGeoJSONとして出力する（２次元）
* 基準点の設定が未設定の場合、例外が発生します。
