# Verifica della migrazione Pages CMS — 13 ottobre 2026

Lavoro esclusivamente locale sul branch `codex/pages-cms`. Baseline: commit `57ae921ad4a2b3755ce50f28dbc87d4754743a9d` del repository. `main` resta sullo stesso commit. Non sono stati eseguiti push, deploy o modifiche alla configurazione del vecchio Cloudflare/Sites. I tre file non versionati alla radice (`index.html`, `script.js`, `styles.css`) sono rimasti esclusi; `.openai/hosting.json` è invariato.

## HTML prima e dopo

Il [diff completo](html-diff.patch) confronta l’HTML originale nel repository con quello generato finale, separando i tag su righe per renderlo leggibile. Non confronta la vecchia anteprima Cloudflare offuscata. I [conteggi per pagina e gli hash dei media](html-diff-summary.json) sono disponibili separatamente.

**Equivalenza della migrazione CMS: 16 pagine su 16.** Il confronto nel browser esegue gli script originali della baseline, poi confronta il DOM risultante con un build della migrazione prima del cambiamento a font e mappe. Verifica struttura, testo e attributi, ignorando solo spazi di formattazione, script e attributi/stati dinamici di animazione, style runtime e i nuovi attributi tecnici della destinazione Maps. Titoli e meta tag sono confrontati separatamente e restano identici. I dati iniziali sono gli stessi; avviso disattivo ed eventi vuoti conservano i testi presenti.

| Pagine | Risultato della migrazione CMS |
| --- | --- |
| Home, Chi siamo, Fondatrici, Insegnanti, Lo studio | DOM equivalente |
| Discipline, Le pratiche, Yoga, Pilates, Gyrotonic | DOM equivalente |
| Orari, Prezzi, Eventi, Contatti, Dove siamo, Privacy | DOM equivalente |
| `cookie.html` | HTML originale conservato, incluso redirect a `privacy.html#cookie` |

L’HTML grezzo delle 16 pagine principali non è identico byte per byte: ora contiene anche i componenti che prima venivano creati dal browser. Le differenze finali previste sono:

- Menu e footer delle nove pagine storiche già nell’HTML; testate dei menu, social e pulsanti WhatsApp delle sette pagine editoriali già nel documento. Gli script gestiscono interazioni, senza reinserire i contenuti.
- Prezzi e fasce resi dal build negli stessi componenti. Importi **140, 270, 1.270, 320, 600 e 30** confermati nel confronto con la baseline; nessun importo è stato cambiato.
- Un solo nuovo script JSON-LD dello studio nella home, con indirizzo/recapiti e `openingHoursSpecification`; nessun Event automatico.
- In tutte le pagine pertinenti, i link/preconnect Google Fonts sono sostituiti da `assets/fonts.css`. I file WOFF2 provengono dalla stessa risposta Google Fonts dell’HTML originale e includono le licenze.
- Solo nelle due pagine con Maps: `src="about:blank"`, URL reale in `data-src`, pulsante “Carica la mappa”, breve nota informativa e link Maps nel riquadro esistente. Il viewport della scheda Contatti diventa un contenitore per evitare un pulsante annidato in un link. Dimensioni e stili originali del riquadro sono conservati.
- Aggiunti `robots.txt` e `sitemap.xml`, generati dal manifesto delle pagine. Nessun `_redirects`, meta robots, `noindex` o intestazione robots è stato introdotto dal build.

**Tutti gli otto CSS originali sono equivalenti**, normalizzando esclusivamente i fine riga CRLF/LF. Le **36 risorse originali** (fotografie, logo, SVG e video) sono identiche secondo SHA-256. `home-experience.js` e `percorso-personalizzato.js` sono invariati a parte gli eventuali fine riga. Il lavoro non ridisegna il sito.

## Browser, rete e interazioni

Chrome già installato, sessione isolata senza finestre, viewport **375, 768 e 1440 px**, altezza 1000 px: tutte le 16 pagine a ciascuna larghezza, **48 combinazioni**. Risultati completi in [browser-verification.json](browser-verification.json):

- 0 richieste HTTP/HTTPS a origini esterne prima di un’azione del visitatore;
- 0 errori JavaScript;
- 0 scorrimenti orizzontali;
- menu mobile editoriale apertura/chiusura e menu storico apertura/Escape funzionanti;
- mappa Contatti inizialmente vuota: clic esplicito assegna l’URL Google e nasconde il pannello informativo;
- geolocalizzazione mai chiamata al caricamento; richiesta del percorso funzionante nei due flussi;
- Contatti: scelta Auto aggiorna la modalità, “Chiudi percorso” ferma `watchPosition` e ripristina la mappa della sede.

Sono state ispezionate anche le schermate complete di Prezzi e Contatti su telefono; il pulsante Area riservata resta disponibile. Le simulazioni delle coordinate e le risposte degli iframe Google sono locali nel test: non è stata usata né inviata una posizione reale. Il test verifica URL e comportamento del sito, non il servizio di routing Google in produzione. Nel confronto della baseline i font esterni vengono serviti con le medesime copie WOFF2 locali, per rendere stabile la verifica della tipografia.

## Test di errore e protezioni

`npm run build` e `npm run check`: riusciti con Node **24.19.0**. `npm test`: **11 test superati**, nessun fallimento.

