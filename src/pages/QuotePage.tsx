import React, { useState, useEffect, useMemo } from 'react';
import {
  Calculator,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  MapPin,
  Truck,
  Send,
  FileText,
  Lock,
  Building,
  Phone,
  Mail,
  User,
  DollarSign,
  Package,
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAdminData } from '../context/AdminDataContext';
import { useCompanyContact } from '../utils/useCompanyContact';
import { COMPANY } from '../config/brand';
import { CountrySelect } from '../components/forms/CountrySelect';
import { PhoneInput } from '../components/forms/PhoneInput';
import { MeasureInput, MoneyInput, UnitToggle, useUnitLabels } from '../components/forms/UnitControls';
import { getCountry, postcodeLabel, regionLabel, shortRegion } from '../data/countries';
import { formatWeight } from '../shared/units';
import { TRANSPORT_MODE_LABELS, type TransportMode } from '../shared/transportMode';
import { useCurrency } from '../utils/useCurrency';
import './QuotePage.css';

// Address as sent to the API: the short region shown after the city ("TX" / "NG"), plus the
// full region, postcode and country as entered.
function addressPayload(countryCode: string, city: string, region: string, postcode: string) {
  return {
    city: city.trim(),
    state: shortRegion(countryCode, region),
    region: region.trim() || undefined,
    postalCode: postcode.trim() || undefined,
    country: getCountry(countryCode)?.name || '',
    countryCode
  };
}

// "Houston, TX, United States" / "Lagos, Nigeria"
function placeLabel(city: string, region: string, countryCode: string) {
  const country = getCountry(countryCode);
  return [city || '—', countryCode === 'US' ? region.trim().toUpperCase() : '', country?.name].filter(Boolean).join(', ');
}

interface QuotePageProps {
  onNavigate: (page: string, param?: string) => void;
  initialService?: string;
}

