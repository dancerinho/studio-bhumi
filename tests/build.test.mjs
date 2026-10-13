import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, cp, readFile, writeFile, rm, mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { build, root } from '../scripts/build.mjs';
import { pages } from '../scripts/pages.mjs';

async function fixture(run) {
  const directory=await mkdtemp(join(tmpdir(),'bhumi-cms-test-'));
  const contentDir=join(directory,'content'), outDir=join(directory,'site');
  await cp(join(root,'content'),contentDir,{recursive:true});
  await mkdir(outDir); await writeFile(join(outDir,'index.html'),'PREVIOUS SUCCESSFUL BUILD');
  const options={contentDir,outDir,siteURL:'https://bhumi.example'};
  const update=async(file,mutate)=>{const path=join(contentDir,file);const value=JSON.parse(await readFile(path,'utf8'));mutate(value);await writeFile(path,JSON.stringify(value));};
  try{await run({options,update,contentDir,outDir});}finally{await rm(directory,{recursive:true,force:true,maxRetries:5,retryDelay:100});}
}
async function rejected(options,regex){await assert.rejects(build(options),regex);assert.equal(await readFile(join(options.outDir,'index.html'),'utf8'),'PREVIOUS SUCCESSFUL BUILD');}

test('empty/missing/malformed data fails before replacing a successful site',async()=>{
  await fixture(async({options,update,contentDir})=>{
    await update('recapiti.json',v=>v.email='');await rejected(options,/recapiti.email.*obbligatorio/);
    await cp(join(root,'content/recapiti.json'),join(contentDir,'recapiti.json'));
    await update('orari.json',v=>v.fasce=[]);await rejected(options,/orari.fasce/);
    await writeFile(join(contentDir,'orari.json'),'{ broken JSON');await rejected(options,/JSON mancante o non valido/);
    await rm(join(contentDir,'orari.json'));await rejected(options,/orari.json.*JSON mancante/);
  });
});
test('unsupported URL protocols and embedded credentials are rejected',async()=>{
  await fixture(async({options,update})=>{
    for(const link of ['javascript:alert(1)','data:text/html,<script>alert(1)</script>','ftp://example.com','https://user:password@example.com','https://example.com/" onclick="alert(1)']){
      await update('recapiti.json',v=>v.logfit=link);await rejected(options,/recapiti.logfit/);
    }
  });
});
test('bad hours, overlapping slots, invalid dates and non-numeric prices fail clearly',async()=>{
  await fixture(async({options,update,contentDir})=>{
    await update('prezzi.json',v=>v.gruppi[0].voci[0].prezzo='140');await rejected(options,/prezzo.*numerico/);
    await cp(join(root,'content/prezzi.json'),join(contentDir,'prezzi.json'));
    await update('orari.json',v=>v.fasce[0].apertura='25:00');await rejected(options,/apertura.*HH:mm/);
    await cp(join(root,'content/orari.json'),join(contentDir,'orari.json'));
    await update('orari.json',v=>v.fasce.push({...v.fasce[0]}));await rejected(options,/sovrapposte/);
    await cp(join(root,'content/orari.json'),join(contentDir,'orari.json'));
    await writeFile(join(contentDir,'eventi/invalid.json'),JSON.stringify({titolo:'Titolo',testo:'Testo',data:'2026-02-30',visibile:false}));await rejected(options,/data valida/);
  });
});
test('oversized and disguised image uploads fail even before being referenced',async()=>{
  await fixture(async({options,contentDir})=>{
    const photo=join(contentDir,'uploads/too-heavy.jpg');await writeFile(photo,Buffer.alloc(600001));await rejected(options,/troppo pesante.*600 KB/);
    await rm(photo);await writeFile(join(contentDir,'uploads/fake.jpg'),'<svg onload="alert(1)"/>');await rejected(options,/malformata/);
  });
});
test('HTML injection is escaped in text, attributes and JSON-LD; invisible events stay absent',async()=>{
  await fixture(async({options,update,contentDir,outDir})=>{
    const payload='<img src=x onerror=alert(1)>';
    await update('avviso-home.json',v=>{v.attivo=true;v.testo=payload;});
    await update('prezzi.json',v=>v.gruppi[0].note=payload);
    await update('recapiti.json',v=>v.indirizzo='</script><script>alert(2)</script>');
    await writeFile(join(contentDir,'eventi/show.json'),JSON.stringify({titolo:payload,data:'2026-10-13',testo:'Testo <script>alert(3)</script> & "virgolette"',visibile:true}));
    await writeFile(join(contentDir,'eventi/hide.json'),JSON.stringify({titolo:'HIDDEN_EVENT',data:'2026-10-13',testo:'Riservato',visibile:false}));
    await build(options);
    const home=await readFile(join(outDir,'index.html'),'utf8');assert.ok(home.includes('&lt;img src=x onerror=alert(1)&gt;'));assert.ok(!home.includes(payload));
    const structured=JSON.parse(home.match(/<script type="application\/ld\+json">([^]*?)<\/script>/)[1]);assert.equal(structured.address.streetAddress,'</script><script>alert(2)</script>');assert.equal(structured.openingHoursSpecification[0].opens,'07:30');
    const events=await readFile(join(outDir,'eventi.html'),'utf8');assert.ok(events.includes('&lt;script&gt;alert(3)&lt;/script&gt;'));assert.ok(!events.includes('HIDDEN_EVENT'));assert.ok(!events.includes('onerror="'));
    const prices=await readFile(join(outDir,'prezzi.html'),'utf8');assert.ok(prices.includes('&lt;img src=x onerror=alert(1)&gt;'));
  });
});
test('valid edits propagate across prices, hours, menus, contacts and structured data without client fetch',async()=>{
  await fixture(async({options,update,outDir})=>{
    await update('prezzi.json',v=>v.gruppi[0].voci[0].prezzo=145.50);
    await update('orari.json',v=>v.fasce[0].apertura='08:00');
    await update('recapiti.json',v=>{v.email='prova@example.com';v.indirizzo='Via Nuova 18';v.citta='Monza';v.quartiere='Centro';v.logfit='https://example.com/prenota';});
    await build(options);
    const prices=await readFile(join(outDir,'prezzi.html'),'utf8');const hours=await readFile(join(outDir,'orari.html'),'utf8');
    assert.ok(prices.includes('145,5 <small>€'));assert.ok(hours.includes('145,5€'));assert.ok(hours.includes('8:00 — 21:00'));assert.ok(hours.includes('mailto:prova@example.com'));
    const contact=await readFile(join(outDir,'contatti.html'),'utf8');assert.ok(contact.includes('Via Nuova 18'));assert.ok(contact.includes('Monza'));assert.ok(contact.includes('https://example.com/prenota'));
    for(const file of pages){const html=await readFile(join(outDir,file.file),'utf8');assert.ok(!html.includes('{{email}}'));assert.ok(!/\bnoindex\b|name="robots"|http-equiv="X-Robots-Tag"/i.test(html));}
    const home=await readFile(join(outDir,'index.html'),'utf8');assert.ok(home.includes('"opens":"08:00"'));assert.ok(home.includes('"addressLocality":"Monza"'));
    const scripts=await readdir(join(root,'src/assets'));for(const file of scripts.filter(f=>f.endsWith('.js'))){const js=await readFile(join(root,'src/assets',file),'utf8');assert.ok(!/fetch\s*\(|XMLHttpRequest|sendBeacon|document\.cookie/.test(js),file);}
  });
});
test('CMS exposes only the five approved content areas and one upload directory',async()=>{
  const config=JSON.parse(await readFile(join(root,'.pages.yml'),'utf8'));
  assert.deepEqual(config.content.map(c=>c.name),['prezzi','orari','eventi','avviso','recapiti']);
  assert.equal(config.media.length,1);assert.equal(config.media[0].input,'content/uploads');assert.deepEqual(config.media[0].extensions,['jpg','jpeg','webp']);
  assert.ok(config.content.every(c=>c.path.startsWith('content/')));
  const fields=config.content.flatMap(c=>c.fields);assert.ok(!fields.some(f=>['rich-text','code'].includes(f.type)));
});
test('JPG photos render with escaped alternative text and actual dimensions; dimensions are limited',async()=>{
  await fixture(async({options,contentDir,outDir})=>{
    const bytes=await readFile(join(root,'src/assets/LogoBhumiDef.jpg'));
    await writeFile(join(contentDir,'uploads/example.jpg'),bytes);
    await writeFile(join(contentDir,'eventi/photo.json'),JSON.stringify({titolo:'Foto di prova',data:'2026-10-13',testo:'Testo di prova',visibile:true,foto:'/uploads/example.jpg',fotoAlt:'Foto "alternativa" <sicura>'}));
    await build(options);
    const html=await readFile(join(outDir,'eventi.html'),'utf8');assert.ok(html.includes('alt="Foto &quot;alternativa&quot; &lt;sicura&gt;"'));assert.ok(!html.includes('width="1600" height="1000"'));
    // Change the actual JPEG SOF dimensions to exercise the dimension guard.
    const changed=Buffer.from(bytes);let offset=2;
    while(offset+8<changed.length){if(changed[offset++]!==0xff)break;while(changed[offset]===0xff)offset++;const marker=changed[offset++];const length=changed.readUInt16BE(offset);if([0xc0,0xc1,0xc2].includes(marker)){changed.writeUInt16BE(1601,offset+5);break;}offset+=length;}
    await writeFile(join(contentDir,'uploads/example.jpg'),changed);await assert.rejects(build(options),/dimensioni massime/);
    assert.equal(await readFile(join(outDir,'eventi.html'),'utf8'),html);
  });
});
test('robots and sitemap contain the stable origin and exactly 16 public URLs, excluding Cookie',async()=>{
  await fixture(async({options,outDir})=>{
    await build(options);
    const robots=await readFile(join(outDir,'robots.txt'),'utf8');const sitemap=await readFile(join(outDir,'sitemap.xml'),'utf8');
    assert.equal(robots,'User-agent: *\nAllow: /\n\nSitemap: https://bhumi.example/sitemap.xml\n');
    assert.equal((sitemap.match(/<loc>/g)||[]).length,16);assert.ok(!sitemap.includes('/cookie'));assert.ok(sitemap.includes('<loc>https://bhumi.example/prezzi</loc>'));assert.ok(!sitemap.includes('localhost'));
  });
});
test('the CLI exits with code 1 on invalid configuration without changing the real output',async()=>{
  const {spawnSync}=await import('node:child_process');
  const previous=await readFile(join(root,'dist/index.html'),'utf8');
  const result=spawnSync(process.execPath,[join(root,'scripts/build.mjs')],{cwd:root,env:{...process.env,SITE_URL:'javascript:alert(1)'},encoding:'utf8'});
  assert.equal(result.status,1);assert.match(result.stderr,/Build annullato.*SITE_URL/);assert.equal(await readFile(join(root,'dist/index.html'),'utf8'),previous);
});
test('static lossy/lossless WebP uploads are accepted and animated WebP is rejected',async()=>{
  const samples=['UklGRkAAAABXRUJQVlA4IDQAAADQAgCdASoUAAoAPm0skkWkIqGYBABABsSgB2AAGCYAAP7Ogv/87WwxBUv//FtI6FJ4AAAA','UklGRh4AAABXRUJQVlA4TBEAAAAvE0ACAAdQy5IVuf+BiOh/AAA='];
  const {imageDimensions}=await import('../scripts/build.mjs');
  for(const sample of samples)assert.deepEqual(imageDimensions(Buffer.from(sample,'base64'),'.webp','sample'),[20,10]);
  await fixture(async({options,contentDir})=>{
    for(let i=0;i<samples.length;i++)await writeFile(join(contentDir,`uploads/static-${i}.webp`),Buffer.from(samples[i],'base64'));
    await build(options);
    await writeFile(join(contentDir,'uploads/animated.webp'),Buffer.from('UklGRswAAABXRUJQVlA4WAoAAAACAAAAEwAACQAAQU5JTQYAAAAAAAAAAABBTk1GTgAAAAAAAAAAABMAAAkAAGQAAAJWUDggNgAAANACAJ0BKhQACgA+bSySRaQioZgEAEAGxKAHYAASlcAA/tLtf/3BmfV1TP/9bbv5veB8eAAAAEFOTUZKAAAAAAAAAAAAEwAACQAAZAAAAFZQOCAyAAAAdAIAnQEqFAAKAD5tLJJFgwCAAADYlAF2AFtiAAD+pNBaiSpv/yU/+8r/XduG6fL0AAA=','base64'));await assert.rejects(build(options),/WebP statico/);
  });
});