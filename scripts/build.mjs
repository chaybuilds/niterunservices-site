import {mkdir,writeFile,rm,copyFile} from 'node:fs/promises';
import {join,resolve,dirname} from 'node:path';

const DIST=resolve('dist');
const HOST='https://niterunservices.com';
const API='https://succvbtctjkzsowotcsy.supabase.co/functions/v1/services-intake';
const CITIES=[
 {slug:'wilmington',name:'Wilmington',region:'Coastal NC',hint:'Homes, condos, rentals and local properties'},
 {slug:'raleigh',name:'Raleigh',region:'Triangle NC',hint:'Busy households, properties and local vehicles'},
 {slug:'charlotte',name:'Charlotte',region:'Metro NC',hint:'Residential, commercial and seasonal requests'}
];
const SERVICES=[
 {slug:'cleaning',name:'NiteClean',type:'Cleaning',line:'A fresh start for every space.',summary:'Residential, rental turnover, move-in/move-out and other cleaning requests.',detail:'Tell us about the space, its size and the result you want. We review the scope, seek suitable independent help where available, and confirm a written quote before any booking.',glyph:'clean',count:'01'},
 {slug:'detailing',name:'NiteDetail',type:'Auto detailing',line:'Make every arrival feel new.',summary:'Mobile-friendly interior and exterior vehicle care requests.',detail:'Share the vehicle type, approximate condition and preferred location. We will check whether a qualified local detailing provider can meet the requirements.',glyph:'car',count:'02'},
 {slug:'washing',name:'NiteWash',type:'Exterior washing',line:'A cleaner first impression.',summary:'Pressure washing, exterior surfaces and property wash inquiries.',detail:'Describe the surface, approximate size and access conditions. We evaluate suitability and help you request a quote from available local professionals.',glyph:'wash',count:'03'},
 {slug:'holiday-lights',name:'NiteHolidays',type:'Seasonal services',line:'Make the season feel effortless.',summary:'Holiday lighting, seasonal setup and related project inquiries.',detail:'Share the property type, the look you want and your ideal dates. Seasonal availability, safety requirements and pricing must be confirmed before scheduling.',glyph:'light',count:'04'}
];
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const href=(depth,target='')=>('../'.repeat(depth)||'./')+target.replace(/^\/+/,'');
const canonical=route=>HOST+route;
const icon=(type,size=27)=>{
 const common='fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';
 const art={
  clean:'<path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9L12 2Z"/><path d="m20 17 .8 2.2L23 20l-2.2.8L20 23l-.8-2.2L17 20l2.2-.8L20 17Z"/>',
  car:'<path d="m5 15-1 3v2h3v-2h10v2h3v-2l-1-3-2-7H7l-2 7Z"/><path d="M5 15h14M7 8l2-3h6l2 3M7.5 16.5h.01M16.5 16.5h.01"/>',
  wash:'<path d="M12 3C9 7.4 5 11.8 5 16a7 7 0 0 0 14 0c0-4.2-4-8.6-7-13Z"/><path d="M9 17a3 3 0 0 0 3 3"/>',
  light:'<path d="M9 18h6M10 21h4M9 15c-2-1.1-3-2.6-3-5a6 6 0 0 1 12 0c0 2.4-1 3.9-3 5l-1 3h-4l-1-3Z"/><path d="M12 1v2M3 10H1M23 10h-2M4.5 3.5 6 5M19.5 3.5 18 5"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  shield:'<path d="M12 2 4 6v6c0 5 3.3 8.3 8 10 4.7-1.7 8-5 8-10V6l-8-4Z"/><path d="m9 12 2 2 4-4"/>'
 };
 return '<svg viewBox="0 0 24 24" width="'+size+'" height="'+size+'" aria-hidden="true" '+common+'>'+ (art[type]||art.arrow)+'</svg>';
};
const select=(name,items,value='',prompt='Choose one',id=name)=>{
 const options='<option value="" '+(!value?'selected':'')+' disabled>'+esc(prompt)+'</option>'+items.map(x=>'<option value="'+esc(x.slug)+'" '+(value===x.slug?'selected':'')+'>'+esc(x.name||x.type)+'</option>').join('');
 return '<select id="'+id+'" name="'+name+'" required>'+options+'</select>';
};
function requestForm(depth,selectedService='',selectedCity=''){
 const serviceOpts=SERVICES.map(s=>({slug:s.slug,name:s.name+' — '+s.type}));
 const cityOpts=CITIES.map(c=>({slug:c.slug,name:c.name+', NC'}));
 return `
 <form class="request-form" data-intake-form data-endpoint="${API}" novalidate>
 <div class="form-title"><span class="form-kicker">REQUEST · 01</span><h2>Tell us what you need.</h2><p>Start with the basics. A request is <strong>not</strong> a confirmed booking or an obligation to purchase.</p></div>
 <div class="form-grid">
 <label class="field"><span>Service <b aria-label="required">*</b></span>${select('service',serviceOpts,selectedService,'Select service')}</label>
 <label class="field"><span>City <b aria-label="required">*</b></span>${select('city',cityOpts,selectedCity,'Select a city')}</label>
 <label class="field"><span>Your name <b aria-label="required">*</b></span><input name="full_name" type="text" maxlength="100" autocomplete="name" placeholder="First and last name" required></label>
 <label class="field"><span>Email <b aria-label="required">*</b></span><input name="email" type="email" maxlength="180" autocomplete="email" placeholder="you@example.com" required></label>
 <label class="field"><span>Phone <small>(optional)</small></span><input name="phone" type="tel" maxlength="32" inputmode="tel" autocomplete="tel" placeholder="(555) 555-5555"></label>
 <label class="field"><span>ZIP code <small>(optional)</small></span><input name="postal_code" type="text" maxlength="10" inputmode="numeric" autocomplete="postal-code" placeholder="28401"></label>
 <label class="field"><span>When do you need it? <b aria-label="required">*</b></span><select name="timing" required><option value="" disabled selected>Select timing</option><option value="asap">As soon as feasible</option><option value="week">Within a week</option><option value="month">Within a month</option><option value="flexible">Flexible / planning ahead</option></select></label>
 <label class="field field-wide"><span>What should we know? <b aria-label="required">*</b></span><textarea name="details" rows="3" maxlength="1200" minlength="12" placeholder="Example: two-bedroom apartment, move-out cleaning, preferred dates and any special surfaces." required></textarea></label>
 <div class="hp-field" aria-hidden="true"><label>Website <input tabindex="-1" autocomplete="off" name="website"></label></div>
 <label class="consent field-wide"><input type="checkbox" name="consent" required><span>I agree to be contacted about <em>this service request</em>. I understand availability, provider qualifications and pricing must be confirmed before booking. This does not subscribe me to marketing. <a href="${href(depth,'privacy/')}">Privacy</a>.</span></label>
 </div>
 <div class="form-footer"><button class="btn btn-primary submit" type="submit">Send my request ${icon('arrow',19)}</button><span class="form-mini">Free to ask · No charge to submit</span></div>
 <div class="form-status" role="status" aria-live="polite" aria-atomic="true"></div>
 </form>`;
}
function mainNav(depth){
 const links=[['Services','services/'],['Locations','#locations'],['How it works','#how'],['About','about/']];
 const linkHtml=links.map(([text,route])=>'<a href="'+(route.startsWith('#')?href(depth,'')+route:href(depth,route))+'">'+text+'</a>').join('');
 return `<header class="header"><div class="header-inner wrap">
 <a class="wordmark" href="${href(depth)}" aria-label="NiteRun Services — homepage"><span class="mark"><span>N</span></span><span class="brand-stack"><strong>NITERUN</strong><small>SERVICES</small></span></a>
 <nav class="nav-desktop" aria-label="Primary navigation">${linkHtml}</nav>
 <div class="nav-actions"><a class="nav-quote" href="${href(depth)}#request">Get a quote <span aria-hidden="true">↗</span></a>
 <details class="mobile-menu"><summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary><nav aria-label="Mobile navigation">${linkHtml}<a href="${href(depth)}#request">Request an estimate</a></nav></details></div>
 </div></header>`;
}
function footer(depth){
 return `<footer class="footer"><div class="wrap footer-grid">
 <div class="footer-brand"><a class="wordmark" href="${href(depth)}"><span class="mark"><span>N</span></span><span class="brand-stack"><strong>NITERUN</strong><small>SERVICES</small></span></a><p>One coordinated place to request home, vehicle and seasonal services. Availability is reviewed before bookings are confirmed.</p></div>
 <div><h3>Explore</h3><a href="${href(depth,'services/')}">All services</a><a href="${href(depth,'cleaning/wilmington/')}">Wilmington requests</a><a href="${href(depth,'cleaning/raleigh/')}">Raleigh requests</a><a href="${href(depth,'cleaning/charlotte/')}">Charlotte requests</a></div>
 <div><h3>Information</h3><a href="${href(depth,'about/')}">How we work</a><a href="${href(depth,'privacy/')}">Privacy</a><a href="mailto:chayson@niterun.com?subject=NiteRun%20Services%20question">Contact</a><a href="${href(depth)}#request">Request a quote</a></div>
 </div><div class="wrap footer-bottom"><span>© ${new Date().getFullYear()} NiteRun Services · A NITE Run Delivery LLC service platform.</span><span>Requests are not bookings. No guaranteed availability or results.</span></div></footer>`;
}
function shell({title,desc,route,depth=0,content,robots='index,follow',bodyClass=''}){
 return `<!doctype html><html lang="en"><head>
 <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <meta name="theme-color" content="#0b201b"><meta name="color-scheme" content="light">
 <title>${esc(title)} | NiteRun Services</title>
 <meta name="description" content="${esc(desc)}"><meta name="robots" content="${robots}">
 <link rel="canonical" href="${canonical(route)}">
 <meta property="og:type" content="website"><meta property="og:title" content="${esc(title)} | NiteRun Services"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${canonical(route)}">
 <link rel="icon" href="${href(depth,'assets/favicon.svg')}" type="image/svg+xml">
 <link rel="stylesheet" href="${href(depth,'assets/site.css')}">
 <script defer src="${href(depth,'assets/site.js')}"></script>
 </head><body class="${bodyClass}">
 <a class="skip-link" href="#content">Skip to content</a>${mainNav(depth)}
 <main id="content" tabindex="-1">${content}</main>
 ${footer(depth)}<div class="toast" role="status" aria-live="polite"></div>
 </body></html>`;
}
const scene=`<div class="scene" aria-label="Architectural illustration of a clean home" role="img">
 <div class="scene-grid"></div>
 <svg class="house" viewBox="0 0 610 410" aria-hidden="true"><defs>
 <linearGradient id="wall" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#e8eedf"/><stop offset="1" stop-color="#8dab9b"/></linearGradient>
 <linearGradient id="wall2" x1="0" x2="1"><stop stop-color="#d9e7d7"/><stop offset="1" stop-color="#849f90"/></linearGradient>
 <linearGradient id="glass" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#355b50"/><stop offset="1" stop-color="#0e2b27"/></linearGradient>
 <linearGradient id="roof" x1="0" x2="1"><stop stop-color="#c4d8c0"/><stop offset="1" stop-color="#6b9080"/></linearGradient>
 </defs>
 <ellipse cx="315" cy="364" rx="246" ry="31" fill="#010f0c" opacity=".33"/>
 <path d="M77 284 316 168l216 112-214 120Z" fill="#25463b" opacity=".48"/>
 <path d="m137 167 180-86 181 101-180 90Z" fill="url(#roof)"/>
 <path d="m137 167 181 105v109l-181-98Z" fill="url(#wall2)"/>
 <path d="m318 272 180-90v105l-180 94Z" fill="url(#wall)"/>
 <path d="m137 167 180-86 181 101" fill="none" stroke="#f2f7e9" stroke-width="3"/>
 <path d="m137 167 181 105 180-90" fill="none" stroke="#a8c4ae" stroke-width="2"/>
 <path d="m364 246 73-37v91l-73 37Z" fill="url(#glass)" stroke="#567c6d" stroke-width="4"/>
 <path d="m400 228 1 94M365 294l72-37" stroke="#87bca2" opacity=".48" stroke-width="3"/>
 <path d="m173 221 87 49v62l-87-46Z" fill="url(#glass)" stroke="#b0caba" stroke-width="4"/>
 <path d="m216 245 1 64M174 255l86 47" stroke="#9ec6ad" opacity=".55" stroke-width="3"/>
 <path d="m266 273 37 21v68l-37-20Z" fill="#3e6658" stroke="#cfdfca" stroke-width="3"/>
 <circle cx="292" cy="327" r="3" fill="#d3dfaa"/>
 <path d="M109 315l48 25m360-40-34 18" stroke="#7dab8d" stroke-width="6" stroke-linecap="round"/>
 <path d="m91 262 24-11m401-18 22-10" stroke="#d8efa9" stroke-width="5" stroke-linecap="round"/>
 <path d="M106 319c3-19 15-24 21-20 8-13 25-11 29 0 15-4 28 11 20 24" fill="#527862"/>
 <path d="M467 325c-8-13 1-23 11-20 3-17 21-19 27-4 14-4 25 12 19 25" fill="#557f65"/>
 </svg>
 <span class="scene-glow"></span>
 <div class="scene-tag tag-top"><span class="tag-dot"></span><span>YOUR CITY. YOUR SERVICE.</span></div>
 <div class="scene-tag tag-bottom"><span class="tag-label">01 — REQUEST</span><strong>One place to start.</strong></div>
 </div>`;
