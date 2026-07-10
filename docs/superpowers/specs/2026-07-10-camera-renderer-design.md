# カメラ〜Renderer 接続設計

日付: 2026-07-10

## 目的

`World` にカメラ（`CameraManager`）を設置し、そのカメラ情報を実際に画面へ描画する `Renderer` へ接続する。
あわせて `Renderer`/`AssetLoader` の空スタブを実装し、`player/Bob` が `bob_idle.png` を見た目として持つことで、
配線全体が実際にブラウザで確認できる状態にする。

`three` はこのタスクで新規に `npm install` する（ルート CLAUDE.md の「残りのセットアップ」の一部を前倒しで実施）。
`@dimforge/rapier2d-compat`（物理）は本タスクのスコープ外のため、引き続き未インストールのままとする。

## スコープ

- `render/Renderer.ts`: 空スタブ → `THREE.WebGLRenderer` / `THREE.Scene` / `THREE.OrthographicCamera` を実所有する実装。
- `scenes/World.ts`: `cameraManager: CameraManager` フィールドを追加。
- `loaders/AssetLoader.ts`: 空スタブ → `THREE.TextureLoader` をラップしたテクスチャ読み込みを実装。
- `player/Bob.ts`: `bob_idle.png` を読み込んだ `THREE.Sprite` を自身の見た目として保持する。
- `main.tsx`: canvas を生成し、`World` / `Renderer` / `Bob` を配線して一度描画する（継続ループなし）。
- `assets/CLAUDE.md` の資産規約修正（3Dモデル前提 → 2Dスプライト前提）— **実施済み・別コミット**。本タスクの
  実装はこの修正後の規約（PNG がスプライトの標準フォーマット）に従う。

### スコープ外（意図的に先送り）

- `core/` のゲームループ（`requestAnimationFrame` による継続描画）。本タスクは一度きりの `render()` 呼び出しに留める。
- `EntityBase`/`PlayerEntityBase` レベルでの汎用エンティティ→ビジュアル同期の仕組み（今回は `Bob` 固有の実装として
  スプライトを持たせるのみで、他エンティティへの一般化は行わない）。
- 物理ワールド (`PhysicsWorld`) との連携、Rapier の導入。
- `Camera`/`CameraManager` 自体のAPI変更（複数カメラの切り替えなど）— 既存の `camera: Camera` 直接保持のままで足りる。
- ウィンドウリサイズへの追従、入力によるカメラ操作。
- 自動テスト（vitest 未導入のため、`World` タスクと同様に手動検証で代替）。

## アーキテクチャ / 依存関係

```
main.tsx（合成ルート、canvas生成 + 配線。Reactツリー外）
  └─ scenes/World          … cameraManager: CameraManager を保持
  └─ render/Renderer        … THREE.WebGLRenderer / Scene / OrthographicCamera を実所有
  └─ player/Bob             … 自身の見た目 (THREE.Sprite) を bob_idle.png から構築
  └─ loaders/AssetLoader    … THREE.TextureLoader のラッパー
```

依存方向は既存ルール（`app`/`main` → `scenes`/`player` → `render`/`loaders`）を満たす。`render/Camera.ts` は
エンジン非依存のデータクラスのまま変更しない。`render/CameraManager.ts` も `camera: Camera` 保持のみで変更しない。

**React はレンダーループに触れない**というルートCLAUDE.mdのルールを守るため、canvas の生成・`Renderer`/`World`/`Bob`
の配線・`render()` 呼び出しは `main.tsx` 内で React コンポーネントのライフサイクル外（マウント前の素の関数呼び出し）
として行う。`App` コンポーネントは canvas を差し込むための空コンテナ（`<div id="app" />`）のままでよい。

## コンポーネント設計

### `render/Renderer.ts`

```ts
class Renderer {
	constructor(canvas: HTMLCanvasElement);      // WebGLRenderer/Scene/OrthographicCamera を生成
	setCameraManager(manager: CameraManager): void;
	add(object: THREE.Object3D): void;             // scene.add のファサード
	remove(object: THREE.Object3D): void;           // scene.remove のファサード
	resize(width: number, height: number): void;
	render(): void;
}
```

