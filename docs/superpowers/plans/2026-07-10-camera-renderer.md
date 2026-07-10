# カメラ〜Renderer 接続 実装計画

> **エージェント作業者向け:** 必須サブスキル: このプランをタスクごとに実装するには superpowers:subagent-driven-development
> （推奨）または superpowers:executing-plans を使用すること。ステップはチェックボックス（`- [ ]`）構文で進捗を追跡する。

**目標:** `World` にカメラ（`CameraManager`）を設置し、`Renderer` を実装して接続し、`Bob` が `bob_idle.png` を
見た目として持つ状態にして、ブラウザで実際に描画結果を確認できるようにする。
[docs/superpowers/specs/2026-07-10-camera-renderer-design.md](../specs/2026-07-10-camera-renderer-design.md) に基づく。

**アーキテクチャ:** `Renderer` が `THREE.WebGLRenderer`/`Scene`/`OrthographicCamera` を実所有し、接続された
`CameraManager` の `camera.position`/`camera.viewSize` を毎回 `render()` 呼び出し時に反映する。`World` は
`cameraManager: CameraManager` を保持するだけで、レンダリングそのものには関与しない。`Bob` は自身の見た目
（`THREE.Sprite`）を `AssetLoader` 経由で非同期に読み込む。`core/` のゲームループはまだ存在しないため、
`main.tsx` から一度だけ（＋テクスチャ読み込み完了後にもう一度）`render()` を呼ぶ。

**技術スタック:** TypeScript, Three.js（本プランで `npm install three` する）。Rapier は未導入のまま。

## 全体の制約

- インデントはタブ、ブレーススタイルは Allman、すべての条件文に `{}` を必須とする（
  [src/CODING_STYLE.md](../../../src/CODING_STYLE.md) 参照）。ESLint が正 — `npm run lint` を実行すること。
- クラスは `PascalCase`、変数/関数は `camelCase`。
- vitest は未導入 — 検証は `npx tsc --noEmit`、`npm run lint`、可能な場合は `npx tsx` を使った使い捨てスクリプト、
  最終確認は `npm start` でのブラウザ目視確認で行う。
- 依存方向: `main.tsx` → `scenes`/`player` → `render`/`loaders`/`shared`。下位レイヤー（`render`/`loaders`）は
  上位レイヤー（`player`/`scenes`）を import してはならない。
- `assets/CLAUDE.md`（修正済み）により、PNG は2Dスプライトの標準テクスチャフォーマット。既存の実ファイル
  `assets/characters/bob/bob_idle.png`（アンダースコア区切り）はリネームしない。
- コミットは、このセッション内でユーザーから明示的に指示があった場合のみ実行する（各タスクのコミットステップは
  その前提で記載する）。

---

### タスク1: `three` のインストールと `Renderer` の実装

**ファイル:**
- 変更: `package.json`（`npm install three` により自動更新）
- 変更: `src/render/Renderer.ts`

**インターフェース:**
- 依存元: `src/render/CameraManager.ts` の `CameraManager`（`camera: Camera` を持つ、既存）。
- 提供するもの:
  ```ts
  class Renderer {
  	constructor(canvas: HTMLCanvasElement);
  	setCameraManager(cameraManager: CameraManager): void;
  	add(object: THREE.Object3D): void;
  	remove(object: THREE.Object3D): void;
  	resize(width: number, height: number): void;
  	render(): void;
  }
  ```
  以降のタスクはこのシグネチャに依存する。

- [ ] **ステップ1: `three` をインストール**

実行: `npm install three`
期待結果: `package.json` の `dependencies` に `"three"` が追加される。`three` パッケージは型定義を同梱しているため
`@types/three` は不要（もし後続の `tsc` で型エラーが出る場合のみ `npm install -D @types/three` を追加する）。

- [ ] **ステップ2: `src/render/Renderer.ts` を書く**

```ts
import * as THREE from "three";
import { CameraManager } from "./CameraManager";

export class Renderer
{
	private readonly webglRenderer: THREE.WebGLRenderer;
	private readonly scene: THREE.Scene;
	private readonly threeCamera: THREE.OrthographicCamera;
	private cameraManager: CameraManager | undefined;

	constructor(canvas: HTMLCanvasElement)
	{
		this.webglRenderer = new THREE.WebGLRenderer({ canvas, antialias: true });
		this.scene = new THREE.Scene();
		this.threeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
		this.threeCamera.position.z = 10;
	}

	setCameraManager(cameraManager: CameraManager): void
	{
		this.cameraManager = cameraManager;
	}

	add(object: THREE.Object3D): void
	{
		this.scene.add(object);
	}

	remove(object: THREE.Object3D): void
	{
		this.scene.remove(object);
	}

	resize(width: number, height: number): void
	{
		this.webglRenderer.setSize(width, height);
	}

	render(): void
	{
		if (this.cameraManager)
		{
			const logicalCamera = this.cameraManager.camera;
			const halfWidth = logicalCamera.viewSize.width / 2;
			const halfHeight = logicalCamera.viewSize.height / 2;

			this.threeCamera.left = -halfWidth;
			this.threeCamera.right = halfWidth;
			this.threeCamera.top = halfHeight;
			this.threeCamera.bottom = -halfHeight;
			this.threeCamera.position.x = logicalCamera.position.x;
			this.threeCamera.position.y = logicalCamera.position.y;
			this.threeCamera.updateProjectionMatrix();
		}

		this.webglRenderer.render(this.scene, this.threeCamera);
	}
}
```

