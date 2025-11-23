import { Container, Sprite, Ticker, Graphics, Renderer } from "pixi.js";
import { InputManager } from "./InputManager";
import { TileMap } from "./TileMap";
import { GameObject } from "./GameObject";

export class Player extends Container {
    private speed = 2;
    private direction: "up" | "down" | "left" | "right" = "down";
    private sprite: Sprite;

    private heldObject: GameObject | null = null;

    constructor(
        renderer: Renderer,
        private inputManager: InputManager,
        private tileMap: TileMap,
        private objects: GameObject[],
        private onAddObject: (obj: GameObject) => void,
        private onRemoveObject: (obj: GameObject) => void
    ) {
        super();

        const graphics = new Graphics()
            .rect(0, 0, TileMap.TILE_SIZE, TileMap.TILE_SIZE)
            .fill(0xFF0000); // Red player

        const texture = renderer.generateTexture(graphics);

        this.sprite = new Sprite(texture);
        this.sprite.anchor.set(0.5);
        this.addChild(this.sprite);

        // this.scale.set(0.8); // Make player slightly smaller than tile
    }

    public update(ticker: Ticker): void {
        const delta = ticker.deltaTime;
        let dx = 0;
        let dy = 0;

        if (this.inputManager.isKeyDown("ArrowUp") || this.inputManager.isKeyDown("KeyW")) {
            dy -= this.speed * delta;
            this.direction = "up";
        }
        else if (this.inputManager.isKeyDown("ArrowDown") || this.inputManager.isKeyDown("KeyS")) {
            dy += this.speed * delta;
            this.direction = "down";
        }

        if (this.inputManager.isKeyDown("ArrowLeft") || this.inputManager.isKeyDown("KeyA")) {
            dx -= this.speed * delta;
            this.direction = "left";
        }
        else if (this.inputManager.isKeyDown("ArrowRight") || this.inputManager.isKeyDown("KeyD")) {
            dx += this.speed * delta;
            this.direction = "right";
        }

        if (dx !== 0 || dy !== 0) {
            this.move(dx, dy);
        }

        if (this.inputManager.isJustPressed("KeyX")) {
            this.interact();
        }

        this.updateHighlight();
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
