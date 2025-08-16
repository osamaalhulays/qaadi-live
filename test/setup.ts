import { TextEncoder, TextDecoder } from 'util';

if (!globalThis.TextEncoder) {
  // @ts-ignore
  globalThis.TextEncoder = TextEncoder;
}

if (!globalThis.TextDecoder) {
  // @ts-ignore
  globalThis.TextDecoder = TextDecoder;
}
