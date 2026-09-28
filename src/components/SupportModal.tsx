import React, { useState } from 'react';
import { Headphones, X, CheckCircle, Send, AlertCircle } from 'lucide-react';
import './SupportModal.css';
import { COMPANY_SHORT } from '../config/brand';
import { generateReference } from '../shared/references';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTrackingNumber?: string;
  defaultIssueType?: string;
}

export const SupportModal: React.FC<SupportModalProps> = ({
  isOpen,
  onClose,
  initialTrackingNumber = '',
  defaultIssueType = 'General Inquiry',
}) => {
  const [trackingNumber, setTrackingNumber] = useState(initialTrackingNumber);
  const [issueType, setIssueType] = useState(defaultIssueType);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTicketId(generateReference('ticket'));
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2800);
  };

  return (
    <div className="sdl-support-overlay" onClick={onClose}>
      <div className="sdl-support-card" onClick={(e) => e.stopPropagation()}>
        <div className="sdl-support-header">
          <div className="support-header-left">
            <div className="support-icon-pill">
              <Headphones size={18} />
            </div>
            <div>
              <h3>Get Shipment Support</h3>
              <p>Direct assistance from the {COMPANY_SHORT} operations team</p>
            </div>
          </div>
          <button className="support-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div className="sdl-support-success">
            <CheckCircle size={44} className="text-emerald" />
            <h4>Support Request Received</h4>
            <p>
              Your ticket <strong>#{ticketId}</strong> has been opened for tracking number <strong>{trackingNumber || 'General'}</strong>.
            </p>
            <span className="support-timeframe">Our operations specialist will respond within 2 business hours.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="sdl-support-form">
            <div className="form-group">
              <label>Tracking Number (Auto-Associated)</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="e.g. DLS7K2M9"
                className="sdl-input font-mono"
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Issue Category</label>
                <select
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="sdl-input"
                >
                  <option value="General Inquiry">General Tracking Inquiry</option>
                  <option value="Delay Inquiry">Delay / ETA Reschedule</option>
                  <option value="Address Correction">Address or Delivery Instructions</option>
                  <option value="Delivery Exception">Delivery Issue / Attempt Failed</option>
                  <option value="Document Request">Missing Documents / Proof of Delivery</option>
                </select>
              </div>

              <div className="form-group">
                <label>Your Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Michael Johnson"
                  className="sdl-input"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Contact Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="sdl-input"
              />
            </div>

            <div className="form-group">
              <label>Describe the shipment issue</label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe any questions or notes regarding your shipment movement..."
                className="sdl-input"
              />
            </div>

            <div className="support-form-actions">
              <button type="button" className="sdl-btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="sdl-btn-primary">
                <Send size={15} /> Submit Support Request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
