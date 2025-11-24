import { Application, Graphics, Text } from "pixi.js";
import { TileMap } from "./TileMap";
import { Player } from "./Player";
import { InputManager } from "./InputManager";
import { Boulder } from "./Boulder";
import { Soil } from "./Soil";
import { Fence } from "./Fence";
import { Weed } from "./Weed";
import { WoodStump } from "./WoodStump";
import { World } from "./World";

export class Game {
  private app: Application;
  private inputManager: InputManager;
  private tileMap: TileMap | undefined;
  private player: Player | undefined;
  private world: World | undefined;
  private currentDay: number = 1;
  private fadeOverlay: Graphics | undefined;
  private dayText: Text | undefined;
  private toolText: Text | undefined;
  private isTransitioning: boolean = false;

  constructor() {
    this.app = new Application();
    this.inputManager = new InputManager();
  }

  public async init(): Promise<void> {
    console.log("Initializing PixiJS app...");
    await this.app.init({ background: "#000000", resizeTo: window });
    document.getElementById("pixi-container")!.appendChild(this.app.canvas);
    console.log("PixiJS app initialized");
    this.createScene();
  }

  private createScene(): void {
    console.log("Creating scene...");

    const grassGraphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
      .fill(0x00ff00);
    const grassTexture = this.app.renderer.generateTexture(grassGraphics);

    const rockGraphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
      .fill(0x808080);
    const rockTexture = this.app.renderer.generateTexture(rockGraphics);

    const waterGraphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
      .fill(0x0000ff); // Blue water
    const waterTexture = this.app.renderer.generateTexture(waterGraphics);

    this.tileMap = new TileMap(grassTexture, rockTexture, waterTexture);

    // Create a world container to center everything
    this.world = new World(this.tileMap);
    this.app.stage.addChild(this.world);

    // Center the world container
    this.world.x =
      (this.app.screen.width - TileMap.MAP_WIDTH * TileMap.TILE_SIZE) / 2;
    this.world.y =
      (this.app.screen.height - TileMap.MAP_HEIGHT * TileMap.TILE_SIZE) / 2;

    // Soil Layer and Object Layer are managed by World now

    // Randomly place a 10x10 patch of soil
    // Ensure it doesn't overlap with border rocks (x/y range: 1 to MAP_WIDTH - 1)
    // Patch size is 10, so max start index is MAP_WIDTH - 1 - 10 = MAP_WIDTH - 11
    // Range: 1 to MAP_WIDTH - 11

    const maxStart = TileMap.MAP_WIDTH - 11;
    const startX = Math.floor(Math.random() * (maxStart - 1 + 1)) + 1;
    const startY = Math.floor(Math.random() * (maxStart - 1 + 1)) + 1;

    for (let x = startX; x < startX + 10; x++) {
      for (let y = startY; y < startY + 10; y++) {
        const soil = new Soil(x, y, this.app.renderer);
        this.world.addObject(soil);
      }
    }

    // Add some boulders, some might be on top of soil
    // Add some boulders (2x2), ensure no overlap
    for (let i = 0; i < 2; i++) {
      const pos = this.findSafePosition(2, 2);
      if (pos) {
        const boulder = new Boulder(pos.x, pos.y, this.app.renderer);
        this.world.addObject(boulder);
      }
    }

    // Add some fences
    for (let i = 0; i < 5; i++) {
      const pos = this.findSafePosition(1, 1);
      if (pos) {
        const fence = new Fence(pos.x, pos.y, this.app.renderer);
        this.world.addObject(fence);
      }
    }

    // Add some wood stumps
    for (let i = 0; i < 2; i++) {
      const pos = this.findSafePosition(2, 2);
      if (pos) {
        const stump = new WoodStump(pos.x, pos.y, this.app.renderer);
        this.world.addObject(stump);
      }
    }

    // Add some weeds
    for (let i = 0; i < 5; i++) {
      const pos = this.findSafePosition(1, 1);
      if (pos) {
        const weed = new Weed(pos.x, pos.y, this.app.renderer);
        this.world.addObject(weed);
      }
    }


    this.player = new Player(
      this.app.renderer,
      this.inputManager,
      this.tileMap,
      this.world,
    );
    this.player.x = 10 * TileMap.TILE_SIZE + TileMap.TILE_SIZE / 2;
    this.player.y = 10 * TileMap.TILE_SIZE + TileMap.TILE_SIZE / 2;

    // Highlight Graphics (above objects, below player)
    const highlightGraphics = new Graphics();
    this.world.addChild(highlightGraphics);
    this.player.setHighlightGraphics(highlightGraphics);

    // Add player to objectLayer for proper depth sorting
    this.world.setPlayer(this.player);

    // Create fade overlay (initially transparent)
    this.fadeOverlay = new Graphics();
    this.fadeOverlay.rect(0, 0, this.app.screen.width, this.app.screen.height);
    this.fadeOverlay.fill(0x000000);
    this.fadeOverlay.alpha = 0;
    this.app.stage.addChild(this.fadeOverlay);

    // Create day counter text
    this.dayText = new Text({
      text: `Day ${this.currentDay}`,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xffffff,
      },
    });
    this.dayText.x = 10;
    this.dayText.y = this.app.screen.height - 40;
    this.app.stage.addChild(this.dayText);

