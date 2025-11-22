import { Sprite, Texture, Ticker } from "pixi.js";
import { InputManager } from "./InputManager";
import { TileMap } from "./TileMap";
import { GameObject } from "./GameObject";

export class Player extends Sprite {
    private speed = 2;
    private direction: "up" | "down" | "left" | "right" = "down";

    constructor(
        texture: Texture,
        private inputManager: InputManager,
        private tileMap: TileMap,
        private objects: GameObject[]
    ) {
        super(texture);
        this.anchor.set(0.5);
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

        for (let i = 0; i < this.objects.length; i++) {
            const obj = this.objects[i];
            if (obj.isAt(targetX, targetY)) {
                const destroyed = obj.interact();
                if (destroyed) {
                    this.objects.splice(i, 1);
                    i--;
                }
                break; // Only interact with one object at a time
            }
        }
    }

    private updateHighlight(): void {
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

        this.tileMap.highlightTile(targetX, targetY);
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
            if (obj.isAt(gridX, gridY)) {
                return true;
            }
        }

        return false;
    }
}
