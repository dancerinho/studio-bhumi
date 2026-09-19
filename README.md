# Studio Bhumi

Sito statico multipagina, senza dipendenze. Richiede Node 20+ per l'anteprima.

## Avvio locale o cloud

`npm run dev` avvia il sito sulla porta 3000 (personalizzabile con PORT). Aprire la porta nell'anteprima dell'ambiente cloud. Non occorre installare pacchetti.
`npm run check` controlla la sintassi JavaScript.

## Struttura

- dist/*.html: 12 pagine modificabili direttamente.
- dist/assets/site.css: layout, palette e animazioni.
- dist/assets/site.js: barra superiore fissa, hamburger, footer e percorso Maps.
- dist/assets/: logo e fotografie originali dello studio.
- .openai/hosting.json: progetto Sites privato esistente, senza credenziali.
- AGENTS.md: istruzioni per continuare con un assistente di codice.

dist è il sorgente statico, non un output generato. Può essere pubblicato su qualsiasi hosting statico.

## Prima del lancio pubblico

Confermare prezzi e orari con lo studio, completare le informative legali per il nuovo hosting e predisporre i redirect dagli URL storici. Gli eventi 2019–2020 non sono presentati come attuali. Il pulsante prova apre l'email; l'area riservata usa il link Logfit originale.

La posizione viene richiesta solo al clic su Mostra percorso e condivisa con Google Maps per le indicazioni; non viene salvata dal sito.

## Fonti

Logo e immagini: https://www.studiobhumi.it/ e https://www.studiobhumi.it/chi_siamo.htm.
Informazioni: pagine discipline.htm, orari.htm e profili delle insegnanti del sito originale.
