import {database,entries,writeEntry,identity} from "../../../lib/catalog";
import {sameOrigin} from "../../../lib/moderation";
import {jsonBody,parseEntry,record,ValidationError} from "../../../lib/validation";
import {sameSubmission,sameSongDate,submissionIdentity,normalizeSubmission,type DuplicateSighting} from "../../../lib/submission-duplicates";
export async function GET(){try{return Response.json(await entries(),{headers:{"Cache-Control":"no-store"}})}catch{return Response.json({error:"The archive is temporarily unavailable. Please retry."},{status:503})}}
export async function POST(request:Request){if(!sameOrigin(request))return Response.json({error:"Please submit from this website."},{status:403});try{const raw=record(await jsonBody(request,15000));if(raw.website)return Response.json({ok:true},{status:202});const input=parseEntry(raw);const db=database();const ip=request.headers.get("cf-connecting-ip");let submissionKey:string|null=null;if(ip){const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(ip+new Date().toISOString().slice(0,10)));submissionKey=Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,"0")).join("");const recent=await db.prepare("SELECT COUNT(*) AS n FROM sightings WHERE submission_key=? AND created_at>?").bind(submissionKey,new Date(Date.now()-3600000).toISOString()).first<{n:number}>();if(recent&&recent.n>=5)return Response.json({error:"Five sightings per hour, please. Try again later."},{status:429});}
const moment=raw.differentMoment===true?typeof raw.moment==="string"?raw.moment.trim():"":"";
if(raw.differentMoment===true&&(!moment||moment.length>200))throw new ValidationError("Describe the different broadcast moment (up to 200 characters), such as the inning or game clock.");
if(moment&&`Broadcast moment: ${moment}\n${input.notes}`.trim().length>4000)throw new ValidationError("Shorten the notes so the broadcast moment and notes fit within 4000 characters.");
const candidates=(await db.prepare("SELECT id,version,song,artist,game,sport,date,notes,moderation_status AS status,community_visible FROM sightings WHERE date=? AND (moderation_status='approved' OR (moderation_status='pending' AND community_visible=1)) ORDER BY id").bind(input.date).all<DuplicateSighting & {community_visible:number}>()).results;
const response=(row:DuplicateSighting & {community_visible:number},possible=false)=>Response.json({error:"Someone already reported this. Heard it too?",duplicate:{possible,sport:row.sport,id:row.id,version:row.version,song:row.song,artist:row.artist,game:row.game,date:row.date,notes:row.notes,status:row.status,canConfirm:Boolean(row.community_visible)}},{status:409,headers:{"Cache-Control":"no-store"}});
const duplicate=candidates.find(row=>sameSubmission(input,row));
if(duplicate&&!moment)return response(duplicate);
const sameMoment=moment?candidates.find(row=>sameSubmission(input,row)&&normalizeSubmission(row.notes.split('\n')[0])===normalizeSubmission(`Broadcast moment: ${moment}`)):undefined;
if(sameMoment)return response(sameMoment);
const ignored=Array.isArray(raw.differentGames)?raw.differentGames.filter(Number.isSafeInteger).slice(0,50):[];
const possible=candidates.find(row=>sameSongDate(input,row)&&!sameSubmission(input,row)&&!ignored.includes(row.id));
if(!duplicate&&possible)return response(possible,true);
const externalKey=`submission-match:${await identity("submission",[submissionIdentity(input,moment)])}`;
const saved=await writeEntry({...input,notes:moment?`Broadcast moment: ${moment}\n${input.notes}`.trim():input.notes},{externalKey,communityVisible:true});
const row=await db.prepare("SELECT id,version,song,artist,game,sport,date,notes,moderation_status AS status,community_visible FROM sightings WHERE external_key=?").bind(externalKey).first<DuplicateSighting & {community_visible:number}>();
if(!row)throw Error("Submission was not saved");
if(row.version!==saved.version){if(row.status==='approved'||(row.status==='pending'&&row.community_visible))return response(row);return Response.json({error:"This report has already been reviewed. Please contact a moderator if it needs correcting."},{status:409});}
if(submissionKey)await db.prepare("UPDATE sightings SET submission_key=? WHERE id=?").bind(submissionKey,row.id).run();return Response.json({ok:true,id:row.id},{status:201});}catch(e){return Response.json({error:e instanceof ValidationError?e.message:"Unable to save right now. Please retry."},{status:e instanceof ValidationError?400:503})}}
