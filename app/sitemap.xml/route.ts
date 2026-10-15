import {entries} from "../../lib/catalog";
export const dynamic="force-dynamic";
export async function GET(){const rows=await entries();const paths=new Set(["/","/songs","/games",...rows.flatMap(r=>[`/songs/${r.songSlug}`,`/games/${r.eventSlug}`,`/sightings/${r.id}`])]);const xml='<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+[...paths].map(p=>`<url><loc>https://www.headysports.com${p}</loc></url>`).join("")+"</urlset>";return new Response(xml,{headers:{"Content-Type":"application/xml","Cache-Control":"public, max-age=300"}})}
