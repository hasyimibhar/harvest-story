import { Container, Sprite, Texture, Graphics } from "pixi.js";

export class TileMap extends Container {
    public static readonly TILE_SIZE = 32;
    public static readonly MAP_WIDTH = 20;
    public static readonly MAP_HEIGHT = 20;

    private mapData: number[][] = [];
    constructor(private grassTexture: Texture, private rockTexture: Texture) {
        super();
        this.generateMap();
        this.renderMap();
    }

    private generateMap(): void {
        for (let y = 0; y < TileMap.MAP_HEIGHT; y++) {
            const row: number[] = [];
            for (let x = 0; x < TileMap.MAP_WIDTH; x++) {
                // 10% chance of a rock
                if (Math.random() < 0.1) {
                    row.push(1); // Rock
                } else {
                    row.push(0); // Grass
                }
            }
            this.mapData.push(row);
        }
    }

    private renderMap(): void {
        for (let y = 0; y < TileMap.MAP_HEIGHT; y++) {
            for (let x = 0; x < TileMap.MAP_WIDTH; x++) {
                const tileType = this.mapData[y][x];
                let sprite: Sprite;

                if (tileType === 1) {
                    sprite = new Sprite(this.rockTexture);
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
                .rect(x * TileMap.TILE_SIZE, y * TileMap.TILE_SIZE, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
                .stroke({ width: 2, color: 0xffff00 });
        }
    }

    public isBlocked(x: number, y: number): boolean {
        if (x < 0 || x >= TileMap.MAP_WIDTH || y < 0 || y >= TileMap.MAP_HEIGHT) {
            return true;
        }
        return this.mapData[y][x] === 1;
    }
}
