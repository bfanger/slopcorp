import { inventory, type Entity, type Room } from "./Entity";

type EventMap = {
  pickup: ItemEvent;
  unlocked: ItemEvent;
  traveled: RoomEvent;
  started: CustomEvent;
  gameover: CustomEvent;
  victory: CustomEvent;
};
class ItemEvent extends Event {
  constructor(
    type: "pickup" | "unlocked",
    public readonly item: Entity,
  ) {
    super(type);
  }
}

class RoomEvent extends Event {
  constructor(
    type: "traveled",
    public readonly room: Room,
  ) {
    super(type);
  }
}

export type GameHook = {
  /** Replaces the answer from the the default tool */
  message?: string;
  /** Delay before processing the message in ms (allows the animations to complete first) */
  delay?: number;
};

/**
 * ECS: Entity Component System
 */
export default class ECS {
  public player: {
    location?: Room;
  };
  public entities: Entity[];
  public gameHook: GameHook | undefined;
  private events = new EventTarget();

  constructor(entities: Entity[]) {
    this.entities = entities;
    this.player = {};
  }

  delay(ms: number): void {
    if ((this.gameHook?.delay ?? 0) < ms) {
      this.gameHook = { ...this.gameHook, delay: ms };
    }
  }

  start(): void {
    this.events.dispatchEvent(new CustomEvent("started"));
  }

  victory(): void {
    this.events.dispatchEvent(new CustomEvent("victory"));
  }

  gameOver(): void {
    this.events.dispatchEvent(new CustomEvent("gameover"));
  }

  /** Subscribe to a typed event emitted by the ECS */
  addEventListener<K extends keyof EventMap>(
    type: K,
    listener: (event: EventMap[K]) => void,
  ): void {
    this.events.addEventListener(type, listener as EventListener);
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
    if (this.player.location?.name !== target.name) {
      this.player.location = target;
      this.events.dispatchEvent(new RoomEvent("traveled", target));
    }
    return true;
  }

  findInRoom(item: string): Entity | undefined {
    const room = this.player.location;
    return this.entities.find(
      (e) => e.name === item && e.discovered !== false && e.location === room,
    );
  }

  /** Look at an item in the current room or inventory and return its description */
  tryLookAt(item: string): string | false {
    const entity = this.findInRoom(item) ?? this.findInInventory(item);
    if (!entity) {
      return false;
    }
    return typeof entity.description === "string"
      ? entity.description
      : entity.description(this);
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
      this.events.dispatchEvent(new ItemEvent("unlocked", targetEntity));
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
    this.events.dispatchEvent(new ItemEvent("pickup", entity));
    return true;
  }

  list(items: string[], empty = "No items"): string {
    if (items.length === 0) {
      return `\n${empty}`;
    }
    return `\n- ${items.join("\n- ")}\n`;
  }
}

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
