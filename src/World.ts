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

    // Remove from old pos (all occupied tiles)
    for (let i = 0; i < obj.widthTiles; i++) {
      for (let j = 0; j < obj.heightTiles; j++) {
        const x = oldGridX + i;
        const y = oldGridY - j;
        if (this.isValidGrid(x, y)) {
          const cell = this.grid[x][y];
          const index = cell.indexOf(obj);
          if (index > -1) {
            cell.splice(index, 1);
          }
        }
      }
    }

    // Add to new pos
    this.addToGrid(obj);
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
      obj.gridX = targetX;
      obj.gridY = targetY;
      obj.x = targetX * TileMap.TILE_SIZE;
      obj.y = targetY * TileMap.TILE_SIZE;
      this.addObject(obj);

      // Handle placement logic (e.g., Weed destroys itself)
      obj.onPlace(this, targetX, targetY);

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
    if (!_obj.canBePlacedOn(this, x, y)) {
      return false;
    }

    // Check for other objects blocking
    // Iterate over all tiles occupied by the object
    // Anchor is bottom-left, so it occupies:
    // x: [gridX, gridX + width - 1]
    // y: [gridY - height + 1, gridY]
    for (let i = 0; i < _obj.widthTiles; i++) {
      for (let j = 0; j < _obj.heightTiles; j++) {
        const checkX = x + i;
        const checkY = y - j;

        const objects = this.getObjectsAt(checkX, checkY);
        for (const other of objects) {
          // This object is scheduled to be removed,
          // so it should be allowed to be placed on top of it
          if (other.isKilled) {
            continue;
          }

          if (other.isSolid) {
            return false;
          }
        }
      }
    }

    return true;
  }

  private addToGrid(obj: GameObject): void {
    const gx = Math.floor(obj.x / TileMap.TILE_SIZE);
    const gy = Math.floor(obj.y / TileMap.TILE_SIZE);

    // Add to all occupied tiles
    // Anchor is bottom-left
    for (let i = 0; i < obj.widthTiles; i++) {
      for (let j = 0; j < obj.heightTiles; j++) {
        const x = gx + i;
        const y = gy - j;
        if (this.isValidGrid(x, y)) {
          this.grid[x][y].push(obj);
        }
      }
    }
  }

  private removeFromGrid(obj: GameObject): void {
    const gx = Math.floor(obj.x / TileMap.TILE_SIZE);
    const gy = Math.floor(obj.y / TileMap.TILE_SIZE);

    // Remove from all occupied tiles
    for (let i = 0; i < obj.widthTiles; i++) {
      for (let j = 0; j < obj.heightTiles; j++) {
        const x = gx + i;
        const y = gy - j;
        if (this.isValidGrid(x, y)) {
          const cell = this.grid[x][y];
          const index = cell.indexOf(obj);
          if (index > -1) {
            cell.splice(index, 1);
          }
        }
      }
    }
  }
}
