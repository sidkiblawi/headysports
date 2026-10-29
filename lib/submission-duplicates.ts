import type {EntryInput} from './validation';
export function normalizeSubmission(value:string){return value.trim().replace(/\s+/g,' ').toLowerCase();}
export function sameSubmission(a:Pick<EntryInput,'song'|'artist'|'game'|'date'>,b:Pick<EntryInput,'song'|'artist'|'game'|'date'>){return ['song','artist','game','date'].every(key=>normalizeSubmission(a[key as keyof typeof a])===normalizeSubmission(b[key as keyof typeof b]));}
export function submissionIdentity(input:EntryInput,moment=''){return JSON.stringify([input.song,input.artist,input.game,input.date,moment].map(normalizeSubmission));}
export type DuplicateSighting={id:number;version:string;song:string;artist:string;game:string;date:string;notes:string;status:string;canConfirm:boolean};
