import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";

export class Soil extends GameObject {
    private isTilled: boolean = false;
    private isWatered: boolean = false;
    private sprite: Sprite;
    private renderer: Renderer;

    constructor(gridX: number, gridY: number, renderer: Renderer) {
        super(gridX, gridY, 1, 1);
        this.renderer = renderer;
        this.isSolid = false; // Soil is walkable

        this.sprite = new Sprite(this.createTexture(0xD2B48C)); // Light brown
        this.addChild(this.sprite);
    }

    private createTexture(color: number) {
        const graphics = new Graphics()
            .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
            .fill(color);
        return this.renderer.generateTexture(graphics);
    }

    public interact(): boolean {
        // Interaction does nothing now
        return false;
    }

    public onToolUse(toolType: string): boolean {
        if (toolType === "Hoe") {
            if (!this.isTilled) {
                this.isTilled = true;
                this.sprite.texture = this.createTexture(0x8B4513); // Dark brown
                return false; // Don't destroy
            }
        } else if (toolType === "Watering Can") {
            if (this.isTilled && !this.isWatered) {
                this.isWatered = true;
                this.sprite.texture = this.createTexture(0x5D2906); // Darker brown (Watered)
                return false;
            }
        }
        return false;
    }
}
