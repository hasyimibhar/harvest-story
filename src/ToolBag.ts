import { Tool } from "./tools/Tool";
import { Hammer } from "./tools/Hammer";
import { Hoe } from "./tools/Hoe";
import { Sickle } from "./tools/Sickle";
import { WateringCan } from "./tools/WateringCan";
import { TurnipSeed } from "./tools/TurnipSeed";

export class ToolBag {
  public tools: (Tool | null)[] = [
    new Hammer(),
    new Hoe(),
    new Sickle(),
    new WateringCan(),
    new TurnipSeed(),
  ];
  public selectedIndex: number = 0;

  public cycle(direction: number): void {
    this.selectedIndex =
      (this.selectedIndex + direction + this.tools.length) % this.tools.length;
  }

  public getSelectedTool(): Tool | null {
    return this.tools[this.selectedIndex];
  }

  public setTool(index: number, tool: Tool | null): void {
    this.tools[index] = tool;
  }
}
