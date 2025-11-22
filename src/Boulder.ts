import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";

export class Boulder extends GameObject {
    private health = 6;

    constructor(gridX: number, gridY: number, renderer: Renderer) {
        super(gridX, gridY, 1, 1);

        const graphics = new Graphics()
            .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
            .fill(0x555555); // Dark grey for boulder

        const texture = renderer.generateTexture(graphics);
        const sprite = new Sprite(texture);

        this.addChild(sprite);
    }

    public interact(): boolean {
        this.health--;
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }
}
