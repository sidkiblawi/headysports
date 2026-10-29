import {eventIdentity} from './event-matching';
import type {EntryInput} from './validation';
export function normalizeSubmission(value:string){return value.trim().replace(/\s+/g,' ').toLowerCase();}
export function sameSubmission(a:Pick<EntryInput,'song'|'artist'|'game'|'date'|'sport'>,b:Pick<EntryInput,'song'|'artist'|'game'|'date'|'sport'>){return sameSongDate(a,b)&&eventIdentity(a.game,a.sport)===eventIdentity(b.game,b.sport);}
export function sameSongDate(a:Pick<EntryInput,'song'|'artist'|'date'|'sport'>,b:Pick<EntryInput,'song'|'artist'|'date'|'sport'>){return ['song','artist','date','sport'].every(key=>normalizeSubmission(a[key as keyof typeof a])===normalizeSubmission(b[key as keyof typeof b]));}
export function submissionIdentity(input:EntryInput,moment=''){return JSON.stringify([normalizeSubmission(input.song),normalizeSubmission(input.artist),input.date,eventIdentity(input.game,input.sport),normalizeSubmission(moment)]);}
export type DuplicateSighting={possible?:boolean;sport:string;id:number;version:string;song:string;artist:string;game:string;date:string;notes:string;status:string;canConfirm:boolean};
