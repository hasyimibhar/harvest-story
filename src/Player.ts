import { Container, Sprite, Ticker, Graphics, Renderer } from "pixi.js";
import { InputManager } from "./InputManager";
import { TileMap } from "./TileMap";
import { GameObject } from "./GameObject";
import { Soil } from "./Soil";
import { Plant } from "./Plant";

export class Player extends Container {
    private speed = 2;
    private direction: "up" | "down" | "left" | "right" = "down";
    private sprite: Sprite;

    private heldObject: GameObject | null = null;

    // Tool system
    public toolBag: string[] = ["Hammer", "Hoe", "Sickle", "Watering Can", "Turnip Seed"];
    public selectedToolIndex: number = 0;

    constructor(
        private renderer: Renderer,
        private inputManager: InputManager,
        private tileMap: TileMap,
        private objects: GameObject[],
        private onAddObject: (obj: GameObject) => void,
        private onRemoveObject: (obj: GameObject) => void
    ) {
        super();

        const graphics = new Graphics()
            .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE * 1.5)
            .fill(0xFF0000); // Red player

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
            this.direction = "up";
        }
        else if (this.inputManager.isKeyDown("ArrowDown")) {
            dy += this.speed * delta;
            this.direction = "down";
        }

        if (this.inputManager.isKeyDown("ArrowLeft")) {
            dx -= this.speed * delta;
            this.direction = "left";
        }
        else if (this.inputManager.isKeyDown("ArrowRight")) {
            dx += this.speed * delta;
            this.direction = "right";
        }

        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy);
        }

        if (this.inputManager.isJustPressed("KeyX")) {
            this.interact();
        }

        // Tool controls
        if (this.inputManager.isJustPressed("KeyQ")) {
            this.cycleTool(-1);
        }
        if (this.inputManager.isJustPressed("KeyW")) {
            this.cycleTool(1);
        }
        if (this.inputManager.isJustPressed("KeyA")) {
            this.useTool();
        }

        this.updateHighlight();
    }

    private cycleTool(direction: number): void {
        this.selectedToolIndex += direction;
        if (this.selectedToolIndex < 0) {
            this.selectedToolIndex = this.toolBag.length - 1;
        } else if (this.selectedToolIndex >= this.toolBag.length) {
            this.selectedToolIndex = 0;
        }
    }

    public getSelectedTool(): string {
        return this.toolBag[this.selectedToolIndex];
    }

    private useTool(): void {
        const currentTool = this.getSelectedTool();
        if (currentTool === "None") return;

        if (currentTool === "Turnip Seed") {
            // 3x3 area centered on player
            const centerGridX = Math.floor(this.x / TileMap.TILE_SIZE);
            const centerGridY = Math.floor(this.y / TileMap.TILE_SIZE);
            let seedUsed = false;

            for (let x = centerGridX - 1; x <= centerGridX + 1; x++) {
                for (let y = centerGridY - 1; y <= centerGridY + 1; y++) {
                    // Find objects at this tile
                    // Check if there is already a plant or blocking object
                    let targetSoil: Soil | null = null;
                    let isBlocked = false;

                    // Iterate to find soil and check for blockers
                    for (let i = this.objects.length - 1; i >= 0; i--) {
                        const obj = this.objects[i];
                        if (obj.isAt(x, y)) {
                            if (obj.isSolid) {
                                isBlocked = true;
                                break;
                            }
                            // Check if it's a Plant (or any other non-soil object that blocks planting?)
                            // For now, assume only Soil is valid base.
                            // If there's a Weed, it's not solid, but we shouldn't plant on it?
                            // Weed is not solid.
                            // If there is a Plant, we shouldn't plant.
                            // We need to check if there is ALREADY a plant here.
                            // Since Plant is a GameObject, we can check instanceof Plant?
                            // But Plant class is not imported here yet.
                            // We can check if obj.constructor.name === "Plant"?
                            // Or better, check if we found soil, and if we found anything else on top of it.

                            if (obj instanceof Soil) {
                                targetSoil = obj;
                            } else {
                                // Any other object on top of soil blocks planting (e.g. Weed, Fence, existing Plant)
                                // Fence is solid, handled above.
                                // Weed is not solid.
                                // Existing Plant is not solid.
                                isBlocked = true;
                            }
                        }
                    }

                    if (!isBlocked && targetSoil && targetSoil.canPlant()) {
                        // Create Plant
                        // We don't have renderer stored in Player, but we passed it in constructor.
                        // We should store it.
                        // Wait, we can't change constructor signature easily without updating Game.ts.
                        // Actually, Player constructor ALREADY takes renderer.
                        // Let's check if it's stored.
                        // It is NOT stored as a property.
                        // I need to store it.
                        const plant = new Plant(targetSoil, this.renderer);
                        this.onAddObject(plant);
                        seedUsed = true;
                    }
                }
            }

            if (seedUsed) {
                // Consume seed
                this.toolBag[this.selectedToolIndex] = "None";
                // Update UI if needed (Game.ts loop handles it)
            }
            return;
        }

        // Standard tool usage (single tile)
        const { targetX, targetY } = this.getTargetTile();

        // Iterate in reverse order
        for (let i = this.objects.length - 1; i >= 0; i--) {
            const obj = this.objects[i];
            if (obj.isAt(targetX, targetY)) {
                const result = obj.onToolUse(currentTool);
                if (result.destroyed) {
                    this.objects.splice(i, 1);
                    this.onRemoveObject(obj);
                }

                if (!result.passThrough) {
                    break; // Swallow tool use (default)
                }
                // If passThrough is true, continue to next object
            }
        }
    }

    private getTargetTile(): { targetX: number, targetY: number } {
        const gridX = Math.floor(this.x / TileMap.TILE_SIZE);
        const gridY = Math.floor(this.y / TileMap.TILE_SIZE);
        let targetX = gridX;
        let targetY = gridY;

        switch (this.direction) {
            case "up": targetY -= 1; break;
            case "down": targetY += 1; break;
            case "left": targetX -= 1; break;
            case "right": targetX += 1; break;
        }
        return { targetX, targetY };
    }

    private interact(): void {
        const gridX = Math.floor(this.x / TileMap.TILE_SIZE);
        const gridY = Math.floor(this.y / TileMap.TILE_SIZE);
        let targetX = gridX;
        let targetY = gridY;

        switch (this.direction) {
            case "up":
                targetY -= 1;
                break;
            case "down":
                targetY += 1;
                break;
            case "left":
                targetX -= 1;
                break;
            case "right":
                targetX += 1;
                break;
        }

        if (this.heldObject) {
            // Try to place object
            if (this.canPlaceObject(this.heldObject, targetX, targetY)) {
                this.heldObject.gridX = targetX;
                this.heldObject.gridY = targetY;
                this.heldObject.x = targetX * TileMap.TILE_SIZE;
                this.heldObject.y = targetY * TileMap.TILE_SIZE;

                // Remove from player children
                this.removeChild(this.heldObject);

                // Handle placement logic (e.g., Weed destroys itself)
                if (this.heldObject.onPlace()) {
                    // Add back to game world if onPlace returns true
                    this.onAddObject(this.heldObject);
                }

                this.heldObject = null;
            }
        } else {
            // Try to interact or pickup
            // Iterate in reverse order to interact with top-most objects first
            for (let i = this.objects.length - 1; i >= 0; i--) {
                const obj = this.objects[i];
                if (obj.isAt(targetX, targetY)) {
                    if (obj.isPickupable) {
                        // Pickup object
                        this.onRemoveObject(obj);
                        this.heldObject = obj;
                        this.addChild(obj);
                        obj.x = 0;
                        obj.y = -TileMap.TILE_SIZE / 2; // Position above head
                        return;
                    }

                    const destroyed = obj.interact();
                    if (destroyed) {
                        this.objects.splice(i, 1);
                    }
                    break; // Only interact with one object at a time (the top one)
                }
            }
        }
    }

    private canPlaceObject(obj: GameObject, x: number, y: number): boolean {
        // Check map bounds
        if (x < 0 || x >= TileMap.MAP_WIDTH || y < 0 || y >= TileMap.MAP_HEIGHT) {
            return false;
        }

        // Check if tile type is valid
        // We need to get tile type from TileMap. 
        // Since TileMap doesn't expose getTileAt, we can check isBlocked for rocks.
        // But Fence logic says "Grass or Soil".
        // TileMap.isBlocked returns true for rocks.
        if (this.tileMap.isBlocked(x, y)) {
            return false;
        }

        // Check for other objects blocking
        for (const other of this.objects) {
            if (other.isAt(x, y)) {
                // Special case: Fence can be placed on Soil
                // If 'other' is Soil, it's okay IF the object allows it.
                // But Soil is an object.
                // We need a way to check if 'other' is Soil.
                // For now, let's assume if there's ANY object, we can't place, UNLESS it's Soil.
                // But we don't have instanceof check easily without importing Soil.
                // Let's use isSolid. Soil is NOT solid.
                if (other.isSolid) {
                    return false;
                }
                // If it's not solid (like Soil), we can place on it?
                // Yes, user said "For fence, it can only be placed down on grass or soil."
            }
        }

        return true;
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
            case "up":
                targetY -= 1;
                break;
            case "down":
                targetY += 1;
                break;
            case "left":
                targetX -= 1;
                break;
            case "right":
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
        const margin = (TileMap.TILE_SIZE / 2) - 2;

        const left = newX - margin;
        const right = newX + margin;
        const top = newY - margin;
        const bottom = newY + margin;

        const topLeftBlocked = this.isBlocked(left, top);
        const topRightBlocked = this.isBlocked(right, top);
        const bottomLeftBlocked = this.isBlocked(left, bottom);
        const bottomRightBlocked = this.isBlocked(right, bottom);

        if (!topLeftBlocked && !topRightBlocked && !bottomLeftBlocked && !bottomRightBlocked) {
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
        for (const obj of this.objects) {
            if (obj.isSolid && obj.isAt(gridX, gridY)) {
                return true;
            }
        }

        return false;
    }
}
