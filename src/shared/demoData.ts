// DEMO DATA — remove before launch (tracker 6.7). This whole file (and server/seed.ts).
// SDL demo data (tracker 1.10): the one definition behind server/seed.ts (SEED_DEMO_DATA=true)
// and src/data/mockShipments.ts (the client's placeholder records), so the two never disagree.
// Everything here is fictional: "Demo" names, example.com emails, no phone numbers or street
// addresses. Times are offsets from "now" so a freshly seeded database looks current.
// Demo shipments are removed before launch (tracker 6.7).

import { COMPANY_SHORT } from '../config/brand.js';

export interface DemoPlace {
  city: string;
  /** Short region shown after the city: ISO country code, or the state for US places. */
  region: string;
  country: string;
  lat: number;
  lng: number;
}

const LAGOS: DemoPlace = { city: 'Lagos', region: 'NG', country: 'Nigeria', lat: 6.5244, lng: 3.3792 };
const LONDON: DemoPlace = { city: 'London', region: 'GB', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 };
const SHANGHAI: DemoPlace = { city: 'Shanghai', region: 'CN', country: 'China', lat: 31.2304, lng: 121.4737 };
const SINGAPORE: DemoPlace = { city: 'Singapore', region: 'SG', country: 'Singapore', lat: 1.2644, lng: 103.8222 };
const ROTTERDAM: DemoPlace = { city: 'Rotterdam', region: 'NL', country: 'Netherlands', lat: 51.9244, lng: 4.4777 };
const DUBAI: DemoPlace = { city: 'Dubai', region: 'AE', country: 'United Arab Emirates', lat: 25.2048, lng: 55.2708 };
const NAIROBI: DemoPlace = { city: 'Nairobi', region: 'KE', country: 'Kenya', lat: -1.2921, lng: 36.8219 };
const HOUSTON: DemoPlace = { city: 'Houston', region: 'TX', country: 'United States', lat: 29.7604, lng: -95.3698 };

export interface DemoEvent {
  hoursAgo: number;
  status: string;
  title: string;
  place: DemoPlace;
  facility: string;
  description: string;
}

export interface DemoParty {
  name: string;
  company: string;
  email: string;
}

export interface DemoShipment {
  trackingNumber: string;
  mode: 'Air' | 'Sea';
  status: string;
  statusText: string;
  statusMessage: string;
  health: 'ON_TRACK' | 'POTENTIAL_DELAY' | 'ATTENTION_REQUIRED';
  healthExplanation: string;
  progressPercent: number;
  service: string;
  shipmentType: 'Parcel' | 'Container' | 'Pallet';
  cargoCategory: string;
  cargoDescription: string;
  totalWeightLbs: number;
  pieces: number;
  dimensions: { length: number; width: number; height: number };
  declaredValue: number;
  origin: DemoPlace;
  destination: DemoPlace;
  current: DemoPlace;
  currentFacility: string;
  createdHoursAgo: number;
  /** Positive = hours from now; for a delivered shipment, the (negative) delivery time. */
  etaHoursFromNow: number;
  sender: DemoParty;
  recipient: DemoParty;
  references: { customerReference: string; orderNumber: string; invoiceNumber: string };
  containerDetails?: {
    containerNumber: string; isoSize: string; boltSeal: string; chassisNumber: string;
    terminal: string; vgmWeightLbs: number; temperature: string; customsStatus: string;
  };
  palletDetails?: {
    standard: string; count: number; weightPerSkidLbs: number; heightIn: number;
    stackable: boolean; forkliftAccess: string; securingChecks: string[];
  };
  exception?: { type: string; title: string; description: string; actionRequired: boolean };
  proofOfDelivery?: { signedBy: string; deliveryNotes: string };
  /** Oldest first; the last one is the current event. */
  events: DemoEvent[];
}

const demoShipper = (company: string): DemoParty => ({ name: 'Demo Shipper', company, email: 'shipper@example.com' });
const demoConsignee = (company: string): DemoParty => ({ name: 'Demo Consignee', company, email: 'consignee@example.com' });

