import { Player } from "../Player";

export abstract class Tool {
  protected _name: string;

  constructor(
    name: string,
    public isConsumable: boolean = false,
  ) {
    this._name = name;
  }

  get name(): string {
    return this._name;
  }

  abstract use(player: Player): boolean;
}
