import type ECS from "./ECS";

/**
 * Item that can be interacted with in the game
 */
export type Entity = {
  /* unique name (id) */
  name: string;
  location: Room | Inventory;
  /** Allow picking up */
  portable?: true;
  /** Allow opening and closing */
  open?: boolean;
  /** Can be unlocked using that item */
  locked?: string;
  /** when set to false,   */
  discovered?: boolean;
  /** The description of the item, can be dynamic based on game state */
  description: string | ((ecs: ECS) => string);
};

export type Room = {
  type: "room";
  name: string;
};

type Inventory = typeof inventory;
export const inventory = {
  type: "inventory",
  name: Symbol("Inventory"),
} as const;
