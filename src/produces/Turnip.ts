import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "../GameObject";
import { TileMap } from "../TileMap";

export class Turnip extends GameObject {
  constructor(gridX: number, gridY: number, renderer: Renderer) {
    super(gridX, gridY, 1, 1);
    this.isSolid = false;
    this.isPickupable = true;

    // Visual: round white circle (like mature turnip)
    const turnipColor = 0xffffff;
    const radius = TileMap.TILE_SIZE / 3;
    const centerX = TileMap.TILE_SIZE / 2;
    const centerY = TileMap.TILE_SIZE / 2;

    const graphics = new Graphics();
    graphics.circle(centerX, centerY, radius).fill(turnipColor);

    const texture = renderer.generateTexture(graphics);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = TileMap.TILE_SIZE / 2;
    sprite.y = TileMap.TILE_SIZE / 2;

    this.addChild(sprite);
  }

  public onPlace(): boolean {
    // Destroy on place (like Weed)
    this.destroy();
    return false;
  }
}
