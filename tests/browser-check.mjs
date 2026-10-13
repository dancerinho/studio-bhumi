import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';
import { join, extname, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import assert from 'node:assert/strict';
import { build, root } from '../scripts/build.mjs';
import { pages } from '../scripts/pages.mjs';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseline=process.env.BASELINE_DIR || join(tmpdir(),'bhumi-cms-baseline-57ae921/dist');
const migration=process.env.MIGRATION_DIR || join(tmpdir(),'bhumi-cms-migration-build/dist');
const final=join(root,'dist');
const report={baselineRevision:'57ae921ad4a2b3755ce50f28dbc87d4754743a9d',dom:[],network:[],layout:[],interactions:[]};
const localFonts=await readFile(join(root,'src/assets/fonts.css'),'utf8');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.mp4':'video/mp4'};
async function server(directory) {
  const server=createServer(async(req,res)=>{
    let filename=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(filename==='/')filename='/index.html';
    try{const file=resolve(directory,'.'+filename);if(!file.startsWith(resolve(directory)))throw new Error();const content=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'text/plain'}).end(content);}catch{res.writeHead(404).end('Not found');}
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  return {server,url:`http://127.0.0.1:${server.address().port}`};
}
const servers=await Promise.all([server(baseline),server(migration),server(final)]);
const browser=await chromium.launch({headless:true,...(process.env.BROWSER_EXECUTABLE?{executablePath:process.env.BROWSER_EXECUTABLE}:{})});
try {
  const context=await browser.newContext({reducedMotion:'reduce',viewport:{width:1440,height:1000}});
  await context.route('https://fonts.googleapis.com/**',route=>route.fulfill({contentType:'text/css',body:localFonts.replaceAll('url(fonts/',`url(${servers[2].url}/assets/fonts/`)}));
  await context.route('https://www.google.com/maps**',route=>route.fulfill({contentType:'text/html',body:'<p>Mappa simulata per test</p>'}));
  const before=await context.newPage(), after=await context.newPage();
  async function canonical(page) {
    return page.evaluate(()=>{
      const skipAttributes=new Set(['style','data-motion-side','data-destination','data-address','data-directions']);
      const transient=new Set(['visible','is-visible','motion-enter']);
      const canonical=node=>{
        if(node.nodeType===Node.TEXT_NODE)return node.textContent.replace(/\s+/g,' ').trim();
        if(node.nodeType!==Node.ELEMENT_NODE || node.tagName==='SCRIPT')return '';
        const attributes=[...node.attributes].filter(a=>!skipAttributes.has(a.name)).map(a=>[a.name,a.name==='class'?a.value.split(/\s+/).filter(c=>!transient.has(c)).join(' '):a.value]).sort(([a],[b])=>a.localeCompare(b));
        return [node.tagName,attributes,[...node.childNodes].map(canonical).filter(v=>v!=='')];
      };
      return canonical(document.body);
    });
  }
  for(const page of pages.filter(p=>p.file!=='cookie.html')) {
    await Promise.all([before.goto(servers[0].url+'/'+page.file),after.goto(servers[1].url+'/'+page.file)]);
    await Promise.all([before.evaluate(()=>document.fonts.ready),after.evaluate(()=>document.fonts.ready)]);
    const a=await canonical(before),b=await canonical(after);
    const equal=JSON.stringify(a)===JSON.stringify(b);
    report.dom.push({page:page.file,equivalent:equal});
    if(!equal){await writeFile(join(tmpdir(),'bhumi-dom-'+page.file+'.json'),JSON.stringify({before:a,after:b},null,2));}
    const heads=await Promise.all([before,after].map(p=>p.evaluate(()=>[...document.head.querySelectorAll('meta,title')].map(n=>n.outerHTML))));assert.deepEqual(heads[0],heads[1],page.file+' metadata');
  }
  await writeFile(join(root,'docs/browser-verification.json'),JSON.stringify(report,null,2)+'\n');
  await context.close();
  const screenshots=join(tmpdir(),'bhumi-cms-browser-screenshots');await mkdir(screenshots,{recursive:true});
  const privacyContext=await browser.newContext({reducedMotion:'reduce'});
  const networkPage=await privacyContext.newPage();
  let external=[];let errors=[];
  networkPage.on('request',req=>{const url=new URL(req.url());if(['http:','https:'].includes(url.protocol)&&url.origin!==servers[2].url)external.push(req.url());});
  networkPage.on('pageerror',error=>errors.push(error.message));
  for(const width of [375,768,1440]) {
    await networkPage.setViewportSize({width,height:1000});
    for(const page of pages.filter(p=>p.file!=='cookie.html')) {
      external=[];errors=[];
      await networkPage.goto(servers[2].url+'/'+page.file);
      await networkPage.evaluate(()=>document.fonts.ready);
      await networkPage.waitForTimeout(60);
      report.network.push({page:page.file,width,externalRequests:external.length,errors});
      const dimensions=await networkPage.evaluate(()=>({width:innerWidth,documentWidth:document.documentElement.scrollWidth}));
      report.layout.push({page:page.file,width,overflow:dimensions.documentWidth>dimensions.width+1});
      assert.equal(external.length,0,'Unexpected external request: '+page.file);assert.deepEqual(errors,[],page.file);
      if(['prezzi.html','orari.html','contatti.html','dove-siamo.html'].includes(page.file))await networkPage.screenshot({path:join(screenshots,`${width}-${page.file}.png`),fullPage:true});
    }
  }
  await networkPage.setViewportSize({width:375,height:1000});
  await networkPage.goto(servers[2].url+'/contatti.html');
  const menu=networkPage.locator('.menu-toggle');await menu.click();assert.equal(await menu.getAttribute('aria-expanded'),'true');await networkPage.locator('.site-menu__close').click();assert.equal(await menu.getAttribute('aria-expanded'),'false');report.interactions.push('editorial mobile menu: open/close');
  await networkPage.goto(servers[2].url+'/orari.html');const oldMenu=networkPage.locator('.sidebar__toggle');await oldMenu.click();assert.equal(await oldMenu.getAttribute('aria-expanded'),'true');await networkPage.keyboard.press('Escape');assert.equal(await oldMenu.getAttribute('aria-expanded'),'false');report.interactions.push('shared menu: open/Escape');
  await networkPage.goto(servers[2].url+'/contatti.html');assert.equal(await networkPage.locator('iframe').getAttribute('src'),'about:blank');
  await networkPage.route('https://www.google.com/maps**',route=>route.fulfill({contentType:'text/html',body:'<p>Mappa simulata</p>'}));
  await networkPage.locator('[data-load-map]').click();assert.ok((await networkPage.locator('iframe').getAttribute('src')).startsWith('https://www.google.com/maps'));assert.equal(await networkPage.locator('[data-map-consent]').isVisible(),false);report.interactions.push('contact map: explicit load only');
  await networkPage.addInitScript(()=>{
    window.__geoCalls=[];
    Object.defineProperty(navigator,'geolocation',{value:{watchPosition(success){window.__geoCalls.push('watch');setTimeout(()=>success({coords:{latitude:45.5,longitude:9.2}}),0);return 123;},getCurrentPosition(success){window.__geoCalls.push('get');setTimeout(()=>success({coords:{latitude:45.5,longitude:9.2}}),0);},clearWatch(id){window.__geoCalls.push('clear:'+id);}}});
  });
  for(const file of ['contatti.html','dove-siamo.html']) {
    await networkPage.goto(servers[2].url+'/'+file);assert.deepEqual(await networkPage.evaluate(()=>window.__geoCalls),[]);await networkPage.locator('[data-route-button]').click();
    await networkPage.waitForFunction(()=>document.querySelector('iframe').src.includes('saddr='));assert.ok((await networkPage.locator('iframe').getAttribute('src')).includes('daddr=Via+Lario+17'));assert.equal(await networkPage.locator('[data-map-consent]').isVisible(),false);
    if(file==='contatti.html'){await networkPage.locator('[data-mode="d"]').click();assert.ok((await networkPage.locator('iframe').getAttribute('src')).includes('dirflg=d'));await networkPage.locator('[data-route-button]').click();assert.ok((await networkPage.locator('iframe').getAttribute('src')).includes('q=Via'));assert.ok((await networkPage.evaluate(()=>window.__geoCalls)).includes('clear:123'));}
    report.interactions.push(file+': geolocation only on click; map route shown');
  }
  await privacyContext.close();
  await writeFile(join(root,'docs/browser-verification.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({domEquivalent:report.dom.filter(x=>x.equivalent).length,domTotal:report.dom.length,domDifferences:report.dom.filter(x=>!x.equivalent),networkCases:report.network.length,externalRequests:report.network.reduce((n,r)=>n+r.externalRequests,0),overflows:report.layout.filter(x=>x.overflow),interactions:report.interactions,screenshots},null,2));
} finally {await browser.close();for(const item of servers)await new Promise(resolve=>item.server.close(resolve));}