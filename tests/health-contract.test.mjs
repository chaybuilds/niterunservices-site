import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const script=readFileSync(new URL('../scripts/health-check.mjs',import.meta.url),'utf8');
test('health reports apex TLS and www redirect separately',()=>{
 assert.match(script,/siteCheck\('custom_domain_https'/);
 assert.match(script,/siteCheck\('www_https_redirect'/);
 assert.match(script,/final\.protocol==='https:'/);
 assert.match(script,/final\.hostname===requiredHost/);
});
test('fallback cannot mask a custom domain whose HTTPS is not ready',()=>{
 assert.match(script,/const ok=apex&&alias&&api&&dns/);
 assert.doesNotMatch(script,/const ok=.*fallback/);
 assert.match(script,/SERVICES_CUSTOM_DOMAIN_INCOMPLETE/);
});
test('health checks actual protected intake but never creates a quote or payment',()=>{
 assert.match(script,/protected_request_api/);
 assert.match(script,/p\.booking_confirmation===false/);
 assert.match(script,/p\.payment_processing===false/);
 assert.doesNotMatch(script,/method:\s*['"]POST['"]/);
});