- [ ] **ステップ3: 型チェック**

実行: `npx tsc --noEmit`
期待結果: エラーなし。

- [ ] **ステップ4: Lint**

実行: `npm run lint`
期待結果: エラーなし。

- [ ] **ステップ5: コミット（ユーザーの明示的指示がある場合のみ）**

```bash
git add package.json package-lock.json src/render/Renderer.ts
git commit -m "$(cat <<'EOF'
Implement Renderer with Three.js WebGL/Scene/OrthographicCamera

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### タスク2: `World` に `cameraManager` を追加

**ファイル:**
- 変更: `src/scenes/World.ts`

**インターフェース:**
- 依存元: `src/render/CameraManager.ts` の `CameraManager`（変更なし）。
- 提供するもの: `World` が `readonly cameraManager: CameraManager` を持つ。コンストラクタ引数
  `cameraManager?: CameraManager`（省略時 `new CameraManager()`）。既存の `addEntity`/`removeEntity`/
  `getEntity`/`getEntities` はシグネチャ変更なし。

- [ ] **ステップ1: `src/scenes/World.ts` を書き換える**

```ts
import { EntityBase } from "../entities/EntityBase";
import { CameraManager } from "../render/CameraManager";

// The world's ground is conceptually an infinite plane at y = 0; not modeled as
// data here yet — that lands with physics/render implementation.
export class World
{
	private readonly entities: Map<string, EntityBase>;
	readonly cameraManager: CameraManager;

	constructor(cameraManager: CameraManager = new CameraManager())
	{
		this.entities = new Map();
		this.cameraManager = cameraManager;
	}

	addEntity(entity: EntityBase): void
	{
		if (this.entities.has(entity.id))
		{
			throw new Error(`World already has an entity with id "${entity.id}"`);
		}

		this.entities.set(entity.id, entity);
	}

	removeEntity(id: string): void
	{
		this.entities.delete(id);
	}

	getEntity(id: string): EntityBase | undefined
	{
		return this.entities.get(id);
	}

	getEntities(): EntityBase[]
	{
		return Array.from(this.entities.values());
	}
}
```

- [ ] **ステップ2: 型チェック**

実行: `npx tsc --noEmit`
期待結果: エラーなし。

- [ ] **ステップ3: Lint**

実行: `npm run lint`
期待結果: エラーなし。

- [ ] **ステップ4: 手動スモークチェック**

`World`/`CameraManager`/`Camera` はいずれも Three.js に依存しない純粋な TypeScript のため、Node 上で確認できる。

```bash
npx tsx -e "
import { World } from './src/scenes/World';

const world = new World();
console.log(world.cameraManager.camera.position); // expect { x: 0, y: 0 }
console.log(world.cameraManager.camera.viewSize); // expect { width: 16, height: 9 }
"
```

期待される出力:
```
{ x: 0, y: 0 }
{ width: 16, height: 9 }
```

- [ ] **ステップ5: コミット（ユーザーの明示的指示がある場合のみ）**

```bash
git add src/scenes/World.ts
git commit -m "$(cat <<'EOF'
Add cameraManager to World

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### タスク3: `AssetLoader` の実装（テクスチャ読み込み）

**ファイル:**
- 変更: `src/loaders/AssetLoader.ts`

**インターフェース:**
- 依存元: `three`（タスク1でインストール済み）。
- 提供するもの: `class AssetLoader { loadTexture(url: string): Promise<THREE.Texture>; }`
  以降のタスク（`Bob`）はこのメソッドに依存する。

- [ ] **ステップ1: `src/loaders/AssetLoader.ts` を書く**

```ts
import * as THREE from "three";

export class AssetLoader
{
	private readonly textureLoader: THREE.TextureLoader;

	constructor()
	{
		this.textureLoader = new THREE.TextureLoader();
	}

	loadTexture(url: string): Promise<THREE.Texture>
	{
		return this.textureLoader.loadAsync(url);
	}
}
```

- [ ] **ステップ2: 型チェック**

実行: `npx tsc --noEmit`
期待結果: エラーなし。

- [ ] **ステップ3: Lint**

実行: `npm run lint`
期待結果: エラーなし。

`THREE.TextureLoader` はブラウザの `Image` 読み込みに依存するため Node/tsx では動作確認できない。実際の
読み込み確認はタスク5のブラウザ目視確認で行う。

- [ ] **ステップ4: コミット（ユーザーの明示的指示がある場合のみ）**