export const DEMO_SHIPMENTS: DemoShipment[] = [
  {
    trackingNumber: 'DLS7K2M9',
    mode: 'Air',
    status: 'IN_TRANSIT',
    statusText: 'In Transit',
    statusMessage: 'Departed Lagos on a scheduled flight to London.',
    health: 'ON_TRACK',
    healthExplanation: 'Your shipment is progressing normally on its scheduled route.',
    progressPercent: 55,
    service: 'Express',
    shipmentType: 'Parcel',
    cargoCategory: 'Industrial Machinery',
    cargoDescription: 'Generator spare parts (2 cartons)',
    totalWeightLbs: 88,
    pieces: 2,
    dimensions: { length: 24, width: 18, height: 16 },
    declaredValue: 2400,
    origin: LAGOS,
    destination: LONDON,
    current: LAGOS,
    currentFacility: 'Lagos Air Cargo Terminal (LOS)',
    createdHoursAgo: 30,
    etaHoursFromNow: 20,
    sender: demoShipper('Demo Engineering Supplies Ltd'),
    recipient: demoConsignee('Demo Power Services Ltd'),
    references: { customerReference: 'DEMO-PO-1001', orderNumber: 'DEMO-ORD-2001', invoiceNumber: 'SDL-INV-004091' },
    events: [
      { hoursAgo: 30, status: 'RECEIVED', title: 'Shipment Received', place: LAGOS, facility: 'Origin Intake Desk', description: `Shipment received into the ${COMPANY_SHORT} network.` },
      { hoursAgo: 26, status: 'PROCESSING', title: 'Export Clearance Completed', place: LAGOS, facility: 'Lagos Air Cargo Terminal (LOS)', description: 'Export documents checked and cleared.' },
      { hoursAgo: 6, status: 'IN_TRANSIT', title: 'Departed Origin Airport', place: LAGOS, facility: 'Lagos Air Cargo Terminal (LOS)', description: 'Departed Lagos on a scheduled flight to London Heathrow (LHR).' },
    ],
  },
  {
    trackingNumber: 'DLS8M4PQ',
    mode: 'Sea',
    status: 'IN_TRANSIT',
    statusText: 'In Transit',
    statusMessage: 'Departed the transshipment port of Singapore; next port Rotterdam.',
    health: 'ON_TRACK',
    healthExplanation: 'Vessel is on its scheduled sailing.',
    progressPercent: 40,
    service: 'Freight',
    shipmentType: 'Container',
    cargoCategory: 'Electronics & Tech',
    cargoDescription: 'Consumer electronics, 40ft high-cube container',
    totalWeightLbs: 26500,
    pieces: 1,
    dimensions: { length: 473, width: 92, height: 106 },
    declaredValue: 180000,
    origin: SHANGHAI,
    destination: ROTTERDAM,
    current: SINGAPORE,
    currentFacility: 'Port of Singapore (transshipment)',
    createdHoursAgo: 288,
    etaHoursFromNow: 384,
    sender: demoShipper('Demo Electronics Export Co.'),
    recipient: demoConsignee('Demo Retail Distribution BV'),
    references: { customerReference: 'DEMO-PO-1002', orderNumber: 'DEMO-ORD-2002', invoiceNumber: 'SDL-INV-004092' },
    containerDetails: {
      containerNumber: 'SDLU4820193',
      isoSize: '40ft High-Cube Dry Van (40HC / 9ft 6in)',
      boltSeal: 'SDL-SL-482019',
      chassisNumber: 'N/A',
      terminal: 'Port of Rotterdam (Maasvlakte)',
      vgmWeightLbs: 28900,
      temperature: 'Ambient',
      customsStatus: 'Export cleared; import clearance pending',
    },
    events: [
      { hoursAgo: 288, status: 'RECEIVED', title: 'Container Received at Origin Terminal', place: SHANGHAI, facility: 'Yangshan Deep-Water Port', description: 'Container gated in and export documents lodged.' },
      { hoursAgo: 264, status: 'PROCESSING', title: 'Loaded on Vessel', place: SHANGHAI, facility: 'Yangshan Deep-Water Port', description: 'Container loaded on board.' },
      { hoursAgo: 250, status: 'IN_TRANSIT', title: 'Vessel Departed', place: SHANGHAI, facility: 'Yangshan Deep-Water Port', description: 'Vessel departed Shanghai.' },
      { hoursAgo: 48, status: 'AT_FACILITY', title: 'Arrived at Transshipment Port', place: SINGAPORE, facility: 'Port of Singapore (transshipment)', description: 'Container discharged for transshipment.' },
      { hoursAgo: 20, status: 'IN_TRANSIT', title: 'Departed Transshipment Port', place: SINGAPORE, facility: 'Port of Singapore (transshipment)', description: 'Loaded on the connecting vessel to Rotterdam.' },
    ],
  },
  {
    trackingNumber: 'DLS3J7NK',
    mode: 'Air',
    status: 'DELIVERED',
    statusText: 'Delivered',
    statusMessage: 'Delivered in Nairobi and signed for by Demo Consignee.',
    health: 'ON_TRACK',
    healthExplanation: 'Delivered on schedule with signature on file.',
    progressPercent: 100,
    service: 'Priority',
    shipmentType: 'Parcel',
    cargoCategory: 'Medical & BioTech',
    cargoDescription: 'Diagnostic lab equipment (temperature-controlled)',
    totalWeightLbs: 140,
    pieces: 3,
    dimensions: { length: 30, width: 20, height: 18 },
    declaredValue: 9500,
    origin: DUBAI,
    destination: NAIROBI,
    current: NAIROBI,
    currentFacility: 'Delivered to consignee',
    createdHoursAgo: 96,
    etaHoursFromNow: -20,
    sender: demoShipper('Demo Medical Trading FZE'),
    recipient: demoConsignee('Demo Diagnostics Ltd'),
    references: { customerReference: 'DEMO-PO-1003', orderNumber: 'DEMO-ORD-2003', invoiceNumber: 'SDL-INV-004093' },
    proofOfDelivery: { signedBy: 'Demo Consignee', deliveryNotes: 'Received at the laboratory reception.' },
    events: [
      { hoursAgo: 96, status: 'RECEIVED', title: 'Shipment Received', place: DUBAI, facility: 'Dubai Cargo Village (DXB)', description: `Shipment received into the ${COMPANY_SHORT} network.` },
      { hoursAgo: 90, status: 'PROCESSING', title: 'Export Clearance Completed', place: DUBAI, facility: 'Dubai Cargo Village (DXB)', description: 'Export documents checked and cleared.' },
      { hoursAgo: 72, status: 'IN_TRANSIT', title: 'Departed Origin Airport', place: DUBAI, facility: 'Dubai Cargo Village (DXB)', description: 'Departed Dubai on a scheduled flight to Nairobi (NBO).' },
      { hoursAgo: 64, status: 'AT_FACILITY', title: 'Arrived at Destination Airport', place: NAIROBI, facility: 'Jomo Kenyatta International Airport (NBO)', description: 'Arrived in Nairobi; awaiting import clearance.' },
      { hoursAgo: 40, status: 'DESTINATION_PROCESSING', title: 'Import Clearance Completed', place: NAIROBI, facility: 'Jomo Kenyatta International Airport (NBO)', description: 'Import formalities completed.' },
      { hoursAgo: 26, status: 'OUT_FOR_DELIVERY', title: 'Out for Delivery', place: NAIROBI, facility: 'Nairobi Delivery Depot', description: 'With the local courier for delivery today.' },
      { hoursAgo: 20, status: 'DELIVERED', title: 'Delivered', place: NAIROBI, facility: 'Consignee premises', description: 'Delivered and signed for by Demo Consignee.' },
    ],
  },
  {
    trackingNumber: 'DLS5P6TL',
    mode: 'Sea',
    status: 'DELAYED',
    statusText: 'Delayed',
    statusMessage: 'Vessel departure from Houston has been pushed back by port congestion.',
    health: 'POTENTIAL_DELAY',
    healthExplanation: 'Port congestion. Revised sailing booked.',
    progressPercent: 20,
    service: 'Freight',
    shipmentType: 'Pallet',
    cargoCategory: 'Industrial Machinery',
    cargoDescription: 'Oilfield valve assemblies (6 pallets)',
    totalWeightLbs: 7200,
    pieces: 6,
    dimensions: { length: 48, width: 40, height: 52 },
    declaredValue: 64000,
    origin: HOUSTON,
    destination: ROTTERDAM,
    current: HOUSTON,
    currentFacility: 'Port of Houston (Barbours Cut)',
    createdHoursAgo: 120,
    etaHoursFromNow: 528,
    sender: demoShipper('Demo Energy Equipment Inc.'),
    recipient: demoConsignee('Demo Offshore Services BV'),
    references: { customerReference: 'DEMO-PO-1004', orderNumber: 'DEMO-ORD-2004', invoiceNumber: 'SDL-INV-004094' },
    palletDetails: {
      standard: 'GMA Standard 48×40 in (US Wood)',
      count: 6,
      weightPerSkidLbs: 1200,
      heightIn: 52,
      stackable: false,
      forkliftAccess: '4-Way Forklift Entry',
      securingChecks: ['Stretch-wrapped', 'Corner boards', 'Banded'],
    },
    exception: {
      type: 'PORT_CONGESTION',
      title: 'Vessel Departure Delayed',
      description: 'Port congestion has pushed back the vessel departure. The cargo is secure at the terminal and booked on the next sailing.',
      actionRequired: false,
    },
    events: [
      { hoursAgo: 120, status: 'RECEIVED', title: 'Received at Origin Warehouse', place: HOUSTON, facility: 'Origin Intake Desk', description: 'Six pallets received and inspected.' },
      { hoursAgo: 96, status: 'PROCESSING', title: 'Export Documents Filed', place: HOUSTON, facility: 'Origin Intake Desk', description: 'Export declaration filed.' },
      { hoursAgo: 72, status: 'AT_FACILITY', title: 'Delivered to Port Terminal', place: HOUSTON, facility: 'Port of Houston (Barbours Cut)', description: 'Pallets stuffed and gated in at the terminal.' },
      { hoursAgo: 30, status: 'DELAYED', title: 'Vessel Departure Delayed', place: HOUSTON, facility: 'Port of Houston (Barbours Cut)', description: 'Port congestion has pushed back the vessel departure; booked on the next sailing.' },
    ],
  },
];

