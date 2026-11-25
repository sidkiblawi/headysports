import {readFileSync,existsSync,mkdirSync,copyFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const command=process.argv[2];
if(command==='init'){mkdirSync('.cloudflare',{recursive:true});if(!existsSync('.cloudflare/config.json'))copyFileSync('cloudflare/config.example.json','.cloudflare/config.json');console.log('Prepared .cloudflare/config.json. Fill in D1 and Cloudflare Access IDs before deploying.');process.exit(0)}
if(!['build','deploy','dry-run'].includes(command))throw Error('Use init, build, dry-run, or deploy');
const config=JSON.parse(readFileSync('.cloudflare/config.json','utf8'));
if(command==='deploy'){
 if(config.account_id!=='9ab190a0293698f9d4fc3f6d8375200f')throw Error('Wrong Cloudflare account');
 if(config.vars?.AUTH_PROVIDER!=='cloudflare-access'||!config.vars?.CF_ACCESS_AUD||JSON.stringify(config).includes('REPLACE')||config.d1_databases?.some(d=>d.database_id.startsWith('00000000')))throw Error('Complete the D1 and Access configuration before deploying');
}
const built=spawnSync('npm',['run','build'],{stdio:'inherit',env:{...process.env,HEADY_CLOUDFLARE:'1'}});if(built.status!==0)process.exit(built.status||1);
if(command==='build')process.exit(0);
const args=['node_modules/wrangler/bin/wrangler.js','deploy','--config','dist/server/wrangler.json',...(command==='dry-run'?['--dry-run','--outdir','.cloudflare/dry-run']:[])];
const result=spawnSync(process.execPath,args,{stdio:'inherit',env:process.env});process.exit(result.status||0);
