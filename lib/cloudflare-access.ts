import {createRemoteJWKSet,jwtVerify,type JWTVerifyGetKey} from 'jose';
import {hasAdminEmail} from './admin-access';
export type AccessSettings={AUTH_PROVIDER?:string;CF_ACCESS_TEAM_DOMAIN?:string;CF_ACCESS_AUD?:string;MODERATOR_EMAIL?:string;ADMIN_EMAILS?:string};
const keySets=new Map<string,JWTVerifyGetKey>();
function accessConfig(settings:AccessSettings){
 const domain=settings.CF_ACCESS_TEAM_DOMAIN||'';
 if(!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)||!settings.CF_ACCESS_AUD)throw Error('Cloudflare Access is not configured');
 const issuer=`https://${domain}`;
 const audience=settings.CF_ACCESS_AUD.split(',').map(s=>s.trim()).filter(Boolean);
 if(!audience.length)throw Error('Cloudflare Access audience is missing');
 return {issuer,audience};
}
export async function verifyAccessToken(token:string,settings:AccessSettings,key?:JWTVerifyGetKey){
 const {issuer,audience}=accessConfig(settings);
 if(!key){key=keySets.get(issuer);if(!key){key=createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`));keySets.set(issuer,key);}}
 const {payload}=await jwtVerify(token,key,{issuer,audience,algorithms:['RS256'],requiredClaims:['exp','sub','email']});
 if(typeof payload.email!=='string'||typeof payload.sub!=='string'||!payload.sub||!hasAdminEmail(payload.email,settings.MODERATOR_EMAIL,settings.ADMIN_EMAILS))throw Error('Admin is not allowed');
 return {email:payload.email,userId:payload.sub};
}
export async function cloudflareRequest(request:Request,settings:AccessSettings,verify=verifyAccessToken):Promise<Request|Response>{
 if(settings.AUTH_PROVIDER!=='cloudflare-access')return request;
 const url=new URL(request.url);
 const headers=new Headers(request.headers);
 // OpenAI identity headers are trusted only behind Sites, never on our Worker.
 for(const name of [...headers.keys()])if(name.startsWith('oai-authenticated-'))headers.delete(name);
 const admin=url.pathname==='/admin'||url.pathname.startsWith('/admin/')||url.pathname==='/api/admin'||url.pathname.startsWith('/api/admin/');
 if(admin){
  try{accessConfig(settings)}catch{return Response.json({error:'Admin sign-in is not configured yet.'},{status:503,headers:{'Cache-Control':'no-store'}})}
  const token=headers.get('cf-access-jwt-assertion');
  if(!token)return Response.json({error:'Sign in through the protected admin address.'},{status:401,headers:{'Cache-Control':'no-store'}});
  try{const user=await verify(token,settings);headers.set('oai-authenticated-user-id',user.userId);headers.set('oai-authenticated-user-email',user.email)}catch{return Response.json({error:'Admin sign-in required.'},{status:403,headers:{'Cache-Control':'no-store'}})}
 }
 // Preserve existing application links while replacing their sign-in provider.
 if(url.pathname==='/signin-with-chatgpt')return Response.redirect(new URL('/admin',url).href,303);
 if(url.pathname==='/signout-with-chatgpt')return Response.redirect(new URL('/cdn-cgi/access/logout',url).href,303);
 return new Request(request,{headers});
}
