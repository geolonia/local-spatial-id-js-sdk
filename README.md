# 3D 空間 ID 共通ライブラリ (ローカル空間ID用)

- 注意：このライブラリはまだ設計段階です。それぞれのクラス名・メソッド名は変わる可能性があるのでご注意ください。

## LocalSpace

- `LocalSpace` は、基準点と高さ幅を指定したローカル空間を表し、このAPIを使用してローカル空間を操作することができます。

### コンストラクタ

```
new LocalSpace(options: LocalSpaceOptions)
```

ローカル空間 (`LocalSpace`) の新しいインスタンスである、`LocalSpace` オブジェクトを返します。

### コンストラクタ引数

`LocalSpaceOptions`
| プロパティ          | 型      | 説明 |
|-----------------|--------|------------------------|
| `scale`        | number | ローカル空間の１軸の最大長さ (メートル単位)。例: `1` を指定すると、最大 `1m × 1m × 1m` の空間を定義します。 |
| `scale_height` | number | ローカル空間の高さ (メートル単位)。未指定の場合、`scale` と同じ値が適用されます。 |
| `origin_latitude` | number | グローバル座標とのマッピング用の基準点 (緯度)。 |
| `origin_longitude` | number | グローバル座標とのマッピング用の基準点 (経度)。 |
| `origin_altitude` | number | 基準点の高度。デフォルトは `0`。 |
| `origin_angle` | number | 基準点の角度。デフォルトは `0`。 |

---

### LocalSpace オブジェクト

```
const localSpace = new LocalSpace(options: LocalSpaceOptions);
```

### プロパティ

| プロパティ   | 型 | 説明 |
|------------|--------------------------|------------------------------------------|
| `.center`  | `{x: number, y: number, z: number}` | 空間オブジェクトの中央点 (3D 座標)。 |
| `.vertices` | `[ [x, y, z], [x, y, z], ... ]` | 空間オブジェクトの 8 頂点の座標を配列で返します。 |
| `.alt` | `number` | 空間オブジェクトの最低高度 (floor) 。 |
| `.zoom` | `number` | 空間オブジェクトのズームレベル (分解能)。 |
| `.zfxy` | `{ z: number, f: number, x: number, y: number }` | 空間オブジェクトの `ZFXYTile` 情報。 |
| `.id` `.tilehash` | `string` | `ZFXYTile` の tilehash 文字列。 |
| `.zfxyStr` | `string` | `ZFXY` の文字列表現。 |

---

### メソッド

#### `.getSpaceById(input: zfxy | zfxyStr): LocalSpace`

* `zfxyStr` もしくは、`zfxy` オブジェクトを引数として受け取りローカル空間オブジェクトを返す。

#### `.getSpaceByLocation(lng: number, lat: number, alt: number, zoom: number): LocalSpace`

* 緯度、経度、高度、ズームレベルを引数として受け取りローカル空間オブジェクトを返す。

#### `.up(by?: number): LocalSpace`

![up](https://user-images.githubusercontent.com/309946/168220328-47e09300-c4dc-4ad1-adae-2cb17aff23ab.png)

* パラメータがない場合は、現在の空間オブジェクトのひとつ上の空間オブジェクトを返す
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す

#### `.down(by?: number): LocalSpace`

![down](https://user-images.githubusercontent.com/309946/168220818-f89a73b1-b99c-462d-9fcb-5eae0eac03eb.png)

* パラメータがない場合は現在の空間オブジェクトのひとつ下の空間オブジェクトを返す
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す

#### `.north(by?: number), .east(by?: number), south(by?: number), .west(by?: number): LocalSpace`

![north](https://user-images.githubusercontent.com/309946/168221234-b03809ef-6c69-442b-98d3-583b4391108e.png)

* こちらの東西南北はローカル座標系内の方位となります。
* パラメータがない場合は、現在の空間オブジェクトの隣のオブジェクトを返す
* パラメータが指定されている場合は、その個数分の空間オブジェクトを配列で返す

#### `.move(by: Partial<Omit<ZFXYTile, 'z'>>): LocalSpace`

* 現在の空間オブジェクトから相対的な新しいオブジェクトを返す。 `by` は少なくとも `x, y, f` の一つ以上を含めてください

```
localSpace.move({x: 1, y: 5, f: -1})
```

上記の例の場合では、返り値は西1マス、北5マス、下1マスにある空間オブジェクト

#### `.surroundings(): LocalSpace[]`

![surroundings](https://user-images.githubusercontent.com/309946/168221371-b1ec30c7-f501-4a6b-ad64-5a6345fb9665.png)

* 現在の空間オブジェクトのまわりにあるすべての空間オブジェクトを配列で返す。

#### `.parent(atZoom?: number): LocalSpace`

* 現在の空間オブジェクトから、分解能（ズームレベル）を `atZoom` のズームレベルまで下げる。デフォルトでは1段階下げます。

#### `.children(): LocalSpace[]`

* 現在の空間オブジェクトから、分解能（ズームレベル）を一つ上げて、そこに含まれるすべての空間オブジェクトを返す。

#### `.contains(input: zfxy | zfxyStr | GeoJSON.Geometry): bool`

* 指定されたローカル空間IDまたは任意なGeoJSONが、指定されたボクセル内に含まれるかどうかを判定して bool 値を返す。
* input の ローカル空間ID が違うローカル空間で作られたものの場合、例外が発生します。
* input が GeoJSON かつ、基準点の設定が未設定の場合、例外が発生します。

#### `.toContainingGlobalSpatialId(): Space`

* 現在の空間オブジェクトがすべて内包できるグローバル空間IDを返します。
* 基準点の設定が未設定の場合、例外が発生します。

#### `.toGlobalSpatialIds(zoom: number): Space[]`

* 現在の空間オブジェクトを内包できるグローバル空間IDを、指定のズームレベルのグローバル空間オブジェクトを配列で返します。
* 基準点の設定が未設定の場合、例外が発生します。

#### `.toGeoJSON(): GeoJSON.Geometry`

* 現在の空間オブジェクトをGeoJSONとして出力する（２次元）
* 基準点の設定が未設定の場合、例外が発生します。

---


## 使用例 (Node.js SDK)

```node
const space = new LocalSpace({ scale: 1, origin_latitude: 35.710271, origin_longitude: 139.810887 })

// 南へ1つ、上へ1つ、東へ1つ移動し、スカイツリーの頂上が含まれるかを判定
const result = space.south().up().east().contains({
  lng: 139.810887,
  lat: 35.710271,
  alt: 634
});
console.log(result); // true or false
```
