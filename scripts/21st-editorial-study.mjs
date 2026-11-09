/**
 * NITERUN Services — 21st editorial service-list staging adaptation.
 * Pattern: "Editorial service list" by Waqar H. Syed (@ibrandify).
 * Source: https://21st.dev/@ibrandify/components/editorial-service-list
 * License: MIT (see THIRD_PARTY_NOTICES.md). Adapted to zero-runtime static HTML,
 * NITERUN service taxonomy, accessible accordion behavior, and arrow-free typography.
 *
 * This page is a REVIEW FIXTURE. It does not submit customer information.
 */
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
export function renderEditorialServiceStudy(services=[]){
  if(!Array.isArray(services)||services.length!==4)throw new Error('Four verified service categories required');
  const rows=services.map((s,i)=>{
    const panel='study-panel-'+i;
    const open=i===0;
    return `<article class="service-entry" data-service-entry>
      <button class="service-control" type="button" data-service-control aria-expanded="${open}" aria-controls="${panel}" id="study-trigger-${i}">
        <span class="service-index" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>
        <span class="service-label"><strong>${esc(s.type)}</strong><small>${esc(s.name)}</small></span>
        <span class="service-action" aria-hidden="true">${open?'CLOSE':'DETAILS'}</span>
      </button>
      <div class="service-panel ${open?'is-open':''}" id="${panel}" data-service-panel role="region" aria-labelledby="study-trigger-${i}" aria-hidden="${!open}">
        <div class="panel-inner"><p>${esc(s.detail)}</p><a href="../../services/${encodeURIComponent(s.slug)}/" ${open?'':'tabindex="-1"'}>Read the scope for ${esc(s.name)}</a></div>
      </div>
    </article>`;
  }).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>NITERUN Services — Editorial service study (private preview)</title>
<meta name="description" content="Private NITERUN design review of a simple, editorial service directory. Not a service booking.">
<style>
:root{--paper:#f0efea;--ink:#191d1a;--muted:#596158;--line:#c7cbc3;--accent:#536a56;--easing:cubic-bezier(.22,1,.36,1)}
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration-thickness:1px;text-underline-offset:.22em}
a:focus-visible,button:focus-visible{outline:2px solid #225a45;outline-offset:5px}
header{position:sticky;top:0;z-index:10;background:rgba(240,239,234,.94);border-bottom:1px solid var(--line)}
@supports (backdrop-filter:blur(12px)){header{backdrop-filter:blur(12px) saturate(1.04);-webkit-backdrop-filter:blur(12px) saturate(1.04)}}
.wrap{width:min(1440px,calc(100% - 96px));margin-inline:auto}
.nav{height:86px;display:flex;justify-content:space-between;align-items:center;gap:24px}
.wordmark{display:flex;align-items:center;gap:14px;text-decoration:none;font-size:19px;font-weight:850;letter-spacing:-.075em}
.wordmark i{display:inline-block;height:27px;width:4px;background:var(--ink);transform:skew(-12deg)}
.wordmark small{font-family:Georgia,serif;font-size:14px;font-weight:400;letter-spacing:-.02em;font-style:italic;margin-left:5px}
.nav-end{display:flex;align-items:center;gap:30px}
.nav-status{font-size:10px;text-transform:uppercase;font-weight:700;letter-spacing:.12em;color:#596158}
.nav-cta{font-size:13px;font-weight:700;text-decoration:none;border-bottom:1px solid currentColor;padding:10px 0}
main{min-height:calc(100svh - 150px)}
.mast{padding:42px 0 22px;border-bottom:1px solid var(--line)}
.meta{display:flex;align-items:center;justify-content:space-between;font-size:10px;text-transform:uppercase;letter-spacing:.2em;font-weight:700;color:var(--muted)}
.layout{display:grid;grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr);gap:clamp(54px,8vw,135px);padding:clamp(80px,8vw,134px) 0 134px}
.left{position:relative;min-width:0}
.eyebrow{font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin:0 0 33px}
h1{font-size:clamp(66px,7.55vw,124px);line-height:.92;letter-spacing:-.086em;font-weight:600;margin:0;max-width:700px}
h1 em{display:block;font-family:Georgia,serif;font-weight:400;letter-spacing:-.08em;font-style:italic;font-size:.86em;margin-top:.14em}
.deck{max-width:335px;line-height:1.7;font-size:15px;color:var(--muted);margin:35px 0 0}
.note{position:absolute;bottom:7px;left:0;display:flex;flex-direction:column;gap:7px;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:var(--muted)}
.right{padding-top:8px;min-width:0}
.section-head{display:flex;justify-content:space-between;gap:12px;align-items:center;border-bottom:2px solid var(--ink);padding-bottom:17px;font-size:10px;text-transform:uppercase;letter-spacing:.15em;font-weight:700}
.service-entry{border-bottom:1px solid var(--line)}
.service-control{border:0;background:transparent;color:var(--ink);cursor:pointer;display:grid;grid-template-columns:58px minmax(0,1fr) 63px;width:100%;text-align:left;align-items:center;gap:16px;padding:31px 0 28px;min-height:106px}
.service-index{font-size:11px;color:var(--accent);font-weight:700;letter-spacing:.05em;align-self:start;padding-top:6px}
.service-label{display:flex;flex-direction:column;gap:10px;min-width:0}
.service-label strong{font-size:clamp(22px,2.3vw,36px);line-height:1.11;letter-spacing:-.052em;font-weight:600;transition:transform .26s var(--easing)}
.service-label small{font-size:12px;color:var(--muted);font-weight:500}
.service-control:hover .service-label strong{transform:translateX(5px)}
.service-action{justify-self:end;align-self:start;margin-top:8px;font-size:9px;font-weight:750;letter-spacing:.13em;color:var(--muted);text-align:right}
.service-panel{display:grid;grid-template-rows:0fr;opacity:0;transition:grid-template-rows .42s var(--easing),opacity .28s ease;visibility:hidden}
.service-panel.is-open{grid-template-rows:1fr;opacity:1;visibility:visible}
.panel-inner{min-height:0;overflow:hidden;padding-left:74px;padding-right:28px}
.panel-inner p{margin:0 0 22px;max-width:490px;color:var(--muted);font-size:14px;line-height:1.7}
.panel-inner a{font-size:12px;font-weight:700;display:inline-block;margin-bottom:27px}
.service-entry:has(.service-panel.is-open) .service-control strong{color:#314d39}
.bottom{display:flex;justify-content:space-between;gap:20px;padding-top:21px;color:#687368;font-size:11px;line-height:1.6}
.footer{border-top:1px solid var(--line);padding:22px 0 42px;display:flex;justify-content:space-between;gap:26px;font-size:11px;line-height:1.6;color:var(--muted)}
@media (max-width:920px){.wrap{width:min(100% - 56px,780px)}.layout{grid-template-columns:1fr;gap:66px;padding:75px 0 80px}h1{font-size:clamp(65px,11vw,94px)}.note{position:static;margin-top:42px}.right{padding:0}}
@media (max-width:550px){.wrap{width:calc(100% - 38px)}.nav{height:70px}.wordmark{font-size:17px}.nav-status{display:none}.nav-end{gap:0}.mast{padding:24px 0 16px}.meta{font-size:9px;letter-spacing:.12em}.layout{padding:55px 0 70px;gap:60px}h1{font-size:clamp(53px,13vw,71px)}.deck{font-size:14px}.service-control{grid-template-columns:33px minmax(0,1fr) 52px;gap:11px;padding:25px 0}.service-label strong{font-size:25px}.service-index{padding-top:4px}.service-action{font-size:9px}.panel-inner{padding-left:44px;padding-right:3px}.footer{flex-direction:column}.bottom{font-size:10px}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{transition:none!important;animation:none!important;scroll-behavior:auto!important}.service-control:hover .service-label strong{transform:none}}
</style>
</head>
<body>
<header><div class="wrap nav"><a class="wordmark" href="../../" aria-label="NITERUN Services home"><i aria-hidden="true"></i>NITERUN <small>Services</small></a><div class="nav-end"><span class="nav-status">DESIGN STUDY / NOT PUBLISHED</span><a class="nav-cta" href="../../#request">Request availability</a></div></div></header>
<main id="main"><section class="wrap mast"><div class="meta"><span>SERVICE INDEX · NORTH CAROLINA</span><span>01—04 / NO CONFIRMED BOOKING</span></div></section>
<section class="wrap layout"><div class="left"><p class="eyebrow">NITERUN / LOCAL SERVICES</p><h1>The work.<em>Without the runaround.</em></h1><p class="deck">Cleaning, vehicle care, exterior washing and seasonal projects. Tell us the scope. We'll review availability and provide next steps before anything is booked.</p><div class="note"><span>Four service divisions</span><span>One reviewed inquiry process</span><span>Independent providers / subject to availability</span></div></div>
<div class="right"><div class="section-head"><span>Explore by type</span><span>SELECT A SERVICE</span></div>${rows}<div class="bottom"><span>Wilmington · Raleigh · Charlotte</span><span>Requests reviewed individually; coverage is not guaranteed.</span></div></div></section></main>
<div class="wrap footer"><span>© 2026 NITE Run Delivery LLC</span><span>Private visual study. No data collection. No booking or payment.</span></div>
<script>
(() => {
  const controls=[...document.querySelectorAll('[data-service-control]')];
  const close=(btn)=>{const p=document.getElementById(btn.getAttribute('aria-controls'));btn.setAttribute('aria-expanded','false');btn.querySelector('.service-action').textContent='DETAILS';p.classList.remove('is-open');p.setAttribute('aria-hidden','true');p.querySelectorAll('a').forEach(a=>a.tabIndex=-1)};
  const open=(btn)=>{const p=document.getElementById(btn.getAttribute('aria-controls'));btn.setAttribute('aria-expanded','true');btn.querySelector('.service-action').textContent='CLOSE';p.classList.add('is-open');p.setAttribute('aria-hidden','false');p.querySelectorAll('a').forEach(a=>a.removeAttribute('tabindex'))};
  controls.forEach(btn=>btn.addEventListener('click',()=>{const active=btn.getAttribute('aria-expanded')==='true';controls.forEach(close);if(!active)open(btn)}));
})();
</script>
</body></html>`;
}
