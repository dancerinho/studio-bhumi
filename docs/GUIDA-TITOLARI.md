# Studio Bhumi — guida rapida per aggiornare il sito

**Prima del lancio confermare con le titolari i prezzi attuali: 140, 270, 1.270, 320, 600 e 30 euro, e le fasce di apertura.** Il gestore attiverà il pannello sul branch collegato alla pubblicazione; finché la configurazione non è completata, il pannello non è operativo.

## Entrare

Accetta l’invito ricevuto dal gestore e apri [Pages CMS](https://app.pagescms.org/). Scegli **Continue with email**, usa **la stessa email dell’invito** e inserisci il codice monouso ricevuto nella casella di posta (nel login ufficiale attuale è di sei cifre). Non serve un account GitHub né una password GitHub. Apri il sito Studio Bhumi e il branch indicato dal gestore; non cambiarlo. Se l’email non arriva controlla lo spam e chiedi un nuovo codice.

## Cambiare un prezzo

Apri **Prezzi e formule**, espandi il gruppo e il pacchetto, modifica “Prezzo in euro” e salva. Scrivi `1270` per 1.270 euro, senza simbolo €; sono ammessi due decimali. Il prezzo aggiorna sia le schede Prezzi sia la tabella Orari. Per rinominare una voce comune (es. “4 lezioni”), usa lo stesso nome nei due gruppi; sono consentite fino a tre voci diverse totali. Non eliminare i due gruppi. La quota annuale è in fondo alla sezione.

## Cambiare le fasce di apertura

Apri **Fasce di apertura dello studio**, scegli i giorni e inserisci apertura/chiusura nel formato `07:30`, poi salva. Sono gli orari di apertura, **non un calendario delle singole lezioni**. La chiusura deve essere successiva all’apertura nello stesso giorno; le fasce non devono sovrapporsi. Il sito aggiorna anche gli orari letti dai motori di ricerca. Durata di 55 minuti e massimo 5 persone si cambiano tramite il gestore, fuori dal pannello.

## Pubblicare una novità

Apri **Eventi e novità**, crea una voce e compila titolo, data e testo breve (massimo 600 caratteri). Puoi annunciare eventi, nuovi attrezzi o tecniche. La foto è facoltativa: usa JPG/WebP statico, massimo **600 KB e 1600×1000 pixel**, già ridimensionato e compresso. Se la inserisci, descrivi cosa si vede nel campo “Descrizione della foto”. Attiva **Mostra sul sito** e salva per pubblicare; disattivalo e salva per nascondere. Una data passata non nasconde automaticamente la voce. Non scrivere codice HTML.

## Avvisi, recapiti e salvataggi

**Avviso in home**: scrivi fino a 140 caratteri e attiva l’interruttore. Il messaggio compare nel piccolo testo sopra il primo titolo; disattivandolo torna il testo originale. **Recapiti e link globali**: cambia email, indirizzo, telefono e collegamenti nelle caselle dedicate. Aggiorna sia il telefono internazionale (`+393487517656`) sia quello visualizzato (`348 751 7656`). I link devono iniziare con `https://` o `http://`.

Ogni salvataggio aggiorna i file su GitHub. Dopo l’attivazione del nuovo Cloudflare, la pubblicazione parte automaticamente dal branch scelto: attendi la conferma del build e controlla il sito. Se il dato non è valido o una foto supera i limiti, **resta online l’ultima versione riuscita**. Correggi il campo segnalato; per una foto troppo pesante sostituiscila o rimuovila dalla cartella media. Non eliminare foto usate da altre novità. Se non risolvi, comunica al gestore il messaggio di errore e la modifica tentata: potrà recuperare la versione precedente. Non cercare di cambiare layout o codice.

Riferimenti: [inviti senza GitHub](https://pagescms.org/docs/configuration/collaborators/), [login email ufficiale](https://github.com/hunvreus/pagescms/blob/main/lib/auth.ts). Invito e accesso effettivo saranno provati dal gestore prima della consegna del pannello.