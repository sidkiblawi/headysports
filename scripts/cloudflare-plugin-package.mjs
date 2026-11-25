// Package an existing Cloudflare build for upload through the connected API plugin.
// Never includes database exports, runtime secrets, or source-control metadata.
import {readFileSync,readdirSync,statSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {hash}=require('blake3-wasm');
const config=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
const mime={'.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.ico':'image/x-icon','.txt':'text/plain','.html':'text/html','.xml':'application/xml','.webp':'image/webp','.woff2':'font/woff2'};
function files(dir){return readdirSync(dir).flatMap(n=>{const p=path.join(dir,n);return statSync(p).isDirectory()?files(p):[p]})}
const assets={};const manifest={};
for(const f of files('dist/client')){
 const relative=path.relative('dist/client',f).split(path.sep).join('/');
 if(relative.split('/').some(p=>p.startsWith('.'))||['_headers','_redirects'].includes(relative))continue;
 const content=readFileSync(f);const encoded=content.toString('base64');
 const key=hash(encoded+path.extname(f).slice(1)).toString('hex').slice(0,32);
 manifest['/'+relative]={hash:key,size:content.length};assets[key]={content:encoded,type:mime[path.extname(f)]||'application/octet-stream'};
}
const modules=files('dist/server').filter(f=>f.endsWith('.js')||f.endsWith('.mjs')).map(f=>({name:path.relative('dist/server',f).split(path.sep).join('/'),content:readFileSync(f,'utf8')}));
const bindings=[...Object.entries(config.vars||{}).map(([name,text])=>({name,type:'plain_text',text})),...config.d1_databases.map(d=>({type:'d1',name:d.binding,id:d.database_id})),...config.r2_buckets.map(b=>({type:'r2_bucket',name:b.binding,bucket_name:b.bucket_name})),{name:'ASSETS',type:'assets'}];
const payload={manifest,assets,modules,metadata:{assets:{config:{run_worker_first:false}},main_module:'index.js',compatibility_date:config.compatibility_date,compatibility_flags:config.compatibility_flags,bindings}};
writeFileSync('.cloudflare/plugin-package.json',JSON.stringify(payload));console.log(JSON.stringify({modules:modules.length,assets:Object.keys(manifest).length,bytes:statSync('.cloudflare/plugin-package.json').size}));
