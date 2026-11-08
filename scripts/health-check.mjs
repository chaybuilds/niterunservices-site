// NiteRun Services read-only health and deployment checks.
// Never changes DNS or creates customer records.
import {lookup} from 'node:dns/promises';
const preview='https://chaybuilds.github.io/niterunservices-site/';
const intake='https://succvbtctjkzsowotcsy.supabase.co/functions/v1/services-intake';
async function check(url,validate){
 const abort=new AbortController();
 const timer=setTimeout(()=>abort.abort(),15000);
 try{
  const response=await fetch(url,{signal:abort.signal,redirect:'follow',headers:{'user-agent':'NiteRunServices-Health/1.0'}});
  if(!response.ok)throw new Error('HTTP '+response.status);
  const text=await response.text();
  if(!validate(text))throw new Error('Content or status validation failed');
  return {ok:true,status:response.status};
 } finally{clearTimeout(timer)}
}
let failed=false;
for(const [label,url,checkBody] of [
 ['public_site',preview,text=>text.includes('NITERUN')&&text.includes('data-intake-form')],
 ['intake_readiness',intake,text=>{
  try{const x=JSON.parse(text);return x.state==='ready'&&x.payment_processing===false&&x.booking_confirmation===false}catch{return false}
 }]
]){
 try{console.log(JSON.stringify({check:label,...await check(url,checkBody)}))}
 catch(e){console.error(JSON.stringify({check:label,ok:false,error:String(e.message)}));failed=true}
}
// DNS parking is an expected state until Namecheap is configured.
try{
 const apex=await lookup('niterunservices.com',{all:true});
 const ips=apex.map(x=>x.address).sort();
 const gh=new Set(['185.199.108.153','185.199.109.153','185.199.110.153','185.199.111.153']);
 console.log(JSON.stringify({check:'custom_domain',state:ips.length>0&&ips.every(x=>gh.has(x))?'github_pages_dns':'dns_pending',addresses:ips}));
}catch(e){console.log(JSON.stringify({check:'custom_domain',state:'dns_pending',error:String(e.code||e.message)}))}
if(failed)process.exit(1);
