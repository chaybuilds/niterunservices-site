import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const client=readFileSync('scripts/build.mjs','utf8');
const backend=readFileSync('supabase/functions/services-intake/index.ts','utf8');

test('the public request-only consent is matched by server-side provenance',()=>{
  assert.match(client,/name="consent" required/);
  assert.match(client,/agree to be contacted about <em>this service request<\/em>/);
  assert.match(client,/does not subscribe me to marketing/);
  assert.match(backend,/if\(raw.consent!==true\)return response\(\{error:'Contact consent required\.'\},422/);
  assert.match(backend,/CONTACT_NOTICE_VERSION='niterun-services-request-contact-20261108-v1'/);
  assert.match(backend,/contact_consent_notice_version:CONTACT_NOTICE_VERSION/);
  assert.match(backend,/contact_consent_capture_method:'website_checkbox'/);
  assert.match(backend,/booking_confirmed:false/);
  assert.match(backend,/marketing_enrollment:false/);
});
test('contact-only consent never implies separate rights',()=>{
  assert.doesNotMatch(client,/name="ai_training"|name="marketing_consent"|name="call_recording"/);
  assert.doesNotMatch(backend,/raw\.consent\s*\?\s*['"]ai_training/);
  assert.doesNotMatch(backend,/marketing_enrollment:true/);
  assert.doesNotMatch(backend,/booking_confirmed:true/);
});
