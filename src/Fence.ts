import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";

export class Fence extends GameObject {
  constructor(gridX: number, gridY: number, renderer: Renderer) {
    super(gridX, gridY, 1, 1);
    this.isSolid = true;
    this.isPickupable = true;

    const graphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE / 2, TileMap.TILE_SIZE)
      .fill(0x8b4513); // Brown filled rectangle

    const texture = renderer.generateTexture(graphics);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = TileMap.TILE_SIZE / 2;
    sprite.y = 0;

    this.addChild(sprite);
  }
}
