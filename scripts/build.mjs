import { readFile, writeFile, readdir, mkdir, cp, rename, rm, lstat } from 'node:fs/promises';
import { resolve, join, dirname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSidebar, renderFooter } from '../src/partials/shared.mjs';
import { pages } from './pages.mjs';

export const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
// OneDrive and Windows scanners can briefly retain directory handles after copy.
async function move(from, to) {
  for (let attempt = 0; ; attempt++) {
    try { return await rename(from, to); }
    catch (error) {
      if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || attempt === 7) throw error;
      await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
}
export const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fail = (field, message) => { throw new Error(`${field}: ${message}`); };
function object(value, field) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(field, 'oggetto mancante o malformato'); }
function text(value, field, max, required = true) {
  if (typeof value !== 'string' || (required && !value.trim()) || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(value)) fail(field, `testo ${required ? 'obbligatorio, ' : ''}massimo ${max} caratteri`);
}
function money(value, field) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 99999 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) fail(field, 'importo numerico tra 0 e 99999, massimo due decimali');
}
export function httpURL(value, field) {
  text(value, field, 500);
  let url; try { url = new URL(value); } catch { fail(field, 'URL non valido'); }
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || /[\s<>"']/u.test(value)) fail(field, 'usa un URL http/https completo, senza credenziali');
  return url;
}
export const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayLabels = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const numeric = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2, useGrouping: 'always' });
const timeLabel = value => value.replace(/^0/, '');
async function json(file) {
  try { return JSON.parse(await readFile(file, 'utf8')); }
  catch (error) { fail(relative(root, file), `JSON mancante o non valido (${error.message})`); }
}
function validate(data) {
  const c = data.contacts;
  object(c, 'recapiti');
  for (const [field, max] of Object.entries({telefono:20,telefonoVisualizzato:30,email:254,indirizzo:100,cap:10,citta:60,quartiere:60,paese:2})) text(c[field], `recapiti.${field}`, max);
  if (!/^\+[1-9]\d{6,14}$/.test(c.telefono)) fail('recapiti.telefono', 'formato internazionale, es. +393487517656');
  if (!/^\d[\d ()-]*$/.test(c.telefonoVisualizzato)) fail('recapiti.telefonoVisualizzato', 'usa solo cifre, spazi, parentesi e trattini');
  if (!/^[A-Za-z0-9.!#$%&*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,}$/.test(c.email)) fail('recapiti.email', 'indirizzo email non valido');
  if (!/^\d{5}$/.test(c.cap) || !/^[A-Z]{2}$/.test(c.paese)) fail('recapiti', 'CAP di cinque cifre e paese ISO di due lettere maiuscole');
  for (const field of ['logfit','instagram','facebook']) httpURL(c[field], `recapiti.${field}`);
  object(data.hours, 'orari');
  if (!Array.isArray(data.hours.fasce) || !data.hours.fasce.length || data.hours.fasce.length > 14) fail('orari.fasce', 'inserisci da 1 a 14 fasce di apertura');
  const slots = [];
  for (const [i, range] of data.hours.fasce.entries()) {
    const field = `orari.fasce[${i+1}]`; object(range, field);
    if (!Array.isArray(range.giorni) || !range.giorni.length || range.giorni.length > 7 || new Set(range.giorni).size !== range.giorni.length || range.giorni.some(d => !days.includes(d))) fail(`${field}.giorni`, 'seleziona giorni validi senza duplicati');
    for (const key of ['apertura','chiusura']) if (typeof range[key] !== 'string' || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(range[key])) fail(`${field}.${key}`, 'ora obbligatoria nel formato HH:mm');
    if (range.apertura >= range.chiusura) fail(field, 'la chiusura deve essere successiva all’apertura nello stesso giorno');
    for (const day of range.giorni) {
      if (slots.some(s => s.day === day && range.apertura < s.end && range.chiusura > s.start)) fail(field, `fasce sovrapposte per ${day}`);
      slots.push({day, start:range.apertura, end:range.chiusura});
    }
  }
  object(data.notice, 'avviso-home');
  if (typeof data.notice.attivo !== 'boolean') fail('avviso-home.attivo', 'valore booleano obbligatorio');
  text(data.notice.testo, 'avviso-home.testo', 140, data.notice.attivo);
  object(data.prices, 'prezzi');
  const groups = data.prices.gruppi;
  if (!Array.isArray(groups) || groups.length !== 2 || new Set(groups.map(g=>g.tipo)).size !== 2) fail('prezzi.gruppi', 'mantieni i due gruppi: gruppo e individuale');
  for (const [i,g] of groups.entries()) {
    const field = `prezzi.gruppi[${i+1}]`; object(g, field);
    if (!['gruppo','individuale'].includes(g.tipo)) fail(`${field}.tipo`, 'gruppo o individuale');
    for (const [key,max] of Object.entries({etichetta:50,titolo:100,titoloTabella:80,note:200,noteTabella:100})) text(g[key], `${field}.${key}`, max);
    if (!Array.isArray(g.voci) || g.voci.length < 1 || g.voci.length > 3) fail(`${field}.voci`, 'inserisci da 1 a 3 formule per mantenere il layout');
    for (const [j,v] of g.voci.entries()) { object(v, field); text(v.voce, `${field}.voci[${j+1}].voce`, 30); money(v.prezzo, `${field}.voci[${j+1}].prezzo`); if(v.note != null) text(v.note, `${field}.voci[${j+1}].note`, 100, false); }
    if (new Set(g.voci.map(v=>v.voce)).size !== g.voci.length) fail(field, 'le voci devono essere diverse');
  }
  if (new Set(groups.flatMap(g=>g.voci.map(v=>v.voce))).size > 3) fail('prezzi.voci', 'massimo tre formule diverse tra i due gruppi, per la tabella Orari');
  money(data.prices.quotaAnnuale, 'prezzi.quotaAnnuale');
  if (data.events.length > 100) fail('eventi', 'massimo 100 novità');
  for (const event of data.events) {
    object(event, event.file);
    text(event.titolo, `${event.file}.titolo`, 100); text(event.testo, `${event.file}.testo`, 600);
    if (typeof event.visibile !== 'boolean') fail(`${event.file}.visibile`, 'valore booleano obbligatorio');
    if (typeof event.data !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(event.data) || !Number.isFinite(Date.parse(event.data)) || new Date(event.data).toISOString().slice(0,10) !== event.data) fail(`${event.file}.data`, 'data valida nel formato YYYY-MM-DD');
    if (event.foto) {
      if (typeof event.foto !== 'string' || !/^\/uploads\/[a-zA-Z0-9_-]+\.(jpg|jpeg|webp)$/i.test(event.foto)) fail(`${event.file}.foto`, 'scegli un JPG/WebP nella cartella uploads, con nome semplice');
      text(event.fotoAlt, `${event.file}.fotoAlt`, 160);
    } else if (event.fotoAlt != null) text(event.fotoAlt, `${event.file}.fotoAlt`, 160, false);
  }
}
// Read dimensions without installing a decoder; uploads must be static JPG/WebP.
export function imageDimensions(buffer, extension, field) {
  if (['.jpg','.jpeg'].includes(extension) && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer.at(-2) === 0xff && buffer.at(-1) === 0xd9) {
    let offset = 2;
    while (offset + 4 <= buffer.length) {
      if (buffer[offset++] !== 0xff) break;
      while (buffer[offset] === 0xff) offset++;
      const marker = buffer[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
      const length = buffer.readUInt16BE(offset);
      if (length < 2 || offset + length > buffer.length) break;
      if ([0xc0,0xc1,0xc2].includes(marker) && length >= 8) return [buffer.readUInt16BE(offset+5),buffer.readUInt16BE(offset+3)];
      offset += length;
    }
  }
  if (extension === '.webp' && buffer.length >= 30 && buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP' && buffer.readUInt32LE(4)+8 === buffer.length) {
    const kind=buffer.toString('ascii',12,16);
    if (kind==='VP8X' && !(buffer[20]&2)) return [1+buffer.readUIntLE(24,3),1+buffer.readUIntLE(27,3)];
    if (kind==='VP8 ' && buffer[23]===0x9d && buffer[24]===1 && buffer[25]===0x2a) return [buffer.readUInt16LE(26)&0x3fff,buffer.readUInt16LE(28)&0x3fff];
    if (kind==='VP8L' && buffer[20]===0x2f) return [1+(((buffer[22]&0x3f)<<8)|buffer[21]),1+(((buffer[24]&0xf)<<10)|(buffer[23]<<2)|(buffer[22]>>6))];
  }
  fail(field, 'immagine malformata o formato diverso da JPG/WebP statico');
}
async function uploads(contentDir, events) {
  const directory = join(contentDir,'uploads');
  const files = await readdir(directory, {withFileTypes:true});
  for (const file of files) {
    if (file.name === '.gitkeep') continue;
    const field=`content/uploads/${file.name}`;
    if (!file.isFile() || !/^[a-zA-Z0-9_-]+\.(jpg|jpeg|webp)$/i.test(file.name)) fail(field, 'solo file JPG/WebP con nome semplice');
    const bytes = await readFile(join(directory,file.name));
    if (bytes.length > 600000) fail(field, 'immagine troppo pesante: massimo 600 KB (600000 byte)');
    const extension = '.'+file.name.split('.').at(-1).toLowerCase();
    const [width,height] = imageDimensions(bytes,extension,field);
    if (!width || !height || width>1600 || height>1000) fail(field, 'dimensioni massime 1600 × 1000 pixel');
  }
  for (const event of events) if(event.foto && !files.some(f=>'/uploads/'+f.name===event.foto)) fail(`${event.file}.foto`, 'immagine non trovata');
}
function tokens(template, values) {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (_,name) => {
    if (!Object.hasOwn(values,name)) fail('template', `segnaposto sconosciuto: ${name}`);
    return values[name];
  });
}
function contactTokens(c) {
  const destination = `${c.indirizzo}, ${c.cap} ${c.citta}`;
  const query = value => new URLSearchParams({query:value}).toString().slice(6);
  return Object.fromEntries(Object.entries({email:c.email,phone:c.telefono,phone_display:c.telefonoVisualizzato,phone_international:c.telefono.startsWith('+39') ? '+39 '+c.telefonoVisualizzato : c.telefono,whatsapp_number:c.telefono.slice(1),logfit:c.logfit,instagram:c.instagram,facebook:c.facebook,street:c.indirizzo,street_lower:c.indirizzo.toLocaleLowerCase('it-IT'),postcode:c.cap,city:c.citta,district:c.quartiere,destination,destination_encoded:encodeURIComponent(destination),destination_query:query(destination),destination_query_legacy:query(c.indirizzo)+',+'+query(`${c.cap} ${c.citta}`),studio_query:query('Studio Bhumi, '+destination),directions:'https://www.google.com/maps/dir/?api=1&destination='+query(destination)}).map(([key,value])=>[key,escapeHTML(value)]));
}
async function render(data, sourceDir, siteURL) {
  const values=contactTokens(data.contacts);
  const partial=async name=>readFile(join(sourceDir,'partials',name),'utf8');
  const groups = ['gruppo','individuale'].map(type=>data.prices.gruppi.find(g=>g.tipo===type));
  const title=value=>escapeHTML(value).replaceAll('\n','<br/>').replaceAll('®','<sup>®</sup>');
  const cards=[];
  for(const group of groups) {
    const options=group.voci.map((v,i)=>`<div${group.tipo==='gruppo' && i===2?' class="price-option-featured"':''}><span>${escapeHTML(v.voce)}</span><strong>${numeric.format(v.prezzo)} <small>€</small></strong>${v.note?`<small>${escapeHTML(v.note)}</small>`:''}</div>`).join('');
    cards.push(tokens(await partial(`price-${group.tipo}.html`), {...values,group_label:escapeHTML(group.etichetta),group_title:title(group.titolo),group_note:escapeHTML(group.note),price_options:options}));
  }
  const formulas=[...new Set(groups.flatMap(g=>g.voci.map(v=>v.voce)))];
  while(formulas.length<3)formulas.push('');
  const priceTable=`<div class="price-table price-table--head"><span></span>${formulas.map(f=>`<span>${escapeHTML(f)}</span>`).join('')}</div>`+groups.map(g=>`<div class="price-table"><span>${escapeHTML(g.titoloTabella)}<small>${escapeHTML(g.noteTabella)}</small></span>${formulas.map(f=>{const v=g.voci.find(v=>v.voce===f);return `<strong data-label="${escapeHTML(f)}">${v?numeric.format(v.prezzo)+'€':'—'}</strong>`;}).join('')}</div>`).join('')+`<div class="price-table"><span>Quota associativa annuale</span><strong data-label="Annuale">${numeric.format(data.prices.quotaAnnuale)}€</strong><strong></strong><strong></strong></div>`;
  const opening=data.hours.fasce.map(r=>{
    const sorted=[...r.giorni].sort((a,b)=>days.indexOf(a)-days.indexOf(b));
    const indexes=sorted.map(d=>days.indexOf(d));
    const contiguous=indexes.every((n,i)=>!i || n===indexes[i-1]+1);
    const label=sorted.length>1&&contiguous?`${dayLabels[indexes[0]]} — ${dayLabels[indexes.at(-1)]}`:indexes.map(i=>dayLabels[i]).join(', ');
    return `<div class="schedule-row"><span>${label}</span><strong>${timeLabel(r.apertura)} — ${timeLabel(r.chiusura)}</strong></div>`;
  }).join('');
  const visible=data.events.filter(e=>e.visibile).sort((a,b)=>b.data.localeCompare(a.data)||a.file.localeCompare(b.file));
  const events=visible.length?`<section class="content-grid">${visible.map(e=>`<article class="content-card reveal"><div class="content-card__number card-number"><time datetime="${e.data}">${new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(e.data))}</time></div><h3>${escapeHTML(e.titolo)}</h3><p>${escapeHTML(e.testo)}</p>${e.foto?`<img src="${escapeHTML(e.foto)}" alt="${escapeHTML(e.fotoAlt)}" width="1600" height="1000" loading="lazy" style="max-width:100%;height:auto"/>`:''}</article>`).join('')}</section>`:tokens(await partial('events-empty.html'),values);
  const output=new Map();
  for(const page of pages) {
    let html=await readFile(join(sourceDir,'pages',page.file),'utf8');
    const current=html.match(/<body[^>]*data-page="([^"]+)"/)?.[1] || 'home';
    html=tokens(html,{...values,sidebar:tokens(renderSidebar(current),values),footer:tokens(renderFooter(),values),price_cards:cards.join('\n      '),annual_fee:numeric.format(data.prices.quotaAnnuale),price_table:priceTable,opening_rows:opening,home_notice:data.notice.attivo?escapeHTML(data.notice.testo):'YOGA E MOVIMENTO · MILANO ISOLA',events});
    if(html.includes('assets/editoriale.js')) {
      html=html.replace(/(<div class="site-menu"[^>]*>)([\s\S]*?)(<\/div><\/nav>)/,(_,start,body,end)=>{
        body=body.replace(/<a\b[^>]*href="([^"]+)"[^>]*>/g,(tag,href)=>href===page.file&&!tag.includes('aria-current')?tag.slice(0,-1)+' aria-current="page">':tag);
        return start+tokens(data.partials.menuHead,values)+body+tokens(data.partials.menuSocial,values)+end;
      });
      html=html.replace(/<div data-social-links><\/div>/g,tokens(data.partials.social,values));
      if(current!=='contact')html=html.replace('</body>',tokens(data.partials.whatsapp,values)+'</body>');
    }
    if(page.file==='index.html') {
      const c=data.contacts;
      const structured={'@context':'https://schema.org','@type':'ExerciseGym','@id':siteURL+'/#studio',name:'Studio Bhumi',url:siteURL+'/',telephone:c.telefono,email:c.email,address:{'@type':'PostalAddress',streetAddress:c.indirizzo,postalCode:c.cap,addressLocality:c.citta,addressCountry:c.paese},sameAs:[c.instagram,c.facebook],openingHoursSpecification:data.hours.fasce.map(r=>({'@type':'OpeningHoursSpecification',dayOfWeek:r.giorni.map(d=>'https://schema.org/'+d),opens:r.apertura,closes:r.chiusura}))};
      const safeJSON=JSON.stringify(structured).replace(/[<>&\u2028\u2029]/g,c=>'\\u'+c.charCodeAt(0).toString(16).padStart(4,'0'));
      html=html.replace('</head>',`<script type="application/ld+json">${safeJSON}</script></head>`);
    }
    output.set(page.file,html);
  }
  return output;
}
export async function build({contentDir=join(root,'content'),sourceDir=join(root,'src'),outDir=join(root,'dist'),siteURL=process.env.SITE_URL||process.env.CF_PAGES_URL||'http://localhost:3000'}={}) {
  const url=httpURL(siteURL,'SITE_URL');
  if(url.pathname!=='/'||url.search||url.hash)fail('SITE_URL','usa soltanto l’origine, es. https://www.example.it');
  siteURL=url.origin;
  const data={contacts:await json(join(contentDir,'recapiti.json')),hours:await json(join(contentDir,'orari.json')),prices:await json(join(contentDir,'prezzi.json')),notice:await json(join(contentDir,'avviso-home.json')),events:[],partials:{}};
  const eventFiles=await readdir(join(contentDir,'eventi'),{withFileTypes:true});
  for(const file of eventFiles) {
    if(file.name==='.gitkeep')continue;
    if(!file.isFile()||!file.name.endsWith('.json'))fail('content/eventi/'+file.name,'sono ammessi solo file JSON');
    data.events.push({...await json(join(contentDir,'eventi',file.name)),file:'content/eventi/'+file.name});
  }
  validate(data);
  await uploads(contentDir,data.events);
  for(const [key,file]of Object.entries({menuHead:'menu-head.html',menuSocial:'menu-social.html',social:'social-icons.html',whatsapp:'whatsapp.html'}))data.partials[key]=await readFile(join(sourceDir,'partials',file),'utf8');
  const html=await render(data,sourceDir,siteURL);
  // Validate and render before touching the previously successful output.
  outDir=resolve(outDir);
  if(outDir===root || !outDir.startsWith(root+sep) && !outDir.startsWith(resolve(process.env.TEMP||'/tmp')+sep)) fail('output','la cartella deve trovarsi nel progetto o nella cartella temporanea');
  try {if((await lstat(outDir)).isSymbolicLink())fail('output','non può essere un collegamento simbolico');}catch(error){if(error.code!=='ENOENT')throw error;}
  await mkdir(dirname(outDir),{recursive:true});
  const stage=join(dirname(outDir),`.build-stage-${process.pid}-${Date.now()}`);
  const backup=join(dirname(outDir),`.build-backup-${process.pid}-${Date.now()}`);
  let previous=false;
  try {
    await mkdir(stage); await cp(join(sourceDir,'assets'),join(stage,'assets'),{recursive:true});
    await cp(join(contentDir,'uploads'),join(stage,'uploads'),{recursive:true,filter:file=>!file.endsWith('.gitkeep')});
    for(const [file,value]of html)await writeFile(join(stage,file),value);
    try {await cp(join(sourceDir,'static'),stage,{recursive:true});}catch(error){if(error.code!=='ENOENT')throw error;}
    try {await move(outDir,backup);previous=true;}catch(error){if(error.code!=='ENOENT')throw error;}
    try {await move(stage,outDir);}catch(error){if(previous)await move(backup,outDir);throw error;}
    if(previous)await rm(backup,{recursive:true,force:true});
  } finally {await rm(stage,{recursive:true,force:true});}
  return {pages:html.size,siteURL};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const result=await build();console.log(`Build completato: ${result.pages} file HTML in dist/ · ${result.siteURL}`);}
  catch(error){console.error(`Build annullato — ${error.message}`);process.exitCode=1;}
}
