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
    const world = player.getWorld();
    const objects = world.getObjectsAt(targetX, targetY);
    let toolUsed = false;

    // Check if there is already a Soil object (tilled soil)
    let hasSoilObject = false;
    for (const obj of objects) {
      if (obj instanceof Soil) {
        hasSoilObject = true;
        break;
      }
      // Hoe can be used to unseed a soil
      if (obj instanceof Plant && obj.isSeed) {
        obj.kill();
        toolUsed = true;
        break;
      }
    }

    if (!toolUsed && !hasSoilObject) {
      // Check if tile is Soil (type 3)
      const tileType = world.tileMap.getTileType(targetX, targetY);
      if (tileType === 3) {
        // Create Soil object (tilled)
        // We need renderer access. Player has it? No.
        // But we can get it from app? Or pass it to Tool?
        // For now, let's assume we can get it from world or player if we refactor.
        // Wait, Player doesn't expose renderer.
        // Let's check Player.ts again.
        // Player has renderer in constructor but private.
        // We might need to expose it or pass it.
        // Let's assume we can add a getter to Player.
        const renderer = player.getRenderer();
        if (renderer) {
          const soil = new Soil(targetX, targetY, renderer);
          world.addObject(soil);
          toolUsed = true;
        }
      }
    }
    return toolUsed;
  }
}
