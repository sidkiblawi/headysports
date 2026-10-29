import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
const sqlite=new DatabaseSync(':memory:');
for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()) sqlite.exec(readFileSync('drizzle/'+name,'utf8'));
function statement(sql,args=[]){return {bind(...values){return statement(sql,values)},async all(){return {results:sqlite.prepare(sql).all(...args)}},async first(){return sqlite.prepare(sql).get(...args)||null},async run(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}},execute(){const r=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(r.changes)}}}}}
globalThis.__duplicateTestEnv={COMMUNITY_VOTE_SECRET:'local-test-secret',DB:{prepare:statement,async batch(statements){sqlite.exec('BEGIN');try{const result=statements.map(s=>s.execute());sqlite.exec('COMMIT');return result}catch(e){sqlite.exec('ROLLBACK');throw e}}}};
const cache=new Map();
function moduleURL(file){file=path.resolve(file);if(cache.has(file))return cache.get(file);let code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
code=code.replace(/import \{ env \} from ["']cloudflare:workers["'];?/g,'const env=globalThis.__duplicateTestEnv;');
code=code.replace(/from (["'])(\.[^"']+)\1/g,(_,q,ref)=>{if(ref.endsWith('/moderation'))return 'from '+JSON.stringify('data:text/javascript,'+encodeURIComponent('export function sameOrigin(){return true}'));return 'from '+JSON.stringify(moduleURL(path.resolve(path.dirname(file),ref+'.ts')))});
const url='data:text/javascript;base64,'+Buffer.from(code).toString('base64');cache.set(file,url);return url}
const {POST}=await import(moduleURL('app/api/sightings/route.ts'));
const base={song:'Free',artist:'Phish',game:'Brewers vs Dodgers',sport:'MLB',network:'FOX',date:'2020-10-16'};
async function submit(body){const r=await POST(new Request('https://example.com/api/sightings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}));return {status:r.status,body:await r.json()}}
const results=await Promise.all(Array.from({length:8},(_,i)=>submit({...base,song:i%2?'  FREE  ':'Free',game:i%2?' Brewers   vs Dodgers ':'Brewers vs Dodgers'})));
assert.equal(results.filter(r=>r.status===201).length,1);
assert.equal(results.filter(r=>r.status===409&&r.body.duplicate).length,7);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM sightings').get().n,1);
const id=results.find(r=>r.status===201).body.id;
assert(results.filter(r=>r.status===409).every(r=>r.body.duplicate.id===id));
const {POST:vote}=await import(moduleURL('app/api/community/route.ts'));
async function confirm(ip,version){const r=await vote(new Request('https://example.com/api/community',{method:'POST',headers:{'Content-Type':'application/json','cf-connecting-ip':ip},body:JSON.stringify({id,version})}));return {status:r.status,body:await r.json()}}
const version=results.find(r=>r.status===409).body.duplicate.version;
assert.equal((await confirm('192.0.2.1','stale')).status,409);
for(let n=1;n<=7;n++){const r=await confirm('192.0.2.'+n,version);assert.equal(r.status,200);assert.equal(r.body.corroborated,n>=5);}
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM community_votes WHERE sighting_id=?').get(id).n,5);
assert.equal((await confirm('192.0.2.1',version)).body.confirmed,true);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM sightings').get().n,1);
assert.equal((await submit({...base,differentMoment:true})).status,400);
const repeat=await submit({...base,differentMoment:true,moment:'Bottom of the 7th'});assert.equal(repeat.status,201);
assert.equal((await submit({...base,differentMoment:true,moment:' bottom OF the   7th '})).status,409);
assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM sightings').get().n,2);
// Existing rows from before deterministic keys are still detected.
sqlite.prepare("UPDATE sightings SET external_key='legacy:one',moderation_status='approved' WHERE id=?").run(id);
assert.equal((await submit(base)).body.duplicate.id,id);
for(const field of ['song','artist','game','sport','network'])assert.equal((await submit({...base,[field]:''})).status,400);
// Private/rejected rows are never returned as duplicate details.
sqlite.prepare("UPDATE sightings SET moderation_status='rejected'").run();
const privateRepeat=await submit({...base,differentMoment:true,moment:'Bottom of the 7th'});assert.equal(privateRepeat.status,409);assert.equal(privateRepeat.body.duplicate,undefined);
console.log('PASS: eight simultaneous submissions create one row; normalized matching; confirmations target same ID; distinct moments; legacy reports; required fields; private rows protected');

const {eventIdentity}=await import(moduleURL('lib/event-matching.ts'));
assert.equal(eventIdentity('LAD @ MIL','MLB'),eventIdentity('Brewers–Dodgers','MLB'));
assert.equal(eventIdentity('Green Bay Packers vs Chicago Bears','NFL'),eventIdentity('CHI at GB','NFL'));
assert.equal(eventIdentity('Boston Celtics vs Milwaukee Bucks','NBA'),eventIdentity('MIL @ BOS','NBA'));
assert.notEqual(eventIdentity('LAD @ MIL Game 1','MLB'),eventIdentity('MIL vs LAD Game 2','MLB'));
assert.notEqual(eventIdentity('Giants vs Cardinals','MLB'),eventIdentity('Giants vs Cardinals','NFL'));
const aliases=['LAD @ MIL','Brewers vs Dodgers','Los Angeles Dodgers at Milwaukee Brewers','MIL–LAD'];
const aliasResults=await Promise.all(Array.from({length:8},(_,i)=>submit({...base,date:'2020-10-17',game:aliases[i%4]})));
assert.equal(aliasResults.filter(r=>r.status===201).length,1);
assert.equal(aliasResults.filter(r=>r.status===409&&!r.body.duplicate.possible).length,7);
const aliasId=aliasResults.find(r=>r.status===201).body.id;
const uncertain={...base,date:'2020-10-17',game:'NLCS baseball broadcast'};
const warning=await submit(uncertain);assert.equal(warning.status,409);assert.equal(warning.body.duplicate.possible,true);
assert.equal((await submit({...uncertain,differentGames:[aliasId]})).status,201);
// "Different game" cannot bypass a confident alias match.
assert.equal((await submit({...base,date:'2020-10-17',game:'MIL vs LAD',differentGames:[aliasId]})).status,409);
const {GET:options}=await import(moduleURL('app/api/submission-options/route.ts'));
const suggestions=await (await options(new Request('https://example.com/api/submission-options?date=2020-10-17'))).json();
assert(suggestions.some(r=>r.game==='LAD @ MIL'));
assert(suggestions.every(r=>r.date==='2020-10-17'));
const hidden=await (await options(new Request('https://example.com/api/submission-options?date=2020-10-16'))).json();assert.equal(hidden.length,0);
console.log('PASS: sport-scoped team aliases, reversed team order, preserved game numbers, simultaneous aliases, uncertain-match escape, private-safe suggestions');
