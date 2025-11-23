import { Player } from "../Player";

export abstract class Tool {
  protected _name: string;
  protected _isConsumable: boolean;

  constructor(name: string, isConsumable: boolean = false) {
    this._name = name;
    this._isConsumable = isConsumable;
  }

  get name(): string {
    return this._name;
  }

  get isConsumable(): boolean {
    return this._isConsumable;
  }

  get isDepleted(): boolean {
    return false;
  }

  abstract use(player: Player): boolean;
}