export interface DemoQuote {
  id: string;
  hoursAgo: number;
  status: 'NEW' | 'RATE_PUBLISHED';
  customerName: string;
  customerEmail: string;
  company: string;
  origin: DemoPlace;
  destination: DemoPlace;
  service: string;
  shipmentType: string;
  cargoDescription: string;
  weightLbs: number;
  pieces: number;
  dimensions: { length: number; width: number; height: number };
  declaredValue: number;
  specialInstructions: string;
  pricing: { baseRate: number; fuelSurcharge: number; accessorials: number; total: number; estimatedTransitDays: number; validForDays: number };
  internalNotes: string;
}

export const DEMO_QUOTES: DemoQuote[] = [
  {
    id: 'Q-2026-8491',
    hoursAgo: 20,
    status: 'NEW',
    customerName: 'Demo Customer',
    customerEmail: 'quotes.demo1@example.com',
    company: 'Demo Automotive Co.',
    origin: SHANGHAI,
    destination: LAGOS,
    service: 'Freight',
    shipmentType: 'Container',
    cargoDescription: 'Vehicle spare parts, 20ft container',
    weightLbs: 18000,
    pieces: 1,
    dimensions: { length: 232, width: 92, height: 94 },
    declaredValue: 45000,
    specialInstructions: 'Customs clearance at Lagos (Apapa) required.',
    pricing: { baseRate: 3850, fuelSurcharge: 327.25, accessorials: 450, total: 4627.25, estimatedTransitDays: 38, validForDays: 14 },
    internalNotes: 'Customer asked for a rate before confirming the booking.',
  },
  {
    id: 'Q-2026-8492',
    hoursAgo: 8,
    status: 'RATE_PUBLISHED',
    customerName: 'Demo Customer',
    customerEmail: 'quotes.demo2@example.com',
    company: 'Demo Flight Systems',
    origin: LONDON,
    destination: DUBAI,
    service: 'Express',
    shipmentType: 'Parcel',
    cargoDescription: 'Calibration instruments',
    weightLbs: 85,
    pieces: 1,
    dimensions: { length: 36, width: 24, height: 24 },
    declaredValue: 12000,
    specialInstructions: 'Fragile, sensitive instruments.',
    pricing: { baseRate: 640, fuelSurcharge: 54.4, accessorials: 75, total: 769.4, estimatedTransitDays: 2, validForDays: 14 },
    internalNotes: 'Quote issued via the customer portal.',
  },
];

// ---- Formatting helpers (shared so the seed and the mock print identical strings) ----

export function hoursFrom(now: number, hours: number): Date {
  return new Date(now + hours * 3_600_000);
}

// "September 26, 2026 · 9:15 AM UTC": the format the event parsers split into date/time/zone.
export function demoTimestamp(d: Date): string {
  const date = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' });
  return `${date} · ${time} UTC`;
}

// "October 1, 2026": a date string Date() can parse, used for ETA pacing.
export function demoDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function demoShortDate(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function placeLabel(p: DemoPlace): string {
  return `${p.city}, ${p.region}`;
}
