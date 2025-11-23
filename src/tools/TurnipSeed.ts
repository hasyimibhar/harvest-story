import { Tool } from "./Tool";
import { Player } from "../Player";
import { TileMap } from "../TileMap";
import { Soil } from "../Soil";
import { Plant } from "../plants/Plant";

export class TurnipSeed extends Tool {
  public count: number = 2;

  constructor() {
    super("Turnip Seed", true); // Consumable
  }

  get name(): string {
    return `Turnip Seed x${this.count}`;
  }

  get isDepleted(): boolean {
    return this.count <= 0;
  }

  use(player: Player): boolean {
    if (this.isDepleted) {
      return false;
    }

    const { x, y } = player;
    const centerGridX = Math.floor(x / TileMap.TILE_SIZE);
    const centerGridY = Math.floor(y / TileMap.TILE_SIZE);
    let seedUsed = false;
    const renderer = player.getRenderer();

    for (let gridX = centerGridX - 1; gridX <= centerGridX + 1; gridX++) {
      for (let gridY = centerGridY - 1; gridY <= centerGridY + 1; gridY++) {
        // Check if there is already a plant or blocking object
        let targetSoil: Soil | null = null;
        let isBlocked = false;

        // Get objects at this tile
        const objects = player.getWorld().getObjectsAt(gridX, gridY);

        for (const obj of objects) {
          if (obj.isSolid) {
            isBlocked = true;
            break;
          }

          if (obj instanceof Soil) {
            targetSoil = obj;
          } else {
            // Any other object on top of soil blocks planting (e.g. Weed, Fence, existing Plant)
            isBlocked = true;
          }
        }
        if (!isBlocked && targetSoil && targetSoil.canPlant()) {
          // Create Plant
          const plant = new Plant(targetSoil, renderer);
          player.getWorld().addObject(plant);
          seedUsed = true;
        }
      }
    }

    if (seedUsed) {
      this.count--;
    }

    return seedUsed;
  }
}
