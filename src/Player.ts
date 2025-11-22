import { Sprite, Texture, Ticker } from "pixi.js";
import { InputManager } from "./InputManager";
import { TileMap } from "./TileMap";

export class Player extends Sprite {
    private speed = 2;
    private direction: "up" | "down" | "left" | "right" = "down";

    constructor(
        texture: Texture,
        private inputManager: InputManager,
        private tileMap: TileMap
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

        this.updateHighlight();
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
        // Use a margin slightly smaller than half the tile size to allow sliding
        const margin = (TileMap.TILE_SIZE / 2) - 0.1;

        const left = newX - margin;
        const right = newX + margin;
        const top = newY - margin;
        const bottom = newY + margin;

        const topLeftBlocked = this.tileMap.isBlocked(
            Math.floor(left / TileMap.TILE_SIZE),
            Math.floor(top / TileMap.TILE_SIZE)
        );
        const topRightBlocked = this.tileMap.isBlocked(
            Math.floor(right / TileMap.TILE_SIZE),
            Math.floor(top / TileMap.TILE_SIZE)
        );
        const bottomLeftBlocked = this.tileMap.isBlocked(
            Math.floor(left / TileMap.TILE_SIZE),
            Math.floor(bottom / TileMap.TILE_SIZE)
        );
        const bottomRightBlocked = this.tileMap.isBlocked(
            Math.floor(right / TileMap.TILE_SIZE),
            Math.floor(bottom / TileMap.TILE_SIZE)
        );

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

                const tl = this.tileMap.isBlocked(Math.floor(leftOnly / TileMap.TILE_SIZE), Math.floor(topOnly / TileMap.TILE_SIZE));
                const tr = this.tileMap.isBlocked(Math.floor(rightOnly / TileMap.TILE_SIZE), Math.floor(topOnly / TileMap.TILE_SIZE));
                const bl = this.tileMap.isBlocked(Math.floor(leftOnly / TileMap.TILE_SIZE), Math.floor(bottomOnly / TileMap.TILE_SIZE));
                const br = this.tileMap.isBlocked(Math.floor(rightOnly / TileMap.TILE_SIZE), Math.floor(bottomOnly / TileMap.TILE_SIZE));

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

                const tl = this.tileMap.isBlocked(Math.floor(leftOnly / TileMap.TILE_SIZE), Math.floor(topOnly / TileMap.TILE_SIZE));
                const tr = this.tileMap.isBlocked(Math.floor(rightOnly / TileMap.TILE_SIZE), Math.floor(topOnly / TileMap.TILE_SIZE));
                const bl = this.tileMap.isBlocked(Math.floor(leftOnly / TileMap.TILE_SIZE), Math.floor(bottomOnly / TileMap.TILE_SIZE));
                const br = this.tileMap.isBlocked(Math.floor(rightOnly / TileMap.TILE_SIZE), Math.floor(bottomOnly / TileMap.TILE_SIZE));

                if (!tl && !tr && !bl && !br) {
                    this.y = newYOnly;
                }
            }
        }
    }
}
