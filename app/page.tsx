import Home from "./home";
import {entries} from "../lib/catalog";
export const dynamic="force-dynamic";
export default async function Page(){try{return <Home initialRows={await entries()}/>}catch{return <Home initialRows={[]} initialError="The archive is temporarily unavailable."/>}}
