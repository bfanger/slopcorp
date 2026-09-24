import type { Entity, Location } from "./Entity";

export function getLocationsTool(entities: Entity[]): LanguageModelTool {
  return {
    name: "getLocations",
    description: "Get a list of locations",
    inputSchema: {
      type: "object",
      additionalProperties: false,
    },
    execute: () => {
      return printList(
        "Locations:",
        getLocations(entities).map((room) => room.name),
      );
    },
  };
}

export function moveToTool(entities: Entity[]): LanguageModelTool {
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
      const room = getLocations(entities).find((l) => l.name === location);
      if (!room) {
        throw new Error(`Location "${location}" not found`);
      }
      const robot = getEntity(entities, "robot");
      const alreadyThere = robot.location === room;
      robot.location = room;
      const items = entities.filter(
        (entity) => entity.location === room && entity !== robot,
      );
      return printList(
        alreadyThere
          ? `You are still in ${room.name}, in this location are:`
          : `You are now in ${room.name}, in this location are:`,
        items.map((item) => item.name),
        `The ${room.name} is empty`,
      );
    },
  };
}

export function getInventoryTool(entities: Entity[]): LanguageModelTool {
  return {
    name: "getInventory",
    description: "Get a list of items you are carrying in your inventory",
    inputSchema: { type: "object", additionalProperties: false },
    execute: () => {
      const items = entities.filter(
        (entity) => entity.location?.type === "inventory",
      );

      return printList(
        `You have ${items.length} items in your inventory:`,
        items.map((item) => item.name),
        "inventory is empty",
      );
    },
  };
}

function getLocations(entities: Entity[]): Location[] {
  const locations: Record<string, Location> = {};
  for (const entity of entities) {
    if (entity.location?.type === "location") {
      locations[entity.location.name] = entity.location;
    }
  }
  return Object.values(locations);
}

function printList(
  title: string,
  items: string[],
  empty?: string,
): Promise<string> {
  if (items.length === 0) {
    if (empty === undefined) {
      throw new Error("No empty state configured");
    }
    return Promise.resolve(empty);
  }
  return Promise.resolve(`${title}\n- ${items.join("\n- ")}`);
}

export function getEntity(entities: Entity[], name: string): Entity {
  const entity = entities.find((e) => e.name === name);
  if (!entity) {
    throw new Error(`Entity "${name}" not found`);
  }
  return entity;
}
