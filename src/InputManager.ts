export class InputManager {
    public keys: { [key: string]: boolean } = {};

    constructor() {
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    private onKeyDown(event: KeyboardEvent): void {
        this.keys[event.code] = true;
    }

    private onKeyUp(event: KeyboardEvent): void {
        this.keys[event.code] = false;
    }

    public isKeyDown(keyCode: string): boolean {
        return !!this.keys[keyCode];
    }
}
