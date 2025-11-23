import { Renderer } from "pixi.js";
import { Plant } from "./Plant";
import { Soil } from "../Soil";

export class TurnipPlant extends Plant {
  constructor(soil: Soil, renderer: Renderer) {
    super(soil, renderer);
    this.maturityAge = 4;
  }
}
