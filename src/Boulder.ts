import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";

export class Boulder extends GameObject {
  private health = 6;

  constructor(gridX: number, gridY: number, renderer: Renderer) {
    super(gridX, gridY, 2, 2);

    const graphics = new Graphics()
      .rect(
        0,
        0,
        TileMap.TILE_SIZE * 2 - 5,
        TileMap.TILE_SIZE * 2 - 5,
      )
      .fill(0x555555); // Dark grey for boulder

    const texture = renderer.generateTexture(graphics);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    // Anchor is bottom-left (0, 0)
    // Center of 2x2 area relative to anchor:
    // X: 1 tile right (32px)
    // Y: 1 tile up (-32px)
    // Wait, tile coordinates increase Y downwards.
    // Bottom-left is (0, 0) relative to object position.
    // Top-left of 2x2 area is (0, -1) relative to object position?
    // No, gridY is the bottom-most row.
    // So occupied rows are gridY and gridY - 1.
    // Center Y is between gridY and gridY - 1.
    // Relative to gridY * TILE_SIZE (which is top of gridY tile? No, usually top-left).
    // GameObject.x/y is gridX/gridY * TILE_SIZE.
    // If gridX/Y is top-left of the tile:
    // Bottom-left anchor means the object's (x, y) is the top-left corner of the bottom-left tile.
    // Occupied tiles: (0,0) and (0,-1) relative to anchor tile?
    // Let's assume standard grid coordinates where (0,0) is top-left.
    // If object is at (5, 5) and size is 2x2, bottom-left anchor.
    // It occupies (5, 5), (6, 5), (5, 4), (6, 4).
    // Center of this area:
    // X: 5.5 * TILE_SIZE + TILE_SIZE/2 = (5 + 1) * TILE_SIZE
    // Y: 4.5 * TILE_SIZE + TILE_SIZE/2 = (4 + 1) * TILE_SIZE
    // Anchor position (5, 5) * TILE_SIZE.
    // Offset:
    // X: +1 * TILE_SIZE
    // Y: -0.5 * TILE_SIZE?
    // Center Y of (4, 5) range is 4.5.
    // Anchor Y is 5.
    // Difference is -0.5 tiles.
    // So offset is (TILE_SIZE, -TILE_SIZE / 2).
    // Let's re-verify.
    // Top-left of 2x2 area: (gridX, gridY - 1).
    // Center: (gridX + 1, gridY - 0.5).
    // Anchor: (gridX, gridY).
    // Delta: (+1, -0.5).
    // Correct.
    sprite.x = TileMap.TILE_SIZE;
    sprite.y = -TileMap.TILE_SIZE / 4;

    this.addChild(sprite);
  }

  public interact(): GameObject | null {
    // Interaction does nothing now
    return null;
  }

  public takeDamage(): boolean {
    this.health--;
    if (this.health <= 0) {
      this.kill();
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
}
