# 3D 空間 ID 共通ライブラリ (ローカル空間ID用)

- 注意：このライブラリはまだ設計段階です。それぞれのクラス名・メソッド名は変わる可能性があるのでご注意ください。

### LocalSpace

- `LocalSpace` は、基準点と高さ幅を指定したローカル空間を表し、このAPIを使用してローカル空間を操作することができます。

#### コンストラクタ

```
new LocalSpace(options: LocalSpaceOptions)
```

ローカル空間 (`LocalSpace`) の新しいインスタンスである、`LocalSpace` オブジェクトを返します。

#### コンストラクタ引数

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

#### `.getLocalSpaceById(id: string): LocalSpace`
指定された `ID` に対応する空間オブジェクトを取得します。

#### `.querySelector(selector: { lat: number, lng: number, alt?: number, zfxy?: { z: number, f: number, x: number, y: number } }): LocalSpace | null`
指定された空間セレクター (緯度経度および高度、または `ZFXY`) に一致する最初の空間オブジェクトを返します。

#### `.up(count?: number): LocalSpace | LocalSpace[]`
現在の空間オブジェクトの上位の空間オブジェクトを取得します。
- `count` が指定されると、その数分だけ上位の空間オブジェクトを配列で返します。
- 負の値を指定すると、`down()` と同様の動作になります。
- メートル単位の移動ができるようにすることも検討中。

#### `.down(count?: number): LocalSpace | LocalSpace[]`
現在の空間オブジェクトの下位の空間オブジェクトを取得します。
- `count` が指定されると、その数分だけ下位の空間オブジェクトを配列で返します。
- 負の値を指定すると、`up()` と同様の動作になります。
- メートル単位の移動ができるようにすることも検討中。

#### `.north(count?: number), .east(count?: number), .south(count?: number), .west(count?: number): LocalSpace | LocalSpace[]`
現在の空間オブジェクトの隣接する空間オブジェクトを取得します。
- `count` が指定されると、その数分だけ隣接する空間オブジェクトを配列で返します。
- 負の値を指定すると、逆方向に移動します。
- メートル単位の移動ができるようにすることも検討中。

#### `.surroundings(): LocalSpace[]`
現在の空間オブジェクトの周囲にあるすべての空間オブジェクトを配列で返します。

#### `.parent(): LocalSpace`
現在の空間オブジェクトのズームレベルを一つ下げた親の空間オブジェクトを返します。

#### `.children(): LocalSpace[]`
現在の空間オブジェクトのズームレベルを一つ上げた子の空間オブジェクトをすべて取得します。

#### `.contains(point: { lat: number, lng: number }): boolean`
指定された緯度経度が、この空間オブジェクト内に含まれるかどうかを判定して `true` / `false` を返します。

#### `.vertices3d(): [ [x, y, z], [x, y, z], ... ]`
現在の空間オブジェクトの 3D バウンディングボックスを形成する 8 点の座標を配列で返します。

#### `.toContainingGlobalSpatialId(): LocalSpace`
現在の空間オブジェクトをすべて内包できるグローバル空間 ID を取得します。
- 基準点が未設定の場合、例外をスローします。

#### `.toGlobalSpatialIds(zoom: number): LocalSpace[]`
指定されたズームレベルで、現在の空間オブジェクトを内包できるグローバル空間 ID を取得します。
- 基準点が未設定の場合、例外をスローします。

#### `.toGeoJSON(): GeoJSON.Geometry`
現在の空間オブジェクトを `GeoJSON` 形式で取得します。

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
