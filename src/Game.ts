import { Application, Graphics } from "pixi.js";
import { TileMap } from "./TileMap";
import { Player } from "./Player";
import { InputManager } from "./InputManager";

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
        await this.app.init({ background: "#1099bb", resizeTo: window });
        document.getElementById("pixi-container")!.appendChild(this.app.canvas);

        this.createScene();
    }

    private createScene(): void {
        const grassGraphics = new Graphics().rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE).fill(0x00FF00);
        const grassTexture = this.app.renderer.generateTexture(grassGraphics);

        const rockGraphics = new Graphics().rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE).fill(0x808080);
        const rockTexture = this.app.renderer.generateTexture(rockGraphics);

        const playerGraphics = new Graphics().rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE).fill(0xFF0000);
        const playerTexture = this.app.renderer.generateTexture(playerGraphics);

        this.tileMap = new TileMap(grassTexture, rockTexture);
        this.app.stage.addChild(this.tileMap);

        this.player = new Player(playerTexture, this.inputManager, this.tileMap);
        this.player.x = 10 * TileMap.TILE_SIZE + TileMap.TILE_SIZE / 2;
        this.player.y = 10 * TileMap.TILE_SIZE + TileMap.TILE_SIZE / 2;
        this.app.stage.addChild(this.player);

        this.app.ticker.add((ticker) => {
            if (this.player) {
                this.player.update(ticker);
            }
        });
    }
}
