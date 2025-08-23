import type { Card } from "./schema/card";

export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionError";
  }
}

const RIGHTS: Record<string, Set<string>> = {
  secretary: new Set(["read", "write"]),
  judge: new Set(["read", "write"]),
  archivist: new Set(["read"]),
};

// accessControl verifies that a module can perform an action on a card.
// If the module is the archivist and reading, it returns a frozen copy of the card.
export function accessControl(module: string, card: Card, action: string): Card;
export function accessControl(module: string, card: null, action: string): null;
export function accessControl(
  module: string,
  card: Card | null,
  action: string
): Card | null {
  const allowed = RIGHTS[module];
  if (!allowed || !allowed.has(action)) {
    throw new PermissionError(`${module} cannot ${action}`);
  }
  if (module === "archivist" && action === "read" && card) {
    return Object.freeze(JSON.parse(JSON.stringify(card))) as Card;
  }
  return card;
}