```bash
git add src/loaders/AssetLoader.ts
git commit -m "$(cat <<'EOF'
Implement AssetLoader texture loading

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### タスク4: `Bob` にスプライトを追加

**ファイル:**
- 変更: `src/player/Bob.ts`

**インターフェース:**
- 依存元: `src/loaders/AssetLoader.ts` の `AssetLoader`（タスク3）、`three`。
- 提供するもの: `Bob` が `readonly sprite: THREE.Sprite` と `readonly spriteReady: Promise<void>` を持つ。
  `spriteReady` はテクスチャ読み込みが完了（またはエラー時は reject）した時点で解決する ── 呼び出し側
  （タスク5の `main.tsx`）がこれを見て再描画のタイミングとエラーハンドリングを行う。

- [ ] **ステップ1: `src/player/Bob.ts` を書き換える**

```ts
import * as THREE from "three";
import { Vector2Like } from "../shared/math";
import { PlayerEntityBase } from "./PlayerEntityBase";
import { AssetLoader } from "../loaders/AssetLoader";
import bobIdleUrl from "../../assets/characters/bob/bob_idle.png";

export class Bob extends PlayerEntityBase
{
	readonly sprite: THREE.Sprite;
	readonly spriteReady: Promise<void>;

	constructor(id: string = "bob", position?: Vector2Like)
	{
		super(id, "Bob", { position, moveSpeed: 5, maxHealth: 100 });

		this.sprite = new THREE.Sprite(new THREE.SpriteMaterial());
		this.sprite.position.set(this.position.x, this.position.y, 0);

		this.spriteReady = new AssetLoader().loadTexture(bobIdleUrl).then((texture) =>
		{
			this.sprite.material.map = texture;
			this.sprite.material.needsUpdate = true;
		});
	}
}
```

`bob_idle.png` の import は Vite の資産インポート（`vite/client` 型定義、`src/vite-env.d.ts` で既に参照済み）に
より文字列URLとして解決される。ファイル名はリネームせず既存の `bob_idle.png`（アンダースコア区切り）をそのまま使う
（[design doc](../specs/2026-07-10-camera-renderer-design.md) の既知の命名規則不一致の節を参照）。

- [ ] **ステップ2: 型チェック**

実行: `npx tsc --noEmit`
期待結果: エラーなし。

- [ ] **ステップ3: Lint**

実行: `npm run lint`
期待結果: エラーなし。

テクスチャ読み込みはブラウザ依存のため Node/tsx では動作確認できない。実際の読み込み確認はタスク5で行う。

- [ ] **ステップ4: コミット（ユーザーの明示的指示がある場合のみ）**

```bash
git add src/player/Bob.ts
git commit -m "$(cat <<'EOF'
Give Bob a sprite loaded from bob_idle.png

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### タスク5: `main.tsx` の配線とブラウザ目視確認

**ファイル:**
- 変更: `src/main.tsx`

**インターフェース:**
- 依存元: `World`（タスク2）、`Renderer`（タスク1）、`Bob`（タスク4）。
- 提供するもの: なし（アプリケーションのエントリーポイント、これ以降のタスクはない）。

- [ ] **ステップ1: `src/main.tsx` を書き換える**

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { World } from "./scenes/World";
import { Renderer } from "./render/Renderer";
import { Bob } from "./player/Bob";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

const CANVAS_WIDTH = 960;
const CANVAS_HEIGHT = 540;

const canvas = document.createElement("canvas");
document.getElementById("app")!.appendChild(canvas);

const world = new World();
const renderer = new Renderer(canvas);
renderer.setCameraManager(world.cameraManager);

const bob = new Bob();
world.addEntity(bob);
renderer.add(bob.sprite);

renderer.resize(CANVAS_WIDTH, CANVAS_HEIGHT);
renderer.render();

bob.spriteReady
	.then(() => renderer.render())
	.catch(console.error);
```

`createRoot(...).render(...)` はこのリポジトリで使っている React 19 の新規ルートに対する初回レンダーであり
同期的にコミットされるため、直後に `document.getElementById("app")` を呼んでも `<div id="app" />` は
既にDOMに存在する。React はこの canvas を自分が管理する子要素として認識しないため、`App` が再レンダーされない
限り（今回は state を持たないため再レンダーされない）React によって消されることはない。

- [ ] **ステップ2: 型チェック**

実行: `npx tsc --noEmit`
期待結果: エラーなし。

- [ ] **ステップ3: Lint**

実行: `npm run lint`
期待結果: エラーなし。

- [ ] **ステップ4: ブラウザ目視確認**

実行: `npm start`
ブラウザで表示されたURLを開き、以下を確認する:
- 画面上に `960x540` の canvas が表示される。
- 読み込み完了後、canvas の中央付近に `bob_idle.png` の絵（Bobのアイドル絵）が表示される
  （読み込み前は白い正方形が一瞬見える場合がある）。
- ブラウザの開発者コンソールにエラーが出ていない。

- [ ] **ステップ5: コミット（ユーザーの明示的指示がある場合のみ）**

```bash
git add src/main.tsx
git commit -m "$(cat <<'EOF'
Wire World/Renderer/Bob together and render Bob's sprite

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
