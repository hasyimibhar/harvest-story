import { Tool } from "./Tool";
import { Player } from "../Player";
import { Weed } from "../Weed";
import { Plant } from "../plants/Plant";

export class Sickle extends Tool {
  constructor() {
    super("Sickle");
  }

  use(player: Player): boolean {
    const { targetX, targetY } = player.getTargetTile();
    const objects = player.getWorld().getObjectsAt(targetX, targetY);
    let toolUsed = false;

    // Iterate top-down (getObjectsAt returns [Top, Bottom])
    for (const obj of objects) {
      if (obj instanceof Weed) {
        player.getWorld().removeObject(obj);
        toolUsed = true;
        break;
      }

      // Sickle destroys plants, unless it's still a seed
      if (obj instanceof Plant && !obj.isSeed) {
        player.getWorld().removeObject(obj);
        toolUsed = true;
        break;
      }
    }
    return toolUsed;
  }
}
