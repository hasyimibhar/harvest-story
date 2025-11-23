import { Tool } from "./Tool";
import { Player } from "../Player";

export class WateringCan extends Tool {
  constructor() {
    super("Watering Can");
  }

  use(player: Player): boolean {
    const { targetX, targetY } = player.getTargetTile();
    const objects = player.getWorld().getObjectsAt(targetX, targetY);
    let toolUsed = false;

    for (const obj of objects) {
      const result = obj.onToolUse(this);
      if (result.destroyed) {
        player.removeObject(obj);
      }
      if (result.used) {
        toolUsed = true;
      }

      if (!result.passThrough) {
        break;
      }
    }
    return toolUsed;
  }
}
