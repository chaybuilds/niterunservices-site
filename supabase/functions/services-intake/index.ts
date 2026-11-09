import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import {createClient} from 'npm:@supabase/supabase-js@2.83.0';

const allowedOrigins=new Set([
 'https://chaybuilds.github.io',
 'https://niterunservices.com','https://www.niterunservices.com',
 'http://127.0.0.1:8778','http://localhost:8778'
]);
const SERVICES=new Set(['cleaning','detailing','washing','holiday-lights']);
const CITIES=new Set(['wilmington','raleigh','charlotte']);
const TIMINGS=new Set(['asap','week','month','flexible']);
// Pin to the visible request-only checkbox on the existing public website.
// Does not authorize marketing, AI-generated calls, recording, or model training.
const CONTACT_NOTICE_VERSION='niterun-services-request-contact-20261108-v1';
const encoder=new TextEncoder();

function response(body:Record<string,unknown>,status=200,origin?:string){
 const headers:Record<string,string>={
  'content-type':'application/json; charset=utf-8',
  'cache-control':'no-store','x-content-type-options':'nosniff'
 };
 if(origin && allowedOrigins.has(origin)){
  headers['access-control-allow-origin']=origin;
  headers['access-control-allow-methods']='GET, POST, OPTIONS';
  headers['access-control-allow-headers']='content-type';
  headers['access-control-max-age']='600';
  headers['vary']='Origin';
 }
 return new Response(JSON.stringify(body),{status,headers});
}
function text(value:unknown,max:number):string{
 return typeof value==='string'?value.trim().slice(0,max+1):'';
}
function validPhone(value:string):boolean{
 return !value || (/^\+?[0-9 ()+.-]{7,32}$/.test(value)&&value.replace(/\D/g,'').length>=7);
}
function validZip(value:string):boolean{
 return !value || /^\d{5}(?:-\d{4})?$/.test(value);
}
async function hmac(secret:string,input:string):Promise<string>{
 const key=await crypto.subtle.importKey('raw',encoder.encode(secret),
  {name:'HMAC',hash:'SHA-256'},false,['sign']);
 const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,encoder.encode(input)));
 return Array.from(bytes,x=>x.toString(16).padStart(2,'0')).join('');
}
Deno.serve(async(req:Request)=>{
 const origin=req.headers.get('origin')||undefined;
 if(origin&&!allowedOrigins.has(origin))return response({error:'Origin not allowed.'},403);
 if(req.method==='OPTIONS')return response({ok:true},200,origin);
 if(req.method==='GET')return response({
  service:'niterun-services-intake',state:'ready',
  payment_processing:false,booking_confirmation:false,marketing_enrollment:false
 },200,origin);
 if(req.method!=='POST')return response({error:'Method not allowed.'},405,origin);
 if(!origin||!allowedOrigins.has(origin))return response({error:'Origin required.'},403);
 if(!(req.headers.get('content-type')||'').toLowerCase().includes('application/json'))
  return response({error:'Use JSON.'},415,origin);
 if(Number(req.headers.get('content-length')||'0')>10000)
  return response({error:'Request too large.'},413,origin);
 let raw:Record<string,unknown>;
 try{
  const rawText=await req.text();
  if(encoder.encode(rawText).length>10000)return response({error:'Request too large.'},413,origin);
  const object=JSON.parse(rawText);
  if(!object||typeof object!=='object'||Array.isArray(object))
   return response({error:'Invalid request.'},400,origin);
  raw=object as Record<string,unknown>;
 }catch{return response({error:'Invalid request.'},400,origin)}
 // Honeypot: quietly discard automated submissions, never create fake lead records.
 if(raw.website)return response({accepted:true,duplicate:false,booking_confirmed:false},200,origin);
 if(raw.consent!==true)return response({error:'Contact consent required.'},422,origin);
 const full_name=text(raw.full_name,100);
 const email=text(raw.email,180).toLowerCase();
 const phone=text(raw.phone,32);
 const postal_code=text(raw.postal_code,10);
 const details=text(raw.details,1200);
 const service=text(raw.service,45);
 const city=text(raw.city,36);
 const timing=text(raw.timing,28);
 const source=text(raw.source,65).replace(/[^a-zA-Z0-9_.-]/g,'')||'direct';
 const campaign=text(raw.campaign,65).replace(/[^a-zA-Z0-9_.-]/g,'');
 const landing_path=text(raw.landing_path,180).replace(/[^a-zA-Z0-9/_-]/g,'');
 if(!SERVICES.has(service)||!CITIES.has(city)||!TIMINGS.has(timing)||
   full_name.length<2||full_name.length>100||
   email.length>180||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||
   !validPhone(phone)||!validZip(postal_code)||
   details.length<12||details.length>1200||
   source.length>65||campaign.length>65||landing_path.length>180)
  return response({error:'Please review the request fields.'},422,origin);
 const url=Deno.env.get('SUPABASE_URL');
 const secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!url||!secret)return response({error:'Service temporarily unavailable.'},503,origin);
 const client=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
 const now=new Date();
 const address=(req.headers.get('x-forwarded-for')||req.headers.get('cf-connecting-ip')||
  req.headers.get('x-real-ip')||'').split(',')[0].trim().slice(0,90);
 const identity=address?'IP:'+address:'EMAIL:'+email;
 const ip_hash=await hmac(secret,'day:'+now.toISOString().slice(0,10)+'|'+identity);
 const slot=Math.floor(now.getTime()/1800000);
 const submission_hash=await hmac(secret,'request:'+email+'|'+service+'|'+city+'|'+slot);
 const since=new Date(now.getTime()-15*60*1000).toISOString();
 const {count:recentCount,error:rateError}=await client.from('nr_service_requests_v1')
  .select('id',{head:true,count:'exact'}).eq('ip_hash',ip_hash).gte('created_at',since);
 if(rateError)return response({error:'Service temporarily unavailable.'},503,origin);
 if((recentCount||0)>=5)return response({error:'Please try again later.'},429,origin);
 const {data:existing,error:dupError}=await client.from('nr_service_requests_v1')
  .select('id').eq('submission_hash',submission_hash).maybeSingle();
 if(dupError)return response({error:'Service temporarily unavailable.'},503,origin);
 if(existing)return response({accepted:true,duplicate:true,booking_confirmed:false},200,origin);
 const {error}=await client.from('nr_service_requests_v1').insert({
  full_name,email,phone,postal_code,service_key:service,city_key:city,timing_key:timing,
  details,source_utm:source,campaign_utm:campaign,landing_path,ip_hash,submission_hash,
  contact_consent_at:now.toISOString(),
  contact_consent_notice_version:CONTACT_NOTICE_VERSION,
  contact_consent_capture_method:'website_checkbox',
  stage:'new',provider_verified:false,verified_payment_cents:0
 });
 if(error){
  if(error.code==='23505')
   return response({accepted:true,duplicate:true,booking_confirmed:false},200,origin);
  return response({error:'Service temporarily unavailable.'},503,origin);
 }
 return response({accepted:true,duplicate:false,booking_confirmed:false},201,origin);
});
