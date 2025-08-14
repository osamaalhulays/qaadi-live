export type SnapshotState = {
  zip: Uint8Array | null;
  name: string;
  verification: any | null;
};

let state: SnapshotState = {
  zip: null,
  name: "qaadi_export.zip",
  verification: null,
};

export function setSnapshot(zip: Uint8Array, name: string, verification: any) {
  state = { zip, name, verification };
}

export function getSnapshot() {
  return state;
}