function serviceCard(s,depth){
 return `<a class="service-card service-${s.slug}" href="${href(depth,'services/'+s.slug+'/')}">
 <div class="card-ambient"></div><div class="service-top"><span class="service-glyph">${icon(s.glyph,33)}</span><span class="service-num">${s.count} / 04</span></div>
 <div class="service-copy"><span class="overline">${s.type}</span><h3>${s.name}</h3><p>${s.summary}</p></div>
 <div class="service-bottom"><span>Explore service</span>${icon('arrow',22)}</div></a>`;
}
function locationPills(depth,service='cleaning'){
 return CITIES.map(c=>`<a class="city-pill" href="${href(depth,service+'/'+c.slug+'/')}"><span>${icon('pin',19)}<strong>${c.name}</strong></span><span>Check availability →</span></a>`).join('');
}
const homeBody=`
 <section class="hero" aria-labelledby="hero-title"><div class="wrap hero-layout">
 <div class="hero-copy"><div class="eyebrow"><span class="eyebrow-rule"></span> A NEW STANDARD FOR GETTING THINGS DONE</div>
 <h1 id="hero-title">Your place.<br>Your plans.<br><em>One simple request.</em></h1>
 <p class="hero-lead">From spotless spaces to cared-for vehicles and standout seasons. Explore services, choose your city, and tell us what you need. We review availability before confirming any job.</p>
 <div class="hero-actions"><a class="btn btn-primary" href="#services">Explore services ${icon('arrow',19)}</a><a class="btn btn-outline" href="#request">Request an estimate</a></div>
 <div class="hero-details"><span>${icon('check',17)} No cost to request</span><span>${icon('check',17)} Clear scope before booking</span><span>${icon('check',17)} Local-first inquiries</span></div>
 </div><div class="hero-art">${scene}</div></div><div class="hero-border wrap"><span>THE NITERUN NETWORK / SERVICES</span><span>NORTH CAROLINA REQUEST PORTAL</span><span>EST. 2026</span></div></section>
 <section class="section section-services" id="services"><div class="wrap">
 <div class="section-heading"><div><div class="eyebrow eyebrow-dark"><span class="eyebrow-rule"></span> WHAT DO YOU NEED?</div><h2>One network.<br><i>Many ways to help.</i></h2></div><p>Different projects, one clear place to begin. Choose a service to view its scope and request local availability.</p></div>
 <div class="service-grid">${SERVICES.map(s=>serviceCard(s,0)).join('')}</div>
 <div class="section-footnote">More service lines may be added after demand, professional qualifications and fulfillment are verified.</div>
 </div></section>
 <section class="section section-how" id="how"><div class="wrap"><div class="section-heading"><div><div class="eyebrow eyebrow-dark"><span class="eyebrow-rule"></span> AN EASIER WAY FORWARD</div><h2>Less searching.<br><i>More clarity.</i></h2></div><p>We coordinate the early steps so you can make an informed decision without assuming an inquiry means a reservation.</p></div>
 <div class="steps"><div><span class="step-num">01</span><h3>Choose your service</h3><p>Select what you need and the city you’re asking about.</p></div><div><span class="step-num">02</span><h3>Describe your project</h3><p>Give us enough detail to understand the work.</p></div><div><span class="step-num">03</span><h3>Review availability</h3><p>We check potential fulfillment options and necessary qualifications.</p></div><div><span class="step-num">04</span><h3>Confirm the details</h3><p>Pricing and scheduling must be approved before any job is booked.</p></div></div>
 </div></section>
 <section class="section section-cities" id="locations"><div class="wrap city-layout"><div class="city-intro"><div class="eyebrow eyebrow-dark"><span class="eyebrow-rule"></span> LOCAL REQUESTS</div><h2>Right service.<br><i>Right location.</i></h2><p>Start with a city-specific page. Each form opens with the area and service already selected, making it easier to describe exactly what you need.</p><small>Location pages accept inquiries; they do not imply a staffed office or guaranteed availability.</small></div><div class="city-list">${locationPills(0)}</div></div></section>
 <section class="section section-values"><div class="wrap values"><div class="value-primary"><span class="overline">THE NITERUN WAY</span><h2>A better experience<br>starts with <em>honesty.</em></h2></div>
 <div class="value-items"><div>${icon('shield',28)}<h3>No imaginary guarantees.</h3><p>We don't manufacture reviews, promise a technician is available, or call a request a confirmed booking.</p></div><div>${icon('check',28)}<h3>Scope before surprises.</h3><p>We aim to clarify expectations, provider requirements and quotes before work is agreed.</p></div></div></div></section>
 <section class="section section-request" id="request"><div class="wrap request-layout"><div class="request-intro"><div class="eyebrow"><span class="eyebrow-rule"></span> START HERE</div><h2>Tell us about<br><em>your next project.</em></h2><p>No account to create. No payment required to submit. Just a straightforward request for a possible quote.</p><div class="request-chips"><span>Home</span><span>Vehicle</span><span>Property</span><span>Seasonal</span></div><p class="request-contact">Have a question? <a href="mailto:chayson@niterun.com?subject=NiteRun%20Services%20question">Email NiteRun Services</a></p></div><div class="request-panel">${requestForm(0)}</div></div></section>
 <section class="section section-faq"><div class="wrap faq-layout"><div><div class="eyebrow eyebrow-dark"><span class="eyebrow-rule"></span> GOOD TO KNOW</div><h2>Questions,<br><i>answered.</i></h2></div><div class="faq-list">
 <details><summary>Is a service request a booking?</summary><p>No. Submitting a request starts an availability and scope review. Pricing and the appointment must be confirmed separately.</p></details>
 <details><summary>Does it cost anything to request an estimate?</summary><p>No. There is no charge to submit your inquiry. If work is available, you'll review any quote and payment terms before confirming.</p></details>
 <details><summary>Which cities do you support?</summary><p>We're collecting requests in Wilmington, Raleigh and Charlotte, North Carolina. Coverage depends on verified provider availability and the project; a city page is not proof of a local branch or a guaranteed job.</p></details>
 <details><summary>Who completes the work?</summary><p>Services may be fulfilled by independent providers. Ask about provider qualifications, insurance or specific requirements in the request; we'll clarify them before booking where possible.</p></details>
 </div></div></section>`;
