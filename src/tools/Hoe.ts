import { Tool } from "./Tool";
import { Player } from "../Player";
import { Soil } from "../Soil";
import { Plant } from "../plants/Plant";

export class Hoe extends Tool {
  constructor() {
    super("Hoe");
  }

  use(player: Player): boolean {
    const { targetX, targetY } = player.getTargetTile();
    const objects = player.getWorld().getObjectsAt(targetX, targetY);
    let toolUsed = false;

    // Iterate top-down (getObjectsAt returns [Top, Bottom])
    for (const obj of objects) {
      if (obj instanceof Soil) {
        toolUsed = obj.till();
        break; // Hoe doesn't pass through
      }

      // Hoe can be used to unseed a soil
      if (obj instanceof Plant && obj.isSeed) {
        obj.kill();
        toolUsed = true;
        break;
      }
    }
    return toolUsed;
  }
}
