import { getDb } from "../../../db";
import { sightings } from "../../../db/schema";
import { desc } from "drizzle-orm";
export async function GET(){try{const rows=await getDb().select().from(sightings).orderBy(desc(sightings.id)).limit(500);return Response.json(rows.map(r=>({...r,status:"Community report"})));}catch{ return Response.json({error:"The community archive is temporarily unavailable."},{status:503});}}
export async function POST(request:Request){
try{const raw=await request.json();if(!raw||typeof raw!=="object"||Array.isArray(raw))return Response.json({error:"Invalid submission."},{status:400});const b=raw as Record<string,string>;const fields=["song","artist","game","sport","network","date","source"];for(const k of fields){if(typeof b[k]!=="string"||!b[k].trim()||b[k].length>500)return Response.json({error:"Please complete every required field (maximum 500 characters)."},{status:400});}
const url=new URL(b.source);if(!["http:","https:"].includes(url.protocol))return Response.json({error:"Use a valid http or https source link."},{status:400});
if(!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||!Number.isFinite(Date.parse(b.date))||b.date>new Date().toISOString().slice(0,10))return Response.json({error:"Enter a valid broadcast date that is not in the future."},{status:400});
if(b.notes && (typeof b.notes!=="string"||b.notes.length>2000))return Response.json({error:"Notes must be under 2,000 characters."},{status:400});
const record=Object.fromEntries(fields.map(k=>[k,b[k].trim()]));await getDb().insert(sightings).values({...record,notes:b.notes?.trim()||"",createdAt:new Date().toISOString()} as typeof sightings.$inferInsert);return Response.json({ok:true},{status:201});
}catch{return Response.json({error:"Could not save your sighting. Check the source link and try again."},{status:400});}}
