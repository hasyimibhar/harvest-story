import { Container, Sprite, Ticker, Graphics, Renderer } from "pixi.js";
import { InputManager } from "./InputManager";
import { TileMap } from "./TileMap";
import { GameObject } from "./GameObject";
import { Tool } from "./tools/Tool";
import { World } from "./World";

import { Rucksack } from "./Rucksack";

import { ToolBag } from "./ToolBag";

export class Player extends Container {
  private speed = 2;
  private direction: number = 2; // 0: Up, 1: Right, 2: Down, 3: Left
  private sprite: Sprite;

  private heldObject: GameObject | null = null;
  public rucksack: Rucksack = new Rucksack();
  public gold: number = 100;

  // Tool system
  public toolBag: ToolBag = new ToolBag();

  constructor(
    private renderer: Renderer,
    private inputManager: InputManager,
    private tileMap: TileMap,
    private world: World,
  ) {
    super();

    const graphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE * 1.5)
      .fill(0xff0000); // Red player

    const texture = renderer.generateTexture(graphics);

    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5, 2 / 3); // Align bottom of sprite with bottom of tile (approx)
    this.addChild(this.sprite);

    // this.scale.set(0.8); // Make player slightly smaller than tile
  }

  public update(ticker: Ticker): void {
    const delta = ticker.deltaTime;
    let dx = 0;
    let dy = 0;

    if (this.inputManager.isKeyDown("ArrowUp")) {
      dy -= this.speed * delta;
      this.direction = 0; // Up
    } else if (this.inputManager.isKeyDown("ArrowDown")) {
      dy += this.speed * delta;
      this.direction = 2; // Down
    }

    if (this.inputManager.isKeyDown("ArrowLeft")) {
      dx -= this.speed * delta;
      this.direction = 3; // Left
    } else if (this.inputManager.isKeyDown("ArrowRight")) {
      dx += this.speed * delta;
      this.direction = 1; // Right
    }

    if (dx !== 0 || dy !== 0) {
      this.move(dx, dy);
    }

    if (this.inputManager.isJustPressed("KeyX")) {
      this.interact();
    }

    // Rucksack controls
    if (this.inputManager.isJustPressed("KeyZ")) {
      if (this.heldObject) {
        // Store held item
        if (this.rucksack.add(this.heldObject)) {
          this.removeChild(this.heldObject);
          this.heldObject = null;
          console.log("Item stored in rucksack");
        } else {
          console.log("Rucksack is full");
        }
      } else {
        // Retrieve item
        const item = this.rucksack.remove();
        if (item) {
          this.pickupObject(item);
          console.log("Item retrieved from rucksack");
        } else {
          console.log("Rucksack is empty");
        }
      }
    }

    // Tool controls
    if (this.inputManager.isJustPressed("KeyQ")) {
      this.cycleTool(-1); // Cycle backward
    }
    if (this.inputManager.isJustPressed("KeyW")) {
      this.cycleTool(1); // Cycle forward
    }
    if (this.inputManager.isJustPressed("KeyA")) {
      this.useTool();
    }

    this.updateHighlight();
  }

  public cycleTool(direction: number = 1): void {
    this.toolBag.cycle(direction);
    const tool = this.getSelectedTool();
    console.log(`Selected tool: ${tool ? tool.name : "None"} `);
  }

  public getSelectedTool(): Tool | null {
    return this.toolBag.getSelectedTool();
  }

  public useTool(): void {
    const currentTool = this.getSelectedTool();
    if (!currentTool) return; // No tool in this slot

    const used = currentTool.use(this);

    if (used && currentTool.isConsumable && currentTool.isDepleted) {
      this.toolBag.setTool(this.toolBag.selectedIndex, null);
    }
  }

  public getTargetTile(): { targetX: number; targetY: number } {
    const tileSize = TileMap.TILE_SIZE;
    let targetX = Math.floor(this.x / tileSize);
    let targetY = Math.floor(this.y / tileSize);

    switch (this.direction) {
      case 0:
        targetY--;
        break; // Up
      case 1:
        targetX++;
        break; // Right
      case 2:
        targetY++;
        break; // Down
      case 3:
        targetX--;
        break; // Left
    }
    return { targetX, targetY };
  }

  public getWorld(): World {
    return this.world;
  }

  public getRenderer(): Renderer {
    return this.renderer;
  }

  private interact(): void {
    const gridX = Math.floor(this.x / TileMap.TILE_SIZE);
    const gridY = Math.floor(this.y / TileMap.TILE_SIZE);
    let targetX = gridX;
    let targetY = gridY;

    switch (this.direction) {
      case 0: // Up
        targetY -= 1;
        break;
      case 2: // Down
        targetY += 1;
        break;
      case 3: // Left
        targetX -= 1;
        break;
      case 1: // Right
        targetX += 1;
        break;
    }

    if (this.heldObject) {
      // Check if we can give the item to an object
      const objects = this.world.getObjectsAt(targetX, targetY);
      let given = false;
      for (const obj of objects) {
        if (obj.receiveItem(this.heldObject)) {
          this.removeChild(this.heldObject);
          this.heldObject = null;
          given = true;
          break;
        }
      }

      if (!given && this.heldObject) {
        this.removeChild(this.heldObject);

        if (this.world.placeObject(this.heldObject, targetX, targetY)) {
          this.heldObject = null;
        } else {
          this.addChild(this.heldObject);
        }
      }
    } else {
      // Try to interact or pickup
      // Iterate to interact with top-most objects first
      const objects = this.world.getObjectsAt(targetX, targetY);
      for (const obj of objects) {
        if (obj.isPickupable) {
          // Remove object first before pickup
          this.world.removeObject(obj);
          this.pickupObject(obj);
          return;
        }

        const produce = obj.interact();
        if (produce) {
          // No need to remove produce because it's not added to world yet
          this.pickupObject(produce);
          return;
        }
        break; // Only interact with one object at a time (the top one)
      }
    }
  }

  private pickupObject(obj: GameObject): void {
    this.heldObject = obj;
    this.addChild(obj);
    obj.x = 0;
    obj.y = -TileMap.TILE_SIZE / 2; // Position above head
  }

  private highlightGraphics: Graphics | null = null;

  public setHighlightGraphics(graphics: Graphics): void {
    this.highlightGraphics = graphics;
  }

  private updateHighlight(): void {
    if (!this.highlightGraphics) return;

    const gridX = Math.floor(this.x / TileMap.TILE_SIZE);
    const gridY = Math.floor(this.y / TileMap.TILE_SIZE);
    let targetX = gridX;
    let targetY = gridY;

    switch (this.direction) {
      case 0: // Up
        targetY -= 1;
        break;
      case 2: // Down
        targetY += 1;
        break;
      case 3: // Left
        targetX -= 1;
        break;
      case 1: // Right
        targetX += 1;
        break;
    }

    this.tileMap.highlightTile(targetX, targetY, this.highlightGraphics);
  }

  private move(dx: number, dy: number): void {
    const newX = this.x + dx;
    const newY = this.y + dy;
    // Use a margin smaller than half the tile size to allow sliding
    // This provides a "forgiving" collision box that feels better for gameplay
    const margin = TileMap.TILE_SIZE / 2 - 2;

    const left = newX - margin;
    const right = newX + margin;
    const top = newY - margin;
    const bottom = newY + margin;

    const topLeftBlocked = this.isBlocked(left, top);
    const topRightBlocked = this.isBlocked(right, top);
    const bottomLeftBlocked = this.isBlocked(left, bottom);
    const bottomRightBlocked = this.isBlocked(right, bottom);

    if (
      !topLeftBlocked &&
      !topRightBlocked &&
      !bottomLeftBlocked &&
      !bottomRightBlocked
    ) {
      this.x = newX;
      this.y = newY;
    } else {
      // Simple sliding logic: try moving only X or only Y
      // This prevents getting stuck on corners
      if (dx !== 0) {
        const newXOnly = this.x + dx;
        const leftOnly = newXOnly - margin;
        const rightOnly = newXOnly + margin;
        const topOnly = this.y - margin;
        const bottomOnly = this.y + margin;

        const tl = this.isBlocked(leftOnly, topOnly);
        const tr = this.isBlocked(rightOnly, topOnly);
        const bl = this.isBlocked(leftOnly, bottomOnly);
        const br = this.isBlocked(rightOnly, bottomOnly);

        if (!tl && !tr && !bl && !br) {
          this.x = newXOnly;
        }
      }

      if (dy !== 0) {
        const newYOnly = this.y + dy;
        const leftOnly = this.x - margin;
        const rightOnly = this.x + margin;
        const topOnly = newYOnly - margin;
        const bottomOnly = newYOnly + margin;

        const tl = this.isBlocked(leftOnly, topOnly);
        const tr = this.isBlocked(rightOnly, topOnly);
        const bl = this.isBlocked(leftOnly, bottomOnly);
        const br = this.isBlocked(rightOnly, bottomOnly);

        if (!tl && !tr && !bl && !br) {
          this.y = newYOnly;
        }
      }
    }
  }

  private isBlocked(x: number, y: number): boolean {
    const gridX = Math.floor(x / TileMap.TILE_SIZE);
    const gridY = Math.floor(y / TileMap.TILE_SIZE);

    // Check map collision
    if (this.tileMap.isBlocked(gridX, gridY)) {
      return true;
    }

    // Check object collision
    const objects = this.world.getObjectsAt(gridX, gridY);
    for (const obj of objects) {
      if (obj.isSolid) {
        return true;
      }
    }

    return false;
  }
}
