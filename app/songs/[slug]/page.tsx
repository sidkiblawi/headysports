import {notFound} from "next/navigation";
import {entries} from "../../../lib/catalog";
import {SiteHeader,Appearances} from "../../catalog-view";
export const dynamic="force-dynamic";
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params;const r=(await entries()).find(r=>r.songSlug===slug);if(!r)return {title:"Song not found | HeadySports"};const title=`${r.song} — ${r.artist} | HeadySports`;return {title,description:`Sports broadcast appearances of ${r.song} by ${r.artist}, with evidence and source links.`,alternates:{canonical:`https://www.headysports.com/songs/${slug}`},openGraph:{title,type:"website",url:`https://www.headysports.com/songs/${slug}`}}}
export default async function Song({params}:Props){const {slug}=await params;const rows=(await entries()).filter(r=>r.songSlug===slug);if(!rows.length)notFound();return <><SiteHeader/><main className="catalog-page"><p className="eyebrow">{rows[0].artist}</p><h1>{rows[0].song}</h1><p>{rows.length} published appearance{rows.length===1?"":"s"} in the archive. Each appearance keeps its own evidence and broadcast context.</p><a href={`https://open.spotify.com/search/${encodeURIComponent(rows[0].artist+" "+rows[0].song)}`} target="_blank" rel="noreferrer">Find the song on Spotify ↗</a><Appearances rows={rows}/></main></>}
