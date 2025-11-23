import { Tool } from "./Tool";
import { Player } from "../Player";

export class Hammer extends Tool {
  constructor() {
    super("Hammer");
  }

  use(player: Player): boolean {
    const { targetX, targetY } = player.getTargetTile();
    const objects = player.getWorld().getObjectsAt(targetX, targetY);
    let toolUsed = false;

    // Iterate top-down (getObjectsAt returns [Top, Bottom])
    for (const obj of objects) {
      // No need to check isAt, getObjectsAt guarantees it
      const result = obj.onToolUse(this);
      if (result.destroyed) {
        player.removeObject(obj);
      }
      if (result.used) {
        toolUsed = true;
      }

      if (!result.passThrough) {
        break; // Swallow tool use
      }
    }
    return toolUsed;
  }
}
