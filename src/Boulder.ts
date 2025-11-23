import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";

export class Boulder extends GameObject {
    private health = 6;

    constructor(gridX: number, gridY: number, renderer: Renderer) {
        super(gridX, gridY, 1, 1);

        const graphics = new Graphics()
            .rect(0, 0, TileMap.TILE_SIZE - 5, TileMap.TILE_SIZE - 5)
            .fill(0x555555); // Dark grey for boulder

        const texture = renderer.generateTexture(graphics);
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.x = TileMap.TILE_SIZE / 2;
        sprite.y = TileMap.TILE_SIZE / 4;

        this.addChild(sprite);
    }

    public interact(): boolean {
        // Interaction does nothing now
        return false;
    }

    public onToolUse(toolType: string): { destroyed: boolean, used: boolean } {
        if (toolType === "Hammer") {
            this.health--;
            if (this.health <= 0) {
                return { destroyed: true, used: true }; // Destroyed
            }

            // Visual feedback (flash red)
            this.children[0].tint = 0xFF0000;
            setTimeout(() => {
                if (this.children.length > 0) {
                    this.children[0].tint = 0xFFFFFF;
                }
            }, 100);
            return { destroyed: false, used: true };
        }
        return { destroyed: false, used: false };
    }
}
