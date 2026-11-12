import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const fromDist=path=>readFileSync(new URL('../dist/'+path,import.meta.url),'utf8');
test('cleaning overview has truthful independent-crew recruiting action',()=>{
 const html=fromDist('services/cleaning/index.html');
 assert.match(html,/Independent cleaning crews around Wilmington or Leland/);
 assert.match(html,/https:\/\/niteclean\.base44\.app\/for-cleaners\?city=Wilmington/);
 assert.match(html,/No job volume is guaranteed/);
 assert.match(html,/signed agreement/);
});
test('Wilmington page has crew CTA but no false staffed-branch claim',()=>{
 const html=fromDist('cleaning/wilmington/index.html');
 assert.match(html,/Wilmington and Leland cleaning companies/);
 assert.match(html,/for-cleaners\?city=Wilmington/);
 assert.match(html,/noindex,follow/);
 assert.match(html,/no confirmed staffed location|no confirmed local Google Business Profile|no confirmed staffed/i);
});
test('Leland is a prelaunch interest page, not a fake business location',()=>{
 const html=fromDist('cleaning/leland/index.html');
 assert.match(html,/noindex,follow/);
 assert.match(html,/LELAND, NC · PRELAUNCH INTEREST ONLY/);
 assert.match(html,/No staffed Leland branch/);
 assert.match(html,/No guaranteed assignments/);
 assert.match(html,/niteclean\.base44\.app\/wilmington/);
 assert.match(html,/niteclean\.base44\.app\/for-cleaners\?city=Wilmington/);
 assert.doesNotMatch(html,/"@type":"LocalBusiness"/);
});
test('short cleaning alias points to real canonical overview',()=>{
 const html=fromDist('cleaning/index.html');
 assert.match(html,/http-equiv="refresh"/);
 assert.match(html,/url=\/services\/cleaning\//);
 assert.match(html,/rel="canonical" href="https:\/\/niterunservices\.com\/services\/cleaning\//);
 assert.match(html,/noindex,follow/);
});
test('no unreviewed additional service cities were generated',()=>{
 assert.equal(existsSync(new URL('../dist/detailing/leland/index.html',import.meta.url)),false);
 assert.equal(existsSync(new URL('../dist/washing/leland/index.html',import.meta.url)),false);
});
