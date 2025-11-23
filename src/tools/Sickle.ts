import { Tool } from "./Tool";
import { Player } from "../Player";

export class Sickle extends Tool {
  constructor() {
    super("Sickle");
  }

  use(player: Player): boolean {
    const { targetX, targetY } = player.getTargetTile();
    const objects = player.getObjects();
    let toolUsed = false;

    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (obj.isAt(targetX, targetY)) {
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
    }
    return toolUsed;
  }
}
