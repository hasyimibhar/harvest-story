import { Graphics, Renderer, Sprite } from "pixi.js";
import { Plant } from "./Plant";
import { Soil } from "../Soil";
import { TileMap } from "../TileMap";
import { GameObject } from "../GameObject";
import { Turnip } from "../produces/Turnip";

export class TurnipPlant extends Plant {
  constructor(soil: Soil, renderer: Renderer) {
    super(soil, renderer);
    this.maturityAge = 4;
    this.updateTexture();
  }

  public grow(): boolean {
    const didGrow = super.grow();
    if (didGrow) {
      this.updateTexture();
      // Make solid when age >= 2
      if (this.age >= 2) {
        this.isSolid = true;
      }
    }
    return didGrow;
  }

  get isSeed(): boolean {
    return this.age < 2;
  }

  protected createProduce(renderer: Renderer): GameObject | null {
    // Create a Turnip produce at the same grid position
    return new Turnip(this.gridX, this.gridY, renderer);
  }

  private updateTexture(): void {
    // Remove old sprite
    if (this.children.length > 0) {
      this.removeChildAt(0);
    }

    const graphics = new Graphics();
    let x = TileMap.TILE_SIZE / 2;
    let y = TileMap.TILE_SIZE / 2;

    if (this.age < 2) {
      // Seed: 4 small circles (wheat color)
      const seedColor = 0xf5deb3;
      const r = TileMap.TILE_SIZE / 8;
      const offset = TileMap.TILE_SIZE / 4;

      graphics.circle(offset, offset, r).fill(seedColor);
      graphics.circle(TileMap.TILE_SIZE - offset, offset, r).fill(seedColor);
      graphics.circle(offset, TileMap.TILE_SIZE - offset, r).fill(seedColor);
      graphics
        .circle(TileMap.TILE_SIZE - offset, TileMap.TILE_SIZE - offset, r)
        .fill(seedColor);
    } else if (this.age < 4) {
      // Small green shoot: small green rectangle
      const shootColor = 0x00ff00;
      const width = TileMap.TILE_SIZE / 3;
      const height = TileMap.TILE_SIZE / 2;
      x = TileMap.TILE_SIZE / 2;
      y = TileMap.TILE_SIZE / 4;

      graphics.rect(0, 0, width, height).fill(shootColor);
    } else {
      // Mature turnip: round white circle
      const turnipColor = 0xffffff;
      const radius = TileMap.TILE_SIZE / 3;
      const centerX = TileMap.TILE_SIZE / 2;
      const centerY = TileMap.TILE_SIZE / 2;

      graphics.circle(centerX, centerY, radius).fill(turnipColor);
    }

    const texture = this.renderer.generateTexture(graphics);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;
    this.addChild(sprite);
  }
}
