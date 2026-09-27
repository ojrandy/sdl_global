import React, { useState, useEffect } from 'react';
import {
  Package,
  Menu,
  X,
  ArrowRight,
  Shield,
  MapPin,
  Calculator,
  Truck,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  ChevronRight,
  Home,
  Headphones,
  FileText
} from 'lucide-react';
import { useCompanyContact } from '../utils/useCompanyContact';
import './Header.css';

interface HeaderProps {
  activePage?: string;
  onNavigate?: (page: string, param?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage = 'home',
  onNavigate = () => {},
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Admin-editable company contact info — this used to be hardcoded here (and independently
  // hardcoded, often with different fake numbers, across every other public page), so
  // changing the phone/email/DOT number in Settings never actually reached any of them.
  // Empty values hide their element (no placeholder numbers).
  const { phone: supportPhone, phoneHref, email: dispatchEmail, regulatoryLine: dotNumber } = useCompanyContact();

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleNav = (page: string, param?: string) => {
    onNavigate(page, param);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sdl-header-wrapper">
      {/* 1. TOP UTILITY BAR (Hidden completely on mobile to eliminate clutter) */}
      <div className="sdl-topbar hide-mobile-topbar">
        <div className="sdl-container-wide sdl-topbar-inner">
          <div className="sdl-topbar-left">
            {supportPhone && (
              <>
                <div className="topbar-item">
                  <Phone size={13} className="text-accent" />
                  <span>Priority Dispatch: <strong>{supportPhone}</strong></span>
                </div>
                <div className="topbar-divider" />
              </>
            )}
            <div className="topbar-item">
              <Mail size={13} className="text-accent" />
              <span>{dispatchEmail}</span>
            </div>
            <div className="topbar-divider" />
            <div className="topbar-item">
              <Clock size={13} className="text-emerald" />
              <span>24/7 Continuous Highway Transit</span>
            </div>
          </div>

          <div className="sdl-topbar-right">
            {dotNumber && (
              <div className="topbar-cert-pill font-mono">
                <CheckCircle2 size={12} className="text-emerald" />
                <span>{dotNumber}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION BAR */}
      <div className="sdl-main-header">
        <div className="sdl-container-wide sdl-header-inner">
          {/* Brand Logo */}
          <div className="sdl-logo-wrap" onClick={() => handleNav('home')}>
            <img
              src="/logo.png"
              alt="Duolingo Express"
              className="sdl-brand-logo-img"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent && !parent.querySelector('.sdl-fallback-logo')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'sdl-fallback-logo';
                  fallback.innerHTML = '<span class="sdl-brand-name">DUOLINGO<span class="text-accent">EXPRESS</span></span>';
                  parent.appendChild(fallback);
                }
              }}
            />
          </div>

          {/* Desktop Nav Links */}
          <nav className="sdl-nav-links">
            <button
              type="button"
              className={`sdl-nav-link ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => handleNav('home')}
            >
              Home
            </button>
            <button
              type="button"
              className={`sdl-nav-link ${activePage === 'about' ? 'active' : ''}`}
              onClick={() => handleNav('about')}
            >
              About Us
            </button>
            <button
              type="button"
              className={`sdl-nav-link ${activePage === 'services' ? 'active' : ''}`}
              onClick={() => handleNav('services')}
            >
              Services
            </button>
            <button
              type="button"
              className={`sdl-nav-link ${activePage === 'track' ? 'active' : ''}`}
              onClick={() => handleNav('track')}
            >
              Track Shipment
            </button>
            <button
              type="button"
              className={`sdl-nav-link ${activePage === 'ship' ? 'active' : ''}`}
              onClick={() => handleNav('ship')}
            >
              Ship Now
            </button>
            <button
              type="button"
              className={`sdl-nav-link ${activePage === 'contact' ? 'active' : ''}`}
              onClick={() => handleNav('contact')}
            >
              Contact
            </button>
          </nav>

          {/* Header Primary Action Button */}
          <div className="sdl-header-actions">
            <button
              type="button"
              className="sdl-btn-top-quote"
              onClick={() => handleNav('quote')}
            >
              <Calculator size={15} />
              <span>Request a Quote</span>
            </button>
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className={`sdl-mobile-toggle-btn ${mobileMenuOpen ? 'is-active' : ''}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* 3. EXECUTIVE MOBILE DRAWER OVERLAY */}
      {mobileMenuOpen && (
        <div className="sdl-drawer-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="sdl-mobile-drawer-sheet animate-slide-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header with Logo and Close */}
            <div className="drawer-header">
              <div className="drawer-logo" onClick={() => handleNav('home')}>
                <img src="/logo.png" alt="Duolingo Express" className="drawer-logo-img" />
              </div>
              <button
                type="button"
                className="drawer-close-btn"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Action Top Cards */}
            <div className="drawer-quick-actions">
              <button
                type="button"
                className="drawer-action-card track-card"
                onClick={() => handleNav('track')}
              >
                <div className="action-icon-wrap accent">
                  <Package size={20} />
                </div>
                <div className="action-text">
                  <strong>Track a Shipment</strong>
                  <small>Live highway telemetry radar</small>
                </div>
                <ChevronRight size={16} className="action-arrow" />
              </button>

              <button
                type="button"
                className="drawer-action-card quote-card"
                onClick={() => handleNav('quote')}
              >
                <div className="action-icon-wrap navy">
                  <Calculator size={20} />
                </div>
                <div className="action-text">
                  <strong>Get Tariff Quote</strong>
                  <small>Instant corridor rate calculation</small>
                </div>
                <ChevronRight size={16} className="action-arrow" />
              </button>
            </div>

            {/* Navigation List */}
            <div className="drawer-nav-section">
              <span className="drawer-section-label">MAIN NAVIGATION</span>
              <nav className="drawer-nav-list">
                <button
                  type="button"
                  className={`drawer-link ${activePage === 'home' ? 'active' : ''}`}
                  onClick={() => handleNav('home')}
                >
                  <Home size={18} className="link-icon" />
                  <span>Home</span>
                  <ChevronRight size={14} className="link-chevron" />
                </button>

                <button
                  type="button"
                  className={`drawer-link ${activePage === 'services' ? 'active' : ''}`}
                  onClick={() => handleNav('services')}
                >
                  <Truck size={18} className="link-icon" />
                  <span>Our Courier Services</span>
                  <ChevronRight size={14} className="link-chevron" />
                </button>

                <button
                  type="button"
                  className={`drawer-link ${activePage === 'ship' ? 'active' : ''}`}
                  onClick={() => handleNav('ship')}
                >
                  <Package size={18} className="link-icon" />
                  <span>Ship a Consignment</span>
                  <ChevronRight size={14} className="link-chevron" />
                </button>

                <button
                  type="button"
                  className={`drawer-link ${activePage === 'locations' ? 'active' : ''}`}
                  onClick={() => handleNav('locations')}
                >
                  <MapPin size={18} className="link-icon" />
                  <span>Facility & Gateway Network</span>
                  <ChevronRight size={14} className="link-chevron" />
                </button>

                <button
                  type="button"
                  className={`drawer-link ${activePage === 'about' ? 'active' : ''}`}
                  onClick={() => handleNav('about')}
                >
                  <Shield size={18} className="link-icon" />
                  <span>About Duolingo Express</span>
                  <ChevronRight size={14} className="link-chevron" />
                </button>

                <button
                  type="button"
                  className={`drawer-link ${activePage === 'contact' ? 'active' : ''}`}
                  onClick={() => handleNav('contact')}
                >
                  <Headphones size={18} className="link-icon" />
                  <span>24/7 Operations Desk</span>
                  <ChevronRight size={14} className="link-chevron" />
                </button>
              </nav>
            </div>

            {/* 24/7 Dispatch Hotline Bottom Box */}
            <div className="drawer-footer-hotline">
              <div className="hotline-head">
                <span className="live-status-dot" />
                <span className="hotline-tag font-mono">24/7 OPERATIONS ACTIVE</span>
              </div>
              {supportPhone ? (
                <a href={phoneHref} className="hotline-phone-btn">
                  <Phone size={15} />
                  <span>Call Dispatch: {supportPhone}</span>
                </a>
              ) : (
                <a href={`mailto:${dispatchEmail}`} className="hotline-phone-btn">
                  <Mail size={15} />
                  <span>{dispatchEmail}</span>
                </a>
              )}
              {dotNumber && (
                <div className="drawer-regulatory font-mono">
                  {dotNumber}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
