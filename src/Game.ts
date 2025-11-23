import { Application, Graphics, Container, Text } from "pixi.js";
import { TileMap } from "./TileMap";
import { Player } from "./Player";
import { InputManager } from "./InputManager";
import { GameObject } from "./GameObject";
import { Boulder } from "./Boulder";
import { Soil } from "./Soil";
import { Fence } from "./Fence";
import { Weed } from "./Weed";

export class Game {
  private app: Application;
  private inputManager: InputManager;
  private tileMap: TileMap | undefined;
  private player: Player | undefined;
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

    // Create a world container to center everything
    const world = new Container();
    this.app.stage.addChild(world);

    // Center the world container
    world.x =
      (this.app.screen.width - TileMap.MAP_WIDTH * TileMap.TILE_SIZE) / 2;
    world.y =
      (this.app.screen.height - TileMap.MAP_HEIGHT * TileMap.TILE_SIZE) / 2;

    const grassGraphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
      .fill(0x00ff00);
    const grassTexture = this.app.renderer.generateTexture(grassGraphics);

    const rockGraphics = new Graphics()
      .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
      .fill(0x808080);
    const rockTexture = this.app.renderer.generateTexture(rockGraphics);

    this.tileMap = new TileMap(grassTexture, rockTexture);
    world.addChild(this.tileMap);

    // Soil Layer (rendered first, below everything)
    const soilLayer = new Container();
    world.addChild(soilLayer);

    // Object Layer
    const objectLayer = new Container();
    world.addChild(objectLayer);

    const objects: GameObject[] = [];

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
        objects.push(soil);
        soilLayer.addChild(soil); // Add to soilLayer instead of objectLayer
      }
    }

    // Add some boulders, some might be on top of soil
    for (let i = 0; i < 5; i++) {
      // Random position within the map (excluding borders)
      const x = Math.floor(Math.random() * (TileMap.MAP_WIDTH - 2)) + 1;
      const y = Math.floor(Math.random() * (TileMap.MAP_HEIGHT - 2)) + 1;

      const boulder = new Boulder(x, y, this.app.renderer);
      objects.push(boulder);
      objectLayer.addChild(boulder);
    }

    // Explicitly place a boulder on the soil patch for testing
    const testBoulder = new Boulder(startX + 5, startY + 5, this.app.renderer);
    objects.push(testBoulder);
    objectLayer.addChild(testBoulder);

    // Add some fences
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * (TileMap.MAP_WIDTH - 2)) + 1;
      const y = Math.floor(Math.random() * (TileMap.MAP_HEIGHT - 2)) + 1;
      const fence = new Fence(x, y, this.app.renderer);
      objects.push(fence);
      objectLayer.addChild(fence);
    }

    // Add some weeds
    for (let i = 0; i < 5; i++) {
      const x = Math.floor(Math.random() * (TileMap.MAP_WIDTH - 2)) + 1;
      const y = Math.floor(Math.random() * (TileMap.MAP_HEIGHT - 2)) + 1;
      const weed = new Weed(x, y, this.app.renderer);
      objects.push(weed);
      objectLayer.addChild(weed);
    }

    this.player = new Player(
      this.app.renderer,
      this.inputManager,
      this.tileMap,
      objects,
      (obj: GameObject) => {
        objects.push(obj);
        // Add soil to soilLayer, everything else to objectLayer
        if (obj instanceof Soil) {
          soilLayer.addChild(obj);
        } else {
          objectLayer.addChild(obj);
        }
      },
      (obj: GameObject) => {
        const index = objects.indexOf(obj);
        if (index !== -1) {
          objects.splice(index, 1);
        }
        // Remove from appropriate layer
        if (obj instanceof Soil) {
          soilLayer.removeChild(obj);
        } else {
          objectLayer.removeChild(obj);
        }
      },
    );
    this.player.x = 10 * TileMap.TILE_SIZE + TileMap.TILE_SIZE / 2;
    this.player.y = 10 * TileMap.TILE_SIZE + TileMap.TILE_SIZE / 2;

    // Highlight Graphics (above objects, below player)
    const highlightGraphics = new Graphics();
    world.addChild(highlightGraphics);
    this.player.setHighlightGraphics(highlightGraphics);

    // Add player to objectLayer for proper depth sorting
    objectLayer.addChild(this.player);

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
      text: `Tool: ${this.player.getSelectedTool().name}`,
      style: {
        fontFamily: "Arial",
        fontSize: 24,
        fill: 0xffffff,
      },
    });
    this.toolText.x = this.app.screen.width - 250;
    this.toolText.y = this.app.screen.height - 40;
    this.app.stage.addChild(this.toolText);

    this.app.ticker.add((ticker) => {
      // Only update game logic when not transitioning
      if (!this.isTransitioning) {
        if (this.player) {
          this.player.update(ticker);
          // Update tool UI
          if (this.toolText) {
            this.toolText.text = `Tool: ${this.player.getSelectedTool().name}`;
          }
        }

        // Check for P key to advance day
        if (this.inputManager.isJustPressed("KeyP")) {
          console.log("P key pressed! isTransitioning:", this.isTransitioning);
          console.log("Advancing day...");
          this.advanceDay();
        }

        // Sort objectLayer children by y-coordinate for proper depth rendering
        objectLayer.children.sort((a, b) => a.y - b.y);
      }

      this.inputManager.update();
    });
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
