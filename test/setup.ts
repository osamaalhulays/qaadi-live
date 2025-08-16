// Polyfill TextEncoder and TextDecoder so Jest can run in Node environments
// where these globals are not defined.
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;
