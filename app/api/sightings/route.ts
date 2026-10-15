import { getDb } from "../../../db";
import { sightings } from "../../../db/schema";
import { and, desc, eq, gt } from "drizzle-orm";
import { sameOrigin } from "../../../lib/moderation";
export async function GET(){try{const rows=await getDb().select({id:sightings.id,song:sightings.song,artist:sightings.artist,game:sightings.game,sport:sightings.sport,network:sightings.network,date:sightings.date,source:sightings.source,notes:sightings.notes}).from(sightings).where(eq(sightings.moderationStatus,"approved")).orderBy(desc(sightings.id)).limit(500);return Response.json(rows.map(r=>({...r,status:"Community · reviewed"})),{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({error:"The community archive is temporarily unavailable."},{status:503});}}
export async function POST(request:Request){
 if(!sameOrigin(request))return Response.json({error:"Please submit from this website."},{status:403});
 try{
 const body=await request.text();if(body.length>10000)return Response.json({error:"Submission is too long."},{status:413});
 const raw:unknown=JSON.parse(body);if(!raw||typeof raw!=="object"||Array.isArray(raw))return Response.json({error:"Invalid submission."},{status:400});
 const b=raw as Record<string,unknown>;
 if(b.website)return Response.json({ok:true},{status:202});
 const fields=["song","artist","game","sport","network","date","source"] as const;
 const record={} as Record<typeof fields[number],string>;
 for(const k of fields){if(typeof b[k]!=="string"||!b[k].trim()||b[k].length>500)return Response.json({error:"Please complete every required field (maximum 500 characters)."},{status:400});record[k]=b[k].trim();}
 const url=new URL(record.source);if(!["http:","https:"].includes(url.protocol)||url.username||url.password)return Response.json({error:"Use a valid public http or https source link."},{status:400});
 const date=new Date(record.date+"T12:00:00Z");
 if(!/^\d{4}-\d{2}-\d{2}$/.test(record.date)||!Number.isFinite(date.valueOf())||date.toISOString().slice(0,10)!==record.date||record.date>new Date().toISOString().slice(0,10))return Response.json({error:"Enter a valid broadcast date that is not in the future."},{status:400});
 if(!["NFL","MLB","NBA","NHL","College football","College basketball","Soccer","NASCAR","Sports TV","Other"].includes(record.sport))return Response.json({error:"Choose a sport from the list."},{status:400});
 if(b.notes!==undefined&&(typeof b.notes!=="string"||b.notes.length>2000))return Response.json({error:"Notes must be under 2,000 characters."},{status:400});
 const ip=request.headers.get("cf-connecting-ip");let submissionKey:string|null=null;
 if(ip){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ip+new Date().toISOString().slice(0,10)));submissionKey=Array.from(new Uint8Array(digest)).map(x=>x.toString(16).padStart(2,"0")).join("");
 const recent=await getDb().select({id:sightings.id}).from(sightings).where(and(eq(sightings.submissionKey,submissionKey),gt(sightings.createdAt,new Date(Date.now()-3600000).toISOString()))).limit(5);
 if(recent.length>=5)return Response.json({error:"You’ve submitted five sightings this hour. Please try again later."},{status:429});}
 const duplicate=await getDb().select({id:sightings.id}).from(sightings).where(and(eq(sightings.song,record.song),eq(sightings.artist,record.artist),eq(sightings.date,record.date),eq(sightings.game,record.game))).limit(1);
 if(duplicate.length)return Response.json({error:"This sighting has already been submitted."},{status:409});
 await getDb().insert(sightings).values({...record,notes:typeof b.notes==="string"?b.notes.trim():"",createdAt:new Date().toISOString(),submissionKey,moderationStatus:"pending"});return Response.json({ok:true},{status:201});
 }catch(error){if(error instanceof SyntaxError||error instanceof TypeError||error instanceof RangeError)return Response.json({error:"Check the submission and source link, then try again."},{status:400});return Response.json({error:"Unable to save right now. Please try again later."},{status:503});}
}