export const QuotePage: React.FC<QuotePageProps> = ({ onNavigate, initialService }) => {
  const { createQuoteRequest, settings } = useAdminData();
  // Empty phone/regulatory values hide their element (no placeholders).
  const { phone: supportPhone, email: dispatchEmail, regulatoryLine: dotNumber } = useCompanyContact();

  // Contact Info (Starts clean and blank)
  const [customerName, setCustomerName] = useState('');
  const [company, setCompany] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Routing: country first, then the fields that fit it (region and postcode optional)
  const [originCountry, setOriginCountry] = useState('');
  const [originCity, setOriginCity] = useState('');
  const [originState, setOriginState] = useState('');
  const [originZip, setOriginZip] = useState('');

  const [destCountry, setDestCountry] = useState('');
  const [destCity, setDestCity] = useState('');
  const [destState, setDestState] = useState('');
  const [destZip, setDestZip] = useState('');

  // '' = let SDL recommend the mode
  const [transportMode, setTransportMode] = useState<TransportMode | ''>('');
  const units = useUnitLabels();
  const money = useCurrency();

  // Cargo Specs (Strict 4 Allowed Core Services, Zero Freight/Train/Ship)
  const [cargoDescription, setCargoDescription] = useState('');
  const [cargoType, setCargoType] = useState('Commercial Parcel');
  const [service, setService] = useState(initialService || 'Priority Express Courier');

  useEffect(() => {
    if (initialService) {
      setService(initialService);
    }
  }, [initialService]);

  // Stored canonically: pounds, inches and USD (the inputs convert for display).
  const [weight, setWeight] = useState<number | ''>('');
  const [pieces, setPieces] = useState('1');
  const [length, setLength] = useState<number | ''>('');
  const [width, setWidth] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [declaredValue, setDeclaredValue] = useState<number | ''>('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // Status & Errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Dynamic Real-Time Tariff Estimator
  const estimatedRate = useMemo(() => {
    const w = weight === '' ? 0 : weight;
    const p = parseInt(pieces, 10) || 1;
    if (w <= 0) return null;

    let baseRate = 65; // Base courier dispatch fee
    let ratePerLb = 1.45;

    if (service === 'Priority Express Courier') {
      baseRate = 95;
      ratePerLb = 2.15;
    } else if (service === 'Scheduled Commercial Linehaul') {
      baseRate = 120;
      ratePerLb = 1.25;
    } else if (service === 'Auto & Vehicle Transport') {
      baseRate = 650;
      ratePerLb = 0.45;
    } else if (service === 'Time-Critical Secure Vault') {
      baseRate = 350;
      ratePerLb = 3.50;
    }

    const calculated = baseRate + (w * ratePerLb) + (p > 1 ? (p - 1) * 12 : 0);
    const lowRange = Math.round(calculated * 0.92);
    const highRange = Math.round(calculated * 1.15);

    return { low: lowRange, high: highRange, base: Math.round(calculated) };
  }, [weight, pieces, service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!customerName.trim() || !customerEmail.trim() || !originCountry || !originCity.trim() || !destCountry || !destCity.trim() || weight === '') {
      setFormError('Please complete all required fields (Name, Email, origin and destination country and city, and Weight).');
      return;
    }

    setIsSubmitting(true);

    try {
      const quotePayload = {
        customerName: customerName.trim(),
        company: company.trim() || undefined,
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        origin: addressPayload(originCountry, originCity, originState, originZip),
        destination: addressPayload(destCountry, destCity, destState, destZip),
        transportMode: transportMode || undefined,
        cargoDescription: cargoDescription.trim() || 'Commercial Express Consignment',
        shipmentType: (cargoType === 'Vehicle / Automobile' ? 'Vehicle' : 'Parcel') as any,
        service: service as any,
        weightLbs: weight,
        pieces: parseInt(pieces, 10) || 1,
        // Optional; only the sides actually entered are sent (inches)
        dimensions: {
          ...(length !== '' ? { length } : {}),
          ...(width !== '' ? { width } : {}),
          ...(height !== '' ? { height } : {})
        },
        declaredValue: declaredValue === '' ? 0 : declaredValue,
        specialInstructions: specialInstructions.trim() || undefined
      };

      // Send to persistent backend SQLite API
      const result = await api.submitPublicQuote(quotePayload as any);
      const generatedId = result.id || `QR-2026-${Math.floor(10000 + Math.random() * 90000)}`;

      // Update state in context
      createQuoteRequest(result);

      setCreatedQuoteId(generatedId);
      setSubmitted(true);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } catch (err: any) {
      console.warn('API quote submission warning, utilizing client synchronization:', err);
      // Fallback local creation
      const localQuote = createQuoteRequest({
        customerName: customerName.trim(),
        company: company.trim() || undefined,
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        origin: addressPayload(originCountry, originCity, originState, originZip),
        destination: addressPayload(destCountry, destCity, destState, destZip),
        transportMode: transportMode || undefined,
        cargoDescription: cargoDescription || 'Commercial Express Consignment',
        service,
        weightLbs: weight,
        pieces: parseInt(pieces, 10) || 1,
        declaredValue: declaredValue === '' ? 0 : declaredValue,
        specialInstructions
      } as any);
      setCreatedQuoteId(localQuote.id);
      setSubmitted(true);
      window.scrollTo({ top: 200, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setCustomerName('');
    setCompany('');
    setCustomerEmail('');
    setCustomerPhone('');
    setOriginCountry('');
    setDestCountry('');
    setTransportMode('');
    setOriginCity('');
    setOriginState('');
    setOriginZip('');
    setDestCity('');
    setDestState('');
    setDestZip('');
    setCargoDescription('');
    setWeight('');
    setPieces('1');
    setLength('');
    setWidth('');
    setHeight('');
    setDeclaredValue('');
    setSpecialInstructions('');
    setFormError(null);
  };

  return (
    <div className="sdl-page-quote">
      {/* =========================================================================
          1. CINEMATIC HERO SECTION
          ========================================================================= */}
      <section className="sdl-quote-hero">
        <div className="quote-hero-bg-overlay" />
        <div className="sdl-container-wide quote-hero-inner">
          <div className="quote-hero-pill animate-fade-in">
            <span className="quote-pulse-dot" />
            <span>{dotNumber ? `${dotNumber} · ` : ''}CENTRAL TARIFF & RATING DESK</span>
          </div>

          <h1 className="quote-hero-title animate-fade-in">
            Calculate & Request <span className="quote-highlight-accent">Custom Consignment Rates.</span>
          </h1>

          <p className="quote-hero-lead animate-fade-in">
            Submit your consignment routing and weight specifications directly to our Central Tariff Desk. Certified rates are published by our operational coordinators.
          </p>
        </div>
      </section>

      {/* =========================================================================
          2. MAIN BODY & FORM
          ========================================================================= */}
      <div className="sdl-container-wide sdl-quote-body">
        {submitted ? (
          /* =========================================================================
             CONFIRMATION STATE
             ========================================================================= */
          <div className="quote-confirmation-card animate-fade-in">
            <div className="confirm-top-pill">
              <span className="pulse-accent-dot" />
              <span>APPLICATION SUBMITTED · PENDING DISPATCH DESK CERTIFICATION</span>
            </div>

            <div className="confirm-header">
              <div className="check-badge-icon"><CheckCircle2 size={48} className="text-emerald" /></div>
              <h2>Rate Request Successfully Submitted</h2>
              <p>
                Your consignment tariff application <strong className="font-mono text-accent">{createdQuoteId}</strong> has been logged in the {COMPANY} dispatch ledger.
              </p>
            </div>

            <div className="admin-review-info-box">
              <div className="info-box-head">
                <Lock size={18} className="text-accent flex-shrink-0" />
                <h4>How Rate Publishing & Certification Works:</h4>
              </div>
              <p>
                {COMPANY} maintains verified tariff transparency without surge markups. Our central dispatch desk reviews corridor linehaul availability, certified scale weight, and required transit speed. Once certified, your official rate is published to your account and sent directly to <strong>{customerEmail || 'your email'}</strong>.
              </p>
            </div>

            <div className="quote-receipt-card">
              <span className="receipt-tag font-mono">APPLICATION SPECIFICATION SUMMARY</span>
              <div className="receipt-grid">
                <div className="rec-item">
                  <small>Request ID Reference:</small>
                  <strong className="font-mono text-accent">{createdQuoteId}</strong>
                </div>
                <div className="rec-item">
                  <small>Applicant Contact:</small>
                  <strong>{customerName} {company ? `(${company})` : ''}</strong>
                </div>
                <div className="rec-item">
                  <small>Route:</small>
                  <strong>{placeLabel(originCity, originState, originCountry)} → {placeLabel(destCity, destState, destCountry)}</strong>
                </div>
                <div className="rec-item">
                  <small>Cargo Consignment:</small>
                  <strong>{cargoDescription || 'Commercial Parcel'}</strong>
                </div>
                <div className="rec-item">
                  <small>Certified Weight & Pieces:</small>
                  <strong>{formatWeight(weight, units.system)} ({pieces || '1'} pc{parseInt(pieces, 10) > 1 ? 's' : ''})</strong>
                </div>
                <div className="rec-item">
                  <small>Requested Service Tier:</small>
                  <strong>{service}{transportMode ? ` · ${TRANSPORT_MODE_LABELS[transportMode]}` : ''}</strong>
                </div>
                <div className="rec-item span-full">
                  <small>Tariff Certification Status:</small>
                  <strong className="text-accent font-mono">● PENDING DISPATCH DESK CERTIFICATION</strong>
                </div>
              </div>
            </div>

            <div className="quote-confirm-actions">
              <button
                type="button"
                className="btn-corp-primary"
                onClick={() => onNavigate('quote-result', createdQuoteId)}
              >
                <FileText size={16} />
                <span>View Official Quote Ledger</span>
              </button>

              <button
                type="button"
                className="btn-corp-ghost"
                onClick={() => onNavigate('track')}
              >
                <span>Track Active Consignment</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="btn-corp-ghost"
                onClick={handleReset}
              >
                <RotateCcw size={16} />
                <span>Submit Another Rate Application</span>
              </button>
            </div>
          </div>
        ) : (
          /* =========================================================================
             INTERACTIVE RATE REQUEST FORM + LIVE PREVIEW SIDEBAR
             ========================================================================= */
          <div className="sdl-quote-grid">
            <div className="quote-form-card">
              <div className="form-head-title">
                <h3>Consignment Rate Parameters</h3>
                <p>Provide your shipment details to receive an official published rate from our administration desk.</p>
              </div>

              {formError && (
                <div className="quote-form-error animate-fade-in">
                  <AlertCircle size={18} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="quote-calc-form">
                {/* 1. CONTACT INFORMATION */}
                <div className="form-section-divider">
                  <User size={16} className="text-accent" />
                  <span>1. Shipper & Contact Information</span>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. John Anderson"
                      className="sdl-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Company / Organization (Optional)</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Apex Distribution LLC"
                      className="sdl-input"
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g. j.anderson@example.com"
                      className="sdl-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="quote-phone">Phone Number <span className="sdl-field-optional">(optional)</span></label>
                    <PhoneInput
                      id="quote-phone"
                      value={customerPhone}
                      onChange={setCustomerPhone}
                      defaultCountry={originCountry || 'US'}
                      className="sdl-input font-mono"
                    />
                  </div>
                </div>

                {/* 2. ROUTE LOCATIONS */}
                <div className="form-section-divider">
                  <MapPin size={16} className="text-accent" />
                  <span>2. Origin & Destination Corridor</span>
                </div>

                {([
                  { key: 'origin', title: 'Origin', country: originCountry, setCountry: setOriginCountry, city: originCity, setCity: setOriginCity, region: originState, setRegion: setOriginState, postcode: originZip, setPostcode: setOriginZip },
                  { key: 'dest', title: 'Destination', country: destCountry, setCountry: setDestCountry, city: destCity, setCity: setDestCity, region: destState, setRegion: setDestState, postcode: destZip, setPostcode: setDestZip }
                ]).map((side) => (
                  <fieldset key={side.key} className="quote-address-fieldset">
                    <legend>{side.title}</legend>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label htmlFor={`${side.key}-country`}>Country *</label>
                        <CountrySelect
                          id={`${side.key}-country`}
                          value={side.country}
                          onChange={side.setCountry}
                          className="sdl-input"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`${side.key}-city`}>City *</label>
                        <input
                          id={`${side.key}-city`}
                          type="text"
                          required
                          value={side.city}
                          onChange={(e) => side.setCity(e.target.value)}
                          placeholder={side.key === 'origin' ? 'e.g. Lagos' : 'e.g. London'}
                          className="sdl-input"
                        />
                      </div>
                    </div>
                    <div className="form-row-2">
                      <div className="form-group">
                        <label htmlFor={`${side.key}-region`}>{regionLabel(side.country)} <span className="sdl-field-optional">(optional)</span></label>
                        <input
                          id={`${side.key}-region`}
                          type="text"
                          value={side.region}
                          onChange={(e) => side.setRegion(e.target.value)}
                          className="sdl-input"
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor={`${side.key}-postcode`}>{postcodeLabel(side.country)} <span className="sdl-field-optional">(optional)</span></label>
                        <input
                          id={`${side.key}-postcode`}
                          type="text"
                          value={side.postcode}
                          onChange={(e) => side.setPostcode(e.target.value)}
                          className="sdl-input font-mono"
                        />
                      </div>
                    </div>
                  </fieldset>
                ))}

                {/* 3. CARGO SPECIFICATIONS */}
                <div className="form-section-divider">
                  <Package size={16} className="text-accent" />
                  <span>3. Cargo Specifications & Service Tier</span>
                </div>

                <div className="form-group">
                  <label>Consignment Description *</label>
                  <input
                    type="text"
                    required
                    value={cargoDescription}
                    onChange={(e) => setCargoDescription(e.target.value)}
                    placeholder="e.g. Precision diagnostic electronic assemblies"
                    className="sdl-input"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Consignment Category *</label>
                    <select
                      value={cargoType}
                      onChange={(e) => setCargoType(e.target.value)}
                      className="sdl-input"
                    >
                      <option value="Commercial Parcel">Commercial & Corporate Parcel</option>
                      <option value="Vehicle / Automobile">Vehicle / Automobile Transport</option>
                      <option value="Automotive Parts">Automotive Parts & Components</option>
                      <option value="High-Tech Electronics">High-Tech & Sensitive Electronics</option>
                      <option value="Medical Equipment">Medical / Laboratory Specimen</option>
                      <option value="Secure Vault Asset">Secure Vault & High-Value Asset</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Requested Courier Service Tier *</label>
                    <select
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="sdl-input"
                    >
                      <option value="Priority Express Courier">Priority Express Courier (Time-Definite)</option>
                      <option value="Scheduled Commercial Linehaul">Scheduled Commercial Linehaul (Interstate)</option>
                      <option value="Auto & Vehicle Transport">Auto & Vehicle Transport (Open/Enclosed)</option>
                      <option value="Time-Critical Secure Vault">Time-Critical Secure Vault (Armed Custody)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="quote-mode">Transport Mode</label>
                  <select
                    id="quote-mode"
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

                <div className="sdl-heading-with-units quote-units-row">
                  <span className="quote-units-label">Units</span>
                  <UnitToggle />
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label htmlFor="quote-weight">Scale Weight ({units.weight}) *</label>
                    <MeasureInput
                      id="quote-weight"
                      kind="weight"
                      step="0.1"
                      min="0"
                      required
                      value={weight}
                      onChange={setWeight}
                      placeholder={units.system === 'metric' ? 'e.g. 6.5' : 'e.g. 14.5'}
                      className="sdl-input font-mono"
                    />
                  </div>

                  <div className="form-group">
                    <label>Total Pieces *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={pieces}
                      onChange={(e) => setPieces(e.target.value)}
                      placeholder="1"
                      className="sdl-input font-mono"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="quote-value">Declared Value ({money.currency})</label>
                    <MoneyInput
                      id="quote-value"
                      min="0"
                      value={declaredValue}
                      onChange={setDeclaredValue}
                      placeholder="e.g. 2500"
                      className="sdl-input font-mono"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Carton Dimensions (L × W × H, {units.length}) <span className="sdl-field-optional">(optional)</span></label>
                  <div className="dimensions-row">
                    <MeasureInput kind="length" min="0" aria-label={`Length (${units.length})`} value={length} onChange={setLength} placeholder={`Length (${units.length})`} className="sdl-input font-mono" />
                    <MeasureInput kind="length" min="0" aria-label={`Width (${units.length})`} value={width} onChange={setWidth} placeholder={`Width (${units.length})`} className="sdl-input font-mono" />
                    <MeasureInput kind="length" min="0" aria-label={`Height (${units.length})`} value={height} onChange={setHeight} placeholder={`Height (${units.length})`} className="sdl-input font-mono" />
                  </div>
                </div>

                <div className="form-group">
                  <label>Special Instructions / Delivery Directives</label>
                  <textarea
                    rows={3}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Provide facility access details, signature requirements, or handling notes..."
                    className="sdl-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-corp-primary submit-quote-btn"
                >
                  <Send size={18} />
                  <span>{isSubmitting ? 'Submitting Application...' : 'Submit Official Rate Application'}</span>
                </button>
              </form>
            </div>

            {/* Sidebar info & Dynamic Preview */}
            <div className="quote-sidebar-col">
              {/* Dynamic Instant Tariff Estimate Box */}
              {estimatedRate && (
                <div className="dynamic-estimate-box animate-fade-in">
                  <div className="est-head">
                    <Sparkles size={18} className="text-accent" />
                    <strong>Preliminary Tariff Corridor</strong>
                  </div>
                  <div className="est-amount font-mono">
                    {money.format(estimatedRate.low, 0)} – {money.format(estimatedRate.high, 0)}
                  </div>
                  <p className="est-note">
                    Preliminary automated estimate for {formatWeight(weight, units.system)} via {service}. Final custom tariff is certified by our dispatch desk upon scale and corridor intake review.
                  </p>
                </div>
              )}

              <div className="quote-policy-card">
                <span className="policy-tag font-mono">OUR TARIFF ASSURANCE</span>
                <h3>Direct Carrier Integrity</h3>
                <p>
                  To eliminate unexpected broker markups and maintain carrier rate integrity, all consignment tariffs are calculated and officially published by our central administrative desk.
                </p>
                
                <div className="policy-points">
                  <div className="p-point">
                    <CheckCircle2 size={16} className="text-accent flex-shrink-0" />
                    <span>Exact scale weight & dimensional cubic rating</span>
                  </div>
                  <div className="p-point">
                    <CheckCircle2 size={16} className="text-accent flex-shrink-0" />
                    <span>Verified route and schedule planning</span>
                  </div>
                  <div className="p-point">
                    <CheckCircle2 size={16} className="text-accent flex-shrink-0" />
                    <span>Published directly to your official tracking ledger</span>
                  </div>
                  <div className="p-point">
                    <CheckCircle2 size={16} className="text-accent flex-shrink-0" />
                    <span>Direct agency documentation issuance</span>
                  </div>
                </div>

                <div className="contact-hotline-box">
                  <small>Need Immediate Tariff Assistance?</small>
                  <strong>{supportPhone || dispatchEmail}</strong>
                  <p>24/7 Central Operations Desk Connection</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