    // Create tool text
    this.toolText = new Text({
      text: `Tool: ${this.player?.getSelectedTool()?.name || "None"}`,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xffffff,
      },
    });
    this.toolText.x = this.app.screen.width - 400;
    this.toolText.y = this.app.screen.height - 40;
    this.app.stage.addChild(this.toolText);

    this.app.ticker.add((ticker) => {
      // Only update game logic when not transitioning
      if (!this.isTransitioning) {
        // Check for P key to advance day
        if (this.inputManager.isJustPressed("KeyP")) {
          console.log("P key pressed! isTransitioning:", this.isTransitioning);
          console.log("Advancing day...");
          this.advanceDay();
        }

        if (this.world) {
          this.world.update(ticker);
        }

        if (this.player) {
          if (this.toolText) {
            const tool = this.player.getSelectedTool();
            const toolName = tool?.name || "None";
            this.toolText.text = `Tool: ${toolName}`;
          }
        }
      }

      this.inputManager.update();
    });
  }

  private findSafePosition(
    width: number,
    height: number,
  ): { x: number; y: number } | null {
    let attempts = 0;
    while (attempts < 100) {
      attempts++;
      // Random position within the map (excluding borders)
      const x = Math.floor(Math.random() * (TileMap.MAP_WIDTH - 1 - width)) + 1;
      const y = Math.floor(Math.random() * (TileMap.MAP_HEIGHT - 1 - height)) + 1;

      // Check for collision with existing objects or blocked tiles
      let blocked = false;
      for (let bx = x; bx < x + width; bx++) {
        for (let by = y; by < y + height; by++) {
          if (this.tileMap?.isBlocked(bx, by)) {
            blocked = true;
            break;
          }
          if (this.world && this.world.getObjectsAt(bx, by).length > 0) {
            blocked = true;
            break;
          }
        }
        if (blocked) break;
      }

      if (!blocked) {
        return { x, y };
      }
    }
    return null;
  }

  private async advanceDay(): Promise<void> {
    console.log("advanceDay called, currentDay:", this.currentDay);
    this.isTransitioning = true;

    // Fade out (0.5s)
    await this.animateFade(0, 1, 500);

    // Pause (1s)
    await this.wait(1000);

    // Increment day
    this.currentDay++;
    if (this.dayText) {
      this.dayText.text = `Day ${this.currentDay}`;
    }

    // Process day pass events (grow plants, reset water)
    if (this.world) {
      this.world.onDayPass();
    }

    // Fade in (0.5s)
    await this.animateFade(1, 0, 500);

    this.isTransitioning = false;
  }

  private animateFade(
    fromAlpha: number,
    toAlpha: number,
    durationMs: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        if (this.fadeOverlay) {
          this.fadeOverlay.alpha = fromAlpha + (toAlpha - fromAlpha) * progress;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      animate();
    });
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
