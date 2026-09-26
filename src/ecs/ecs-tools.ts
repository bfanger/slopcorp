import type ECS from "./ECS";

const success = (message: string): Promise<string> => Promise.resolve(message);
const fail = (message: string): Promise<string> => {
  const object = new String(message) as string & { toolCallFailed: true };
  object.toolCallFailed = true;
  return Promise.resolve(object);
};

export function getRoomsTool(ecs: ECS): LanguageModelTool {
  return {
    name: "getRooms",
    description: "Get a list of available rooms. Example: getRooms()",
    inputSchema: {
      type: "object",
      additionalProperties: false,
    },
    execute: () =>
      success(`Rooms:${ecs.list(ecs.getRooms().map((room) => room.name))}`),
  };
}

export function moveToTool(ecs: ECS): LanguageModelTool {
  return {
    name: "moveTo",
    description: 'Move to a room. Example: moveTo(room="name_of_the_room")',
    inputSchema: {
      type: "object",
      properties: {
        room: {
          type: "string",
          description: "The name of the room to move to",
        },
      },
      required: ["room"],
    },
    execute: ({ room: name }: { room: string }) => {
      const previous = ecs.player.location;
      if (!ecs.tryMove(name)) {
        return fail(
          `Room "${name}" not found, use the getRooms() tool to get available rooms`,
        );
      }
      const room = ecs.player.location!;
      const alreadyThere = previous === room;
      const items = ecs.entities.filter(
        (entity) => entity.location === room && entity.discovered !== false,
      );
      if (items.length === 0) {
        return success(
          `The location "${room.name}" is empty, nothing to do here`,
        );
      }
      const intro = alreadyThere
        ? `In ${room.name}`
        : `You are now in ${room.name} and `;
      return success(
        `${intro} you can see:${ecs.list(
          items.map((item) => item.name),
          `The ${room.name} is empty`,
        )}`,
      );
    },
  };
}

export function getInventoryTool(ecs: ECS): LanguageModelTool {
  return {
    name: "getInventory",
    description:
      "Get a list of items you are carrying in your inventory. Example: getInventory()",
    inputSchema: { type: "object", additionalProperties: false },
    execute: () => {
      const items = ecs.getInventory();

      return success(
        `You have ${items.length} items in your inventory:${ecs.list(
          items.map((item) => item.name),
          "inventory is empty",
        )}`,
      );
    },
  };
}

export function pickUpTool(ecs: ECS): LanguageModelTool {
  return {
    name: "pickUp",
    description:
      'Pick up an item from your current location and places it into your inventory. Example: pickUp(item="name_of_the_item")',
    inputSchema: {
      type: "object",
      properties: {
        item: {
          type: "string",
          description: "The name of the item to pick up",
        },
      },
      required: ["item"],
    },
    execute: ({ item }: { item: string }) => {
      if (ecs.tryPickUp(item)) {
        return success(`You took the ${item}`);
      }
      if (ecs.findInRoom(item)) {
        return fail(`${item} can not be picked up.`);
      }
      return fail(
        "That item does not exist in this room, only use names of items you've discovered inside the rooms they are placed",
      );
    },
  };
}

export function placeItemTool(ecs: ECS): LanguageModelTool {
  return {
    name: "placeItem",
    description:
      'Place an item from your inventory onto a item in your current room. Example: placeItem(item="name_of_the_item_in_inventory",target="name_of_the_target_item")',
    inputSchema: {
      type: "object",
      properties: {
        item: {
          type: "string",
          description:
            "The name of the item to place (must be in your inventory)",
        },
        target: {
          type: "string",
          description:
            "The name of the target to place the item onto (in your current room)",
        },
      },
      required: ["item", "target"],
    },
    execute: ({ item, target }: { item: string; target: string }) => {
      if (ecs.tryPlaceItem(item, target)) {
        return success(`You've successfully placed the item`);
      }
      if (!ecs.findInInventory(item)) {
        return fail(
          `You don't have a "${item}" in your inventory, use the getInventory() tool to see what you're carrying`,
        );
      }
      if (!ecs.findInRoom(target)) {
        return fail(
          `The item "${target}" is not in this room, you are in the "${ecs.player.location?.name}" room or the item doesn't exist, only use names of items you've discovered`,
        );
      }
      return fail(`The ${item} does not fit the ${target}`);
    },
  };
}