- `add`/`remove` で `THREE.Scene` を外部に露出させず、Three.js 依存を `render/` 内部に閉じ込める。
- `render()` は接続済みの `CameraManager`（`setCameraManager` 未呼び出しの場合は何もしない＝カメラ未接続でも
  例外にはしない）から `camera.position` / `camera.viewSize` を読み、内部の `THREE.OrthographicCamera` の
  `left/right/top/bottom` と `position.x/y` を更新して `updateProjectionMatrix()` → `webglRenderer.render(scene, camera)`。
- `OrthographicCamera` の `near`/`far`/`position.z` は固定値（例: `position.z = 10`, `near = 0.1`, `far = 100`）とし、
  2Dスプライトが `z = 0` 付近に配置される前提でカメラだけが `z` を持つ。

### `scenes/World.ts`

`cameraManager: CameraManager` フィールドを追加する。コンストラクタでデフォルト `new CameraManager()` を生成する
（外部から差し込む必要が生じた場合に備え、オプション引数での注入も可とする）。既存の `addEntity`/`removeEntity`/
`getEntity`/`getEntities` API はそのまま変更しない。

### `loaders/AssetLoader.ts`

```ts
class AssetLoader {
	loadTexture(url: string): Promise<THREE.Texture>;   // THREE.TextureLoader.loadAsync のラッパー
}
```

### `player/Bob.ts`

`readonly sprite: THREE.Sprite` を追加する。コンストラクタは同期のままにするため、`THREE.SpriteMaterial` を
即座に生成して `sprite` を作り、`AssetLoader.loadTexture` の完了後に `material.map` を差し替える
（`material.needsUpdate = true`）。テクスチャのURLは既存の実ファイル `assets/characters/bob/bob_idle.png`
（アンダースコア区切り）を指すモジュール定数として `Bob.ts` 内に定義する。

**命名規則との不一致（既知）**: 修正後の `assets/CLAUDE.md` はハイフン区切り（例: `bob-idle.png`）を規約とするが、
既存の実ファイルはアンダースコア区切り（`bob_idle.png`）である。本タスクでは実ファイルを尊重してそのまま参照し、
ファイル名のリネームは行わない（無断リネームはアセットを提供したユーザーの意図を壊すおそれがあるため）。
規約統一が必要な場合は別タスクとする。

## データフロー

1. `main.tsx`: `<canvas>` を生成し `#app` 配下（Reactツリー外）にマウント。
2. `World` を生成（内部で `CameraManager` が生成される）。
3. `Renderer` を `canvas` で生成し、`renderer.setCameraManager(world.cameraManager)` で接続。
4. `Bob` を生成（コンストラクタ内でテクスチャ読み込みが非同期に開始される）。
5. `world.addEntity(bob)` でエンティティ登録、`renderer.add(bob.sprite)` で描画対象に登録。
6. `renderer.resize(canvas.width, canvas.height)` を呼び、`renderer.render()` で最初のフレームを描画
   （この時点ではまだ白テクスチャの可能性がある）。
7. `Bob` 内のテクスチャ読み込み `Promise` が解決した後、`renderer.render()` を再度呼び、`bob_idle.png` が
   反映された状態を描画する。

## エラーハンドリング

- テクスチャ読み込み失敗時は `Promise` が reject される。`Bob` 側では握りつぶさず、`main.tsx` 配線コードで
  `.catch(console.error)` して開発中に気づけるようにする（本番挙動の作り込みはスコープ外 — 白いスプライトの
  ままフォールバックする）。
- `Renderer.render()` は `CameraManager` 未接続でも例外を投げない（前述）。これはテスト/単体利用時に
  カメラ接続を必須にしないための意図的な緩さ。

## テスト/検証方法

vitest 未導入のため、`World` タスクと同様に以下で検証する:

- `npx tsc --noEmit` — 型エラーなし。
- `npm run lint` — タブ/Allman/`{}` 必須のフォーマット規約に準拠。
- `npm start` してブラウザで目視確認 — canvas 上に Bob のスプライト（`bob_idle.png`）が表示されること。
