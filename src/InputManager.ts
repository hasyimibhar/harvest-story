export class InputManager {
    private keys: { [key: string]: boolean } = {};
    private previousKeys: { [key: string]: boolean } = {};

    constructor() {
        window.addEventListener("keydown", (e) => {
            this.keys[e.code] = true;
            // Only prevent default for game keys
            const gameKeys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyX", "KeyP"];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener("keyup", (e) => {
            this.keys[e.code] = false;
        });
    }

    public update(): void {
        // Copy current state to previous state
        // This should be called at the END of the game loop frame
        this.previousKeys = { ...this.keys };
    }

    public isKeyDown(keyCode: string): boolean {
        return !!this.keys[keyCode];
    }

    public isJustPressed(keyCode: string): boolean {
        return !!this.keys[keyCode] && !this.previousKeys[keyCode];
    }
}
