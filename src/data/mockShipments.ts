// DEMO DATA — remove before launch (tracker 6.7). This whole file.
import { Shipment, ShipmentStatus, TrackingEvent } from '../types/shipment';
import { parseTrackingInput, pieceLabel } from '../shared/trackingId';
import { formatInZone, timeZoneForPlace } from '../shared/timeZones';
import {
  DEMO_SHIPMENTS, DemoShipment, DemoPlace,
  hoursFrom, demoTimestamp, demoDate, demoShortDate, placeLabel
} from '../shared/demoData';

// Client-side copies of the SDL demo shipments (src/shared/demoData.ts, also seeded into the
// database by server/seed.ts). Shown as placeholders until the real records load.

const now = Date.now();

const party = (p: DemoShipment['sender'], place: DemoPlace) => ({
  name: p.name,
  company: p.company,
  email: p.email,
  city: place.city,
  state: place.region,
  country: place.country,
});

const place = (p: DemoPlace) => ({ city: p.city, state: p.region, country: p.country, lat: p.lat, lng: p.lng });

function toShipment(s: DemoShipment): Shipment {
  const eta = hoursFrom(now, s.etaHoursFromNow);
  const created = hoursFrom(now, -s.createdHoursAgo);
  const lastEvent = s.events[s.events.length - 1];

  // Newest first, as the timeline renders it.
  const timeline: TrackingEvent[] = s.events.map((e, i) => {
    const at = hoursFrom(now, -e.hoursAgo);
    // Same as the seeded rows: local time in the event's own zone, plus its UTC offset.
    const zone = timeZoneForPlace({ city: e.place.city, state: e.place.region, country: e.place.country, lat: e.place.lat, lng: e.place.lng });
    const { displayDate, displayTime, utcOffset } = formatInZone(at.getTime(), zone);
    return {
      id: `ev-${s.trackingNumber}-${i + 1}`,
      timestamp: at.toISOString(),
      occurredAt: at.toISOString(),
      timezone: zone,
      utcOffset,
      displayDate,
      displayTime,
      title: e.title,
      eventStatus: e.status,
      facility: e.facility,
      city: e.place.city,
      state: e.place.region,
      description: e.description,
      isCurrent: i === s.events.length - 1,
      isCompleted: true,
    } as TrackingEvent;
  }).reverse();

  return {
    trackingNumber: s.trackingNumber,
    barcodeCode: `*${s.trackingNumber}*`,
    status: s.status as ShipmentStatus,
    statusText: s.statusText,
    statusMessage: s.statusMessage,
    progressPercent: s.progressPercent,
    health: s.health,
    healthExplanation: s.healthExplanation,
    shipmentType: s.shipmentType,
    transportMode: s.mode,
    cargoCategory: s.cargoCategory,
    cargoDescription: s.cargoDescription,
    service: s.service,
    shipmentDate: demoDate(created),
    createdAt: demoShortDate(created),
    createdAtTs: created.getTime(),
    estimatedDelivery: demoDate(eta),
    estimatedDeliveryDetail: s.status === 'DELIVERED' ? `Delivered at ${demoTimestamp(eta).split(' · ')[1]}` : 'by 5:00 PM',
    currentLocation: placeLabel(s.current),
    currentFacility: s.currentFacility,
    lastUpdated: demoTimestamp(hoursFrom(now, -lastEvent.hoursAgo)),
    origin: place(s.origin),
    destination: place(s.destination),
    sender: party(s.sender, s.origin),
    recipient: party(s.recipient, s.destination),
    totalWeightLbs: s.totalWeightLbs,
    totalPieces: s.pieces,
    declaredValue: s.declaredValue,
    dimensions: s.dimensions,
    references: s.references,
    containerDetails: s.containerDetails,
    palletDetails: s.palletDetails,
    routeCheckpoints: [
      { id: 'origin', name: s.origin.city, state: s.origin.region, type: 'origin', statusLabel: 'Origin', lat: s.origin.lat, lng: s.origin.lng },
      { id: 'current', name: s.current.city, state: s.current.region, type: 'current', statusLabel: 'Current Location', lat: s.current.lat, lng: s.current.lng },
      { id: 'destination', name: s.destination.city, state: s.destination.region, type: 'destination', statusLabel: 'Destination', lat: s.destination.lat, lng: s.destination.lng },
    ],
    pieces: Array.from({ length: s.pieces }, (_, i) => ({
      id: `${s.trackingNumber}-P${i + 1}`,
      pieceNumber: i + 1,
      totalPieces: s.pieces,
      trackingNumber: pieceLabel(s.trackingNumber, i + 1),
      status: s.status as ShipmentStatus,
      statusText: s.statusText,
      currentLocation: placeLabel(s.current),
      weightLbs: Math.round((s.totalWeightLbs / s.pieces) * 10) / 10,
      dimensions: s.dimensions,
    })),
    timeline,
    exception: s.exception ? { ...s.exception, date: demoDate(hoursFrom(now, -lastEvent.hoursAgo)) } : undefined,
    proofOfDelivery: s.proofOfDelivery ? { ...s.proofOfDelivery, deliveredAt: demoTimestamp(eta) } : undefined,
  } as Shipment;
}

export const MOCK_SHIPMENTS: Record<string, Shipment> = Object.fromEntries(
  DEMO_SHIPMENTS.map(s => [s.trackingNumber, toShipment(s)])
);

export const PRIMARY_SHIPMENT: Shipment = MOCK_SHIPMENTS[DEMO_SHIPMENTS[0].trackingNumber];

// Accepts "dls 7k2-m9" and child labels such as DLS7K2M9-01 (BRAND_GUIDE §7).
export function getShipmentByTrackingNumber(trackingNumber: string): Shipment | null {
  const parsed = parseTrackingInput(trackingNumber);
  return parsed ? MOCK_SHIPMENTS[parsed.trackingId] ?? null : null;
}
