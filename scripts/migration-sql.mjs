import {readFileSync,readdirSync,writeFileSync} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {createHash} from 'node:crypto';
const input=process.argv[2]||'.migration-private/database.json';
const output=process.argv[3]||'.migration-private/database.sql';
const data=JSON.parse(readFileSync(input,'utf8'));
if(data.format!=='headysports-database-migration'||data.version!==1)throw Error('Unsupported migration snapshot');
const order=['archive_settings','songs','events','sightings','sources','community_votes'];
if(Object.keys(data.tables).sort().join(',')!==[...order].sort().join(','))throw Error('Incomplete table export');
const schema=readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort().map(f=>readFileSync('drizzle/'+f,'utf8')).join('\n');
const check=new DatabaseSync(':memory:');check.exec('PRAGMA foreign_keys=ON;');check.exec(schema);
const literal=v=>v===null?'NULL':typeof v==='number'&&Number.isFinite(v)?String(v):typeof v==='string'?`CAST(X'${Buffer.from(v,'utf8').toString('hex')}' AS TEXT)`:(()=>{throw Error('Unsupported cell type')})();
const statements=[];
for(const table of order){
 const expected=check.prepare(`PRAGMA table_info("${table}")`).all().map(c=>c.name);
 if(!Array.isArray(data.tables[table]))throw Error('Missing table '+table);
 for(const row of data.tables[table]){
  const columns=Object.keys(row);if(columns.length!==expected.length||columns.some(c=>!expected.includes(c)))throw Error('Incomplete or unknown columns in '+table);
  statements.push(`INSERT INTO "${table}" (${columns.map(c=>`"${c}"`).join(',')}) VALUES (${columns.map(c=>literal(row[c])).join(',')});`);
 }
}
check.exec('BEGIN;\n'+statements.join('\n')+'\nCOMMIT;');
if(check.prepare('PRAGMA foreign_key_check').all().length)throw Error('Snapshot has broken references');
const counts=Object.fromEntries(order.map(t=>[t,check.prepare(`SELECT COUNT(*) AS n FROM "${t}"`).get().n]));
for(const table of order)if(counts[table]!==data.tables[table].length)throw Error('Row count mismatch');
const sql='-- Import into a NEW EMPTY D1 database only. Never run against the Sites database.\n'+schema+'\n'+statements.join('\n')+'\n';
writeFileSync(output,sql,{mode:0o600});
writeFileSync(output+'.manifest.json',JSON.stringify({exportedAt:data.exportedAt,counts,sha256:createHash('sha256').update(sql).digest('hex'),foreignKeys:'verified'},null,2),{mode:0o600});
console.log(JSON.stringify({output,counts,foreignKeys:'verified'}));
