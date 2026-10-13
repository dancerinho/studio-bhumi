# Studio Bhumi — sito statico e Pages CMS

HTML/CSS/JavaScript scritto a mano. Il repository è la fonte di verità: 16 pagine pubbliche più `cookie.html`, il redirect già esistente a `privacy.html#cookie`. Il build usa soltanto Node.js; nessun framework, pacchetto da installare o fetch dei contenuti nel browser.

## Struttura e comandi

- `src/pages/`: i 16 template HTML e il redirect Cookie, con gli stessi nomi e link di prima.
- `src/partials/`: menu, footer, social, schede prezzi e stato vuoto degli eventi. `shared.mjs` genera il menu e il footer delle nove pagine storiche.
- `src/assets/`: foto, logo, video, CSS, JavaScript e font originali locali. `fonts/` include le licenze OFL e le URL di provenienza.
- `src/static/`: crediti fotografici da copiare nell’output.
- `content/`: quattro file JSON singoli e la collezione `eventi/`. `uploads/` contiene solo le nuove foto delle novità.
- `scripts/build.mjs`: validazione, rendering HTML, JSON-LD e sostituzione dell’output solo dopo un build completo. `pages.mjs` è l’elenco delle pagine e degli URL della sitemap.
- `.pages.yml`: cinque sezioni del pannello e una sola cartella media. È scritto in sintassi JSON, valida anche come YAML 1.2, per poterlo controllare senza aggiungere un parser al progetto.
- `dist/`: output generato, ignorato da Git. Non modificarlo a mano.
- `tests/`: controlli dei contenuti e verifica facoltativa nel browser. `docs/`: guida delle titolari e report della migrazione.

Usare Node **24.19.0**, fissato in `.node-version` e `package.json`.

```sh
npm run build
npm run dev
npm run check
npm test
```

