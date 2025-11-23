import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { Tool } from "./tools/Tool";
import { Hoe } from "./tools/Hoe";
import { WateringCan } from "./tools/WateringCan";
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

    this.sprite = new Sprite(this.createTexture(0xd2b48c)); // Light brown
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

  public onToolUse(tool: Tool): {
    destroyed: boolean;
    used: boolean;
    passThrough: boolean;
  } {
    if (tool instanceof Hoe) {
      if (!this.isTilled) {
        this.isTilled = true;
        this.sprite.texture = this.createTexture(0x8b4513); // Dark brown
        return { destroyed: false, used: true, passThrough: false };
      }
    } else if (tool instanceof WateringCan) {
      if (this.isTilled && !this.isWatered) {
        this.isWatered = true;
        this.sprite.texture = this.createTexture(0x5d2906); // Darker brown (Watered)
        return { destroyed: false, used: true, passThrough: false };
      }
    }
    return { destroyed: false, used: false, passThrough: false };
  }

  public canPlant(): boolean {
    return this.isTilled;
  }
}
