import { Graphics, Renderer, Sprite } from "pixi.js";
import { GameObject } from "./GameObject";
import { TileMap } from "./TileMap";

export class Soil extends GameObject {
  private isTilled: boolean = false;
  private __isWatered: boolean = false;
  private sprite: Sprite;
  private renderer: Renderer;

  constructor(gridX: number, gridY: number, renderer: Renderer) {
    super(gridX, gridY, 1, 1);
    this.renderer = renderer;
    this.isSolid = false; // Soil is walkable

    this.sprite = new Sprite(this.createTexture(0xd2b48c)); // Light brown
    this.addChild(this.sprite);
  }

  private createTexture(color: number) {
    const graphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
      .fill(color);
    return this.renderer.generateTexture(graphics);
  }

  public interact(): GameObject | null {
    // Interaction does nothing now
    return null;
  }

  public till(): boolean {
    if (!this.isTilled) {
      this.isTilled = true;
      this.sprite.texture = this.createTexture(0x8b4513); // Dark brown
      return true;
    }
    return false;
  }

  public water(): boolean {
    if (this.isTilled && !this.__isWatered) {
      this.__isWatered = true;
      this.sprite.texture = this.createTexture(0x5d2906); // Darker brown (Watered)
      return true;
    }
    return false;
  }

  public canPlant(): boolean {
    return this.isTilled;
  }

  get isWatered(): boolean {
    return this.__isWatered;
  }

  public resetWater(): boolean {
    if (this.isWatered) {
      this.__isWatered = false;
      this.sprite.texture = this.createTexture(0x8b4513); // Back to tilled (dry)
      return true;
    }
    return false;
  }

  public onDayPass(): boolean {
    return this.resetWater();
  }
}
