import { Container } from "pixi.js";
import { TileMap } from "./TileMap";
import { World } from "./World";

export class GameObject extends Container {
  public isSolid: boolean = true;
  protected _isKilled: boolean = false;

  constructor(
    public gridX: number,
    public gridY: number,
    public widthTiles: number,
    public heightTiles: number,
  ) {
    super();
    this.x = gridX * TileMap.TILE_SIZE;
    this.y = gridY * TileMap.TILE_SIZE;
  }

  public isAt(gridX: number, gridY: number): boolean {
    return (
      gridX >= this.gridX &&
      gridX < this.gridX + this.widthTiles &&
      gridY >= this.gridY &&
      gridY < this.gridY + this.heightTiles
    );
  }

  public interact(): GameObject | null {
    return null;
  }

  public isPickupable: boolean = false;

  public onDayPass(): boolean {
    return true;
  }

  get isKilled(): boolean {
    return this._isKilled;
  }

  public kill(): void {
    this._isKilled = true;
  }

  public canBePlacedOn(world: World, gridX: number, gridY: number): boolean {
    return !world.tileMap.isBlocked(gridX, gridY);
  }

  public onPlace(_world: World, _gridX: number, _gridY: number) {
    // Do nothing
  }
}
