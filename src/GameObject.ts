import { Container } from "pixi.js";
import { TileMap } from "./TileMap";

export class GameObject extends Container {
    public isSolid: boolean = true;

    constructor(
        public gridX: number,
        public gridY: number,
        public widthTiles: number,
        public heightTiles: number
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

    public interact(): boolean {
        return false;
    }

    public isPickupable: boolean = false;

    public canBePlacedOn(tileType: number): boolean {
        return true;
    }

    public onPlace(): boolean {
        return true;
    }
}
