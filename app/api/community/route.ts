import {env} from 'cloudflare:workers';
import {database} from '../../../lib/catalog';
import {communityRows} from '../../../lib/community';
import {sameOrigin} from '../../../lib/moderation';
import {jsonBody,record} from '../../../lib/validation';
export async function GET(){try{return Response.json(await communityRows(),{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({error:'Community sightings are temporarily unavailable.'},{status:503})}}
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:'Please confirm from this website.'},{status:403});try{
const body=record(await jsonBody(request,1000));if(!Number.isSafeInteger(body.id)||Number(body.id)<1)return Response.json({error:'Invalid sighting.'},{status:400});
const secret=(env as unknown as {COMMUNITY_VOTE_SECRET?:string}).COMMUNITY_VOTE_SECRET;const ip=request.headers.get('cf-connecting-ip');if(!secret||!ip)return Response.json({error:'Confirmations are temporarily unavailable.'},{status:503});
const cookie=request.headers.get('cookie')?.match(/(?:^|;\s*)heady_voter=([a-f0-9-]{36})(?:;|$)/)?.[1];const voter=cookie||crypto.randomUUID();
async function hash(s:string){const h=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secret+'|'+s));return Array.from(new Uint8Array(h)).map(b=>b.toString(16).padStart(2,'0')).join('')}
const browser=await hash('browser|'+voter),network=await hash('network|'+ip),db=database();
const row=await db.prepare("SELECT version FROM sightings WHERE id=? AND community_visible=1 AND moderation_status IN ('pending','approved')").bind(body.id).first<{version:string}>();if(!row)return Response.json({error:'This sighting is not open for confirmations.'},{status:404});
const cutoff=new Date(Date.now()-3600000).toISOString();
const recent=await db.prepare('SELECT COUNT(*) AS n FROM community_votes WHERE network_hash=? AND created_at>?').bind(network,cutoff).first<{n:number}>();if((recent?.n||0)>=20)return Response.json({error:'Please try again later.'},{status:429});
await db.prepare(`INSERT OR IGNORE INTO community_votes(sighting_id,version,browser_hash,network_hash,created_at) SELECT id,version,?,?,? FROM sightings a WHERE id=? AND version=? AND community_visible=1 AND moderation_status IN ('pending','approved') AND (SELECT COUNT(*) FROM community_votes WHERE sighting_id=a.id AND version=a.version)<5 AND NOT EXISTS (SELECT 1 FROM community_votes WHERE sighting_id=a.id AND version=a.version AND (browser_hash=? OR network_hash=?)) AND (SELECT COUNT(*) FROM community_votes WHERE network_hash=? AND created_at>?)<20`).bind(browser,network,new Date().toISOString(),body.id,row.version,browser,network,network,cutoff).run();
const state=await db.prepare('SELECT COUNT(*)>=5 AS starred, MAX(browser_hash=? OR network_hash=?) AS confirmed FROM community_votes WHERE sighting_id=? AND version=?').bind(browser,network,body.id,row.version).first();
return Response.json({corroborated:Boolean(state?.starred),confirmed:Boolean(state?.confirmed)},{headers:{'Cache-Control':'no-store','Set-Cookie':`heady_voter=${voter}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`}});
}catch{return Response.json({error:'Could not save your confirmation. Please retry.'},{status:503})}}
