import { isModerator, sameOrigin } from "../../../lib/moderation";
import { getChatGPTUser } from "../../chatgpt-auth";
import { getDb } from "../../../db";
import { sightings } from "../../../db/schema";
import { desc, eq } from "drizzle-orm";
export async function GET(){
 if(!await isModerator())return Response.json({error:"Moderator access required."},{status:403});
 try{const rows=await getDb().select().from(sightings).orderBy(desc(sightings.id)).limit(1000);return Response.json(rows,{headers:{"Cache-Control":"no-store"}});}catch{return Response.json({error:"Could not load the queue."},{status:503});}
}
export async function PATCH(request:Request){
 if(!await isModerator()||!sameOrigin(request))return Response.json({error:"Moderator access required."},{status:403});
 try{const b=await request.json() as {id?:number;status?:string};if(!b||!Number.isSafeInteger(b.id)||!b.id||b.id<1||!b.status||!["approved","rejected","pending"].includes(b.status))return Response.json({error:"Invalid review action."},{status:400});
 const user=await getChatGPTUser();const result=await getDb().update(sightings).set({moderationStatus:b.status,reviewedAt:new Date().toISOString(),reviewedBy:user!.userId}).where(eq(sightings.id,b.id)).returning({id:sightings.id});
 if(!result.length)return Response.json({error:"Sighting not found."},{status:404});return Response.json({ok:true});
 }catch{return Response.json({error:"Could not save the review. Please retry."},{status:503});}
}
