// SDL tracking IDs (BRAND_GUIDE §7): the prefix plus 5 characters, exactly 8 in total,
// e.g. DLS7K2M9. Shared by the browser and the server (tsconfig.server.json compiles it too),
// so every place that creates, validates or looks up an ID follows the same rules.
import { TRACKING_PREFIX } from '../config/brand.js';

// No 0/O or 1/I, so an ID read aloud or off a label can't be misread.
export const TRACKING_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const SUFFIX_LENGTH = 5;
const ID_LENGTH = TRACKING_PREFIX.length + SUFFIX_LENGTH;

export const TRACKING_ID_PATTERN = new RegExp(`^${TRACKING_PREFIX}[2-9A-HJ-NP-Z]{${SUFFIX_LENGTH}}$`);
// Multi-piece child label: the parent ID plus a 2-digit piece number, e.g. DLS7K2M9-01.
// The dash is optional so a label typed without it (DLS7K2M901) still resolves.
const PIECE_LABEL_PATTERN = new RegExp(`^(${TRACKING_PREFIX}[2-9A-HJ-NP-Z]{${SUFFIX_LENGTH}})-?(\\d{2})$`);

// Any dash punctuation (hyphen, en/em dash, ...), since IDs get pasted from documents and emails.
const DASHES = /\p{Pd}/gu;

// A random ID from the platform CSPRNG (Web Crypto, available in browsers and Node ≥ 19).
// The alphabet has exactly 32 characters, so `byte & 31` picks each one with equal
// probability. The server is the authority: it checks uniqueness and retries
// (server/trackingIds.ts); anything generated in the browser is a preview at most.
export function generateTrackingId(): string {
  const bytes = new Uint8Array(SUFFIX_LENGTH);
  globalThis.crypto.getRandomValues(bytes);
  let suffix = '';
  for (const b of bytes) suffix += TRACKING_ALPHABET[b & 31];
  return TRACKING_PREFIX + suffix;
}

// Trims, upper-cases and strips spaces and dashes: "dls 7k2-m9" -> "DLS7K2M9". A trailing
// piece number on a full 8-character ID keeps its dash: "dls7k2m9 - 01" -> "DLS7K2M9-01".
export function normalizeTrackingInput(input: string): string {
  const compact = input.trim().toUpperCase().replace(/\s+/g, '').replace(DASHES, '-');
  const piece = /^(.+?)-(\d{2})$/.exec(compact);
  if (piece) {
    const base = piece[1].replace(/-+/g, '');
    if (base.length === ID_LENGTH) return `${base}-${piece[2]}`;
  }
  return compact.replace(/-+/g, '');
}

// Strict check of an already-normalised ID.
export function isValidTrackingId(id: string): boolean {
  return TRACKING_ID_PATTERN.test(id);
}

export interface PieceLabel {
  /** The 8-character shipment ID the label belongs to. */
  parentId: string;
  /** Piece number, from 1. */
  piece: number;
}

// Parses a child label such as DLS7K2M9-01. Input is normalised first; returns null for
// anything that isn't a piece label (including a bare 8-character ID and piece 00).
export function parsePieceLabel(input: string): PieceLabel | null {
  const match = PIECE_LABEL_PATTERN.exec(normalizeTrackingInput(input));
  if (!match) return null;
  const piece = Number(match[2]);
  return piece >= 1 ? { parentId: match[1], piece } : null;
}

export interface ParsedTrackingInput {
  /** The 8-character shipment ID the input resolves to. */
  trackingId: string;
  /** Piece number when the input was a child label such as DLS7K2M9-01. */
  piece?: number;
}

// Resolves free-text input to a shipment ID; a child label resolves to its parent.
// Returns null when the input is not a well-formed SDL tracking ID or piece label.
export function parseTrackingInput(input: string): ParsedTrackingInput | null {
  const clean = normalizeTrackingInput(input);
  if (isValidTrackingId(clean)) return { trackingId: clean };
  const child = parsePieceLabel(clean);
  return child ? { trackingId: child.parentId, piece: child.piece } : null;
}

// Child label for piece `n` of a shipment: DLS7K2M9-01.
export function pieceLabel(trackingId: string, piece: number): string {
  return `${trackingId}-${String(piece).padStart(2, '0')}`;
}
