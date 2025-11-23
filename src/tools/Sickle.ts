import { Tool } from "./Tool";
import { Player } from "../Player";
import { Weed } from "../Weed";

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
        const destroyed = obj.cut();
        if (destroyed) {
          player.getWorld().removeObject(obj);
        }
        toolUsed = true;
        break; // Sickle doesn't pass through
      }
    }
    return toolUsed;
  }
}
