import type ECS from "./ECS";

const respond = (message: string): Promise<string> => Promise.resolve(message);

export function getRoomsTool(ecs: ECS): LanguageModelTool {
  return {
    name: "getRooms",
    description: "Get a list of available rooms",
    inputSchema: {
      type: "object",
      additionalProperties: false,
    },
    execute: () =>
      respond(`Rooms:${ecs.list(ecs.getRooms().map((room) => room.name))}`),
  };
}

export function moveToTool(ecs: ECS): LanguageModelTool {
  return {
    name: "moveTo",
    description: "Move to a location",
    inputSchema: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to move to",
        },
      },
      required: ["location"],
    },
    execute: ({ location }: { location: string }) => {
      const previous = ecs.player.location;
      if (!ecs.tryMove(location)) {
        return respond(
          `Room "${location}" not found, use the getRooms() tool to get available rooms`,
        );
      }
      const room = ecs.player.location!;
      const alreadyThere = previous === room;
      const items = ecs.entities.filter(
        (entity) => entity.location === room && entity.discovered !== false,
      );
      if (items.length === 0) {
        return respond(
          `The location "${room.name}" is empty, nothing to do here`,
        );
      }
      const intro = alreadyThere
        ? `In ${room.name}`
        : `You are now in ${room.name} and `;
      return respond(
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
    description: "Get a list of items you are carrying in your inventory",
    inputSchema: { type: "object", additionalProperties: false },
    execute: () => {
      const items = ecs.getInventory();

      return respond(
        `You have ${items.length} items in your inventory:${ecs.list(
          items.map((item) => item.name),
          "inventory is empty",
        )}`,
      );
    },
  };
}

export function pickUpItemTool(ecs: ECS): LanguageModelTool {
  return {
    name: "pickUpItem",
    description:
      "Pick up an item from your current location and places it into your inventory",
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the item to pick up",
        },
      },
      required: ["item"],
    },
    execute: ({ name }: { name: string }) => {
      if (!ecs.findInRoom(name)) {
        return respond(
          "That item does not exist in this game, only use names of items you've discovered",
        );
      }
      if (!ecs.tryPickUp(name)) {
        throw new Error(`"${name}" is not in your current location`);
      }
      return respond(`You took the ${name}`);
    },
  };
}
