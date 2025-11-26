import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";
import { Turnip } from "./produces/Turnip";
import { Player } from "./Player";
import { Fence } from "./Fence";

export class ShippingBin extends GameObject {
  private storage: GameObject[] = [];
  private capacity: number = 50;

  constructor(gridX: number, gridY: number, renderer: Renderer) {
    super(gridX, gridY, 1, 1);
    this.isSolid = true;

    const graphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
      .fill(0xff0000); // Red shipping bin

    const texture = renderer.generateTexture(graphics);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = TileMap.TILE_SIZE / 2;
    sprite.y = TileMap.TILE_SIZE / 2;

    this.addChild(sprite);
  }

  public receiveItem(item: GameObject): boolean {
    if (item instanceof Turnip || item instanceof Fence) {
      if (this.storage.length < this.capacity) {
        this.storage.push(item);
        console.log(`Shipped Turnip! Total: ${this.storage.length}/${this.capacity}`);
        // Item is removed from player's hand by Player class
        // We should probably "kill" or "destroy" the visual representation if it's not going to be in the world anymore
        // But since it's in storage, maybe we just keep it reference?
        // For now, let's just keep reference.
        return true;
      } else {
        console.log("Shipping Bin is full!");
        return false;
      }
    }
    return false;
  }

  public onDayPass(player: Player): boolean {
    let totalValue = 0;
    for (const item of this.storage) {
      totalValue += item.sellValue;
    }

    this.storage = []; // Clear storage
    if (totalValue > 0) {
      console.log(`Processed shipping: ${totalValue}G`);
    }

    player.gold += totalValue;
    return totalValue > 0;
  }
}
