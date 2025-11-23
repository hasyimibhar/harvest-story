import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";

export class Weed extends GameObject {
  constructor(gridX: number, gridY: number, renderer: Renderer) {
    super(gridX, gridY, 1, 1);
    this.isSolid = false;
    this.isPickupable = true;

    const graphics = new Graphics()
      .circle(
        TileMap.TILE_SIZE / 2,
        TileMap.TILE_SIZE / 2,
        TileMap.TILE_SIZE / 4,
      )
      .fill(0x006400); // Dark Green circle

    const texture = renderer.generateTexture(graphics);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = TileMap.TILE_SIZE / 2;
    sprite.y = TileMap.TILE_SIZE / 2;

    this.addChild(sprite);
  }

  public onPlace(): boolean {
    // Destroy on place
    this.destroy();
    return false;
  }
}
