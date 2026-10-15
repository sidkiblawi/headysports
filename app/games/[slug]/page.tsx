import {notFound} from "next/navigation";
import {entries} from "../../../lib/catalog";
import {displayDate} from "../../../lib/archive";
import {SiteHeader,Appearances} from "../../catalog-view";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params;const r=(await entries()).find(r=>r.eventSlug===slug);if(!r)return {title:"Game not found | HeadySports"};const title=`${r.game} · ${displayDate(r.date)} | HeadySports`;return {title,description:`Songs heard during ${r.game}. Explore the broadcast music with linked sources.`,alternates:{canonical:`https://www.headysports.com/games/${slug}`},openGraph:{title,type:"website",url:`https://www.headysports.com/games/${slug}`}}}
export default async function Game({params}:Props){const {slug}=await params;const rows=(await entries()).filter(r=>r.eventSlug===slug);if(!rows.length)notFound();return <><SiteHeader/><main className="catalog-page"><p className="eyebrow">{rows[0].sport} · {displayDate(rows[0].date)}</p><h1>{rows[0].game}</h1><p>{rows.length} recorded musical moment{rows.length===1?"":"s"}. This is a growing setlist; missing songs and unknown timings remain open for research.</p><Appearances rows={rows}/></main></>}