function serviceBody(s){
 return `<section class="route-hero"><div class="wrap route-hero-inner"><div class="route-copy"><div class="breadcrumb"><a href="../../">Services</a><span>/</span><span>${s.name}</span></div><span class="eyebrow"><span class="eyebrow-rule"></span> NITERUN SERVICES / ${s.count}</span><h1>${s.name}<br><em>${s.line}</em></h1><p>${s.detail}</p><a class="btn btn-primary" href="#request">Request a ${s.type.toLowerCase()} quote ${icon('arrow',19)}</a></div><div class="route-art route-art-${s.slug}">${icon(s.glyph,112)}<span>${s.type}</span></div></div></section>
 <section class="section section-cities" id="locations"><div class="wrap city-layout"><div class="city-intro"><span class="eyebrow eyebrow-dark"><span class="eyebrow-rule"></span> CHOOSE YOUR CITY</span><h2>Start where<br><i>you are.</i></h2><p>These links preset your location and ${s.type.toLowerCase()} request. Availability varies by project and provider.</p></div><div class="city-list">${locationPills(2,s.slug)}</div></div></section>
 <section class="section section-request" id="request"><div class="wrap request-layout"><div class="request-intro"><span class="eyebrow"><span class="eyebrow-rule"></span> ${s.name.toUpperCase()} QUOTES</span><h2>Your project.<br><em>Our next step.</em></h2><p>Describe your request. We'll review feasibility, scope and available providers before any booking.</p></div><div class="request-panel">${requestForm(2,s.slug)}</div></div></section>`;
}
function cityBody(s,c){
 return `<section class="route-hero city-hero"><div class="wrap route-hero-inner"><div class="route-copy"><div class="breadcrumb"><a href="../../">All services</a><span>/</span><a href="../../services/${s.slug}/">${s.name}</a><span>/</span><span>${c.name}</span></div>
 <span class="eyebrow"><span class="eyebrow-rule"></span> ${c.region.toUpperCase()} · SERVICE REQUESTS</span><h1>${s.name}<br><em>in ${c.name}.</em></h1>
 <p>${s.detail} Request an estimate in ${c.name}, NC. We will confirm local availability, eligibility and price before anything is scheduled.</p>
 <a href="#request" class="btn btn-primary">Start my ${c.name} request ${icon('arrow',19)}</a></div><div class="route-art route-art-${s.slug}">${icon(s.glyph,112)}<span>${c.name}, NC</span></div></div></section>
 <section class="section section-cities city-route-notice"><div class="wrap notice-panel">${icon('pin',24)}<p><strong>${c.name} request portal</strong> · ${c.hint}. This page does not represent a separate physical office or a confirmed local Google Business Profile.</p></div></section>
 <section class="section section-request" id="request"><div class="wrap request-layout"><div class="request-intro"><span class="eyebrow"><span class="eyebrow-rule"></span> PRESELECTED FOR YOU</span><h2>${s.type}.<br><em>${c.name}.</em></h2><p>These details are already selected in the request form, so you can move straight to describing the project.</p><p class="request-contact">Different area or task? Change the selections in the form.</p></div><div class="request-panel">${requestForm(2,s.slug,c.slug)}</div></div></section>`;
}
function serviceIndex(){
 return `<section class="route-hero"><div class="wrap route-hero-inner"><div class="route-copy"><span class="eyebrow"><span class="eyebrow-rule"></span> OUR SERVICE LINES</span><h1>One platform.<br><em>Everyday projects.</em></h1><p>Four starting divisions. One place to understand options and request estimates without juggling multiple websites.</p><a class="btn btn-primary" href="../#request">Make a request ${icon('arrow',19)}</a></div><div class="route-art route-art-services">${icon('clean',100)}<span>Discover NiteRun Services</span></div></div></section>
 <section class="section section-services"><div class="wrap"><div class="service-grid">${SERVICES.map(s=>serviceCard(s,1)).join('')}</div></div></section>`;
}
const aboutBody=`<section class="route-hero"><div class="wrap route-hero-inner"><div class="route-copy"><span class="eyebrow"><span class="eyebrow-rule"></span> ABOUT THE PLATFORM</span><h1>Built to make<br><em>requests simpler.</em></h1><p>NiteRun Services brings multiple service divisions under one brand and one intake process, operated by NITE Run Delivery LLC. We're building the operational network step by step, with verified fulfillment ahead of empty promises.</p><a href="../#request" class="btn btn-primary">Request availability ${icon('arrow',19)}</a></div><div class="route-art">${icon('shield',118)}<span>Clarity before booking</span></div></div></section><section class="section"><div class="wrap rich-text"><h2>One operating system, not four disconnected websites.</h2><p>NiteClean, NiteDetail, NiteWash and NiteHolidays are service divisions of NiteRun Services—not separate legal subsidiaries by default. Customers can request estimates through one website and our team can review each inquiry by service and city.</p><h2>Independent fulfillment, transparent next steps.</h2><p>When projects can be fulfilled, independent service professionals may do the work. We will verify availability and discuss qualifications, pricing, scope and scheduling before a service is confirmed. Neither an inquiry nor a page for a city means providers are already available there.</p><h2>Interested in collaborating?</h2><p>If you are an independent provider or property operator, contact <a href="mailto:chayson@niterun.com?subject=NiteRun%20Services%20partnership">chayson@niterun.com</a> with your service area and capabilities. No work or earnings are guaranteed.</p></div></section>`;
const privacyBody=`<section class="route-hero simple-hero"><div class="wrap route-hero-inner"><div class="route-copy"><span class="eyebrow"><span class="eyebrow-rule"></span> YOUR INFORMATION</span><h1>Privacy,<br><em>without guesswork.</em></h1><p>What we collect when you ask for help and how to reach us about your information.</p></div></div></section><section class="section"><div class="wrap rich-text"><p><strong>Effective date:</strong> November 8, 2026.</p>
 <h2>Who operates this site?</h2><p>NiteRun Services is a service platform operated by NITE Run Delivery LLC. Contact: <a href="mailto:chayson@niterun.com">chayson@niterun.com</a>.</p>
 <h2>What information do we collect?</h2><p>When you submit an inquiry, we ask for your name, email, selected service and city, timing, project description, and your consent to contact you. You may optionally provide a phone number and ZIP code. We may retain basic source-attribution data and pseudonymous daily anti-abuse hashes with the request record while it is needed for operational and legal purposes. Please avoid sending payment cards, government IDs, passwords or medical information through the request form.</p>
 <h2>How is it used?</h2><p>To review your request, assess availability, ask clarifying questions, coordinate possible service professionals and respond about the proposed work. Form submission does not enroll you in marketing or authorize recurring SMS messages.</p>
 <h2>Storage and service partners</h2><p>Requests are held in an access-restricted database hosted by Supabase. We may share only the necessary project details with prospective independent fulfillment providers when needed to assess your request. We do not sell contact lists. We use service providers to operate and secure the website.</p>
 <h2>Retention and choices</h2><p>We retain information for as long as reasonably needed to evaluate and manage requests, handle disputes, comply with law and prevent abuse. To request access, correction or deletion when applicable, email <a href="mailto:chayson@niterun.com?subject=NiteRun%20Services%20privacy%20request">chayson@niterun.com</a>. Certain records may need to be kept to meet legal obligations.</p>
 <h2>Tracking</h2><p>We may record non-sensitive campaign parameters you arrive with for basic acquisition measurement. The site does not require an advertising tracker or account to submit a request.</p>
 <h2>Changes</h2><p>We may update this notice as services evolve. Material changes will be reflected in the date above.</p></div></section>`;