`dev` costruisce il sito e lo serve su [localhost:3000](http://localhost:3000); `PORT` cambia la porta. Dopo una modifica ricostruire il sito o riavviare `dev`: non c’è un watcher. Il server supporta anche gli URL senza `.html` e le richieste parziali del video. `check` costruisce e controlla la sintassi di tutti gli script; `test` lavora su copie temporanee dei dati.

`SITE_URL` imposta l’origine pubblica usata da JSON-LD, robots e sitemap (solo protocollo e dominio, niente percorsi). Senza variabile, il build usa `CF_PAGES_URL` se disponibile, altrimenti `http://localhost:3000` per il lavoro locale. Prima del lancio impostare **l’URL stabile del nuovo progetto o il dominio definitivo**: non usare l’anteprima del vecchio account. Non vengono aggiunti `noindex`, meta robots o intestazioni `X-Robots-Tag` dal progetto.

## Contenuti modificabili

| Sezione CMS | Dati | Dove vengono pubblicati |
| --- | --- | --- |
| Prezzi e formule | `content/prezzi.json` | Schede Prezzi e tabella Orari, quota annuale inclusa |
| Fasce di apertura dello studio | `content/orari.json` | Righe della scheda Orari e JSON-LD dello studio |
| Eventi e novità | `content/eventi/*.json` | Componenti esistenti in Eventi; solo le voci visibili |
| Avviso in home | `content/avviso-home.json` | Piccolo testo sopra il primo titolo; disattivo conserva il testo originale |
| Recapiti e link globali | `content/recapiti.json` | Menu, footer, contatti, prenotazioni, social, destinazione Maps e JSON-LD |

Orari significa **apertura dello studio**, non calendario delle lezioni. I giorni selezionati generano sia la dicitura italiana sia `openingHoursSpecification`. Le fasce non possono sovrapporsi e devono aprire/chiudere nello stesso giorno. Un solo JSON-LD `ExerciseGym` è presente nella home; nessun dato strutturato Event viene generato.

I due gruppi di prezzi conservano il tipo tecnico, non modificabile dal pannello. I testi sono modificabili; il titolo della scheda e quello breve della tabella sono separati per preservare le diciture iniziali. Ogni gruppo ha fino a tre voci e ci sono al massimo tre formule diverse complessive: le etichette uguali identificano le colonne della tabella. Gli importi iniziali restano **140, 270, 1.270, 320, 600 e 30 euro**; non sono stati riconfermati dalle titolari.

Non ci sono eventi inventati: la collezione parte vuota e conserva l’attuale stato “Nuovi appuntamenti in arrivo”. Le novità possono descrivere anche nuovi attrezzi o tecniche. La data è informativa: `visibile` controlla la pubblicazione, senza scadenza automatica. Una data passata resta visibile finché la titolare disattiva la voce.

## Configurare il nuovo Cloudflare Pages

1. Nell’account Cloudflare del proprietario creare un progetto **Pages collegato a GitHub**, autorizzando soltanto `dancerinho/studio-bhumi`.
2. Questa migrazione è solo locale sul branch `codex/pages-cms`. Push, eventuale revisione e unione in un branch di produzione richiedono una richiesta successiva. Non collegare il nuovo CMS a `main` finché la configurazione e il build non saranno stati approvati e portati sul branch scelto.
3. Scegliere quel branch come production branch. Preset **None**, root del progetto alla radice della repository, build **`npm run build`**, output **`dist`**.
4. Usare il build system v3. Impostare `NODE_VERSION=24.19.0` (coerente con `.node-version`) e `SITE_URL=https://DOMINIO-SCELTO`. È possibile impostare `SKIP_DEPENDENCY_INSTALL=1`: non ci sono dipendenze. Le variabili non sono segreti.
5. Non attivare Web Analytics, Zaraz o altre iniezioni di script esterni. Non configurare Direct Upload, workflow di deploy, token Cloudflare o deploy hook.
6. Dopo il primo deploy verificare `/robots.txt`, `/sitemap.xml`, tutti gli URL, i link esterni e la procedura CMS → commit GitHub → build Pages. Un errore del build restituisce stato non zero: Cloudflare non sostituisce il deploy precedente con l’output incompleto.

La sitemap include soltanto le 16 pagine, con gli URL senza estensione che Cloudflare Pages serve come destinazione dei suoi redirect automatici da `.html`; Cookie è escluso perché è un redirect. I nomi dei file e tutti i link HTML esistenti sono conservati. Non è stato aggiunto `_redirects`: aspettiamo l’elenco degli URL storici. Cloudflare può aggiungere autonomamente `X-Robots-Tag: noindex` alle sue **preview**: questo non viene dal build e va distinto dalla produzione.

Fonti ufficiali: [build e output](https://developers.cloudflare.com/pages/configuration/build-configuration/), [versione Node e build image](https://developers.cloudflare.com/pages/configuration/build-image/), [URL e intestazioni delle preview](https://developers.cloudflare.com/pages/configuration/serving-pages/).

### Progetto ChatGPT Sites esistente

`.openai/hosting.json` è conservato senza modifiche e punta alla cartella `dist`. Non contiene un’impostazione che richieda file versionati, ma da un checkout pulito quella cartella **non esiste fino al build**. L’eventuale anteprima Sites dovrà quindi eseguire `npm run build` prima di leggere `dist`; il funzionamento del suo flusso automatico non è stato verificato né aggiornato. Nessun nuovo progetto Sites è stato creato e nessuna pubblicazione è stata eseguita.

## Configurare Pages CMS e collaboratrici

1. Il gestore tecnico entra in [app.pagescms.org](https://app.pagescms.org/) con GitHub e autorizza la GitHub App sul solo repository del sito.
2. Seleziona repository e **branch scelto per la pubblicazione**, dopo che questa migrazione è stata approvata e inviata. Il pannello legge `.pages.yml` da quel branch.
3. Verifica che compaiano soltanto le cinque sezioni previste e “Foto di eventi e novità”. Logo, foto degli insegnanti, template e codice non sono tra i media modificabili.
4. Invita le titolari come **collaboratrici tramite email**, nelle impostazioni del repository in Pages CMS. Non serve loro un account GitHub. La schermata pubblica presenta “Continue with email”; nell’implementazione ufficiale attuale il login email usa un **codice monouso di sei cifre**, inviato via email; il gestore resta l’utente GitHub.
5. Le collaboratrici possono modificare contenuti e media, ma non la configurazione `.pages.yml` o gli inviti. Non assegnare loro accesso GitHub in scrittura al codice: chi ha quei permessi può comunque modificare la repository fuori dal CMS. Gli inviti sono nel database del CMS, non nel file YAML.
6. Fare una prova con un invito reale, un prezzo reversibile e una novità nascosta; verificarne salvataggio e build. Questi passaggi richiedono l’account e non sono stati eseguiti in questa lavorazione locale.

Fonti controllate: [collaboratori](https://pagescms.org/docs/configuration/collaborators/), [autenticazione](https://pagescms.org/docs/development/authentication/), [codice ufficiale del login email](https://github.com/hunvreus/pagescms/blob/main/lib/auth.ts), [campi](https://pagescms.org/docs/configuration/content/fields/), [liste](https://pagescms.org/docs/configuration/content/list/), [media](https://pagescms.org/docs/configuration/media/), [immagini](https://pagescms.org/docs/configuration/fields/image/). Le opzioni di campi, liste, file, filename e view usate sono documentate; non è stata inventata una chiave `maxSize`.

## Immagini, sicurezza e guasti

Nuove foto: **JPG/JPEG o WebP statico, massimo 600000 byte (600 KB), larghezza ≤1600 e altezza ≤1000 pixel**. Consigliato il taglio orizzontale 1600×1000. Comprimere/ridimensionare prima del caricamento ed eliminare eventuali metadati personali con il proprio editor. Non c’è un servizio di elaborazione esterno né una dipendenza pesante nel build.

Pages CMS filtra le estensioni. Peso, intestazione del formato e dimensioni vengono controllati dal build, anche sulle foto caricate ma non ancora utilizzate. Una foto fuori limite può essere salvata nella repository dal pannello, ma **blocca la pubblicazione** finché viene sostituita o rimossa. Una foto usata da un evento deve esistere ed avere descrizione alternativa. Il controllo dell’intestazione non sostituisce una decodifica completa del file: una foto danneggiata internamente va corretta nell’editor.

Tutti i campi testuali sono testo semplice: il build escapa HTML e attributi e protegge il JSON-LD dai caratteri che potrebbero chiudere il tag script. I link accettano soltanto HTTP/HTTPS e rifiutano credenziali; telefono, email, importi, date, giorni e fasce sono validati. I messaggi indicano file/campo da correggere. Il build prepara l’output in una cartella temporanea e lo sostituisce solo dopo validazione e rendering completi; su Windows attende brevi blocchi temporanei di OneDrive. Il sito non fa fetch dei contenuti, non scrive cookie né archivia la posizione.

## Font, mappe e percorso-live.js

I WOFF2 originali di EB Garamond (normal/italic 400 e 500) e Lato (300, 400, 700), con tutti i subset della risposta originale Google Fonts, sono serviti dallo stesso sito; nessun collegamento o preconnect a Google Fonts resta nell’HTML.

Le due mappe hanno inizialmente `src="about:blank"`. Solo “Carica la mappa” o una richiesta esplicita del percorso assegnano una URL Google all’iframe. La nota nel riquadro informa del contatto con Google; restano disponibili link diretti a Maps. I riquadri conservano dimensioni e CSS precedenti.

`percorso-live.js` usa `navigator.geolocation.watchPosition` dopo il clic, con permesso del browser. Google Maps calcola e visualizza il percorso nell’iframe (a piedi, mezzi o auto); il sito non ha un proprio motore di routing né chiama API di altri fornitori. Aggiornamento dopo almeno 60 metri e 20 secondi. La distanza in linea d’aria è calcolata localmente con coordinate **indicative** dello studio (45.4917, 9.1893), da riconfermare e modificare a mano in `src/assets/percorso-live.js` se la sede cambia. “Chiudi percorso” e l’uscita dalla pagina fermano il monitoraggio. La posizione non viene salvata. La pagina Dove siamo usa una singola `getCurrentPosition`, sempre dopo clic. Il browser/sistema operativo decide autonomamente come ottenere la posizione.

## Contenuti ancora da modificare a mano

- **55 minuti e massimo 5 persone**: `src/partials/price-gruppo.html`, `src/pages/orari.html`, `src/pages/studio.html`. Sono fuori dal CMS.
- Testi delle discipline, biografie, testi editoriali, metadati, informative legali, foto originali e struttura del sito: `src/pages/`, `src/assets/` e `src/partials/`.
- Nuove pagine e URL della sitemap: `scripts/pages.mjs` e nuovo template in `src/pages/`.
- Coordinate indicative per la distanza: `src/assets/percorso-live.js`.

## Aggiungere un nuovo campo (gestore tecnico)

1. Aggiungere il dato iniziale nel JSON pertinente, mantenendo i dati esistenti.
2. Aggiungere a `.pages.yml` nome, etichetta italiana, tipo, obbligatorietà e limiti **documentati**. Non esporre campi di codice, classi CSS o rich text.
3. Aggiungere la validazione in `scripts/build.mjs`; convertire i dati in testo sicuro con `escapeHTML`, o in attributi sicuri. I valori renderizzati non devono essere reinterpretati come template.
4. Inserire il segnaposto o il componente nel template senza cambiare il design. Per nuovi URL esterni usare `httpURL`; per JSON-LD mantenere l’escaping della stringa JSON.
5. Aggiungere un test dei dati validi e del caso di errore, eseguire build/check/test e confrontare l’HTML delle pagine estranee alla modifica. Aggiornare la guida, poi richiedere la pubblicazione.

## Verifiche e decisioni residue

Per rigenerare il diff HTML: `node scripts/compare-html.mjs 57ae921ad4a2b3755ce50f28dbc87d4754743a9d` (richiede Git, nessuna dipendenza). Il controllo nel browser `tests/browser-check.mjs` richiede una copia già disponibile di Playwright e Chromium/Chrome: impostare `PLAYWRIGHT_MODULE`, `BROWSER_EXECUTABLE`, `BASELINE_DIR` e `MIGRATION_DIR` alle installazioni/cartelle di confronto. Queste dipendenze di verifica non fanno parte del build o del sito.

Il [report della verifica](docs/VERIFICA-CMS.md) riporta equivalenza HTML/DOM, rete, layout e test di errore. La [guida per le titolari](docs/GUIDA-TITOLARI.md) spiega le sole operazioni del pannello.

Restano da verificare con gli account reali: inviti/login e salvataggio Pages CMS, permessi della GitHub App, nuovo progetto Cloudflare, versione Node nel suo ambiente, trigger Git e mantenimento del deploy precedente in caso di errore. Da decidere: dominio definitivo/`SITE_URL`, branch di produzione e flusso di approvazione delle modifiche, URL storici per `_redirects`. Prima del lancio le titolari devono confermare prezzi e fasce, le coordinate indicative e le informative legali in base al nuovo hosting. Nessun push, deploy o modifica a `main` è autorizzato da questa migrazione.