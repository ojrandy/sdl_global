// How a shipment's main leg moves (tracker 2.3). Shared by the browser and the server.
export type TransportMode = 'Road' | 'Air' | 'Sea';

export const TRANSPORT_MODES: TransportMode[] = ['Road', 'Air', 'Sea'];

// Accepts "air", "Sea", "ocean", "road", "truck"…; anything else is undefined.
export function parseTransportMode(value: unknown): TransportMode | undefined {
  if (typeof value !== 'string') return undefined;
  const v = value.trim().toLowerCase().replace(/\s+freight$/, '');
  if (v === 'air') return 'Air';
  if (v === 'sea' || v === 'ocean') return 'Sea';
  if (v === 'road' || v === 'truck' || v === 'ground') return 'Road';
  return undefined;
}

// Customer-facing names for the modes (tracker 2.8).
export const TRANSPORT_MODE_LABELS: Record<TransportMode, string> = {
  Road: 'Road',
  Air: 'Air Freight',
  Sea: 'Ocean Freight',
};
