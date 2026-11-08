// NiteRun Services non-mutating health observer.
// Reports all links, checks site content, and never changes DNS, triggers sends or touches private data.
import {lookup,resolveCname} from 'node:dns/promises';
const targets=['https://niterunservices.com/','https://chaybuilds.github.io/niterunservices-site/'];
const api='https://succvbtctjkzsowotcsy.supabase.co/functions/v1/services-intake';
async function fetchText(url){
 const ctl=new AbortController();
 const timer=setTimeout(()=>ctl.abort(),14000);
 try{
  const res=await fetch(url,{signal:ctl.signal,redirect:'follow',headers:{'user-agent':'NiteRunServices-Readiness/1.0'}});
  const body=await res.text();
  return {ok:res.ok,status:res.status,url:res.url,body};
 }finally{clearTimeout(timer)}
}
let websiteOk=false;
for(const website of targets){
 try{
  const result=await fetchText(website);
  const branded=result.ok&&result.body.includes('NITERUN')&&result.body.includes('data-intake-form');
  websiteOk=websiteOk||branded;
  console.log(JSON.stringify({check:'customer_site',requested:website,servedUrl:result.url,status:result.status,ready:branded}));
 }catch(e){
  console.log(JSON.stringify({check:'customer_site',requested:website,ready:false,error:String(e.message)}));
 }
}
let apiOk=false;
try{
 const r=await fetchText(api);
 let json={};
 try{json=JSON.parse(r.body)}catch{}
 apiOk=r.ok&&json.state==='ready'&&json.booking_confirmation===false&&json.payment_processing===false;
 console.log(JSON.stringify({check:'protected_request_api',ready:apiOk,http:r.status,paymentEnabled:json.payment_processing,confirmedBooking:json.booking_confirmation}));
}catch(e){console.error(JSON.stringify({check:'protected_request_api',ready:false,error:String(e.message)}))}
const githubIps=new Set(['185.199.108.153','185.199.109.153','185.199.110.153','185.199.111.153']);
try{
 const addresses=(await lookup('niterunservices.com',{all:true})).map(x=>x.address);
 console.log(JSON.stringify({check:'apex_dns',ready:addresses.length===4&&addresses.every(x=>githubIps.has(x)),addresses}));
}catch(e){console.log(JSON.stringify({check:'apex_dns',ready:false,error:String(e.message)}))}
try{
 const cname=await resolveCname('www.niterunservices.com');
 console.log(JSON.stringify({check:'www_dns',ready:cname.some(x=>x.replace(/\.$/,'')==='chaybuilds.github.io'),cname}));
}catch(e){console.log(JSON.stringify({check:'www_dns',ready:false,error:String(e.message)}))}
if(!websiteOk||!apiOk){
 console.error('SERVICES_HEALTH_DEGRADED: public site or protected intake is not yet reachable');
 process.exit(1);
}
console.log('SERVICES_HEALTH_OK');
