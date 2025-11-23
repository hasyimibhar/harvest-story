import { Player } from "../Player";

export abstract class Tool {
  constructor(
    public name: string,
    public isConsumable: boolean = false,
  ) {}

  abstract use(player: Player): boolean;
}
