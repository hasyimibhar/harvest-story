import { Application, Graphics, Container } from "pixi.js";
import { TileMap } from "./TileMap";
import { Player } from "./Player";
import { InputManager } from "./InputManager";
import { GameObject } from "./GameObject";
import { Boulder } from "./Boulder";
import { Soil } from "./Soil";
import { Fence } from "./Fence";
import { Weed } from "./Weed";

export class Game {
    private app: Application;
    private inputManager: InputManager;
    private tileMap: TileMap | undefined;
    private player: Player | undefined;

    constructor() {
        this.app = new Application();
        this.inputManager = new InputManager();
    }

    public async init(): Promise<void> {
        console.log("Initializing PixiJS app...");
        await this.app.init({ background: "#000000", resizeTo: window });
        document.getElementById("pixi-container")!.appendChild(this.app.canvas);
        console.log("PixiJS app initialized");
        this.createScene();
    }

    private createScene(): void {
        console.log("Creating scene...");

        // Create a world container to center everything
        const world = new Container();
        this.app.stage.addChild(world);

        // Center the world container
        world.x = (this.app.screen.width - TileMap.MAP_WIDTH * TileMap.TILE_SIZE) / 2;
        world.y = (this.app.screen.height - TileMap.MAP_HEIGHT * TileMap.TILE_SIZE) / 2;

        const grassGraphics = new Graphics().rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE).fill(0x00FF00);
        const grassTexture = this.app.renderer.generateTexture(grassGraphics);

        const rockGraphics = new Graphics().rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE).fill(0x808080);
        const rockTexture = this.app.renderer.generateTexture(rockGraphics);

        const playerGraphics = new Graphics().rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE).fill(0xFF0000);
        const playerTexture = this.app.renderer.generateTexture(playerGraphics);

        this.tileMap = new TileMap(grassTexture, rockTexture);
        world.addChild(this.tileMap);

        // Object Layer
        const objectLayer = new Container();
        world.addChild(objectLayer);

        const objects: GameObject[] = [];

        // Randomly place a 10x10 patch of soil
        // Ensure it doesn't overlap with border rocks (x/y range: 1 to MAP_WIDTH - 1)
        // Patch size is 10, so max start index is MAP_WIDTH - 1 - 10 = MAP_WIDTH - 11
        // Range: 1 to MAP_WIDTH - 11

        const maxStart = TileMap.MAP_WIDTH - 11;
        const startX = Math.floor(Math.random() * (maxStart - 1 + 1)) + 1;
        const startY = Math.floor(Math.random() * (maxStart - 1 + 1)) + 1;

        for (let x = startX; x < startX + 10; x++) {
            for (let y = startY; y < startY + 10; y++) {
                const soil = new Soil(x, y, this.app.renderer);
                objects.push(soil);
                objectLayer.addChild(soil);
            }
        }

        // Add some boulders, some might be on top of soil
        for (let i = 0; i < 5; i++) {
            // Random position within the map (excluding borders)
            const x = Math.floor(Math.random() * (TileMap.MAP_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (TileMap.MAP_HEIGHT - 2)) + 1;

            const boulder = new Boulder(x, y, this.app.renderer);
            objects.push(boulder);
            objectLayer.addChild(boulder);
        }

        // Explicitly place a boulder on the soil patch for testing
        const testBoulder = new Boulder(startX + 5, startY + 5, this.app.renderer);
        objects.push(testBoulder);
        objectLayer.addChild(testBoulder);

        // Add some fences
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * (TileMap.MAP_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (TileMap.MAP_HEIGHT - 2)) + 1;
            const fence = new Fence(x, y, this.app.renderer);
            objects.push(fence);
            objectLayer.addChild(fence);
        }

        // Add some weeds
        for (let i = 0; i < 5; i++) {
            const x = Math.floor(Math.random() * (TileMap.MAP_WIDTH - 2)) + 1;
            const y = Math.floor(Math.random() * (TileMap.MAP_HEIGHT - 2)) + 1;
            const weed = new Weed(x, y, this.app.renderer);
            objects.push(weed);
            objectLayer.addChild(weed);
        }

        this.player = new Player(
            playerTexture,
            this.inputManager,
            this.tileMap,
            objects,
            (obj: GameObject) => {
                objects.push(obj);
                objectLayer.addChild(obj);
            },
            (obj: GameObject) => {
                const index = objects.indexOf(obj);
                if (index !== -1) {
                    objects.splice(index, 1);
                }
                objectLayer.removeChild(obj);
            }
        );
        this.player.x = 10 * TileMap.TILE_SIZE + TileMap.TILE_SIZE / 2;
        this.player.y = 10 * TileMap.TILE_SIZE + TileMap.TILE_SIZE / 2;

        // Highlight Graphics (above objects, below player)
        const highlightGraphics = new Graphics();
        world.addChild(highlightGraphics);
        this.player.setHighlightGraphics(highlightGraphics);

        world.addChild(this.player);

        this.app.ticker.add((ticker) => {
            if (this.player) {
                this.player.update(ticker);
            }
            this.inputManager.update();
        });
    }
}
