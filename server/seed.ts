import { db } from './db.js';
import { LEGAL_NAME } from '../src/config/brand.js';
import { pieceLabel } from '../src/shared/trackingId.js';
import {
  DEMO_SHIPMENTS, DEMO_QUOTES, DemoShipment,
  hoursFrom, demoTimestamp, demoDate, demoShortDate, placeLabel
} from '../src/shared/demoData.js';

// Seeds the SDL demo shipments, quotes and a sample document (src/shared/demoData.ts).
// Only runs when SEED_DEMO_DATA=true (see db.ts) and the shipments table is empty.
export function seedDatabaseIfEmpty() {
  // Must check whether the table is genuinely empty, not merely whether one demo record
  // exists: deleting a single demo shipment must not make it reappear on the next restart.
  const { count } = db.prepare('SELECT COUNT(*) as count FROM shipments').get() as { count: number };
  if (count > 0) {
    return; // Database already has real data — never reseed over it.
  }

  console.log(`[DB] Seeding ${DEMO_SHIPMENTS.length} SDL demo shipments, quotes and a sample document...`);
  const now = Date.now();

  const insertShipment = db.prepare(`
    INSERT OR IGNORE INTO shipments (
      tracking_number, barcode_code, status, status_text, progress_percent,
      last_updated, created_at, estimated_delivery_date, estimated_delivery_time,
      service, shipment_type, cargo_description, total_weight_lbs, total_pieces,
      declared_value, origin_city, origin_state, origin_lat, origin_lng,
      destination_city, destination_state, destination_lat, destination_lng,
      current_location_city, current_location_state, current_location_lat, current_location_lng,
      current_facility, sender_json, recipient_json, dimensions_json,
      container_json, pallet_json, references_json, cargo_category,
      created_at_ts, progress_updated_at_ts
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertPiece = db.prepare(`
    INSERT OR IGNORE INTO shipment_pieces (
      id, tracking_number, parent_tracking, piece_number, total_pieces,
      status, status_text, current_location, weight_lbs, dimensions_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertEvent = db.prepare(`
    INSERT OR IGNORE INTO tracking_events (
      id, shipment_tracking, status, title, location, facility,
      timestamp, description, operator_notes, delay_flag, completed, current_flag, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertQuote = db.prepare(`
    INSERT OR IGNORE INTO quote_requests (
      id, created_at, status, customer_name, customer_email, customer_phone,
      company, origin_json, destination_json, service, shipment_type,
      cargo_description, weight_lbs, pieces, dimensions_json, declared_value,
      special_instructions, pricing_json, internal_notes, created_at_ts
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDoc = db.prepare(`
    INSERT OR IGNORE INTO documents (
      id, doc_type, title, shipment_tracking,
      sender_name, sender_company, sender_city, sender_state,
      recipient_name, recipient_company, recipient_city, recipient_state,
      cargo_description, shipment_type, service, weight_lbs, pieces, dimensions,
      declared_value, charges_json, bol_carrier, bol_trailer_number, bol_seal_number,
      bol_special_instructions, created_date, status, version, file_size, created_at_ts
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const party = (p: DemoShipment['sender'], place: DemoShipment['origin']) => JSON.stringify({
    name: p.name, company: p.company, email: p.email,
    city: place.city, state: place.region, country: place.country
  });

  const seedShipment = (s: DemoShipment) => {
    const created = hoursFrom(now, -s.createdHoursAgo);
    const eta = hoursFrom(now, s.etaHoursFromNow);
    const delivered = s.status === 'DELIVERED';
    const lastEvent = s.events[s.events.length - 1];

    insertShipment.run(
      s.trackingNumber, `*${s.trackingNumber}*`, s.status, s.statusText, s.progressPercent,
      demoTimestamp(hoursFrom(now, -lastEvent.hoursAgo)), demoShortDate(created),
      demoDate(eta),
      delivered ? `Delivered at ${demoTimestamp(eta).split(' · ')[1]}` : 'by 5:00 PM',
      s.service, s.shipmentType, s.cargoDescription, s.totalWeightLbs, s.pieces,
      s.declaredValue,
      s.origin.city, s.origin.region, s.origin.lat, s.origin.lng,
      s.destination.city, s.destination.region, s.destination.lat, s.destination.lng,
      s.current.city, s.current.region, s.current.lat, s.current.lng,
      s.currentFacility,
      party(s.sender, s.origin), party(s.recipient, s.destination),
      JSON.stringify(s.dimensions),
      s.containerDetails ? JSON.stringify(s.containerDetails) : null,
      s.palletDetails ? JSON.stringify(s.palletDetails) : null,
      JSON.stringify(s.references), s.cargoCategory,
      created.getTime(), now
    );

    for (let n = 1; n <= s.pieces; n++) {
      insertPiece.run(
        `${s.trackingNumber}-P${n}`, pieceLabel(s.trackingNumber, n), s.trackingNumber, n, s.pieces,
        s.status, s.statusText, placeLabel(s.current),
        Math.round((s.totalWeightLbs / s.pieces) * 10) / 10, JSON.stringify(s.dimensions)
      );
    }

    s.events.forEach((e, i) => {
      const isCurrent = i === s.events.length - 1;
      insertEvent.run(
        `ev-${s.trackingNumber}-${i + 1}`, s.trackingNumber, e.status, e.title, placeLabel(e.place), e.facility,
        demoTimestamp(hoursFrom(now, -e.hoursAgo)), e.description, null,
        e.status === 'DELAYED' ? 1 : 0, 1, isCurrent ? 1 : 0, i + 1
      );
    });
  };

  const runSeed = () => {
    DEMO_SHIPMENTS.forEach(seedShipment);

    for (const q of DEMO_QUOTES) {
      const created = hoursFrom(now, -q.hoursAgo);
      const { validForDays, ...pricing } = q.pricing;
      insertQuote.run(
        q.id, created.toISOString(), q.status, q.customerName, q.customerEmail, '',
        q.company,
        JSON.stringify({ city: q.origin.city, state: q.origin.region, country: q.origin.country }),
        JSON.stringify({ city: q.destination.city, state: q.destination.region, country: q.destination.country }),
        q.service, q.shipmentType, q.cargoDescription, q.weightLbs, q.pieces,
        JSON.stringify(q.dimensions), q.declaredValue, q.specialInstructions,
        JSON.stringify({ ...pricing, validUntil: hoursFrom(created.getTime(), validForDays * 24).toISOString().slice(0, 10) }),
        q.internalNotes, created.getTime()
      );
    }

    // Sample document: the ocean bill of lading for the Shanghai -> Rotterdam container.
    const sea = DEMO_SHIPMENTS.find(s => s.trackingNumber === 'DLS8M4PQ')!;
    const docCreated = hoursFrom(now, -sea.createdHoursAgo);
    insertDoc.run(
      'doc-bol-dls8m4pq', 'BOL', 'Ocean Bill of Lading', sea.trackingNumber,
      sea.sender.name, sea.sender.company, sea.origin.city, sea.origin.region,
      sea.recipient.name, sea.recipient.company, sea.destination.city, sea.destination.region,
      sea.cargoDescription, sea.shipmentType, sea.service, sea.totalWeightLbs, sea.pieces,
      `${sea.dimensions.length} × ${sea.dimensions.width} × ${sea.dimensions.height} in`,
      sea.declaredValue,
      JSON.stringify({ baseRate: 3200, insurance: 450, fuelSurcharge: 272, total: 3922 }),
      LEGAL_NAME, sea.containerDetails!.containerNumber, sea.containerDetails!.boltSeal,
      'Keep container sealed until customs inspection at destination.',
      demoShortDate(docCreated), 'GENERATED', 1, '1.4 MB', docCreated.getTime()
    );
  };

  // Atomic seed — node:sqlite has no db.transaction() helper.
  db.exec('BEGIN');
  try {
    runSeed();
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  console.log('[DB] Seeding completed successfully.');
}
