// Single source of truth for brand facts (CLAUDE.md §2, BRAND_GUIDE.md). Import from here
// instead of hard-coding names, emails or domains in components.
//
// Contact values left as '' are not known yet. UI that would show them must hide itself
// (see useCompanyContact). Never fill these with made-up numbers or addresses.

export const COMPANY = 'SDL Global Logistics';
export const COMPANY_SHORT = 'SDL';
export const LEGAL_NAME = 'SDL Global Logistics Ltd';
export const TAGLINE = 'Fast, Safe, Reliable';

export const EMAIL = 'info@sdlgloballogistics.com';
export const DOMAIN = 'sdlgloballogistics.com';
export const SITE_URL = `https://${DOMAIN}`;

// The admin console only opens on <ADMIN_SUBDOMAIN>.<DOMAIN> (plus localhost for development).
export const ADMIN_SUBDOMAIN = 'private';
export const ADMIN_HOST = `${ADMIN_SUBDOMAIN}.${DOMAIN}`;
export const ADMIN_CONSOLE_NAME = `${COMPANY_SHORT} Operations Console`;

// Tracking ID = prefix + 5 characters, 8 total (BRAND_GUIDE §7).
export const TRACKING_PREFIX = 'DLS';

// TBD: supplied by the owner.
export const PHONE = '';
export const WHATSAPP = '';
export const HQ_ADDRESS = '';

export const SOCIAL = {
  facebook: '',
  x: '',
  instagram: '',
  linkedin: '',
  youtube: '',
};

export type SocialNetwork = keyof typeof SOCIAL;
