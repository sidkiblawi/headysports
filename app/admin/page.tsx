import { isModerator } from "../../lib/moderation";
import { requireChatGPTUser } from "../chatgpt-auth";
import Queue from "./queue";
export const dynamic="force-dynamic";
export default async function Admin(){await requireChatGPTUser("/admin");if(!await isModerator())return <main className="admin"><h1>Moderator access required</h1><p>This review queue is restricted to the site owner.</p><a href="/">Back to HeadySports</a></main>;return <Queue/>;}
