export const evidenceLabels={clip:"Broadcast clip",reporting:"Published reporting",fan:"Unverified fan report"} as const;
export type Evidence=keyof typeof evidenceLabels;
export type Source={label:string;url:string;kind:Evidence};
export type Sighting={id:number;communityVisible?:boolean;communityCorroborated?:boolean;song:string;artist:string;game:string;sport:string;network:string;date:string;source:string;notes:string;status:string;evidence:Evidence;cueType:string;songSlug:string;eventSlug:string;sources:Source[];moderationStatus:string;updatedAt:string;createdAt:string;externalKey:string|null;version:string};
export const sports=["NFL","MLB","NBA","NHL","College football","College basketball","Soccer","NASCAR","Golf","Sports TV","Other"];
export const cueTypes=["Commercial outro","Feature / highlights","Show theme","In-venue","Other"];
export function displayDate(date:string){if(!date)return "Date unknown";if(date.length===4)return date;return new Date(date+(date.length===7?"-02":"")+"T12:00:00Z").toLocaleDateString("en-US",date.length===7?{month:"short",year:"numeric",timeZone:"UTC"}:{month:"short",day:"numeric",year:"numeric",timeZone:"UTC"});}
