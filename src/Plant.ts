import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { Tool } from "./tools/Tool";
import { WateringCan } from "./tools/WateringCan";
import { TileMap } from "./TileMap";
import { Soil } from "./Soil";

export class Plant extends GameObject {
  private sprite: Sprite;

  constructor(_soil: Soil, renderer: Renderer) {
    super(_soil.gridX, _soil.gridY, 1, 1);
    this.isSolid = false;
    this.isPickupable = false; // Plants can't be picked up (yet)

    // Visuals: 4 small circles
    const seedColor = 0xf5deb3; // Wheat color
    const r = TileMap.TILE_SIZE / 8;
    const offset = TileMap.TILE_SIZE / 4;

    const g = new Graphics();
    g.circle(offset, offset, r).fill(seedColor);
    g.circle(TileMap.TILE_SIZE - offset, offset, r).fill(seedColor);
    g.circle(offset, TileMap.TILE_SIZE - offset, r).fill(seedColor);
    g.circle(TileMap.TILE_SIZE - offset, TileMap.TILE_SIZE - offset, r).fill(
      seedColor,
    );

    const texture = renderer.generateTexture(g);
    this.sprite = new Sprite(texture);
    this.addChild(this.sprite);
  }

  public onToolUse(tool: Tool): {
    destroyed: boolean;
    used: boolean;
    passThrough: boolean;
  } {
    if (tool instanceof WateringCan) {
      // Pass through watering can to soil below
      return { destroyed: false, used: false, passThrough: true };
    }
    return { destroyed: false, used: false, passThrough: false };
  }
}
