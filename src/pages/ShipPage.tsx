import React, { useState } from 'react';
import {
  Package,
  Truck,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  User,
  Clock,
  ShieldCheck,
  Plus,
  Trash2,
  FileText,
  Copy,
  Check,
  Building,
  Layers,
  Phone,
  Car,
  Lock,
  Calendar
} from 'lucide-react';
import { Barcode } from '../components/Barcode';
import { useAdminData } from '../context/AdminDataContext';
import { resolveAddressPrecise } from '../services/geocodingService';
import './ShipPage.css';
import { pieceLabel } from '../shared/trackingId';
import { COMPANY, COMPANY_SHORT } from '../config/brand';
import { CountrySelect } from '../components/forms/CountrySelect';
import { PhoneInput } from '../components/forms/PhoneInput';
import { MeasureInput, MoneyInput, UnitToggle, useUnitLabels } from '../components/forms/UnitControls';
import { getCountry, postcodeLabel, regionLabel, shortRegion } from '../data/countries';
import { formatDimensions, formatWeight } from '../shared/units';
import { TRANSPORT_MODE_LABELS, type TransportMode } from '../shared/transportMode';
import { useCurrency } from '../utils/useCurrency';

interface ShipPageProps {
  onTrack: (trackingNumber: string) => void;
  onNavigate: (page: string) => void;
}

// Weight in pounds and dimensions in inches (canonical); the inputs show the viewer's units.
interface PieceItem {
  id: string;
  weight: number | '';
  length: number | '';
  width: number | '';
  height: number | '';
  description: string;
}

interface AddressFieldsProps {
  idPrefix: string;
  country: string;
  onCountry: (code: string) => void;
  city: string;
  onCity: (v: string) => void;
  region: string;
  onRegion: (v: string) => void;
  postcode: string;
  onPostcode: (v: string) => void;
  cityPlaceholder: string;
}

// Country first (searchable), then city, then the optional region and postcode for that country.
const AddressFields: React.FC<AddressFieldsProps> = (f) => (
  <>
    <div className="form-group">
      <label htmlFor={`${f.idPrefix}-country`}>Country *</label>
      <CountrySelect id={`${f.idPrefix}-country`} value={f.country} onChange={f.onCountry} className="sdl-input" required />
    </div>
    <div className="form-group">
      <label htmlFor={`${f.idPrefix}-city`}>City *</label>
      <input id={`${f.idPrefix}-city`} type="text" required value={f.city} onChange={(e) => f.onCity(e.target.value)} className="sdl-input" placeholder={f.cityPlaceholder} />
    </div>
    <div className="form-group">
      <label htmlFor={`${f.idPrefix}-region`}>{regionLabel(f.country)} <span className="sdl-field-optional">(optional)</span></label>
      <input id={`${f.idPrefix}-region`} type="text" value={f.region} onChange={(e) => f.onRegion(e.target.value)} className="sdl-input" />
    </div>
    <div className="form-group">
      <label htmlFor={`${f.idPrefix}-postcode`}>{postcodeLabel(f.country)} <span className="sdl-field-optional">(optional)</span></label>
      <input id={`${f.idPrefix}-postcode`} type="text" value={f.postcode} onChange={(e) => f.onPostcode(e.target.value)} className="sdl-input font-mono" />
    </div>
  </>
);

// "Houston, TX" / "Lagos, Nigeria" for summaries
const placeText = (city: string, region: string, countryCode: string) =>
  [city, countryCode === 'US' ? region.trim().toUpperCase() : getCountry(countryCode)?.name].filter(Boolean).join(', ');

const PICKUP_WINDOWS = [
  'Today, 2:00 PM – 5:00 PM (local time)',
  'Tomorrow morning, 8:00 AM – 12:00 PM (local time)',
  'Tomorrow afternoon, 1:00 PM – 5:00 PM (local time)'
];

