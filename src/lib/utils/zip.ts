// Minimal ZIP writer (STORE method). Suitable for small exports on Edge.
const te = new TextEncoder();

/** CRC32 (poly 0xEDB88320) */
function crc32(u8: Uint8Array) {
  let c = ~0 >>> 0;
  for (let i = 0; i < u8.length; i++) {
    c ^= u8[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & (-(c & 1)));
  }
  return (~c) >>> 0;
}

function dosDateTime(d: Date) {
  const time =
    ((d.getHours() & 0x1f) << 11) |
    ((d.getMinutes() & 0x3f) << 5) |
    ((Math.floor(d.getSeconds() / 2)) & 0x1f);
  const date =
    (((d.getFullYear() - 1980) & 0x7f) << 9) |
    ((d.getMonth() + 1) << 5) |
    (d.getDate() & 0x1f);
  return { time, date };
}

function writeU16(v: number) { const b = new Uint8Array(2); new DataView(b.buffer).setUint16(0, v, true); return b; }
function writeU32(v: number) { const b = new Uint8Array(4); new DataView(b.buffer).setUint32(0, v >>> 0, true); return b; }

export type ZipFile = { path: string; content: string | Uint8Array };

export function makeZip(files: ZipFile[], now = new Date()): Uint8Array {
  const parts: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const { time, date } = dosDateTime(now);

  for (const f of files) {
    const name = te.encode(f.path.replace(/^\/+/, ""));
    const data = typeof f.content === "string" ? te.encode(f.content) : f.content;
    const crc = crc32(data);
    const size = data.byteLength;

    // Local file header
    parts.push(
      writeU32(0x04034b50),        // signature
      writeU16(20),                 // version
      writeU16(0),                  // flags
      writeU16(0),                  // method = STORE
      writeU16(time), writeU16(date),
      writeU32(crc), writeU32(size), writeU32(size),
      writeU16(name.length), writeU16(0),
      name, data
    );

    // Central directory entry
    central.push(
      writeU32(0x02014b50),        // central signature
      writeU16(20), writeU16(20),  // version made/needed
      writeU16(0), writeU16(0),    // flags/method
      writeU16(time), writeU16(date),
      writeU32(crc), writeU32(size), writeU32(size),
      writeU16(name.length), writeU16(0), writeU16(0),
      writeU16(0), writeU16(0),    // disk/start attrs
      writeU32(0),                 // external attrs
      writeU32(offset),
      name
    );

    // advance offset by this local header + name + data sizes
    offset += 30 + name.length + size;
  }

  const centralBlob = concat(central);
  const centralSize = centralBlob.byteLength;
  const centralOffset = offset;

  // End of central directory
  const end = concat([
    writeU32(0x06054b50),
    writeU16(0), writeU16(0),
    writeU16(files.length), writeU16(files.length),
    writeU32(centralSize),
    writeU32(centralOffset),
    writeU16(0)
  ]);

  return concat([...parts, centralBlob, end]);

  function concat(arrs: Uint8Array[]) {
    const total = arrs.reduce((n, a) => n + a.byteLength, 0);
    const out = new Uint8Array(total);
    let p = 0;
    for (const a of arrs) { out.set(a, p); p += a.byteLength; }
    return out;
  }
}
