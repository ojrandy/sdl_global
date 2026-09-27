// SDL tracking IDs (BRAND_GUIDE §7): the prefix plus 5 characters, exactly 8 in total,
// e.g. DLS7K2M9. Shared by the browser and the server (server/tsconfig compiles it too), so
// every place that creates, validates or looks up an ID follows the same rules.
import { TRACKING_PREFIX } from '../config/brand.js';

// No 0/O or 1/I, so an ID read aloud or off a label can't be misread.
export const TRACKING_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const SUFFIX_LENGTH = 5;

export const TRACKING_ID_PATTERN = new RegExp(`^${TRACKING_PREFIX}[2-9A-HJ-NP-Z]{${SUFFIX_LENGTH}}$`);
// Multi-piece child label: the parent ID plus a 2-digit piece number, e.g. DLS7K2M9-01.
const CHILD_LABEL_PATTERN = new RegExp(`^(${TRACKING_PREFIX}[2-9A-HJ-NP-Z]{${SUFFIX_LENGTH}})(\\d{2})$`);

// A random ID. The alphabet has exactly 32 characters, so `byte & 31` picks each one with
// equal probability. The server is the authority: it checks uniqueness and retries.
export function generateTrackingId(): string {
  const bytes = new Uint8Array(SUFFIX_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  let suffix = '';
  for (const b of bytes) suffix += TRACKING_ALPHABET[b & 31];
  return TRACKING_PREFIX + suffix;
}

// Trims, upper-cases and strips spaces and dashes: "dls 7k2-m9" -> "DLS7K2M9".
export function normalizeTrackingInput(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]+/g, '');
}

export function isValidTrackingId(id: string): boolean {
  return TRACKING_ID_PATTERN.test(id);
}

export interface ParsedTrackingInput {
  /** The 8-character shipment ID the input resolves to. */
  trackingId: string;
  /** Piece number when the input was a child label such as DLS7K2M9-01. */
  piece?: number;
}

// Resolves free-text input to a shipment ID; a child label resolves to its parent.
// Returns null when the input is not a well-formed SDL tracking ID.
export function parseTrackingInput(input: string): ParsedTrackingInput | null {
  const clean = normalizeTrackingInput(input);
  if (isValidTrackingId(clean)) return { trackingId: clean };
  const child = CHILD_LABEL_PATTERN.exec(clean);
  if (child) return { trackingId: child[1], piece: Number(child[2]) };
  return null;
}

// Child label for piece `n` of a shipment: DLS7K2M9-01.
export function pieceLabel(trackingId: string, piece: number): string {
  return `${trackingId}-${String(piece).padStart(2, '0')}`;
}
