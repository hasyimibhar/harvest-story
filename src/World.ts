import { Container } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";
import { Soil } from "./Soil";

export class World extends Container {
  private grid: GameObject[][][];
  private objects: GameObject[] = [];

  // Layers
  private soilLayer: Container;
  private objectLayer: Container;

  constructor() {
    super();

    // Initialize layers
    this.soilLayer = new Container();
    this.objectLayer = new Container();
    this.addChild(this.soilLayer);
    this.addChild(this.objectLayer);

    // Initialize grid
    this.grid = [];
    for (let x = 0; x < TileMap.MAP_WIDTH; x++) {
      this.grid[x] = [];
      for (let y = 0; y < TileMap.MAP_HEIGHT; y++) {
        this.grid[x][y] = [];
      }
    }
  }

  public addObject(obj: GameObject): void {
    this.objects.push(obj);

    // Add to appropriate layer
    if (obj instanceof Soil) {
      this.soilLayer.addChild(obj);
    } else {
      this.objectLayer.addChild(obj);
    }

    // Add to grid
    // Assuming object is already positioned or will be positioned.
    // If object moves, this grid needs updating.
    // For now, assuming static placement or manual update.
    this.addToGrid(obj);
  }

  public removeObject(obj: GameObject): void {
    const index = this.objects.indexOf(obj);
    if (index > -1) {
      this.objects.splice(index, 1);

      if (obj.parent) {
        obj.parent.removeChild(obj);
      }

      this.removeFromGrid(obj);
    }
  }

  public getObjectsAt(x: number, y: number): GameObject[] {
    if (!this.isValidGrid(x, y)) return [];
    // Return objects sorted by top-most first (reverse of render order typically)
    // The grid array stores them in order of addition (which usually matches render order if we don't z-sort).
    // However, we have layers.
    // If we just use the grid array, it mixes layers?
    // Yes, grid[x][y] will have both Soil and Objects.
    // We want to return them in visual order (Top to Bottom).
    // Objects are above Soil.
    // So we want Objects first, then Soil.
    // Within Objects, we want higher Y (or later added) first.

    // Let's just return the list reversed.
    // But we need to ensure the list order matches render order.
    // When we add to grid, we push.
    // If we add Soil then Object, list is [Soil, Object].
    // Reversed: [Object, Soil]. Correct.
    return [...this.grid[x][y]].reverse();
  }

  public updateObjectGridPosition(
    obj: GameObject,
    oldX: number,
    oldY: number,
  ): void {
    const oldGridX = Math.floor(oldX / TileMap.TILE_SIZE);
    const oldGridY = Math.floor(oldY / TileMap.TILE_SIZE);

    // Remove from old pos
    if (this.isValidGrid(oldGridX, oldGridY)) {
      const cell = this.grid[oldGridX][oldGridY];
      const index = cell.indexOf(obj);
      if (index > -1) {
        cell.splice(index, 1);
      }
    }

    // Add to new pos
    this.addToGrid(obj);
  }

  private addToGrid(obj: GameObject): void {
    const gx = Math.floor(obj.x / TileMap.TILE_SIZE);
    const gy = Math.floor(obj.y / TileMap.TILE_SIZE);
    if (this.isValidGrid(gx, gy)) {
      this.grid[gx][gy].push(obj);
      // We might want to sort this list by layer/z-index if we rely on it for rendering order logic?
      // But rendering is handled by Containers.
      // This list is for logic (collision, interaction).
      // Interaction usually wants top-most.
      // If we push, we assume added in order.
      // If we have layers, we might want to ensure Objects are after Soil in this list?
      // If we add Soil first, then Objects, it's fine.
    }
  }

  private removeFromGrid(obj: GameObject): void {
    const gx = Math.floor(obj.x / TileMap.TILE_SIZE);
    const gy = Math.floor(obj.y / TileMap.TILE_SIZE);
    if (this.isValidGrid(gx, gy)) {
      const cell = this.grid[gx][gy];
      const index = cell.indexOf(obj);
      if (index > -1) {
        cell.splice(index, 1);
      }
    }
  }

  private isValidGrid(x: number, y: number): boolean {
    return x >= 0 && x < TileMap.MAP_WIDTH && y >= 0 && y < TileMap.MAP_HEIGHT;
  }

  public sortObjects(): void {
    // Sort object layer by Y for depth
    this.objectLayer.children.sort((a, b) => a.y - b.y);
  }

  public addToObjectLayer(obj: Container): void {
    this.objectLayer.addChild(obj);
  }

  public addChildToMap(child: Container): void {
    this.addChildAt(child, 0); // Add at bottom (for TileMap)
  }
}
