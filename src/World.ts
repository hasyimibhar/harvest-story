import { Container, Ticker } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";
import { Soil } from "./Soil";
import { Player } from "./Player";

export class World extends Container {
  private _tileMap: TileMap;
  private grid: GameObject[][][];
  private objects: GameObject[] = [];
  private player: Player | undefined;

  // Layers
  private soilLayer: Container;
  private objectLayer: Container;

  constructor(tileMap: TileMap) {
    super();

    this._tileMap = tileMap;
    this.addChildAt(tileMap, 0);

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

  get tileMap(): TileMap {
    return this._tileMap;
  }

  public update(ticker: Ticker) {
    if (this.player) {
      this.player.update(ticker);
    }

    this.sortObjects();

    // Clean up killed objects at the end of the update
    const killedObjects = this.objects.filter((obj) => obj.isKilled);
    for (const obj of killedObjects) {
      this.removeObject(obj);
      obj.destroy();
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

  public setPlayer(player: Player): void {
    this.player = player;
    this.objectLayer.addChild(this.player);
  }

  public onDayPass(): void {
    // Loop through all coordinates
    for (let x = 0; x < TileMap.MAP_WIDTH; x++) {
      for (let y = 0; y < TileMap.MAP_HEIGHT; y++) {
        // Get all objects at this coordinate
        const objects = this.getObjectsAt(x, y);

        // Call onDayPass for each object
        for (const obj of objects) {
          obj.onDayPass();
        }
      }
    }
  }

  public placeObject(
    obj: GameObject,
    targetX: number,
    targetY: number,
  ): boolean {
    if (this.canPlaceObject(obj, targetX, targetY)) {
      // Handle placement logic (e.g., Weed destroys itself)
      if (obj.onPlace()) {
        // Add back to game world if onPlace returns true
        obj.gridX = targetX;
        obj.gridY = targetY;
        obj.x = targetX * TileMap.TILE_SIZE;
        obj.y = targetY * TileMap.TILE_SIZE;
        this.addObject(obj);
      }

      return true;
    }

    return false;
  }

  private canPlaceObject(_obj: GameObject, x: number, y: number): boolean {
    // Check map bounds
    if (x < 0 || x >= TileMap.MAP_WIDTH || y < 0 || y >= TileMap.MAP_HEIGHT) {
      return false;
    }

    // Check if tile type is valid
    // We need to get tile type from TileMap.
    // Since TileMap doesn't expose getTileAt, we can check isBlocked for rocks.
    // But Fence logic says "Grass or Soil".
    // TileMap.isBlocked returns true for rocks.
    if (this._tileMap.isBlocked(x, y)) {
      return false;
    }

    // Check for other objects blocking
    const objects = this.getObjectsAt(x, y);
    for (const other of objects) {
      // Special case: Fence can be placed on Soil
      // If 'other' is Soil, it's okay IF the object allows it.
      // But Soil is an object.
      // We need a way to check if 'other' is Soil.
      // For now, let's assume if there's ANY object, we can't place, UNLESS it's Soil.
      // But we don't have instanceof check easily without importing Soil.
      // Let's use isSolid. Soil is NOT solid.
      if (other.isSolid) {
        return false;
      }
      // If it's not solid (like Soil), we can place on it?
      // Yes, user said "For fence, it can only be placed down on grass or soil."
    }

    return _obj.canBePlacedOn(this, x, y);
  }
}
