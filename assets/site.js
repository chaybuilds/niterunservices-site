// NiteRun Services client. No tracking SDKs, payment actions or fake availability.
const VALID_SERVICES=new Set(['cleaning','detailing','washing','holiday-lights']);
const VALID_CITIES=new Set(['wilmington','raleigh','charlotte']);
const VALID_TIMING=new Set(['asap','week','month','flexible']);
const API_TIMEOUT_MS=13000;

function onlyText(value,max){return String(value||'').trim().slice(0,max)}
function publishStatus(node,kind,message,withEmail=false){
 node.className='form-status '+kind;
 node.replaceChildren();
 const p=document.createElement('span');
 p.textContent=message;
 node.append(p);
 if(withEmail){
  node.append(document.createTextNode(' '));
  const a=document.createElement('a');
  a.href='mailto:chayson@niterun.com?subject=NiteRun%20Services%20request';
  a.textContent='Email NiteRun Services instead.';
  node.append(a);
 }
}
function readForm(form){
 const f=new FormData(form);
 const params=new URLSearchParams(window.location.search);
 const out={
  full_name:onlyText(f.get('full_name'),100),
  email:onlyText(f.get('email'),180).toLowerCase(),
  phone:onlyText(f.get('phone'),32),
  postal_code:onlyText(f.get('postal_code'),10),
  service:onlyText(f.get('service'),45),
  city:onlyText(f.get('city'),36),
  timing:onlyText(f.get('timing'),28),
  details:onlyText(f.get('details'),1200),
  consent:f.get('consent')==='on',
  website:onlyText(f.get('website'),150),
  source:onlyText(params.get('utm_source')||'direct',65).replace(/[^\w.-]/g,''),
  campaign:onlyText(params.get('utm_campaign')||'',65).replace(/[^\w.-]/g,''),
  landing_path:window.location.pathname.slice(0,180)
 };
 if(!VALID_SERVICES.has(out.service)||!VALID_CITIES.has(out.city)||
    !VALID_TIMING.has(out.timing)||out.full_name.length<2||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)||
    out.details.length<12||out.consent!==true){
   throw new Error('validation');
 }
 if(out.phone && !/^\+?[0-9 ()+.-]{7,32}$/.test(out.phone))throw new Error('validation');
 if(out.postal_code && !/^\d{5}(?:-\d{4})?$/.test(out.postal_code))throw new Error('validation');
 return out;
}
async function submitRequest(form){
 const status=form.querySelector('.form-status');
 const button=form.querySelector('button[type="submit"]');
 if(form.dataset.pending==='true')return;
 if(!form.checkValidity()){
  form.reportValidity();
  publishStatus(status,'error','Please complete the required fields and confirm your contact consent.');
  return;
 }
 let body;
 try{body=readForm(form)}catch{
  publishStatus(status,'error','Please check the service, city, timing, contact details and project description.');
  return;
 }
 form.dataset.pending='true';
 button.disabled=true;
 const original=button.innerHTML;
 button.textContent='Sending your request…';
 publishStatus(status,'','Submitting securely. Please do not close this page.');
 const abort=new AbortController();
 const timer=setTimeout(()=>abort.abort(),API_TIMEOUT_MS);
 try{
  const response=await fetch(form.dataset.endpoint,{method:'POST',mode:'cors',
   headers:{'Content-Type':'application/json','Accept':'application/json'},
   body:JSON.stringify(body),signal:abort.signal,credentials:'omit'});
  if(!response.ok){
   if(response.status===422){
    publishStatus(status,'error','Please review the form fields and try again.');
    return;
   }
   if(response.status===429){
    publishStatus(status,'error','Too many requests were received recently. Please try later or email us.',true);
    return;
   }
   throw new Error('unavailable');
  }
  const result=await response.json();
  if(result && result.accepted===true){
   const duplicate=result.duplicate===true;
   publishStatus(status,'success',duplicate
    ? 'We already received this request recently. Please avoid resubmitting; we will review the original inquiry.'
    : 'Your inquiry was received. This is not a booking. Availability, the quote and any appointment must be confirmed separately.');
   if(!duplicate){
    const fixedService=form.querySelector('[name="service"]')?.value;
    const fixedCity=form.querySelector('[name="city"]')?.value;
    form.reset();
    // Location-specific pages retain their preselected service and city after submission.
    const service=form.querySelector('[name="service"]');
    const city=form.querySelector('[name="city"]');
    if(service && form.dataset.locationForm==='true')service.value=fixedService;
    if(city && form.dataset.locationForm==='true')city.value=fixedCity;
   }
  }else{
   throw new Error('unverified-result');
  }
 }catch{
  publishStatus(status,'error','We could not verify that the request was saved. Please try again once, or contact us by email.',true);
 }finally{
  clearTimeout(timer);
  form.dataset.pending='false';
  button.disabled=false;
  button.innerHTML=original;
 }
}
document.querySelectorAll('form[data-intake-form]').forEach(form=>{
 const segments=window.location.pathname.split('/').filter(Boolean);
 form.dataset.locationForm=segments.length>=2&&VALID_SERVICES.has(segments[segments.length-2])&&VALID_CITIES.has(segments[segments.length-1])?'true':'false';
 form.addEventListener('submit',event=>{event.preventDefault();void submitRequest(form)});
});
document.querySelectorAll('.mobile-menu').forEach(menu=>{
 menu.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>menu.open=false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')menu.open=false});
 document.addEventListener('click',event=>{if(!menu.contains(event.target))menu.open=false});
});
