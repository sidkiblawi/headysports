import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../app/chatgpt-auth";
export async function isModerator(){
 const user=await getChatGPTUser();
 const email=(env as unknown as {MODERATOR_EMAIL?:string}).MODERATOR_EMAIL;
 return Boolean(user && email && user.email.toLowerCase()===email.toLowerCase());
}
export function sameOrigin(request:Request){return request.headers.get("origin")===new URL(request.url).origin;}
