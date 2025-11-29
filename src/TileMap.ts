import { Container, Sprite, Texture, Graphics } from "pixi.js";

export class TileMap extends Container {
  public static readonly TILE_SIZE = 32;
  public static readonly MAP_WIDTH = 100;
  public static readonly MAP_HEIGHT = 100;

  private mapData: number[][] = [];
  constructor(
    private grassTexture: Texture,
    private rockTexture: Texture,
    private waterTexture: Texture,
  ) {
    super();
    this.generateMap();
    this.renderMap();
  }

  private generateMap(): void {
    for (let y = 0; y < TileMap.MAP_HEIGHT; y++) {
      const row: number[] = [];
      for (let x = 0; x < TileMap.MAP_WIDTH; x++) {
        // Place rocks on the borders
        if (
          x === 0 ||
          x === TileMap.MAP_WIDTH - 1 ||
          y === 0 ||
          y === TileMap.MAP_HEIGHT - 1
        ) {
          row.push(1); // Rock
        } else {
          row.push(0); // Grass
        }
      }
      this.mapData.push(row);
    }

    // Place 4x4 water patch in a random corner
    const corners = [
      { x: 1, y: 1 }, // Top-Left
      { x: TileMap.MAP_WIDTH - 5, y: 1 }, // Top-Right
      { x: 1, y: TileMap.MAP_HEIGHT - 5 }, // Bottom-Left
      { x: TileMap.MAP_WIDTH - 5, y: TileMap.MAP_HEIGHT - 5 }, // Bottom-Right
    ];

    const corner = corners[Math.floor(Math.random() * corners.length)];

    for (let y = corner.y; y < corner.y + 4; y++) {
      for (let x = corner.x; x < corner.x + 4; x++) {
        this.mapData[y][x] = 2; // Water
      }
    }
  }

  private renderMap(): void {
    for (let y = 0; y < TileMap.MAP_HEIGHT; y++) {
      for (let x = 0; x < TileMap.MAP_WIDTH; x++) {
        const tileType = this.mapData[y][x];
        let sprite: Sprite;

        if (tileType === 1) {
          sprite = new Sprite(this.rockTexture);
        } else if (tileType === 2) {
          sprite = new Sprite(this.waterTexture);
        } else {
          sprite = new Sprite(this.grassTexture);
        }

        sprite.x = x * TileMap.TILE_SIZE;
        sprite.y = y * TileMap.TILE_SIZE;
        this.addChild(sprite);
      }
    }
  }

  public highlightTile(x: number, y: number, graphics: Graphics): void {
    graphics.clear();
    if (x >= 0 && x < TileMap.MAP_WIDTH && y >= 0 && y < TileMap.MAP_HEIGHT) {
      graphics
        .rect(
          x * TileMap.TILE_SIZE,
          y * TileMap.TILE_SIZE,
          TileMap.TILE_SIZE,
          TileMap.TILE_SIZE,
        )
        .stroke({ width: 2, color: 0xffff00 });
    }
  }

  public isBlocked(x: number, y: number): boolean {
    if (x < 0 || x >= TileMap.MAP_WIDTH || y < 0 || y >= TileMap.MAP_HEIGHT) {
      return true;
    }
    const tileType = this.mapData[y][x];
    return tileType === 1 || tileType === 2; // Block Rock (1) and Water (2)
  }

  public getTileType(x: number, y: number): number {
    if (x < 0 || x >= TileMap.MAP_WIDTH || y < 0 || y >= TileMap.MAP_HEIGHT) {
      return -1; // Invalid tile
    }
    return this.mapData[y][x];
  }
}
