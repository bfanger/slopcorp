export type Location = {
  type: "location";
  name: string;
};
export type Inventory = { type: "inventory" };

export type Entity = {
  name: string;
  location?: Location | Inventory;
};
