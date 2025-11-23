import { GameObject } from "./GameObject";

export class Rucksack {
  public readonly capacity: number = 5;
  private items: (GameObject | null)[] = [];

  constructor() {
    this.items = new Array(this.capacity).fill(null);
  }

  public add(item: GameObject): boolean {
    const emptyIndex = this.items.indexOf(null);
    if (emptyIndex !== -1) {
      this.items[emptyIndex] = item;
      return true;
    }
    return false;
  }

  public remove(): GameObject | null {
    // Find the first non-null item
    const index = this.items.findIndex((item) => item !== null);
    if (index !== -1) {
      const item = this.items[index];
      this.items[index] = null;
      return item;
    }
    return null;
  }

  public peek(): GameObject | null {
    const index = this.items.findIndex((item) => item !== null);
    if (index !== -1) {
      return this.items[index];
    }
    return null;
  }

  public isFull(): boolean {
    return this.items.indexOf(null) === -1;
  }

  public isEmpty(): boolean {
    return this.items.every((item) => item === null);
  }

  public getItems(): (GameObject | null)[] {
    return [...this.items];
  }
}
