import { inventory, type Entity, type Room } from "./Entity";

/**
 * Create entities inside a location.
 *
 * Usage:
 *   const entities = [...createLocation("room1", $room1entities), ...createLocation("room2", $room2entities)]
 */
export function createLocation(
  name: string,
  entities: Omit<Entity, "location">[],
): (Omit<Entity, "location"> & {
  location: Room;
})[] {
  const location: Room = { type: "room", name };
  return entities.map((entity) => ({ ...entity, location }));
}

export type Hooks = {
  pickup?: (item: Entity) => void;
  unlocked?: (item: Entity) => void;
};

/**
 * ECS: Entity Component System
 */
export default class ECS {
  public player: {
    location?: Room;
  };
  public entities: Entity[];
  public hooks: Hooks;

  constructor(entities: Entity[], hooks: Hooks = {}) {
    this.entities = entities;
    this.hooks = hooks;
    this.player = {};
  }

  /** Raw access to entities, no game logic applied */
  getEntity(name: string): Entity {
    const entity = this.entities.find((item) => item.name === name);
    if (!entity) {
      throw new Error(`Entity "${name}" not found`);
    }
    return entity;
  }
  /** Raw access to rooms, no game logic applied */
  getRoom(name: string): Room {
    const location = this.entities.find(
      (entity) =>
        entity.location.type === "room" && entity.location.name === name,
    )?.location;
    if (!location) {
      throw new Error(`Location "${name}" not found`);
    }
    return location as Room;
  }

  getRooms(): Room[] {
    const rooms: Record<string, Room> = {};
    for (const entity of this.entities) {
      const location = entity.location;
      if (location.type === "room") {
        rooms[location.name] = location;
      }
    }
    return Object.values(rooms);
  }

  tryMove(room: string): boolean {
    const target = this.getRooms().find((entry) => entry.name === room);
    if (!target) {
      return false;
    }
    this.player.location = target;
    return true;
  }

  findInRoom(item: string): Entity | undefined {
    const room = this.player.location;
    return this.entities.find(
      (e) => e.name === item && e.discovered !== false && e.location === room,
    );
  }

  /** Items currently held in the player's inventory */
  getInventory(): Entity[] {
    return this.entities.filter((entity) => entity.location === inventory);
  }

  findInInventory(name: string) {
    return this.entities.find(
      (e) => e.location === inventory && e.name === name,
    );
  }

  /** Place a held item in the player's current room, unlocking the target if the item fits it */
  tryPlaceItem(item: string, target: string): boolean {
    const itemEntity = this.findInInventory(item);
    const targetEntity = this.findInRoom(target);
    if (!itemEntity || !targetEntity) {
      return false;
    }
    if (targetEntity.locked === itemEntity.name) {
      targetEntity.locked = undefined;
      this.hooks.unlocked?.(targetEntity);
      return true;
    }
    return false;
  }

  /** Pick up a discovered item from the player's current room */
  tryPickUp(item: string): boolean {
    const entity = this.findInRoom(item);
    if (!entity || entity.location?.type !== "room") {
      return false;
    }
    if (!entity.portable) {
      return false;
    }
    entity.location = inventory;
    this.hooks.pickup?.(entity);
    return true;
  }

  list(items: string[], empty = "No items"): string {
    if (items.length === 0) {
      return `\n${empty}`;
    }
    return `\n- ${items.join("\n- ")}\n`;
  }
}
