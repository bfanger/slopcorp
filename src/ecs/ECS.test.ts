import { describe, expect, it, vi } from "vitest";
import ECS, { createLocation } from "./ECS";
import { inventory } from "./Entity";

function createDungeon() {
  const ecs = new ECS(
    createLocation("dungeon", [
      // the chest sits on the dungeon floor and can only be opened with the key
      { name: "chest", locked: "key", description: "Chest" },
      // the key lies on the dungeon floor and can be picked up
      { name: "key", portable: true, description: "Key" },
      // the treasure inside the chest has not been discovered yet
      { name: "treasure", discovered: false, description: "Treasure" },
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
    const movedHook = vi.fn();
    ecs.hooks.moved = movedHook;
    expect(ecs.tryMove("nowhere")).toBe(false);
    expect(ecs.player.location).toBeUndefined();
    expect(movedHook).not.toHaveBeenCalled();
  });

  it("calls the moved hook with the target room when the player moves", () => {
    const { ecs, dungeon } = createDungeon();
    const movedHook = vi.fn();
    ecs.hooks.moved = movedHook;
    expect(ecs.tryMove(dungeon.name)).toBe(true);
    expect(ecs.player.location).toBe(dungeon);
    expect(movedHook).toHaveBeenCalledTimes(1);
    expect(movedHook).toHaveBeenCalledWith(dungeon);
    // Moving to the room the player is already in does not fire the hook
    expect(ecs.tryMove(dungeon.name)).toBe(true);
    expect(movedHook).toHaveBeenCalledTimes(1);
  });

  it("createLocation attaches the same location to every item in the room", () => {
    const entities = createLocation("dungeon", [
      { name: "chest", locked: "key", description: "Chest" },
      { name: "key", portable: true, description: "Key" },
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

  it("looks at items in the room and in inventory, and fails for unknown items", () => {
    const { ecs, dungeon } = createDungeon();

    // Can't look at items while not in their room
    expect(ecs.tryLookAt("key")).toBe(false);

    ecs.tryMove(dungeon.name);
    expect(ecs.tryLookAt("key")).toBe("Key");
    expect(ecs.tryLookAt("chest")).toBe("Chest");

    // Undiscovered items can't be looked at
    expect(ecs.tryLookAt("treasure")).toBe(false);

    // Unknown items fail
    expect(ecs.tryLookAt("nope")).toBe(false);

    // Picked-up items can be looked at from inventory
    expect(ecs.tryPickUp("key")).toBe(true);
    expect(ecs.tryLookAt("key")).toBe("Key");
  });

  it("resolves dynamic descriptions when looking at", () => {
    const ecs = new ECS(
      createLocation("lab", [
        {
          name: "lamp",
          description: (e) =>
            e.findInInventory("battery")
              ? "The lamp is switched on"
              : "The lamp is off",
        },
        { name: "battery", portable: true, description: "Battery" },
      ]),
    );

    ecs.tryMove("lab");
    expect(ecs.tryLookAt("lamp")).toBe("The lamp is off");
    expect(ecs.tryPickUp("battery")).toBe(true);
    expect(ecs.tryLookAt("lamp")).toBe("The lamp is switched on");
  });
});