export const ShipPage: React.FC<ShipPageProps> = ({ onTrack, onNavigate }) => {
  const { createShipment, generateDocument } = useAdminData();
  const units = useUnitLabels();
  const money = useCurrency();

  // Multi-step form flow
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State - Sender (Origin)
  const [senderCompany, setSenderCompany] = useState('');
  const [senderContact, setSenderContact] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [senderCountry, setSenderCountry] = useState('');
  const [senderCity, setSenderCity] = useState('');
  const [senderState, setSenderState] = useState('');
  const [senderZip, setSenderZip] = useState('');
  const [pickupType, setPickupType] = useState<'pickup' | 'dropoff'>('pickup');
  const [pickupWindow, setPickupWindow] = useState(PICKUP_WINDOWS[0]);

  // Form State - Recipient (Destination)
  const [recipientCompany, setRecipientCompany] = useState('');
  const [recipientContact, setRecipientContact] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('');
  const [recipientCity, setRecipientCity] = useState('');
  const [recipientState, setRecipientState] = useState('');
  const [recipientZip, setRecipientZip] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // Form State - Pieces (Clean, empty piece item)
  const [piecesList, setPiecesList] = useState<PieceItem[]>([
    {
      id: '01',
      weight: '',
      length: '',
      width: '',
      height: '',
      description: '',
    },
  ]);

  // Form State - Service Selection (Strictly 4 authentic core tiers, ZERO freight/ship/train)
  const [selectedService, setSelectedService] = useState<'courier' | 'linehaul' | 'auto' | 'vault'>('courier');
  // '' = let SDL recommend
  const [transportMode, setTransportMode] = useState<TransportMode | ''>('');
  const [declaredValue, setDeclaredValue] = useState<number | ''>('');
  const [requireSignature, setRequireSignature] = useState(true);
  const [saturdayDelivery, setSaturdayDelivery] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(false);
  const [generatedTracking, setGeneratedTracking] = useState('');
  const [copiedTracking, setCopiedTracking] = useState(false);

  // Calculations
  const totalWeight = piecesList.reduce((acc, curr) => acc + (curr.weight === '' ? 0 : curr.weight), 0);
  const totalPieces = piecesList.length;

  const handleAddPiece = () => {
    const nextNum = (piecesList.length + 1).toString().padStart(2, '0');
    setPiecesList([
      ...piecesList,
      {
        id: nextNum,
        weight: '',
        length: '',
        width: '',
        height: '',
        description: '',
      },
    ]);
  };

  const handleRemovePiece = (index: number) => {
    if (piecesList.length > 1) {
      setPiecesList(piecesList.filter((_, i) => i !== index));
    }
  };

  const handleUpdatePiece = <K extends keyof PieceItem>(index: number, field: K, val: PieceItem[K]) => {
    const updated = [...piecesList];
    updated[index] = { ...updated[index], [field]: val };
    setPiecesList(updated);
  };

  // Step Validation Logic
  const validateStep = (step: number): boolean => {
    setFormError(null);
    if (step === 1) {
      // State/region and postcode are optional (not every country has them).
      if (!senderContact.trim() || !senderPhone.trim() || !senderAddress.trim() || !senderCountry || !senderCity.trim()) {
        setFormError('Please fill out all required sender and pickup address fields (name, phone, street, country and city) before continuing.');
        return false;
      }
    } else if (step === 2) {
      if (!recipientContact.trim() || !recipientPhone.trim() || !recipientAddress.trim() || !recipientCountry || !recipientCity.trim()) {
        setFormError('Please fill out all required recipient fields (name, phone, street, country and city) before continuing.');
        return false;
      }
    } else if (step === 3) {
      for (const p of piecesList) {
        if (p.weight === '' || p.weight <= 0) {
          setFormError(`Each piece must have a valid scale weight (${units.weight}).`);
          return false;
        }
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setFormError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 400, behavior: 'smooth' });
  };

  const getServiceName = () => {
    switch (selectedService) {
      case 'courier': return 'Priority Express Courier';
      case 'linehaul': return 'Scheduled Commercial Linehaul';
      case 'auto': return 'Auto & Vehicle Transport';
      case 'vault': return 'Time-Critical Secure Vault';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    setIsSubmitting(true);

    const originRegion = shortRegion(senderCountry, senderState);
    const destRegion = shortRegion(recipientCountry, recipientState);
    const originLabel = [senderCity.trim(), originRegion].filter(Boolean).join(', ');
    // Inches; 0 = side not given (shown as "—"), never an invented size.
    const dimensionsOf = (piece: PieceItem) => ({
      length: piece.length === '' ? 0 : piece.length,
      width: piece.width === '' ? 0 : piece.width,
      height: piece.height === '' ? 0 : piece.height
    });
    const party = (company: string, name: string, phone: string, street: string, city: string, region: string, postcode: string, countryCode: string) => ({
      company,
      name,
      phone,
      addressLine: street,
      city: city.trim(),
      state: shortRegion(countryCode, region),
      region: region.trim() || undefined,
      postalCode: postcode.trim() || undefined,
      country: getCountry(countryCode)?.name || '',
      countryCode
    });

    // Piece ids and labels (DLSxxxxx-NN) are stamped from the server-assigned ID in createShipment.
    const piecesFormatted = piecesList.map((p, idx) => ({
      id: '',
      pieceNumber: idx + 1,
      totalPieces: piecesList.length,
      trackingNumber: '',
      status: 'AWAITING_PICKUP' as const,
      statusText: 'Consignment Tender Staged for Intake',
      currentLocation: originLabel,
      weightLbs: p.weight === '' ? 0 : p.weight,
      dimensions: dimensionsOf(p)
    }));

    // Coordinates for the route map, from the country-aware lookup (live geocoder when the
    // offline tables only have a guess). An address we can't place at all stops the booking.
    const [originGeo, destGeo] = await Promise.all([
      resolveAddressPrecise({ street: senderAddress, city: senderCity, region: senderState, countryCode: senderCountry }, getCountry(senderCountry)?.name),
      resolveAddressPrecise({ street: recipientAddress, city: recipientCity, region: recipientState, countryCode: recipientCountry }, getCountry(recipientCountry)?.name)
    ]);
    if (!originGeo || !destGeo) {
      const missing = !originGeo ? `${senderCity}, ${getCountry(senderCountry)?.name}` : `${recipientCity}, ${getCountry(recipientCountry)?.name}`;
      setFormError(`We couldn't find ${missing}. Check the city and country, then try again.`);
      setIsSubmitting(false);
      return;
    }

    // Register into persistent application state & backend database. The server assigns the
    // tracking ID; the confirmation and the BOL below use the one it returned.
    let newTrackingId: string;
    try {
      const created = await createShipment({
        status: 'AWAITING_PICKUP',
        statusText: 'Consignment Tender Registered · Awaiting Intake Scan',
        statusMessage: `Consignment registered in the ${COMPANY_SHORT} intake system. Linear Code 128 piece barcodes assigned.`,
        health: 'ON_TRACK',
        progressPercent: 10,
        lastUpdated: 'Just now',
        createdAt: 'Today',
        service: getServiceName(),
        transportMode: transportMode || undefined,
        shipmentType: 'Parcel',
        cargoCategory: 'Commercial Goods',
        cargoDescription: piecesList[0]?.description || 'Commercial Express Consignment',
        totalWeightLbs: totalWeight,
        totalPieces: totalPieces,
        declaredValue: declaredValue === '' ? 0 : declaredValue,
        dimensions: dimensionsOf(piecesList[0]),
        origin: {
          city: senderCity.trim(),
          state: originRegion,
          country: getCountry(senderCountry)?.name || '',
          lat: originGeo.lat,
          lng: originGeo.lng
        },
        destination: {
          city: recipientCity.trim(),
          state: destRegion,
          country: getCountry(recipientCountry)?.name || '',
          lat: destGeo.lat,
          lng: destGeo.lng
        },
        currentLocation: originLabel,
        currentFacility: `${senderCity.trim()} Regional Gateway`,
        sender: party(senderCompany, senderContact, senderPhone, senderAddress, senderCity, senderState, senderZip, senderCountry),
        recipient: party(recipientCompany, recipientContact, recipientPhone, recipientAddress, recipientCity, recipientState, recipientZip, recipientCountry),
        estimatedDelivery: '2-3 Business Days',
        estimatedDeliveryDetail: 'by 5:00 PM',
        pieces: piecesFormatted,
        events: [
          {
            id: `ev-${Date.now()}`,
            timestamp: new Date().toISOString(),
            displayDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            displayTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            status: 'AWAITING_PICKUP',
            title: 'Consignment Tender Registered & Barcodes Provisioned',
            location: originLabel,
            facility: `${senderCity.trim()} Intake Hub`,
            city: senderCity.trim(),
            state: originRegion,
            description: `Shipment tendered via customer intake portal. Courier scheduled for pickup: ${pickupWindow}. Official BOL manifest and labels will be issued by agency dispatch.`,
            isCompleted: true,
            isCurrent: true,
            recordedBy: 'Customer Portal Intake'
          }
        ]
      });
      newTrackingId = created.trackingNumber;
    } catch (err: any) {
      setFormError(`We couldn't register your shipment: ${err?.message || 'the server did not respond'}. Nothing was saved; please try again.`);
      setIsSubmitting(false);
      return;
    }
    setGeneratedTracking(newTrackingId);

    // Auto-generate Master Record in Document Center
    generateDocument({
      docType: 'BOL',
      title: `Agency Bill of Lading Manifest (${newTrackingId})`,
      shipmentTracking: newTrackingId,
      senderName: senderContact,
      senderCompany: senderCompany,
      senderAddress: senderAddress,
      senderCity: senderCity,
      senderState: originRegion,
      senderZip: senderZip,
      senderPhone: senderPhone,
      recipientName: recipientContact,
      recipientCompany: recipientCompany,
      recipientAddress: recipientAddress,
      recipientCity: recipientCity,
      recipientState: destRegion,
      recipientZip: recipientZip,
      recipientPhone: recipientPhone,
      cargoDescription: piecesList[0]?.description || 'Commercial Express Consignment',
      shipmentType: 'Parcel',
      service: getServiceName(),
      weightLbs: totalWeight,
      pieces: totalPieces,
      // Documents keep the canonical unit (inches)
      dimensions: formatDimensions(piecesList[0], 'imperial'),
      declaredValue: declaredValue === '' ? 0 : declaredValue,
      charges: {
        baseAmount: 185,
        oversizeFee: totalWeight > 50 ? 45 : 0,
        specialHandlingFee: requireSignature ? 15 : 0,
        totalAmount: 200,
        paymentStatus: 'PENDING',
        paymentMethod: 'Agency Central Invoicing'
      }
    });

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedBooking(true);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    }, 600);
  };

  const handleCopyTracking = () => {
    navigator.clipboard.writeText(generatedTracking);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className="sdl-page-ship">
      {/* =========================================================================
          1. CINEMATIC HERO SECTION
          ========================================================================= */}
      <section className="sdl-ship-hero">
        <div className="sdl-ship-hero-bg" />
        <div className="sdl-container-wide ship-hero-container">
          <div className="sdl-ship-breadcrumbs">
            <span onClick={() => onNavigate('home')} className="crumb-link">Home</span>
            <span className="crumb-sep">/</span>
            <span className="crumb-current">Ship a Consignment</span>
          </div>

          <div className="ship-hero-badge animate-fade-in">
            <span className="ship-pulse-dot" />
            <span>COMMERCIAL & CONSUMER CONSIGNMENT TENDER</span>
          </div>

          <h1 className="ship-hero-title animate-fade-in">
            Tender & Register Consignments with <span className="text-highlight-accent">Piece-Level Precision.</span>
          </h1>

          <p className="ship-hero-subtitle animate-fade-in">
            Register single or multi-piece consignments directly into the {COMPANY} relay network with linear Code 128 barcode provisioning. No customer account required.
          </p>

          <div className="ship-hero-trust-strip animate-fade-in">
            <div className="trust-item"><CheckCircle2 size={16} className="text-emerald" /> Guaranteed Space Tender</div>
            <div className="trust-item"><CheckCircle2 size={16} className="text-emerald" /> Linear Code 128 Piece Barcodes</div>
            <div className="trust-item"><CheckCircle2 size={16} className="text-emerald" /> 24/7 Central Operations Dispatch</div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. MAIN FORM CONTAINER & STICKY LIVE SUMMARY
          ========================================================================= */}
      <div className="sdl-container-wide sdl-ship-workspace">
        {submittedBooking ? (
          /* BOOKING CONFIRMATION SCREEN */
          <div className="sdl-booking-confirmed-card animate-fade-in">
            <div className="confirm-top-pill">
              <span className="pulse-dot" />
              <span>CONSIGNMENT REGISTERED · PENDING DISPATCH INTAKE REVIEW</span>
            </div>

            <div className="confirm-header">
              <CheckCircle2 size={56} className="confirm-check-icon text-emerald" />
              <h2>Shipment Successfully Registered</h2>
              <p>
                Your consignment has been recorded in the {COMPANY} intake queue. Master tracking identifier <strong className="font-mono">{generatedTracking}</strong> has been provisioned.
              </p>
            </div>

            {/* Agency Official Documentation Notice */}
            <div className="admin-rate-notice-banner">
              <div className="rate-notice-icon"><ShieldCheck size={24} className="text-accent flex-shrink-0" /></div>
              <div>
                <strong>Official Documentation & Invoicing Dispatch Notice</strong>
                <p>
                  All official shipping documents, including your <strong>certified Bill of Lading (BOL)</strong>, <strong>Code 128 piece barcode labels</strong>, and <strong>published tariff invoice</strong>, are issued directly by the {COMPANY} dispatch desk and will be transmitted to you via your designated communication channel (email, SMS, or dispatch coordinator).
                </p>
              </div>
            </div>

            {/* Prominent Linear Barcode Card */}
            <div className="confirm-barcode-block">
              <div className="barcode-block-header">
                <span className="barcode-tag">MASTER WAYBILL CONSIGNMENT</span>
                <span className="barcode-service">{getServiceName().toUpperCase()}</span>
              </div>

              <div className="barcode-render-stage">
                <Barcode
                  value={generatedTracking}
                  height={55}
                  width={1.6}
                  fontSize={14}
                  displayValue={true}
                />
              </div>

              <div className="barcode-block-meta">
                <div><strong>Route:</strong> {placeText(senderCity, senderState, senderCountry)} → {placeText(recipientCity, recipientState, recipientCountry)}</div>
                <div><strong>Pieces:</strong> {totalPieces} ({formatWeight(totalWeight, units.system)} gross)</div>
                {transportMode && <div><strong>Mode:</strong> {TRANSPORT_MODE_LABELS[transportMode]}</div>}
                <div><strong>Tender Mode:</strong> {pickupType === 'pickup' ? 'Courier Pickup Scheduled' : 'Origin Hub Drop-off'}</div>
              </div>
            </div>

            {/* Piece Barcodes List */}
            <div className="confirm-pieces-grid">
              {piecesList.map((piece, idx) => (
                <div key={piece.id} className="confirm-piece-card">
                  <div className="piece-card-header">
                    <span className="font-bold">PIECE {piece.id} of {piecesList.length.toString().padStart(2, '0')}</span>
                    <small>{[formatWeight(piece.weight, units.system), formatDimensions(piece, units.system)].filter(Boolean).join(' • ')}</small>
                  </div>
                  <div className="piece-barcode-render">
                    <Barcode
                      value={pieceLabel(generatedTracking, idx + 1)}
                      height={32}
                      width={1.1}
                      fontSize={10}
                      displayValue={true}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Next Steps Instructions */}
            <div className="confirm-instructions-card">
              <div className="inst-icon"><Clock size={20} className="text-accent flex-shrink-0" /></div>
              <div>
                <h4>Next Operational Steps:</h4>
                <p>
                  {pickupType === 'pickup'
                    ? `A courier driver has been scheduled for your selected window (${pickupWindow}). Your assigned dispatch coordinator will contact you to confirm pickup and hand off official paperwork.`
                    : `Please drop off your parcel at your nearest sort gateway before the evening linehaul departure cutoff (7:30 PM local time).`}
                </p>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="confirm-action-row">
              <button
                type="button"
                className="btn-corp-primary"
                onClick={() => onTrack(generatedTracking)}
              >
                <span>Track This Shipment Live</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="btn-corp-ghost"
                onClick={handleCopyTracking}
              >
                {copiedTracking ? (
                  <>
                    <Check size={16} className="text-emerald" />
                    <span>Copied Tracking ID!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Copy Tracking ID</span>
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-corp-ghost"
                onClick={() => {
                  setSubmittedBooking(false);
                  setTransportMode('');
                  setCurrentStep(1);
                }}
              >
                <span>Register Another Consignment</span>
              </button>
            </div>
          </div>
        ) : (
          /* MULTI-STEP BOOKING FORM + STICKY SIDEBAR */
          <div className="sdl-ship-grid">
            {/* Left Column: Multi-Section Form */}
            <div className="sdl-ship-main-form">
              {/* Unified Responsive Step Stepper */}
              <div className="form-steps-nav">
                <button
                  type="button"
                  className={`step-nav-item ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
                  onClick={() => setCurrentStep(1)}
                >
                  <span className="step-num">{currentStep > 1 ? '✓' : '1'}</span>
                  <div className="step-label-group">
                    <span className="step-title">Origin & Sender</span>
                    <span className="step-sub">{senderCity ? placeText(senderCity, senderState, senderCountry) : 'Pickup'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`step-nav-item ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
                  onClick={() => validateStep(1) && setCurrentStep(2)}
                >
                  <span className="step-num">{currentStep > 2 ? '✓' : '2'}</span>
                  <div className="step-label-group">
                    <span className="step-title">Destination</span>
                    <span className="step-sub">{recipientCity ? placeText(recipientCity, recipientState, recipientCountry) : 'Delivery'}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`step-nav-item ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}
                  onClick={() => validateStep(1) && validateStep(2) && setCurrentStep(3)}
                >
                  <span className="step-num">{currentStep > 3 ? '✓' : '3'}</span>
                  <div className="step-label-group">
                    <span className="step-title">Pieces & Weight</span>
                    <span className="step-sub">{totalPieces} Pcs • {formatWeight(totalWeight, units.system)}</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`step-nav-item ${currentStep === 4 ? 'active' : ''}`}
                  onClick={() => validateStep(1) && validateStep(2) && validateStep(3) && setCurrentStep(4)}
                >
                  <span className="step-num">4</span>
                  <div className="step-label-group">
                    <span className="step-title">Service Tier</span>
                    <span className="step-sub">Review & Tender</span>
                  </div>
                </button>
              </div>

              {/* Mobile Real-Time Step Progress Indicator */}
              <div className="mobile-step-summary-bar">
                <div className="mobile-step-text">
                  <span className="step-badge-mini">Step {currentStep}/4</span>
                  <strong>
                    {currentStep === 1 && 'Origin & Pickup Location'}
                    {currentStep === 2 && 'Destination Recipient'}
                    {currentStep === 3 && `Pieces (${totalPieces} Pcs • ${formatWeight(totalWeight, units.system)})`}
                    {currentStep === 4 && 'Service Tier & Tender Review'}
                  </strong>
                </div>
                <div className="mobile-step-track">
                  <div className="mobile-step-fill" style={{ width: `${(currentStep / 4) * 100}%` }} />
                </div>
              </div>

              {/* Error Notice */}
              {formError && (
                <div className="form-validation-error animate-fade-in">
                  <FileText size={18} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* STEP 1: ORIGIN & SENDER */}
              {currentStep === 1 && (
                <div className="form-section-card animate-fade-in">
                  <div className="sec-header">
                    <div className="sec-icon"><User size={20} /></div>
                    <div>
                      <h3>Step 1: Origin & Sender Information</h3>
                      <p>Specify who is dispatching the consignment and the pickup address.</p>
                    </div>
                  </div>

                  <div className="form-fields-grid">
                    <div className="form-group span-2">
                      <label>Company / Organization (Optional)</label>
                      <input
                        type="text"
                        value={senderCompany}
                        onChange={(e) => setSenderCompany(e.target.value)}
                        className="sdl-input"
                        placeholder="e.g. Apex Distribution Logistics LLC"
                      />
                    </div>

                    <div className="form-group">
                      <label>Sender Full Name *</label>
                      <input
                        type="text"
                        required
                        value={senderContact}
                        onChange={(e) => setSenderContact(e.target.value)}
                        className="sdl-input"
                        placeholder="e.g. John Anderson"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="sender-phone">Phone Number *</label>
                      <PhoneInput id="sender-phone" required value={senderPhone} onChange={setSenderPhone} defaultCountry={senderCountry || 'US'} className="sdl-input" />
                    </div>

                    <div className="form-group span-2">
                      <label>Street Address *</label>
                      <input
                        type="text"
                        required
                        value={senderAddress}
                        onChange={(e) => setSenderAddress(e.target.value)}
                        className="sdl-input"
                        placeholder="e.g. 140 West Street, 8th Floor"
                      />
                    </div>

                    <AddressFields
                      idPrefix="sender"
                      country={senderCountry}
                      onCountry={setSenderCountry}
                      city={senderCity}
                      onCity={setSenderCity}
                      region={senderState}
                      onRegion={setSenderState}
                      postcode={senderZip}
                      onPostcode={setSenderZip}
                      cityPlaceholder="e.g. Lagos"
                    />
                  </div>

                  {/* Tender Method Toggle */}
                  <div className="tender-mode-wrap">
                    <label className="section-sublabel">How will {COMPANY} receive this consignment?</label>
                    <div className="tender-toggle-row">
                      <div
                        className={`tender-card ${pickupType === 'pickup' ? 'selected' : ''}`}
                        onClick={() => setPickupType('pickup')}
                      >
                        <Truck size={22} className="text-accent" />
                        <div>
                          <strong>Schedule Courier Pickup</strong>
                          <p>Driver dispatches to your dock, office, or facility</p>
                        </div>
                      </div>

                      <div
                        className={`tender-card ${pickupType === 'dropoff' ? 'selected' : ''}`}
                        onClick={() => setPickupType('dropoff')}
                      >
                        <Building size={22} className="text-accent" />
                        <div>
                          <strong>Drop Off at Logistics Gateway Hub</strong>
                          <p>Tender directly to regional sortation terminal</p>
                        </div>
                      </div>
                    </div>

                    {pickupType === 'pickup' && (
                      <div className="pickup-window-select">
                        <label>Preferred Pickup Window</label>
                        <select
                          value={pickupWindow}
                          onChange={(e) => setPickupWindow(e.target.value)}
                          className="sdl-input"
                        >
                          {PICKUP_WINDOWS.map((w) => (
                            <option key={w} value={w}>{w}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="form-step-actions">
                    <button
                      type="button"
                      className="btn-corp-primary"
                      onClick={handleNextStep}
                    >
                      <span>Continue to Destination</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: DESTINATION & RECIPIENT */}
              {currentStep === 2 && (
                <div className="form-section-card animate-fade-in">
                  <div className="sec-header">
                    <div className="sec-icon"><MapPin size={20} /></div>
                    <div>
                      <h3>Step 2: Destination & Recipient Information</h3>
                      <p>Provide the recipient's delivery location and handling notes.</p>
                    </div>
                  </div>

                  <div className="form-fields-grid">
                    <div className="form-group span-2">
                      <label>Recipient Company / Facility (Optional)</label>
                      <input
                        type="text"
                        value={recipientCompany}
                        onChange={(e) => setRecipientCompany(e.target.value)}
                        className="sdl-input"
                        placeholder="e.g. Pacific Horizon Technologies Inc."
                      />
                    </div>

                    <div className="form-group">
                      <label>Recipient Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={recipientContact}
                        onChange={(e) => setRecipientContact(e.target.value)}
                        className="sdl-input"
                        placeholder="e.g. Michael Johnson"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="recipient-phone">Recipient Phone Number *</label>
                      <PhoneInput id="recipient-phone" required value={recipientPhone} onChange={setRecipientPhone} defaultCountry={recipientCountry || senderCountry || 'US'} className="sdl-input" />
                    </div>

                    <div className="form-group span-2">
                      <label>Delivery Street Address *</label>
                      <input
                        type="text"
                        required
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="sdl-input"
                        placeholder="e.g. 900 Wilshire Blvd, Suite 1400"
                      />
                    </div>

                    <AddressFields
                      idPrefix="recipient"
                      country={recipientCountry}
                      onCountry={setRecipientCountry}
                      city={recipientCity}
                      onCity={setRecipientCity}
                      region={recipientState}
                      onRegion={setRecipientState}
                      postcode={recipientZip}
                      onPostcode={setRecipientZip}
                      cityPlaceholder="e.g. London"
                    />

                    <div className="form-group span-2">
                      <label>Special Delivery Instructions</label>
                      <input
                        type="text"
                        value={deliveryInstructions}
                        onChange={(e) => setDeliveryInstructions(e.target.value)}
                        placeholder="e.g. Loading dock #4, Direct signature required"
                        className="sdl-input"
                      />
                    </div>
                  </div>

                  <div className="form-step-actions dual">
                    <button
                      type="button"
                      className="btn-corp-ghost"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Origin</span>
                    </button>

                    <button
                      type="button"
                      className="btn-corp-primary"
                      onClick={handleNextStep}
                    >
                      <span>Continue to Pieces & Weight</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: MULTI-PIECE CONSIGNMENT BUILDER */}
              {currentStep === 3 && (
                <div className="form-section-card animate-fade-in">
                  <div className="sec-header">
                    <div className="sec-icon"><Layers size={20} /></div>
                    <div className="sec-title-wrap">
                      <div>
                        <h3>Step 3: Multi-Piece Consignment Builder</h3>
                        <p>Configure individual cartons or pieces with piece-level Code 128 barcodes.</p>
                        <UnitToggle className="ship-unit-toggle" />
                      </div>
                      <button
                        type="button"
                        className="add-piece-btn"
                        onClick={handleAddPiece}
                      >
                        <Plus size={15} /> Add Another Piece
                      </button>
                    </div>
                  </div>

                  <div className="pieces-builder-list">
                    {piecesList.map((piece, index) => (
                      <div key={index} className="piece-builder-row">
                        <div className="piece-badge-col">
                          <span className="p-badge font-mono">#{piece.id}</span>
                          {piecesList.length > 1 && (
                            <button
                              type="button"
                              className="p-delete-btn"
                              onClick={() => handleRemovePiece(index)}
                              title="Remove this piece"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>

                        <div className="piece-inputs-col">
                          <div className="piece-dim-grid">
                            <div className="p-field">
                              <label htmlFor={`piece-${index}-weight`}>Weight ({units.weight}) *</label>
                              <MeasureInput
                                id={`piece-${index}-weight`}
                                kind="weight"
                                step="0.1"
                                min="0.1"
                                required
                                value={piece.weight}
                                onChange={(v) => handleUpdatePiece(index, 'weight', v)}
                                className="sdl-input"
                              />
                            </div>

                            <div className="p-field">
                              <label htmlFor={`piece-${index}-length`}>Length ({units.length})</label>
                              <MeasureInput
                                id={`piece-${index}-length`}
                                kind="length"
                                min="0"
                                value={piece.length}
                                onChange={(v) => handleUpdatePiece(index, 'length', v)}
                                className="sdl-input"
                              />
                            </div>

                            <div className="p-field">
                              <label htmlFor={`piece-${index}-width`}>Width ({units.length})</label>
                              <MeasureInput
                                id={`piece-${index}-width`}
                                kind="length"
                                min="0"
                                value={piece.width}
                                onChange={(v) => handleUpdatePiece(index, 'width', v)}
                                className="sdl-input"
                              />
                            </div>

                            <div className="p-field">
                              <label htmlFor={`piece-${index}-height`}>Height ({units.length})</label>
                              <MeasureInput
                                id={`piece-${index}-height`}
                                kind="length"
                                min="0"
                                value={piece.height}
                                onChange={(v) => handleUpdatePiece(index, 'height', v)}
                                className="sdl-input"
                              />
                            </div>
                          </div>

                          <div className="p-field-desc">
                            <label>Item Description / Packaging Notes</label>
                            <input
                              type="text"
                              value={piece.description}
                              onChange={(e) => handleUpdatePiece(index, 'description', e.target.value)}
                              placeholder="e.g. Precision Electronics, Document Archive"
                              className="sdl-input"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="form-step-actions dual">
                    <button
                      type="button"
                      className="btn-corp-ghost"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Destination</span>
                    </button>

                    <button
                      type="button"
                      className="btn-corp-primary"
                      onClick={handleNextStep}
                    >
                      <span>Continue to Service Tier</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: SERVICE TIER & SUBMISSION */}
              {currentStep === 4 && (
                <div className="form-section-card animate-fade-in">
                  <div className="sec-header">
                    <div className="sec-icon"><Truck size={20} /></div>
                    <div>
                      <h3>Step 4: Service Tier & Special Handling</h3>
                      <p>Select your required transit tier across our 4 authentic courier services.</p>
                    </div>
                  </div>

                  {/* Service Cards Grid (Zero Freight/Train/Ship) */}
                  <div className="services-select-grid">
                    <div
                      className={`service-option-card ${selectedService === 'courier' ? 'selected' : ''}`}
                      onClick={() => setSelectedService('courier')}
                    >
                      <div className="serv-head">
                        <Clock size={20} className="text-accent" />
                        <strong>Priority Express Courier</strong>
                      </div>
                      <div className="serv-transit">Next Business Day by 10:30 AM</div>
                      <div className="serv-rate-status font-mono">RATE PUBLISHED BY ADMIN</div>
                      <small>Guaranteed direct flight & earliest delivery</small>
                    </div>

                    <div
                      className={`service-option-card popular ${selectedService === 'linehaul' ? 'selected' : ''}`}
                      onClick={() => setSelectedService('linehaul')}
                    >
                      <span className="pop-badge">RECOMMENDED</span>
                      <div className="serv-head">
                        <Truck size={20} className="text-accent" />
                        <strong>Scheduled Commercial Linehaul</strong>
                      </div>
                      <div className="serv-transit">2 - 3 Business Days</div>
                      <div className="serv-rate-status font-mono">RATE PUBLISHED BY ADMIN</div>
                      <small>Scheduled road relay & sortation network</small>
                    </div>

                    <div
                      className={`service-option-card ${selectedService === 'auto' ? 'selected' : ''}`}
                      onClick={() => setSelectedService('auto')}
                    >
                      <div className="serv-head">
                        <Car size={20} className="text-accent" />
                        <strong>Auto & Vehicle Transport</strong>
                      </div>
                      <div className="serv-transit">Specialized 3 - 5 Days</div>
                      <div className="serv-rate-status font-mono">RATE PUBLISHED BY ADMIN</div>
                      <small>Enclosed & open-deck door-to-door relocation</small>
                    </div>

                    <div
                      className={`service-option-card ${selectedService === 'vault' ? 'selected' : ''}`}
                      onClick={() => setSelectedService('vault')}
                    >
                      <div className="serv-head">
                        <Lock size={20} className="text-accent" />
                        <strong>Time-Critical Secure Vault</strong>
                      </div>
                      <div className="serv-transit">Dedicated Custody Delivery</div>
                      <div className="serv-rate-status font-mono">RATE PUBLISHED BY ADMIN</div>
                      <small>Armored chain-of-custody for high-value tenders</small>
                    </div>
                  </div>

                  {/* Transport mode (tracker 2.8) */}
                  <div className="transport-mode-row">
                    <label htmlFor="ship-mode" className="section-sublabel">Transport Mode</label>
                    <select
                      id="ship-mode"
                      value={transportMode}
                      onChange={(e) => setTransportMode(e.target.value as TransportMode | '')}
                      className="sdl-input"
                    >
                      <option value="">Let {COMPANY} recommend</option>
                      <option value="Air">{TRANSPORT_MODE_LABELS.Air}</option>
                      <option value="Sea">{TRANSPORT_MODE_LABELS.Sea}</option>
                      <option value="Road">{TRANSPORT_MODE_LABELS.Road}</option>
                    </select>
                  </div>

                  {/* Value Add-ons */}
                  <div className="addons-grid">
                    <div className="addon-checkbox-row">
                      <input
                        type="checkbox"
                        id="signCheck"
                        checked={requireSignature}
                        onChange={(e) => setRequireSignature(e.target.checked)}
                      />
                      <label htmlFor="signCheck">
                        <strong>Direct Recipient Signature Confirmation</strong>
                        <small>Courier will require an authorized physical timestamped signature at delivery</small>
                      </label>
                    </div>

                    <div className="addon-checkbox-row">
                      <input
                        type="checkbox"
                        id="satCheck"
                        checked={saturdayDelivery}
                        onChange={(e) => setSaturdayDelivery(e.target.checked)}
                      />
                      <label htmlFor="satCheck">
                        <strong>Saturday Expedited Delivery</strong>
                        <small>Weekend delivery for urgent residential and commercial consignments</small>
                      </label>
                    </div>

                    <div className="declared-value-row">
                      <label htmlFor="ship-declared-value">Declared Consignment Value ({money.currency}, for insurance cover)</label>
                      <div className="value-input-wrap">
                        <span className="curr-sym">{money.symbol}</span>
                        <MoneyInput
                          id="ship-declared-value"
                          min="0"
                          value={declaredValue}
                          onChange={setDeclaredValue}
                          className="sdl-input font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-step-actions dual">
                    <button
                      type="button"
                      className="btn-corp-ghost"
                      onClick={handlePrevStep}
                    >
                      <ArrowLeft size={16} />
                      <span>Back to Pieces</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      className="btn-corp-primary submit-booking-btn"
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <>
                          <span className="spinner-border" />
                          <span>Provisioning Barcodes & Registering...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Consignment Manifest</span>
                          <ArrowRight size={17} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Real-Time Summary */}
            <aside className="sdl-ship-sidebar">
              <div className="sidebar-sticky-card">
                <div className="sidebar-head">
                  <h3>Consignment Summary</h3>
                  <span className="badge-live font-mono">MANIFEST DRAFT</span>
                </div>

                <div className="sidebar-route-preview">
                  <div className="route-loc origin">
                    <MapPin size={16} className="text-accent" />
                    <div>
                      <small>ORIGIN</small>
                      <strong>{senderCity ? placeText(senderCity, senderState, senderCountry) : 'Origin'}</strong>
                    </div>
                  </div>
                  <div className="route-arrow-line">
                    <span className="route-line" />
                    <span className="route-dot" />
                  </div>
                  <div className="route-loc dest">
                    <MapPin size={16} className="text-accent" />
                    <div>
                      <small>DESTINATION</small>
                      <strong>{recipientCity ? placeText(recipientCity, recipientState, recipientCountry) : 'Destination'}</strong>
                    </div>
                  </div>
                </div>

                <div className="sidebar-specs-list">
                  <div className="spec-row">
                    <span>Total Pieces:</span>
                    <strong>{totalPieces} Pieces</strong>
                  </div>
                  <div className="spec-row">
                    <span>Gross Scale Weight:</span>
                    <strong>{formatWeight(totalWeight, units.system) || '—'}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Service Tier:</span>
                    <strong className="text-accent">
                      {getServiceName()}
                    </strong>
                  </div>
                  <div className="spec-row">
                    <span>Transport Mode:</span>
                    <strong>{transportMode ? TRANSPORT_MODE_LABELS[transportMode] : `${COMPANY_SHORT} recommends`}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Tender Mode:</span>
                    <strong>{pickupType === 'pickup' ? 'Courier Pickup' : 'Hub Drop-off'}</strong>
                  </div>
                  <div className="spec-row">
                    <span>Signature Required:</span>
                    <strong>{requireSignature ? 'Yes (Direct)' : 'No'}</strong>
                  </div>
                </div>

                <div className="sidebar-pricing-breakdown">
                  <div className="price-row-status">
                    <span>Official Rate Tariff:</span>
                    <strong className="text-amber font-mono">● PENDING ADMIN REVIEW</strong>
                  </div>
                  <p className="admin-publishing-note">
                    All tariff quotes and official billing paperwork are reviewed by central dispatch and issued directly to you alongside your certified BOL manifest.
                  </p>
                </div>

                <div className="sidebar-trust-box">
                  <ShieldCheck size={18} className="text-emerald flex-shrink-0" />
                  <p>All tendered consignments receive append-only tracking events and individual Code 128 piece barcodes.</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* =========================================================================
          3. HOW SHIPMENT INTAKE WORKS SECTION
          ========================================================================= */}
      <section className="sdl-ship-process-section">
        <div className="sdl-container-wide">
          <div className="section-center-header">
            <span className="section-eyebrow">OPERATIONAL PROVENANCE</span>
            <h2>How Consignment Tender Works</h2>
            <p className="section-desc-sub">From initial registration to hub ingestion, line-haul by air, sea or road, and final direct recipient signature.</p>
            <div className="section-header-line" />
          </div>

          <div className="process-steps-grid">
            <div className="p-step-card">
              <div className="step-badge">01</div>
              <h4>Consignment Tender</h4>
              <p>Consignment record and master Code 128 barcode are provisioned instantly in our central intake queue.</p>
            </div>

            <div className="p-step-card">
              <div className="step-badge">02</div>
              <h4>Gateway Ingestion Scan</h4>
              <p>Origin hub scans each carton, verifying scale weight, certified dimensions, and custody handover.</p>
            </div>

            <div className="p-step-card">
              <div className="step-badge">03</div>
              <h4>Air, Sea or Road Relay</h4>
              <p>Consignment travels across verified corridor sortation hubs with real-time waypoint checkpoint scans.</p>
            </div>

            <div className="p-step-card">
              <div className="step-badge">04</div>
              <h4>Proof of Delivery</h4>
              <p>Final destination delivery with timestamped physical signature and instant digital POD signoff.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
