import { Tool } from "./Tool";
import { Player } from "../Player";
import { Soil } from "../Soil";
import { Plant } from "../plants/Plant";

export class WateringCan extends Tool {
  public readonly maxWater: number = 20;
  public currentWater: number = 20;

  constructor() {
    super("Watering Can");
  }

  get name(): string {
    return `Watering Can (${this.currentWater}/${this.maxWater})`;
  }

  use(player: Player): boolean {
    const { targetX, targetY } = player.getTargetTile();
    const world = player.getWorld();

    // Check for refill
    const tileType = world.tileMap.getTileType(targetX, targetY);
    if (tileType === 2) {
      // Water tile
      this.currentWater = this.maxWater;
      console.log("Watering can refilled!");
      return true;
    }

    if (this.currentWater <= 0) {
      console.log("Watering can is empty!");
      return false;
    }

    const objects = world.getObjectsAt(targetX, targetY);
    let toolUsed = false;

    // Iterate top-down (getObjectsAt returns [Top, Bottom])
    for (const obj of objects) {
      // Skip plants (pass through to soil below)
      if (obj instanceof Plant) {
        continue;
      }

      if (obj instanceof Soil) {
        toolUsed = obj.water();
        if (toolUsed) {
          this.currentWater--;
          console.log(`Water left: ${this.currentWater}`);
        }
        break; // Stop after watering soil
      }
    }
    return toolUsed;
  }
}