async function save(path,contents){
 const target=join(DIST,path);
 await mkdir(dirname(target),{recursive:true});
 await writeFile(target,contents,'utf8');
}
await rm(DIST,{recursive:true,force:true});
await mkdir(DIST,{recursive:true});
// GitHub Pages Actions serves dist/; its custom-domain certificate requires a deployed CNAME artifact.
await save('CNAME','niterunservices.com\n');
await save('index.html',shell({title:'Home, vehicle and seasonal services — one simple request',desc:'One place to request cleaning, detailing, exterior washing and holiday service estimates in North Carolina. Review availability before booking.',route:'/',depth:0,content:homeBody,bodyClass:'home'}));
await save('services/index.html',shell({title:'Explore our services',desc:'Explore NiteClean, NiteDetail, NiteWash and NiteHolidays. Request clear scope and local availability before scheduling.',route:'/services/',depth:1,content:serviceIndex()}));
await save('about/index.html',shell({title:'About NiteRun Services',desc:'Learn how NiteRun Services coordinates independent home, auto and seasonal service requests with transparent booking steps.',route:'/about/',depth:1,content:aboutBody}));
await save('privacy/index.html',shell({title:'Privacy policy',desc:'Learn how NiteRun Services handles service request information, privacy choices and contact preferences.',route:'/privacy/',depth:1,content:privacyBody}));
for(const service of SERVICES){
 await save('services/'+service.slug+'/index.html',shell({title:service.name+' — '+service.type,desc:service.summary+' Learn about the scope and request a local quote without a confirmed booking.',route:'/services/'+service.slug+'/',depth:2,content:serviceBody(service)}));
 for(const city of CITIES){
  await save(service.slug+'/'+city.slug+'/index.html',shell({
   title:service.name+' in '+city.name+', NC',
   desc:'Request '+service.type.toLowerCase()+' availability and a project estimate in '+city.name+', North Carolina. No guaranteed providers or booking until confirmed.',
   route:'/'+service.slug+'/'+city.slug+'/',depth:2,
   content:cityBody(service,city),robots:'noindex,follow',bodyClass:'city-page'
  }));
 }
}
await save('404.html',shell({title:'Page not found',desc:'Find a service or request an estimate with NiteRun Services.',route:'/404.html',depth:0,robots:'noindex,follow',content:'<section class="route-hero simple-hero"><div class="wrap route-hero-inner"><div class="route-copy"><div class="eyebrow">ERROR 404</div><h1>Wrong turn.<br><em>Right place.</em></h1><p>That address isn’t here. Choose a service or head back to the home page.</p><a class="btn btn-primary" href="./">Back to services →</a></div></div></section>'}));
await save('robots.txt','User-agent: *\nAllow: /\nSitemap: '+HOST+'/sitemap.xml\n');
const sitemapRoutes=['/','/services/','/about/','/privacy/',...SERVICES.map(s=>'/services/'+s.slug+'/')];
await save('sitemap.xml','<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+sitemapRoutes.map(route=>'  <url><loc>'+canonical(route)+'</loc></url>').join('\n')+'\n</urlset>\n');
await mkdir(join(DIST,'assets'),{recursive:true});
await copyFile(resolve('assets/site.css'),join(DIST,'assets','site.css'));
await copyFile(resolve('assets/site.js'),join(DIST,'assets','site.js'));
await copyFile(resolve('assets/favicon.svg'),join(DIST,'assets','favicon.svg'));
console.log(JSON.stringify({status:'BUILT',pages:1+1+1+1+SERVICES.length*(1+CITIES.length)+1,totalRoutes:SERVICES.length*CITIES.length,generatedDirectory:DIST,quoteEndpoint:API}));
