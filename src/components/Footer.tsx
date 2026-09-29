import React from 'react';
import {
  ShieldCheck,
  Clock,
  Layers,
  Globe,
  Send,
  Linkedin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  ChevronRight
} from 'lucide-react';
import { COMPANY_SHORT, LEGAL_NAME, LOGO_ALT, LOGO_WHITE, SOCIAL, SocialNetwork, TAGLINE } from '../config/brand';
import { useCompanyContact } from '../utils/useCompanyContact';
import './Footer.css';

// Only networks with a real URL in brand.ts are rendered.
const SOCIAL_LINKS: { key: SocialNetwork; label: string; Icon: typeof Facebook }[] = [
  { key: 'facebook', label: 'Facebook', Icon: Facebook },
  { key: 'x', label: 'Twitter / X', Icon: Twitter },
  { key: 'instagram', label: 'Instagram', Icon: Instagram },
  { key: 'linkedin', label: 'LinkedIn', Icon: Linkedin },
  { key: 'youtube', label: 'YouTube', Icon: Youtube },
];

// LegalPage sections (CONTENT §1.3 / §13).
const LEGAL_LINKS = [
  { section: 'privacy', label: 'Privacy Policy' },
  { section: 'terms', label: 'Terms of Service' },
  { section: 'shipping-terms', label: 'Shipping Terms' },
  { section: 'cookies', label: 'Cookie Policy' },
  { section: 'accessibility', label: 'Accessibility' },
];

interface FooterProps {
  onNavigate?: (page: string, param?: string) => void;
  showTrustStrip?: boolean;
}

export const Footer: React.FC<FooterProps> = ({
  onNavigate = () => {},
  showTrustStrip = true,
}) => {
  const { address } = useCompanyContact();

  return (
    <footer className="sdl-pro-footer-wrapper">
      {/* 1. TRUST FEATURE STRIP */}
      {showTrustStrip && (
        <div className="sdl-footer-trust-strip">
          <div className="sdl-container-wide sdl-trust-grid">
            <div className="sdl-trust-card">
              <div className="sdl-trust-icon">
                <Globe size={24} />
              </div>
              <div className="sdl-trust-info">
                <h4>Worldwide Coverage</h4>
                <p>Air, ocean and road, connected.</p>
              </div>
            </div>

            <div className="sdl-trust-card">
              <div className="sdl-trust-icon">
                <Clock size={24} />
              </div>
              <div className="sdl-trust-info">
                <h4>Live Milestones</h4>
                <p>Every hand-off scanned and time-stamped.</p>
              </div>
            </div>

            <div className="sdl-trust-card">
              <div className="sdl-trust-icon">
                <Layers size={24} />
              </div>
              <div className="sdl-trust-info">
                <h4>Piece-Level Labels</h4>
                <p>Every carton individually barcoded.</p>
              </div>
            </div>

            <div className="sdl-trust-card">
              <div className="sdl-trust-icon">
                <ShieldCheck size={24} />
              </div>
              <div className="sdl-trust-info">
                <h4>Signed Delivery</h4>
                <p>Digital proof of delivery on every shipment.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN EXECUTIVE FOOTER */}
      <div className="sdl-pro-footer-main">
        {/* Subtle Map Watermark Background */}
        <div className="footer-world-map-bg" />
        
        {/* Glowing Accent Corner Swoosh */}
        <div className="footer-accent-swoosh" />

        <div className="sdl-container-wide footer-content-relative">
          <div className="sdl-pro-footer-grid">
            {/* Column 1: Brand & Tagline */}
            <div className="sdl-pro-brand-col">
              <div className="sdl-pro-footer-logo" onClick={() => onNavigate('home')}>
                <img
                  src={LOGO_WHITE}
                  alt={LOGO_ALT}
                  className="sdl-pro-footer-logo-img"
                />
              </div>

              <p className="sdl-pro-brand-desc">
                Express, freight and secure cargo across borders, with one tracking ID and one accountable team from pickup to proof of delivery.
              </p>

              {SOCIAL_LINKS.some(s => SOCIAL[s.key]) && (
                <div className="sdl-pro-socials">
                  {SOCIAL_LINKS.filter(s => SOCIAL[s.key]).map(({ key, label, Icon }) => (
                    <a key={key} href={SOCIAL[key]} className="pro-social-btn" aria-label={label} target="_blank" rel="noopener noreferrer">
                      <Icon size={15} />
                    </a>
                  ))}
                </div>
              )}

              <div className="sdl-pro-faster-tagline font-mono">
                <span>{TAGLINE.toUpperCase()}.</span>
                <div className="tagline-bar" />
              </div>
            </div>

            {/* Column 2: Services */}
            <div className="sdl-pro-links-col">
              <h4 className="sdl-pro-col-title">
                Services
                <span className="title-accent-dash" />
              </h4>
              <ul className="sdl-pro-links-list">
                <li>
                  <button type="button" onClick={() => onNavigate('services')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Priority Express</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('services')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Freight & Linehaul</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('services')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Vehicle Shipping</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('services')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Secure Vault</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('quote')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Get a Quote</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Company (Careers hidden until the page exists) */}
            <div className="sdl-pro-links-col">
              <h4 className="sdl-pro-col-title">
                Company
                <span className="title-accent-dash" />
              </h4>
              <ul className="sdl-pro-links-list">
                <li>
                  <button type="button" onClick={() => onNavigate('about')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>About {COMPANY_SHORT}</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('locations')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Global Network</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('contact')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Contact</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Support */}
            <div className="sdl-pro-links-col">
              <h4 className="sdl-pro-col-title">
                Support
                <span className="title-accent-dash" />
              </h4>
              <ul className="sdl-pro-links-list">
                <li>
                  <button type="button" onClick={() => onNavigate('track')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Track a Shipment</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('help')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Help Centre</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('ship')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Book a Shipment</span>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => onNavigate('contact')}>
                    <ChevronRight size={14} className="link-chevron" />
                    <span>Report an Issue</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 5: Legal */}
            <nav className="sdl-pro-links-col" aria-label="Legal">
              <h4 className="sdl-pro-col-title">
                Legal
                <span className="title-accent-dash" />
              </h4>
              <ul className="sdl-pro-links-list">
                {LEGAL_LINKS.map(({ section, label }) => (
                  <li key={section}>
                    <button type="button" onClick={() => onNavigate('legal', section)}>
                      <ChevronRight size={14} className="link-chevron" />
                      <span>{label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* 3. BOTTOM BAR */}
          <div className="sdl-pro-footer-bottom">
            <div className="pro-copy-text">
              © {new Date().getFullYear()} {LEGAL_NAME}. All rights reserved.
              {address && <> · {address}</>}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
