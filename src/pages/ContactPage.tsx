import React, { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Check
} from 'lucide-react';
import { useAdminData } from '../context/AdminDataContext';
import { useCompanyContact } from '../utils/useCompanyContact';
import { LEGAL_NAME } from '../config/brand';
import './ContactPage.css';

interface ContactPageProps {
  onNavigate?: (page: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const { settings } = useAdminData();
  // Empty phone/address/regulatory values hide their element (no placeholders).
  const { phone: supportPhone, email: dispatchEmail, address: headquartersAddress, regulatoryLine: dotNumber } = useCompanyContact();
  const companyName = settings.companyName || LEGAL_NAME;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('General Operations');
  const [priority, setPriority] = useState<'routine' | 'urgent' | 'critical'>('routine');
  const [tracking, setTracking] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Accordion open states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError('Please complete all required fields (Name, Email, and Message) before submitting.');
      return;
    }

    const generatedId = `SDL-TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketId(generatedId);
    setSubmitted(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleReset = () => {
    setName('');
    setEmail('');
    setPhone('');
    setSubject('General Operations');
    setPriority('routine');
    setTracking('');
    setMessage('');
    setSubmitted(false);
    setFormError(null);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      q: "How do I track an active consignment across your sortation network?",
      a: "Enter your 8-character tracking ID (e.g. DLS7K2M9) in the search bar on our Track page. You'll see verified checkpoint scans, live milestones and your estimated delivery."
    },
    {
      q: "What courier delivery options exist for commercial and residential tenders?",
      a: "We provide time-definite deliveries with options for Direct Adult Signature Confirmation, Saturday Expedited Delivery, Scheduled Dock Intake, or Monitored Gateway Facility Hold."
    },
    {
      q: "How is recipient proof of delivery (POD) captured and archived?",
      a: "Upon delivery handover, the courier captures an authorized physical signature and verified timestamp. These records are archived into our permanent digital ledger and transmitted directly to the consignor."
    },
    {
      q: "Can I request an urgent re-route or address hold for a shipment in transit?",
      a: `Yes. Authorized shippers or consignees can contact our 24/7 central dispatch desk at ${supportPhone || dispatchEmail} with their master tracking reference to request a gateway terminal hold or address update prior to final delivery dispatch.`
    },
    {
      q: "What services do you provide for high-value tenders and vehicle transport?",
      a: "We offer specialized Auto & Vehicle Transport (enclosed and open-deck carrier relocation) as well as Time-Critical Secure Vault courier services with dual-custody armored transport and dedicated dispatch oversight."
    },
    {
      q: "What happens if an unexpected weather or highway corridor delay occurs?",
      a: "If an operational delay occurs, our automated telemetry system recalculates transit windows and logs an updated ETA in your live tracking ledger. You can also submit an urgent ticket here or contact our desk directly."
    }
  ];

  return (
    <div className="sdl-page-contact">
      {/* =========================================================================
          1. CINEMATIC HERO SECTION
          ========================================================================= */}
      <section className="sdl-contact-hero">
        <div className="contact-hero-bg-overlay" />
        <div className="sdl-container-wide contact-hero-inner">
          <div className="contact-hero-pill animate-fade-in">
            <span className="contact-pulse-dot" />
            <span>{dotNumber ? `${dotNumber} · ` : ''}24/7 CENTRAL DISPATCH DESK</span>
          </div>

          <h1 className="contact-hero-title animate-fade-in">
            Connect with Our <span className="contact-highlight-accent">Logistics Operations Team.</span>
          </h1>

          <p className="contact-hero-lead animate-fade-in">
            Speak directly with experienced U.S. linehaul dispatchers, courier routing specialists, and vehicle transport coordinators around the clock.
          </p>
        </div>
      </section>

      {/* =========================================================================
          2. MAIN BODY: FORM & DIRECT CHANNELS
          ========================================================================= */}
      <div className="sdl-container-wide sdl-contact-body">
        <div className="contact-grid">
          {/* Left Column: Form & Confirmation */}
          <div className="contact-form-card">
            {submitted ? (
              <div className="contact-success-wrap animate-fade-in">
                <div className="success-icon-badge">
                  <CheckCircle2 size={48} className="text-emerald" />
                </div>
                <h3>Dispatch Ticket Logged Successfully</h3>
                
                <div className="ticket-summary-box">
                  <span className="tkt-label">OFFICIAL INQUIRY REFERENCE</span>
                  <span className="tkt-id font-mono">{ticketId}</span>
                  <p>
                    Thank you, <strong>{name}</strong>. Your inquiry regarding <strong>{subject}</strong> has been logged into our central dispatch queue.
                  </p>
                  <div className="tkt-details-row">
                    <span>Priority Status: <strong className={`prio-tag ${priority}`}>{priority.toUpperCase()}</strong></span>
                    <span>Target Response: <strong>&lt; 30 Mins</strong></span>
                  </div>
                </div>

                <div className="ticket-notice-banner">
                  <ShieldCheck size={18} className="text-accent flex-shrink-0" />
                  <p>
                    A regional dispatch coordinator will review your request and reach out directly to <strong>{email}</strong>.
                  </p>
                </div>

                <div className="success-action-row">
                  <button
                    type="button"
                    className="btn-corp-primary"
                    onClick={handleReset}
                  >
                    <RotateCcw size={16} />
                    <span>Submit Another Inquiry</span>
                  </button>

                  {onNavigate && (
                    <button
                      type="button"
                      className="btn-corp-ghost"
                      onClick={() => onNavigate('track')}
                    >
                      <span>Track Active Consignment</span>
                      <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-header-row">
                  <div>
                    <h3>Submit an Operations Ticket</h3>
                    <p>Provide your inquiry parameters below for immediate routing to the appropriate dispatch desk.</p>
                  </div>
                  <div className="priority-select-wrap">
                    <span className="prio-label">Priority Level</span>
                    <div className="prio-btn-group">
                      <button
                        type="button"
                        className={`prio-btn ${priority === 'routine' ? 'active' : ''}`}
                        onClick={() => setPriority('routine')}
                      >
                        Routine
                      </button>
                      <button
                        type="button"
                        className={`prio-btn ${priority === 'urgent' ? 'active urgent' : ''}`}
                        onClick={() => setPriority('urgent')}
                      >
                        Urgent
                      </button>
                      <button
                        type="button"
                        className={`prio-btn ${priority === 'critical' ? 'active critical' : ''}`}
                        onClick={() => setPriority('critical')}
                      >
                        Critical
                      </button>
                    </div>
                  </div>
                </div>

                {formError && (
                  <div className="contact-form-error animate-fade-in">
                    <AlertTriangle size={18} className="flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}
                
                <div className="form-row-2">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Anderson"
                      className="sdl-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. j.anderson@example.com"
                      className="sdl-input"
                    />
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Direct Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. (555) 014-8822"
                      className="sdl-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Tracking Number / BOL Reference (Optional)</label>
                    <input
                      type="text"
                      value={tracking}
                      onChange={(e) => setTracking(e.target.value)}
                      placeholder="e.g. DLS7K2M9"
                      className="sdl-input font-mono"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Inquiry Category</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="sdl-input"
                  >
                    <option value="General Operations">General Operations & Courier Services</option>
                    <option value="Tracking Assistance">Active Consignment Tracking & Movement</option>
                    <option value="Delivery Exception">Delivery Exception or Gateway Terminal Hold</option>
                    <option value="Scheduled Linehaul">Scheduled Commercial Linehaul Routing</option>
                    <option value="Vehicle Transport">Auto & Vehicle Transport Dispatch</option>
                    <option value="Secure Vault">Time-Critical Secure Vault Inquiries</option>
                    <option value="Billing & Claims">Billing Invoicing & Proof of Delivery</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Message / Consignment Specifications *</label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your inquiry, delivery update request, or specialized courier requirements..."
                    className="sdl-input"
                  />
                </div>

                <button type="submit" className="btn-corp-primary form-submit-btn">
                  <Send size={16} />
                  <span>Dispatch Ticket to Operations Desk</span>
                </button>
              </form>
            )}
          </div>

          {/* Right Column: Direct Channels & Hotline */}
          <div className="contact-info-col">
            <div className="contact-info-card">
              <span className="card-top-tag font-mono">DIRECT DISPATCH CHANNELS</span>
              <h3>24/7 Operations Desk</h3>

              {supportPhone && (
                <div className="contact-channel-item">
                  <div className="channel-icon icon-accent"><Phone size={22} /></div>
                  <div>
                    <small>Toll-Free 24/7 Operations Hotline</small>
                    <strong>{supportPhone}</strong>
                    <p>Direct Connection to Regional Dispatch Supervisors</p>
                  </div>
                </div>
              )}

              <div className="contact-channel-item">
                <div className="channel-icon icon-emerald"><Mail size={22} /></div>
                <div>
                  <small>Central Email Desk</small>
                  <strong>{dispatchEmail}</strong>
                  <p>Average response time under 30 minutes</p>
                </div>
              </div>

              {headquartersAddress && (
                <div className="contact-channel-item">
                  <div className="channel-icon icon-sky"><MapPin size={22} /></div>
                  <div>
                    <small>National Corporate Headquarters</small>
                    <strong>{companyName}</strong>
                    <p>{headquartersAddress}</p>
                  </div>
                </div>
              )}

              <div className="emergency-box">
                <div className="em-head">
                  <AlertTriangle size={18} className="text-amber" />
                  <strong>Active Interstate Linehaul Emergency?</strong>
                </div>
                <p>For urgent in-transit delivery holds or urgent vehicle transports, contact our dedicated supervisor {supportPhone ? <>priority line at <strong>{supportPhone} (Ext 1)</strong></> : <>desk at <strong>{dispatchEmail}</strong></>}.</p>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            3. INTERACTIVE FAQ ACCORDION SECTION
            ========================================================================= */}
        <section className="sdl-contact-faq-section">
          <div className="section-center-header">
            <span className="section-eyebrow">FREQUENTLY ASKED QUESTIONS</span>
            <h2>Operations & Support Knowledge Base</h2>
            <p className="section-desc-sub">Quick answers to common questions regarding linehaul transit, piece-level tracking, and proof of delivery.</p>
            <div className="section-header-line" />
          </div>

          <div className="contact-faq-accordion">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className={`contact-faq-item ${openFaq === index ? 'active' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFaq(index)}
                >
                  <div className="q-left">
                    <HelpCircle size={18} className="text-accent flex-shrink-0" />
                    <span>{faq.q}</span>
                  </div>
                  {openFaq === index ? (
                    <ChevronUp size={18} className="text-accent flex-shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />
                  )}
                </button>

                {openFaq === index && (
                  <div className="faq-answer-body animate-fade-in">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
