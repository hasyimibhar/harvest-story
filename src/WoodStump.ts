import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";
import { Fence } from "./Fence";
import { World } from "./World";

export class WoodStump extends GameObject {
  private health = 6;
  private renderer: Renderer;

  constructor(gridX: number, gridY: number, renderer: Renderer) {
    super(gridX, gridY, 2, 2);
    this.renderer = renderer;

    const graphics = new Graphics()
      .rect(
        0,
        0,
        TileMap.TILE_SIZE * 2 - 5,
        TileMap.TILE_SIZE * 2 - 5,
      )
      .fill(0x8B4513); // SaddleBrown for wood stump

    const texture = renderer.generateTexture(graphics);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    // Anchor is bottom-left (0, 0)
    // Visual offset for 2x2 object with bottom-left anchor
    sprite.x = TileMap.TILE_SIZE;
    sprite.y = -TileMap.TILE_SIZE / 4;

    this.addChild(sprite);
  }

  public interact(): GameObject | null {
    return null;
  }

  public takeDamage(world: World): boolean {
    this.health--;
    if (this.health <= 0) {
      this.kill();
      this.spawnFences(world);
      return true; // Destroyed
    }

    // Visual feedback (flash red)
    this.children[0].tint = 0xff0000;
    setTimeout(() => {
      if (this.children.length > 0) {
        this.children[0].tint = 0xffffff;
      }
    }, 100);
    return false; // Not destroyed yet
  }

  private spawnFences(world: World): void {
    // Spawn 4 fences in the 2x2 area
    // Anchor is bottom-left (gridX, gridY)
    // Occupied tiles:
    // (gridX, gridY) - Bottom-Left
    // (gridX + 1, gridY) - Bottom-Right
    // (gridX, gridY - 1) - Top-Left
    // (gridX + 1, gridY - 1) - Top-Right

    const positions = [
      { x: this.gridX, y: this.gridY },
      { x: this.gridX + 1, y: this.gridY },
      { x: this.gridX, y: this.gridY - 1 },
      { x: this.gridX + 1, y: this.gridY - 1 },
    ];

    for (const pos of positions) {
      // Check if we can place a fence there (though stump was there, so it should be valid unless something else moved in?)
      // Stump is being removed, so it shouldn't block.
      // But we need to make sure we don't spawn on top of something else if logic allows overlap?
      // Stump is solid, so nothing else should be there.

      const fence = new Fence(pos.x, pos.y, this.renderer);
      world.placeObject(fence, pos.x, pos.y);
    }
  }
}
