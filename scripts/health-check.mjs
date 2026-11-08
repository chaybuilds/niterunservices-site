// NiteRun Services — read-only live health, no credentials, payment or outbound communications.
// A working HTTP page or a GitHub Pages redirect is not evidence of secure HTTPS readiness.
import {lookup,resolveCname} from 'node:dns/promises';

const ORIGIN='https://niterunservices.com/';
const WWW='https://www.niterunservices.com/';
const DEFAULT='https://chaybuilds.github.io/niterunservices-site/';
const API='https://succvbtctjkzsowotcsy.supabase.co/functions/v1/services-intake';
const ips=new Set(['185.199.108.153','185.199.109.153','185.199.110.153','185.199.111.153']);

async function fetchCheck(url,{timeoutMs=13500}={}){
 const controller=new AbortController();
 const timer=setTimeout(()=>controller.abort(),timeoutMs);
 try{
  const r=await fetch(url,{redirect:'follow',signal:controller.signal,headers:{'user-agent':'NiteRunServices-Health/1.1'}});
  const body=await r.text();
  return {status:r.status,ok:r.ok,finalUrl:r.url,body};
 }finally{clearTimeout(timer)}
}
function report(entry){console.log(JSON.stringify(entry))}
async function siteCheck(label,url,{requiredHost=null}={}){
 try{
  const r=await fetchCheck(url);
  const final=new URL(r.finalUrl);
  const branded=r.ok&&r.body.includes('NITERUN')&&r.body.includes('data-intake-form');
  const secure=final.protocol==='https:';
  const hostRight=!requiredHost||final.hostname===requiredHost;
  const ready=branded&&secure&&hostRight;
  report({check:label,ready,status:r.status,finalUrl:r.finalUrl,branded,secure,hostRight});
  return ready;
 }catch(e){report({check:label,ready:false,error:String(e?.message||e).slice(0,160)});return false}
}
async function dataHealth(){
 try{
  const r=await fetchCheck(API,{timeoutMs:12000});
  const p=JSON.parse(r.body);
  const ready=r.ok&&p.state==='ready'&&p.payment_processing===false&&
    p.booking_confirmation===false&&p.marketing_enrollment===false;
  report({check:'protected_request_api',ready,status:r.status,paidActionsEnabled:!!p.payment_processing});
  return ready;
 }catch(e){report({check:'protected_request_api',ready:false,error:String(e?.message||e).slice(0,160)});return false}
}
async function dnsHealth(){
 let apex=false,www=false;
 try{
  const addresses=(await lookup('niterunservices.com',{all:true})).map(x=>x.address);
  apex=addresses.length===4&&new Set(addresses).size===4&&addresses.every(x=>ips.has(x));
  report({check:'apex_dns',ready:apex,addresses});
 }catch(e){report({check:'apex_dns',ready:false,error:String(e?.message||e).slice(0,160)})}
 try{
  const cnames=await resolveCname('www.niterunservices.com');
  www=cnames.some(x=>x.replace(/\.$/,'')==='chaybuilds.github.io');
  report({check:'www_dns',ready:www,cnames});
 }catch(e){report({check:'www_dns',ready:false,error:String(e?.message||e).slice(0,160)})}
 return apex&&www;
}
const [apex,alias,fallback,api,dns]=await Promise.all([
 siteCheck('custom_domain_https',ORIGIN,{requiredHost:'niterunservices.com'}),
 siteCheck('www_https_redirect',WWW,{requiredHost:'niterunservices.com'}),
 siteCheck('github_pages_fallback',DEFAULT),
 dataHealth(),dnsHealth()
]);
const ok=apex&&alias&&api&&dns;
report({check:'services_launch_gate',ready:ok,apex_https:apex,www_https:alias,api,dns,
 github_pages_fallback:fallback,customer_quote_submission_is_booking:false});
if(!ok){
 console.error('SERVICES_CUSTOM_DOMAIN_INCOMPLETE: HTTPS and intake must pass; GitHub Pages certificate may still be provisioning.');
 process.exitCode=1;
}else{
 console.log('SERVICES_CUSTOM_DOMAIN_HTTPS_AND_INTAKE_READY');
}
