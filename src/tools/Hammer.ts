import { Tool } from "./Tool";
import { Player } from "../Player";
import { Boulder } from "../Boulder";

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
      if (obj instanceof Boulder) {
        obj.takeDamage();
        toolUsed = true;
        break; // Hammer doesn't pass through
      }
    }
    return toolUsed;
  }
}
