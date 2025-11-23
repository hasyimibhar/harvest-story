import { Tool } from "./Tool";
import { Player } from "../Player";
import { TileMap } from "../TileMap";
import { Soil } from "../Soil";
import { Plant } from "../Plant";

export class TurnipSeed extends Tool {
  constructor() {
    super("Turnip Seed", true); // Consumable
  }

  use(player: Player): boolean {
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
          player.addObject(plant);
          seedUsed = true;
        }
      }
    }

    return seedUsed;
  }
}
