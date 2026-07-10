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
