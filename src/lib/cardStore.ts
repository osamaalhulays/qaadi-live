export interface Card {
  id: string;
  data: any;
}

const store = new Map<string, any>();
let nextId = 1;

export function createCard(data: any): string {
  const id = String(nextId++);
  store.set(id, data);
  return id;
}

export function updateCard(id: string, data: any): boolean {
  if (!store.has(id)) return false;
  store.set(id, data);
  return true;
}

export function getCard(id: string): any | undefined {
  return store.get(id);
}
