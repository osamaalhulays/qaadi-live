import type { Card } from "./schema/card";

const store = new Map<string, Card>();
let nextId = 1;

export function createCard(data: Card["data"]): Card {
  const id = String(nextId++);
  const now = new Date().toISOString();
  const card: Card = {
    id,
    data,
    version: "1.0",
    status: "open",
    parent_id: null,
    date_created: now,
    last_modified: now,
  };
  store.set(id, card);
  return card;
}

export function updateCard(id: string, data: Partial<Card>): Card | null {
  const existing = store.get(id);
  if (!existing || existing.status === "archived") return null;
  const updated: Card = {
    ...existing,
    ...data,
    id,
    date_created: existing.date_created,
    last_modified: new Date().toISOString(),
  };
  store.set(id, updated);
  return updated;
}

export function getCard(id: string): Card | undefined {
  return store.get(id);
}
