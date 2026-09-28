// Tests for reference numbers (BRAND_GUIDE §7) and the shared demo data (tracker 1.10/1.11).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateReference, referenceFor, REFERENCE_PATTERN } from '../src/shared/references.ts';
import { DEMO_SHIPMENTS, DEMO_QUOTES } from '../src/shared/demoData.ts';
import { isValidTrackingId } from '../src/shared/trackingId.ts';

test('generateReference: SDL-SL/TKT/INV + 6 digits', () => {
  for (const [kind, prefix] of [['seal', 'SDL-SL-'], ['ticket', 'SDL-TKT-'], ['invoice', 'SDL-INV-']] as const) {
    for (let i = 0; i < 500; i++) {
      const ref = generateReference(kind);
      assert.ok(ref.startsWith(prefix), ref);
      assert.match(ref, REFERENCE_PATTERN);
    }
  }
});

test('referenceFor is stable per seed and well-formed', () => {
  assert.equal(referenceFor('invoice', 'INV-2026-48213'), referenceFor('invoice', 'INV-2026-48213'));
  assert.notEqual(referenceFor('invoice', 'INV-2026-48213'), referenceFor('invoice', 'INV-2026-48214'));
  assert.match(referenceFor('invoice', 'x'), /^SDL-INV-\d{6}$/);
});

test('demo shipments: valid unique DLS IDs, worldwide routes, fictional parties', () => {
  const ids = DEMO_SHIPMENTS.map(s => s.trackingNumber);
  assert.equal(new Set(ids).size, ids.length);
  for (const s of DEMO_SHIPMENTS) {
    assert.ok(isValidTrackingId(s.trackingNumber), s.trackingNumber);
    assert.notEqual(s.origin.country, s.destination.country, `${s.trackingNumber} should cross a border`);
    assert.match(s.sender.name, /^Demo /);
    assert.match(s.recipient.name, /^Demo /);
    assert.match(s.sender.email, /@example\.com$/);
    assert.match(s.references.invoiceNumber, REFERENCE_PATTERN);
    if (s.containerDetails) assert.match(s.containerDetails.boltSeal, REFERENCE_PATTERN);
    const ages = s.events.map(e => e.hoursAgo);
    assert.deepEqual([...ages].sort((a, b) => b - a), ages, `${s.trackingNumber} events must be oldest first`);
    assert.equal(s.events[s.events.length - 1].place.city, s.current.city);
  }
});

test('demo data has no phone numbers or old personal references', () => {
  const text = JSON.stringify({ DEMO_SHIPMENTS, DEMO_QUOTES });
  assert.doesNotMatch(text, /randy|tacoma|duolingo|dxp/i);
  assert.doesNotMatch(text, /\+\d[\d\s()-]{6,}/, 'no phone numbers');
});
