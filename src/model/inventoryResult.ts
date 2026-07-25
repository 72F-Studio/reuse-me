// Result object for inventory mode.
//
// This is the prevention side of the product. Every other mode answers "what
// went wrong after the fact"; this one answers "what already exists" and is
// meant to be read before code is written. It is deliberately the smallest
// output the tool produces, because its job is to fit in a model's context
// window at the moment it is about to build a component.
export interface InventoryResult {
  mode: "inventory";
  components: InventoryComponent[];
  tokens: InventoryToken[];
  metadata: {
    componentCount: number;
    tokenCount: number;
  };
}

export interface InventoryComponent {
  path: string;
  name: string;
  referenceCount: number;
}

export interface InventoryToken {
  name: string;
  value: string;
  sourcePath: string;
}
