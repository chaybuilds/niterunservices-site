import test from 'node:test';
import assert from 'node:assert/strict';
import {renderEditorialServiceStudy} from '../scripts/21st-editorial-study.mjs';
const fixture=[
  {slug:'cleaning',name:'NiteClean',type:'Cleaning',detail:'Cleaning inquiries require a confirmed scope.'},
  {slug:'detailing',name:'NiteDetail',type:'Auto detailing',detail:'Condition must be reviewed.'},
  {slug:'washing',name:'NiteWash',type:'Exterior washing',detail:'Surfaces must be assessed.'},
  {slug:'holiday-lights',name:'NiteHolidays',type:'Seasonal services',detail:'Seasonal capacity must be verified.'}
];
test('Editorial stage displays the four real services and links',()=>{
 const html=renderEditorialServiceStudy(fixture);
 for(const s of fixture){
  assert.ok(html.includes(s.name),s.name);
  assert.ok(html.includes('services/'+s.slug+'/'),s.slug);
 }
 assert.equal((html.match(/data-service-control/g)||[]).length,5); // 4 attributes plus script reference
 assert.equal((html.match(/<article class="service-entry"/g)||[]).length,4);
});
test('No fake bookings, external code or 3D effects',()=>{
 const html=renderEditorialServiceStudy(fixture);
 assert.match(html,/Private visual study/);
 assert.match(html,/noindex,nofollow/);
 assert.match(html,/No data collection/);
 assert.match(html,/aria-expanded/);
 assert.match(html,/prefers-reduced-motion/);
 assert.doesNotMatch(html,/https?:\/\/images\./);
 assert.doesNotMatch(html,/<canvas|<iframe/);
 assert.doesNotMatch(html,/<svg/);
});
test('Service content is escaped and rejects incomplete taxonomy',()=>{
 const safe=fixture.map(x=>({...x}));
 safe[0].detail='<script>alert(1)</script>';
 const html=renderEditorialServiceStudy(safe);
 assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.throws(()=>renderEditorialServiceStudy(fixture.slice(0,2)),/Four verified/);
});
