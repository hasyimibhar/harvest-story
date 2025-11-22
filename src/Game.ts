import { Application, Graphics, Container } from "pixi.js";
import { TileMap } from "./TileMap";
import { Player } from "./Player";
import { InputManager } from "./InputManager";
import { GameObject } from "./GameObject";
import { Boulder } from "./Boulder";
import { Soil } from "./Soil";

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

        // Add a boulder
        const boulder = new Boulder(5, 5, this.app.renderer);
        objects.push(boulder);
        objectLayer.addChild(boulder);

        // Add a patch of soil
        for (let x = 7; x < 10; x++) {
            for (let y = 5; y < 8; y++) {
                const soil = new Soil(x, y, this.app.renderer);
                objects.push(soil);
                objectLayer.addChild(soil);
            }
        }

        this.player = new Player(playerTexture, this.inputManager, this.tileMap, objects);
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
