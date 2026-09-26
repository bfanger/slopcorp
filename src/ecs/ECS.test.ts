import { describe, expect, it, vi } from "vitest";
import ECS, { createLocation, type Hooks } from "./ECS";
import { inventory } from "./Entity";

function createDungeon() {
  const ecs = new ECS(
    createLocation("dungeon", [
      // the chest sits on the dungeon floor and can only be opened with the key
      { name: "chest", locked: "key" },
      // the key lies on the dungeon floor and can be picked up
      { name: "key", portable: true },
      // the treasure inside the chest has not been discovered yet
      { name: "treasure", discovered: false },
    ]),
    {
      unlocked: (item) => {
        if (item.name === "chest") {
          ecs.getEntity("treasure").discovered = true;
        }
      },
    },
  );
  const dungeon = ecs.getRoom("dungeon");
  const key = ecs.getEntity("key");
  const chest = ecs.getEntity("chest");
  const treasure = ecs.getEntity("treasure");
  return { ecs, dungeon, key, chest, treasure };
}

describe("ECS dungeon room", () => {
  it("defines a dungeon room with a locked chest, undiscovered treasure, and a key on the floor", () => {
    const { ecs } = createDungeon();
    expect(ecs.tryMove("dungeon")).toBe(true);
    expect(ecs.getRooms().map((room) => room.name)).toEqual(["dungeon"]);

    const chest = ecs.getEntity("chest");
    expect(chest.location.name).toBe("dungeon");
    expect(chest.locked).toBe("key");

    const key = ecs.getEntity("key");
    expect(key.location.name).toBe("dungeon");
    expect(key.portable).toBe(true);

    const treasure = ecs.entities.find((e) => e.name === "treasure");
    expect(treasure?.discovered).toBe(false);
    expect(ecs.findInRoom("treasure")).toBeUndefined();
  });

  it("moves the player into the dungeon and shows only discovered items", () => {
    const { ecs } = createDungeon();
    expect(ecs.tryMove("dungeon")).toBe(true);
    const visible = ecs.entities.filter(
      (entity) =>
        entity.location.name === "dungeon" && entity.discovered !== false,
    );
    expect(visible.map((entity) => entity.name)).toEqual(["chest", "key"]);
  });

  it("rejects moving to an unknown location", () => {
    const { ecs } = createDungeon();
    expect(ecs.tryMove("nowhere")).toBe(false);
    expect(ecs.player.location).toBeUndefined();
  });

  it("createLocation attaches the same location to every item in the room", () => {
    const entities = createLocation("dungeon", [
      { name: "chest", locked: "key" },
      { name: "key", portable: true },
    ]);
    expect(entities).toHaveLength(2);
    expect(entities[0].location).toBe(entities[1].location);
    expect(entities[0].location).toEqual({ type: "room", name: "dungeon" });
  });

  it("lets the player pick up the key from the dungeon floor", () => {
    const { ecs, key, dungeon } = createDungeon();
    const pickupHook = vi.fn(ecs.hooks.pickup);
    ecs.hooks.pickup = pickupHook;
    expect(key.location).toBe(dungeon);
    // Can't pick up when not in the same room
    expect(ecs.tryPickUp("key")).toBe(false);
    expect(ecs.getInventory()).toHaveLength(0);
    expect(pickupHook).not.toHaveBeenCalled();
    // pickup move the item into inventory
    ecs.tryMove(dungeon.name);
    expect(ecs.tryPickUp("key")).toBe(true);
    expect(key.location).toBe(inventory);
    expect(pickupHook).toHaveBeenCalledTimes(1);
    expect(pickupHook).toHaveBeenCalledWith(key);
  });

  it("lets the player place a held item in the room and unlock the entity it fits", () => {
    const { ecs, key, chest, dungeon, treasure } = createDungeon();

    ecs.tryMove(dungeon.name);
    ecs.tryPickUp("key");

    expect(chest.locked).toBe("key");
    expect(treasure.discovered).toBeFalsy();

    expect(ecs.tryPlaceItem("key", "chest")).toBe(true);
    expect(key.location).toBe(inventory);
    expect(chest.locked).toBeUndefined();
    expect(treasure.discovered).toBeTruthy();
  });
});
