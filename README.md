# Spatial Object Model （仕様のドラフト）

## LSOM (Local Spatial Object Model) Core

### コンストラクタ

new  LocalSpace(options: LocalSpaceOptions)

LocalSpaceOptions
/// ローカル空間全体の１軸の最大長さ。メートルで指定。例えば 1 の場合、該当のローカル空間の最大収容可能な地物は 1m×1m×1m の 1m3 となります。
scale: number

/// ローカル空間全体の高さ。メートルで指定。指定がなければ、 `scale` と同じ値が使われます。
scale_height?: number

/// ローカル空間をグローバル空間とマッピングする場合、基準点をしていしなければなりません。 `altitude` または `angle` はデフォルトで `0` となります。
origin_latitude?: number
origin_longitude?: number
origin_altitude?: number
origin_angle?: number

返り値: Space


### Spaceインスタンス

インスタンスのローカル空間オブジェクトは以下のようなインターフェスをもつこと。


## Properties

.center -> {x: number, y: number, z: number}
現在の空間オブジェクトの中央点 (3Dの {x: number, y: number, z: number} 型)
.vertices -> [x, y, z][8]
現在の空間オブジェクトの8頂点がそれぞれ配列として返す。
.alt -> number
現在の空間オブジェクトの最低高さ (floor)
.zoom -> number
現在の空間オブジェクトのズームレベル（分解能）
.zfxy -> { z: number, f: number, x: number, y: number }
現在の空間オブジェクトが表現している ZFXY を ZFXYTile 型 ({ z: number, f: number, x: number, y: number })
.id, .tilehash -> string
現在の空間オブジェクトが表現している ZFXY の tilehash の文字列
.zfxyStr -> string



## Methods

### .getLocalSpaceById()

* ID を引数として受け取り空間オブジェクトを返す。

### .querySelector()

- メソッドは、指定された空間セレクター（緯度経度及び高度、ZFXY）に一致する最初の 空間オブジェクト を返します。
- 一致するものが見つからない場合は null を返します。

### .up()

![up](https://user-images.githubusercontent.com/309946/168220328-47e09300-c4dc-4ad1-adae-2cb17aff23ab.png)

* パラメータがない場合は、現在の空間オブジェクトのひとつ上の空間オブジェクトを返す。
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す(？)
* マイナスも受け付けられるといい。
* メートルで指定できるといいかも(？)

### .down()

![down](https://user-images.githubusercontent.com/309946/168220818-f89a73b1-b99c-462d-9fcb-5eae0eac03eb.png)

* パラメータがない場合は現在の空間オブジェクトのひとつ下の空間オブジェクトを返す。
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す(？)
* マイナスも受け付けられるといい。
* メートルで指定できるといいかも(？)

### .north(), .east(), south(), .west()

![north](https://user-images.githubusercontent.com/309946/168221234-b03809ef-6c69-442b-98d3-583b4391108e.png)

* パラメータがない場合は、現在の空間オブジェクトの隣のオブジェクトを返す。
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す(？)
* マイナスも受け付けられるといい。
* メートルで指定できるといいかも(？)

### .surroundings()

![surroundings](https://user-images.githubusercontent.com/309946/168221371-b1ec30c7-f501-4a6b-ad64-5a6345fb9665.png)

* 現在の空間オブジェクトのまわりにあるすべての空間オブジェクトを配列で返す。

### .parent()

* 現在の空間オブジェクトから、分解能（ズームレベル）を一つ下げて、その空間オブジェクトを返す。

### .children()

* 現在の空間オブジェクトから、分解能（ズームレベル）を一つ上げて、そこに含まれるすべての空間オブジェクトを返す。

### .contains()

* 指定された緯度経度が、指定されたボクセル内に含まれるかどうかを判定して bool 値を返す。

### .vertices3d()

* 現在の空間オブジェクトの3Dバウンディングボックスを作る8点の座標を配列として返す。

### .toContainingGlobalSpatialId() -> Space
現在の空間オブジェクトがすべて内包できるグローバル空間IDを返します。
基準点の設定が未設定の場合、例外が発生します。

### .toGlobalSpatialIds(zoom: number) -> Space[]
* 現在の空間オブジェクトを内包できるグローバル空間IDを、指定のズームレベルのグローバル空間オブジェクトを配列で返します。
* 基準点の設定が未設定の場合、例外が発生します。

### .toGeoJSON() -> GeoJSON.Geometry

## 参考: NodeJS ベースの SDK （があると仮定して）での実装例

```node
const space = new Space(12345678) // 空間ID、緯度経度及び高度、ZFXYのいずれか

// 南へ一つ、上へひとつ、東へひとつ移動したあとで、そこにスカイツリーの頂上があるかどうかを判定する。
const result = space.south().up().east().contains({lng: 139.81088744999997, lat: 35.71027146141545, alt: 634})
```
