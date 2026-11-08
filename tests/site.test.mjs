import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync} from 'node:fs';
import {resolve,join} from 'node:path';
const BASE=resolve('dist');
const services=['cleaning','detailing','washing','holiday-lights'];
const cities=['wilmington','raleigh','charlotte'];
const read=p=>readFileSync(join(BASE,p),'utf8');

before(()=>execFileSync(process.execPath,['scripts/build.mjs'],{stdio:'pipe'}));

test('21 original pages, 12 city/service routes and key static assets generate',()=>{
 const expected=['index.html','services/index.html','about/index.html','privacy/index.html',
  ...services.map(s=>'services/'+s+'/index.html'),
  ...services.flatMap(s=>cities.map(c=>s+'/'+c+'/index.html')),
  '404.html','robots.txt','sitemap.xml','CNAME','assets/site.css','assets/site.js','assets/favicon.svg'];
 for(const path of expected)assert.ok(existsSync(join(BASE,path)),'Missing '+path);
 assert.equal(services.length*cities.length,12);
 assert.equal(read('CNAME').trim(),'niterunservices.com','Published Pages artifact must keep the purchased custom domain');
});
test('every internal link in all generated pages resolves to a file within the site',()=>{
 const pages=['index.html','services/index.html','about/index.html','privacy/index.html',
  ...services.map(s=>'services/'+s+'/index.html'),
  ...services.flatMap(s=>cities.map(c=>s+'/'+c+'/index.html'))];
 let inspected=0;
 for(const page of pages){
  const base=new URL('https://chaybuilds.github.io/niterunservices-site/'+page.replace('index.html',''));
  const doc=read(page);
  const matches=[...doc.matchAll(/\b(?:href|src)="([^"]+)"/g)];
  for(const [,target] of matches){
   if(target.startsWith('mailto:')||target.startsWith('#')||target.startsWith('data:'))continue;
   const url=new URL(target,base);
   if(url.origin!=='https://chaybuilds.github.io'||!url.pathname.startsWith('/niterunservices-site/'))continue;
   const route=url.pathname.slice('/niterunservices-site/'.length);
   const file=route.endsWith('/')?route+'index.html':route;
   assert.ok(existsSync(join(BASE,file)),'Broken '+target+' from '+page);
   inspected++;
  }
 }
 assert.ok(inspected>180,'Insufficient internal link coverage '+inspected);
});
test('root and service landing pages are SEO accessible without invented local branch claims',()=>{
 const root=read('index.html');
 assert.match(root,/meta name="robots" content="index,follow"/);
 assert.match(root,/NITERUN/);
 assert.match(root,/One simple request/);
 assert.match(root,/A NITE Run Delivery LLC service platform/);
 assert.match(root,/No guaranteed availability or results/);
 const map=read('sitemap.xml');
 for(const s of services)assert.ok(map.includes('/services/'+s+'/'));
 for(const s of services)for(const c of cities)assert.ok(!map.includes('/'+s+'/'+c+'/'));
});
test('city request pages remain noindex pending actual provider and GBP eligibility',()=>{
 for(const s of services)for(const c of cities){
  const page=read(s+'/'+c+'/index.html');
  assert.match(page,/meta name="robots" content="noindex,follow"/);
  assert.match(page,/a city page is not proof|does not represent a separate physical office/i);
  assert.match(page,new RegExp('<option value="'+s+'" selected'));
  assert.match(page,new RegExp('<option value="'+c+'" selected'));
  assert.match(page,/No charge to submit/);
  assert.match(page,/booking|booked/i);
 }
});
test('every request form has explicit consent, protected inquiry language, honeypot and privacy',()=>{
 const pages=['index.html',...services.map(s=>'services/'+s+'/index.html'),
  ...services.flatMap(s=>cities.map(c=>s+'/'+c+'/index.html'))];
 for(const p of pages){
  const doc=read(p);
  assert.match(doc,/data-intake-form/,'Missing form '+p);
  assert.match(doc,/consent" required/,'Missing consent '+p);
  assert.match(doc,/name="website"/,'Missing spam honeypot '+p);
  assert.match(doc,/not<\/strong> a confirmed booking/,'Misleading booking state '+p);
  assert.match(doc,/services-intake/,'Missing public intake endpoint '+p);
 }
});
test('static files avoid trackers, payment processors, hardcoded keys and fake testimonials',()=>{
 const html=read('index.html'),js=read('assets/site.js');
 assert.doesNotMatch(html,/stripe\.com|checkout\.stripe|facebook\.net\/tr|gtag\(/i);
 assert.doesNotMatch(js,/service_role|Bearer |whsec_|sk_live_|api_secret/i);
 assert.match(js,/credentials:'omit'/);
 assert.match(js,/publishStatus/);
 assert.match(js,/booking/);
});
test('responsive, keyboard and motion-reduction guardrails exist',()=>{
 const css=read('assets/site.css');
 for(const needle of ['@media(max-width:700px)','@media(max-width:390px)',
  '@media(max-width:340px)','prefers-reduced-motion','focus-visible','grid-template-columns'])
  assert.ok(css.includes(needle),'Missing '+needle);
 const home=read('index.html');
 assert.match(home,/class="skip-link"/);
 assert.match(home,/aria-label="Primary navigation"/);
 assert.match(home,/class="mobile-menu"/);
 assert.match(home,/role="status" aria-live="polite"/);
});
test('business division names are coherent and no separate corporations implied',()=>{
 const about=read('about/index.html');
 for(const name of ['NiteClean','NiteDetail','NiteWash','NiteHolidays'])assert.ok(about.includes(name));
 assert.match(about,/not separate legal subsidiaries/i);
});
