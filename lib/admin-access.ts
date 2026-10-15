// Match only the trusted sign-in email; never accept client-supplied identities.
export function hasAdminEmail(email:string|undefined,owner?:string,additional?:string){
 const normalized=email?.trim().toLowerCase();
 if(!normalized)return false;
 return [owner||"",...(additional||"").split(",")].some(value=>value.trim().toLowerCase()===normalized);
}
