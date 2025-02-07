# fxyz DOM ライク API ドキュメント (拡張版)

このドキュメントは、3D 空間を DOM（Document Object Model）ライクに扱うための fxyz ライブラリの仕様書です。  
従来の DOM 操作に慣れた開発者が直感的に 3D 空間を扱えるよう、空間そのものを「ドキュメント」として、各空間単位を「エレメント」として操作できるインターフェースを目指しています。  
なお、仕様はまだ設計段階にあり、クラス名やメソッド名は今後変更される可能性があります。

---

## 1. 空間ドキュメント: `LocalSpace`

`LocalSpace` は、3D 空間全体を表す「ドキュメント」として機能します。  
HTML の `document` オブジェクトのように、`LocalSpace` インスタンスを起点として、その内部に配置される空間エレメント（`LocalSpatialId`）を生成・操作します。

### 1.1 コンストラクタ

```js
new LocalSpace(options: LocalSpaceOptions)
説明:
新たな空間ドキュメントを生成します。
このオブジェクトを通じて、新規空間エレメントの作成や既存エレメントへの操作を行います。

座標系について:
この空間ドキュメントでは、以下の XYZ 座標系を採用しています:

x 軸: 右 ↔ 左
y 軸: 前 ↔ 奥
z 軸: 上 ↔ 下
1.1.1 LocalSpaceOptions インターフェース
ts
コピーする
interface LocalSpaceOptions {
  /**  
   * 任意の一意な文字列。  
   * ドキュメント全体の識別子として機能します。  
   */
  id?: string;

  /**  
   * 空間ドキュメント全体の 1 軸あたりの最大長（単位: メートル）。  
   * 例: 1 と指定すると、最大 1m × 1m × 1m の領域を表現します。  
   */
  scale: number;

  /**  
   * 空間ドキュメント全体の高さ（単位: メートル）。  
   * 指定がない場合は `scale` の値が使われます。  
   */
  scale_height?: number;

  name?: string;
  description?: string;

  /**  
   * グローバル空間とのマッピングを行う場合の基準点設定。  
   * `origin_latitude`、`origin_longitude`、`origin_altitude`、および `origin_angle` は、  
   * 指定がない場合、`0` がデフォルト値となります。  
   */
  origin_latitude?: number;
  origin_longitude?: number;
  origin_altitude?: number;
  origin_angle?: number;
}
1.2 空間エレメントの生成・取得
DOM の createElement や querySelector に類似して、LocalSpace では空間内の各エレメント（局所空間 ID）を操作するためのメソッドを提供しています。

1.2.1 space(input) → LocalSpatialId
機能:
指定した座標または空間 ID をもとに、空間エレメント（LocalSpatialId）を生成または取得します。

入力フォーマット:

XYZObject: 3 次元座標オブジェクト（例: { x: number, y: number, z: number }、単位はメートル）
ZFXYTile: ZFXY（3 次元タイル番号）を表す文字列（例: "/15/6/2844/17952"）
TileHash: ZFXY をハッシュ化した値（例: "100213200122640"）
注意:
XYZObject で指定された座標が空間ドキュメントの範囲外の場合、例外が発生します。

1.2.2 spacesFromGeoJSON(zoom: number, input: GeoJSON.Geometry) → LocalSpatialId[]
機能:
指定した GeoJSON ジオメトリを元に、該当するズームレベルで内包される空間エレメントの配列を取得します。

注意:
基準点（origin）の設定が行われていない場合、例外が発生します。

1.2.3 boundingSpaceFromGeoJSON(input: GeoJSON.Geometry) → LocalSpatialId
機能:
指定した GeoJSON ジオメトリ全体を内包する最小の空間エレメントを算出し、返します。

注意:
基準点の設定が未設定の場合、例外が発生します。

1.3 DOM ライクな拡張メソッド
従来の空間操作 API に加え、DOM の getElementById および querySelectorAll と同様の感覚で利用できるメソッドを実装します。
これにより、既存の DOM 操作の知識を活かして空間内のエレメント検索が可能になります。

1.3.1 getElementById(id: string): LocalSpatialId | null
説明:
空間ドキュメント内で、指定した一意の ID（通常は ZFXY のハッシュ値などを想定）を持つ空間エレメントを返します。
DOM の document.getElementById に相当します。

使用例:

js
コピーする
const element = localSpace.getElementById("100213200122640");
if (element) {
  // element に対して操作を行う
} else {
  // 該当するエレメントが見つからなかった場合
}
実装例（疑似コード）:

js
コピーする
class LocalSpace {
  constructor(options) {
    // ... 初期化処理
    this._elements = new Map(); // 空間エレメントを内部的に管理する
  }

  // 既存の space() メソッド内でエレメント生成時に登録することを想定
  _registerElement(element) {
    this._elements.set(element.id(), element);
  }

  getElementById(id) {
    return this._elements.get(id) || null;
  }
}
1.3.2 querySelectorAll(selector: string): LocalSpatialId[]
説明:
空間ドキュメント内で、指定されたセレクタに一致する全ての空間エレメントを配列で返します。
DOM の document.querySelectorAll に相当します。
初期実装では、CSS ライクなセレクタとして以下の仕様をサポートします:

ID セレクタ: セレクタ文字列が #<id> の形式の場合、
該当するエレメントがあれば配列として返します（存在しなければ空配列）。
※ 将来的には、クラス名や属性、階層構造などに基づくセレクタも拡張可能です。

使用例:

js
コピーする
// ID セレクタの場合
const elements = localSpace.querySelectorAll("#100213200122640");
elements.forEach(element => {
  // element に対して処理を行う
});
実装例（疑似コード）:

js
コピーする
class LocalSpace {
  // ... 既存の実装

  querySelectorAll(selector) {
    const results = [];
    // ID セレクタの例: "#someId"
    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      const element = this.getElementById(id);
      if (element) {
        results.push(element);
      }
    }
    // TODO: 将来的にクラスセレクタや属性セレクタの実装を追加
    return results;
  }
}
2. 空間エレメント: LocalSpatialId
LocalSpatialId は、空間ドキュメント内の個々のエレメントを表し、HTML の DOM エレメントのように扱えます。
通常、LocalSpace#space メソッドや内部のエレメント登録処理を通じて生成されます。

2.1 エレメントのジオメトリ取得
.center → { x: number, y: number, z: number }
空間エレメントの中心座標を返します。

.vertices → [[x, y, z], ...]（全 8 頂点の配列）
エレメントを構成する 3D ボックスの各頂点の座標を返します。

.alt → number
空間エレメントの最低高度（床面）を返します。

.zoom → number
エレメントの分解能（ズームレベル）を示します。

.zfxy → { z: number, f: number, x: number, y: number }
ZFXY 表現をオブジェクト形式で返します。

.id および .tilehash → string
エレメントの ZFXY をハッシュ化した文字列を返します。

.zfxyStr → string
URL パス形式（例: /15/6/2844/17952）でエレメントの ZFXY を表現します。

2.2 空間内のナビゲーション
（DOM の parentElement や children、隣接要素取得に相当）

.up(by?: number)
.down(by?: number)
.north(by?: number), .east(by?: number), .south(by?: number), .west(by?: number)
.move(by: Partial<Omit<ZFXYTile, 'z'>>)
.surroundings()
各メソッドは、現在のエレメントを基点として、空間内での相対位置にあるエレメントを取得します。

2.3 エレメント階層の操作
.parent(atZoom?: number)
.children()
.contains(input: LocalSpatialId | GeoJSON.Geometry)
エレメント間の階層関係や包含関係を操作できます。

2.4 グローバル空間との変換
.toContainingGlobalSpatialId()
.toGlobalSpatialIds(zoom: number)
.toGeoJSON()
ローカル空間エレメントとグローバル空間エレメントとの相互変換を行います。

3. まとめ
この fxyz ライブラリでは、

LocalSpace を「空間ドキュメント」として、全体の 3D 空間を管理し、
LocalSpatialId を DOM エレメントのように扱い、個々の空間ユニットの生成・取得、幾何学的な情報取得、階層・隣接関係の操作を行います。
さらに、DOM の getElementById および querySelectorAll に類似するメソッドを実装することで、既存の DOM 操作の知識を活かした直感的な空間操作を可能にしています。
（なお、内部仕様や名称は今後変更される可能性がありますので、ご留意ください。）



