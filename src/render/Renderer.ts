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
