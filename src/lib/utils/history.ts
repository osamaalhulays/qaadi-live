import { getLocal, setLocal } from "./store";

export type Snapshot = {
  timestamp: string;
  target: string;
  lang: string;
  paths: string[];
  zip: string; // base64
};

const KEY = "QAADI_HISTORY";

export function loadHistory(): Snapshot[] {
  try {
    return JSON.parse(getLocal(KEY, "[]"));
  } catch {
    return [];
  }
}

export function addHistory(entry: Snapshot) {
  const list = loadHistory();
  list.unshift(entry);
  // keep only latest 20
  setLocal(KEY, JSON.stringify(list.slice(0, 20)));
}