| Caso provato | Risultato |
| --- | --- |
| Email vuota, fasce vuote, JSON mancante o malformato | Build fallisce con file/campo indicato; output precedente intatto |
| Orario `25:00`, fasce sovrapposte, data `2026-02-30`, prezzo stringa | Errore di validazione chiaro; output precedente intatto |
| HTML nei testi (`<img ... onerror>`, `<script>`) | Pubblicato come testo con caratteri escapati, nessun tag eseguibile |
| Indirizzo con `</script><script>...` | JSON-LD protetto con escaping Unicode; JSON valido conserva il valore testuale |
| Attributo alt con virgolette e HTML | Escaping corretto; nessuna uscita dall’attributo |
| Link `javascript:`, `data:`, `ftp:`, credenziali o virgolette | Build rifiuta il link; output precedente intatto |
| Foto di 600001 byte | Errore “immagine troppo pesante: massimo 600 KB” anche se non usata in un evento |
| SVG mascherato da JPG, larghezza JPEG di 1601 px | Errore di formato/dimensioni; nessuna sostituzione dell’ultimo output riuscito |
| JPG valido, WebP statici lossy e lossless | Accettati; dimensioni reali usate nell’HTML delle foto |
| WebP animato | Rifiutato: sono ammesse foto statiche |
| Evento con visibile=false | Nessun contenuto dell’evento nell’HTML pubblico |
| Cambi validi a prezzo, fascia, recapiti | Aggiornate schede/tabella, menu/footer/contatti e JSON-LD, senza fetch client |
| Avvio del comando di build con SITE_URL non valido | Uscita 1 e messaggio “Build annullato”; output reale preservato |
| Robots/sitemap con origine di prova | Esattamente 16 URL, Cookie escluso, nessun dominio localhost nell’output con SITE_URL impostato |

Il build valida tutte le voci, anche nascoste, e tutti gli upload: questo impedisce che un file danneggiato venga pubblicato in un salvataggio successivo. Il controllo delle immagini verifica formato dichiarato, intestazioni, peso e dimensioni; non effettua una decodifica completa né comprime automaticamente. Compressione e dimensioni sono documentate per le titolari.

## Pages CMS e servizi esterni

Sono stati controllati i nomi delle chiavi sui documenti ufficiali di [campi](https://pagescms.org/docs/configuration/content/fields/), [liste](https://pagescms.org/docs/configuration/content/list/), [media](https://pagescms.org/docs/configuration/media/), [immagini](https://pagescms.org/docs/configuration/fields/image/), filename e view. `.pages.yml` usa sintassi JSON, valida come YAML 1.2, senza chiavi inventate per peso/dimensioni. Questi limiti sono descritti nei campi e imposti dal build.

Le [collaboratrici possono essere invitate via email senza GitHub](https://pagescms.org/docs/configuration/collaborators/). La schermata pubblica dell’app è stata letta: mostra “Sign in with GitHub” e **“Continue with email”**. Il [codice ufficiale dell’autenticazione](https://github.com/hunvreus/pagescms/blob/main/lib/auth.ts) conferma il codice monouso di sei cifre via email. Non è stato inviato alcun invito o codice, e non è stato eseguito un accesso reale.

`percorso-live.js`: geolocalizzazione del browser via `watchPosition` soltanto dopo clic, nessuna archiviazione delle coordinate; Google Maps riceve origine e destinazione nell’iframe e calcola il percorso. Nessun altro fornitore, fetch o API di routing. Haversine calcolato localmente per la distanza indicativa; aggiornamenti dopo 60 m/20 s; monitoraggio fermato alla chiusura o uscita dalla pagina. Dove siamo usa invece `getCurrentPosition` una sola volta. Font, foto, video, CSS e script vengono serviti localmente. Il codice del sito non scrive cookie.

## Non verificato o da decidere

1. **Account reali**: installazione e permessi della GitHub App, inviti/email OTP, salvataggio nel CMS e form effettivi delle titolari. La sintassi è stata confrontata con documentazione e codice ufficiali, non caricata in una repository remota durante questa lavorazione.
2. **Nuovo Cloudflare**: progetto ancora da creare, esecuzione con Node fissato nel suo ambiente, trigger da Git, intestazioni effettive, cache e conservazione dell’ultimo deploy in caso di build fallito. Test locale di uscita non zero superato; nessuna pubblicazione effettuata. Cloudflare può mettere `noindex` nelle proprie preview autonomamente, come descritto nella sua documentazione.
3. **Decisioni del proprietario**: URL stabile/`SITE_URL`, branch di produzione e flusso di approvazione; elenco degli URL storici per `_redirects`.
4. **Conferma delle titolari**: prezzi, fasce di apertura, coordinate indicative della distanza e informative legali in base al nuovo hosting. “55 minuti” e “massimo 5 persone” restano fuori dal CMS, nei file indicati nel README.
5. **Dispositivi e Maps reali**: non provati Safari/iOS, telefoni/tablet fisici, GPS reale o calcolo/resa grafica del percorso da parte di Google. La verifica responsive riguarda i viewport di Chrome; la struttura e i CSS esistenti sono conservati.
6. **ChatGPT Sites**: `.openai/hosting.json` punta ancora a `dist`; non è stato provato se il suo flusso automatico costruisce la cartella da un checkout in cui è ignorata. Il progetto privato è conservato, l’anteprima pubblicata non è stata sincronizzata perché non è autorizzato alcun deploy.

La [guida per le titolari](GUIDA-TITOLARI.md) e il README descrivono impostazioni, limiti, operazioni consentite e recupero dopo un errore.