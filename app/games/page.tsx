import {entries} from "../../lib/catalog";
import {displayDate} from "../../lib/archive";
import {SiteHeader} from "../catalog-view";
export const dynamic="force-dynamic";
export const metadata={title:"Games & events | HeadySports",description:"Browse sports broadcasts and their documented musical moments."};
export default async function Games(){const rows=await entries();const groups=new Map<string,{game:string;sport:string;date:string;count:number}>();for(const r of rows){const g=groups.get(r.eventSlug);groups.set(r.eventSlug,{game:r.game,sport:r.sport,date:r.date,count:(g?.count||0)+1})}return <><SiteHeader/><main className="catalog-page"><p className="eyebrow">THE GAME LOG</p><h1>Find your game’s soundtrack.</h1><p>Recorded appearances across {groups.size} games, events, and coverage records. These are documented selections, not complete broadcast playlists.</p><div className="catalog-grid">{[...groups].map(([slug,g])=><a className="catalog-card" href={`/games/${slug}`} key={slug}><span className="eyebrow">{g.sport} · {displayDate(g.date)}</span><h2>{g.game}</h2><p>{g.count} appearance{g.count===1?"":"s"} ↗</p></a>)}</div></main></>}
