import { Tool } from "./Tool";
import { Player } from "../Player";
import { Soil } from "../Soil";
import { Plant } from "../plants/Plant";

export class WateringCan extends Tool {
  constructor() {
    super("Watering Can");
  }

  use(player: Player): boolean {
    const { targetX, targetY } = player.getTargetTile();
    const objects = player.getWorld().getObjectsAt(targetX, targetY);
    let toolUsed = false;

    // Iterate top-down (getObjectsAt returns [Top, Bottom])
    for (const obj of objects) {
      // Skip plants (pass through to soil below)
      if (obj instanceof Plant) {
        continue;
      }

      if (obj instanceof Soil) {
        toolUsed = obj.water();
        break; // Stop after watering soil
      }
    }
    return toolUsed;
  }
}
