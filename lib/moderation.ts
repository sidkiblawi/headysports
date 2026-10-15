import { env } from "cloudflare:workers";
import { hasAdminEmail } from "./admin-access";
import { getChatGPTUser } from "../app/chatgpt-auth";
export async function isModerator(){
 const user=await getChatGPTUser();
 const settings=env as unknown as {MODERATOR_EMAIL?:string;ADMIN_EMAILS?:string};
 return hasAdminEmail(user?.email,settings.MODERATOR_EMAIL,settings.ADMIN_EMAILS);
}
export function sameOrigin(request:Request){return request.headers.get("origin")===new URL(request.url).origin;}
