import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import { App } from "./app/App";
import { World } from "./scenes/World";
import { Renderer } from "./render/Renderer";
import { Bob } from "./player/Bob";

flushSync(() =>
{
	createRoot(document.getElementById("root")!).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
});

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
