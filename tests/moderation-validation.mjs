import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
// Load the actual parser with its archive dependency in Node.
const archive = ts.transpileModule(readFileSync('lib/archive.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const archiveURL = 'data:text/javascript;base64,' + Buffer.from(archive).toString('base64');
const validation = ts.transpileModule(readFileSync('lib/validation.ts','utf8'), {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace('"./archive"',JSON.stringify(archiveURL));
const {parseEntry,ValidationError} = await import('data:text/javascript;base64,' + Buffer.from(validation).toString('base64'));
const fan = parseEntry({song:'Free',artist:'Phish',game:'Brewers Dodgers Game 4',sport:'MLB',network:'FS1',date:'2026-10',notes:'End of 3rd inning',source:''});
assert.equal(fan.moderationStatus,'pending');
for (const moderationStatus of ['approved','rejected','pending']) {
 const result=parseEntry({...fan,moderationStatus},true);
 assert.equal(result.moderationStatus,moderationStatus);
 assert.equal(result.evidence,'fan');
 assert.deepEqual(result.sources,[]);
}
for(const key of ["song","artist","game","sport","network"]){
 for(const value of [undefined,"","   "]){assert.throws(()=>parseEntry({...fan,[key]:value}),ValidationError);}
}
const incomplete=parseEntry({...fan,song:"",artist:"",game:"",sport:"",network:""},true);
assert.equal(parseEntry({...incomplete,moderationStatus:'rejected'},true).moderationStatus,'rejected');
assert.throws(()=>parseEntry({...incomplete,moderationStatus:'approved'},true),ValidationError);
for(const evidence of ['clip','reporting']) {
 assert.throws(()=>parseEntry({...fan,evidence,moderationStatus:'approved'},true),ValidationError);
 assert.equal(parseEntry({...fan,evidence,moderationStatus:'approved',sources:[{label:'Evidence',url:'https://example.com',kind:evidence}]},true).evidence,evidence);
}
assert.throws(()=>parseEntry({...fan,moderationStatus:'approved',sources:[{label:'Bad',url:'javascript:alert(1)',kind:'fan'}]},true),ValidationError);
console.log('PASS: source-free fan moderation, incomplete rejection, publication requirements, evidence labels and safe URLs');
