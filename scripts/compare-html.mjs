import { readFile, writeFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pages } from './pages.mjs';
import { root } from './build.mjs';
const revision=process.argv[2] || '57ae921ad4a2b3755ce50f28dbc87d4754743a9d';
const temporary=await mkdtemp(join(tmpdir(),'bhumi-html-diff-'));
const normalize=s=>s.replace(/\r\n/g,'\n');
const pretty=s=>normalize(s).replace(/>\s*</g,'>\n<');
const summary={baselineRevision:revision,pages:[],styles:[],media:[],unchangedScripts:[]};let patch='';
try {
  for(const page of pages){
    const before=execFileSync('git',['show',revision+':dist/'+page.file],{cwd:root,encoding:'utf8'});
    const after=await readFile(join(root,'dist',page.file),'utf8');
    const oldFile=join(temporary,'before.html'),newFile=join(temporary,'after.html');
    await writeFile(oldFile,pretty(before));await writeFile(newFile,pretty(after));
    const result=spawnSync('git',['diff','--no-index','--',oldFile,newFile],{cwd:root,encoding:'utf8'});
    if(![0,1].includes(result.status))throw new Error(result.stderr);
    patch+=result.stdout.replace(/^diff --git .*$/m,`diff --git a/${page.file} b/${page.file}`).replace(/^index .*\n/m,'').replace(/^--- .*$/m,`--- prima/${page.file}`).replace(/^\+\+\+ .*$/m,`+++ dopo/${page.file}`);
    summary.pages.push({file:page.file,rawEquivalent:normalize(before)===normalize(after),addedLines:result.stdout.split('\n').filter(l=>l.startsWith('+')&&!l.startsWith('+++')).length,removedLines:result.stdout.split('\n').filter(l=>l.startsWith('-')&&!l.startsWith('---')).length});
  }
  const originalAssets=execFileSync('git',['ls-tree','--name-only',revision+':dist/assets'],{cwd:root,encoding:'utf8'}).trim().split('\n');
  const hash=b=>createHash('sha256').update(b).digest('hex');
  for(const file of originalAssets){
    const before=execFileSync('git',['show',revision+':dist/assets/'+file],{cwd:root,maxBuffer:256*1024*1024});const after=await readFile(join(root,'src/assets',file));
    if(file.endsWith('.css'))summary.styles.push({file,equivalent:normalize(before.toString())===normalize(after.toString())});
    else if(!file.endsWith('.js'))summary.media.push({file,identical:hash(before)===hash(after),sha256:hash(after)});
    else if(normalize(before.toString())===normalize(after.toString()))summary.unchangedScripts.push(file);
  }
  await writeFile(join(root,'docs/html-diff.patch'),patch);
  await writeFile(join(root,'docs/html-diff-summary.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({rawIdentical:summary.pages.filter(p=>p.rawEquivalent).map(p=>p.file),css:summary.styles,originalMedia:summary.media.length,mediaChanged:summary.media.filter(m=>!m.identical),unchangedScripts:summary.unchangedScripts,patch:'docs/html-diff.patch'},null,2));
} finally {await rm(temporary,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
