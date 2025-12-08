# Directa Portfolio Analyzer

Questo strumento permette di visualizzare e analizzare la performance reale degli investimenti effettuati tramite la piattaforma Directa, filtrando i depositi e i prelievi che normalmente alterano la visualizzazione del grafico "Patrimonio".

> **⚠️ Attribution / Crediti**: Questo progetto è basato sul lavoro originale di [ilbonte/directa-analyzer](https://github.com/ilbonte/directa-analyzer). Questo fork è stato sviluppato per portare l'applicazione su uno stack **Vite/React/Tailwind** e aggiungere nuove funzionalità e informazioni.

## 🎯 Obiettivo del Progetto

Il grafico standard del "Patrimonio" su Directa include i versamenti e i prelievi di liquidità. Questo rende difficile comprendere il reale andamento degli investimenti (Guadagno/Perdita), poiché un semplice bonifico in entrata appare come un aumento del patrimonio, anche se non è frutto di una performance di mercato.

Questo analizzatore elabora il file storico esportato da Directa per:
1.  Isolare i movimenti di liquidità (bonifici, prelievi).
2.  Calcolare il vero Guadagno/Perdita giornaliero.
3.  Fornire metriche avanzate come MWRR e TWRR per valutare la bontà della gestione.
4.  Tutto avviene **localmente nel tuo browser**: nessun dato viene inviato a server esterni.

## 🚀 Installazione e Avvio

Il progetto è basato su React e Vite. Assicurati di avere [Node.js](https://nodejs.org/) installato.

1.  **Clona il repository** (o scarica i file):
    ```bash
    git clone <url-repository>
    cd <nome-cartella>
    ```

2.  **Installa le dipendenze**:
    ```bash
    npm install
    # oppure
    pnpm install
    # oppure
    yarn install
    ```

3.  **Avvia il server di sviluppo**:
    ```bash
    npm run dev
    ```

4.  Apri il browser all'indirizzo indicato (solitamente `http://localhost:5173`).

## 📂 Come ottenere il file di input da Directa

Per utilizzare lo strumento, è necessario esportare lo storico del patrimonio dalla piattaforma **Libera** di Directa:

1.  Accedi al tuo conto su **Directa** (piattaforma Libera).
2.  Naviga nel menu: **Conto** &rarr; **Patrimonio** &rarr; **Storico**.
3.  Seleziona l'intervallo di date desiderato (nota: Directa permette solitamente un massimo di 3 anni per esportazione).
4.  Clicca sull'icona di **Download** (solitamente una freccia verso il basso o un'icona CSV) situata sopra il grafico.
5.  Verrà scaricato un file `.csv`. Carica questo file nell'applicazione.

## 🧮 Modalità di Calcolo

Di seguito viene spiegato come vengono calcolati i valori mostrati nelle card statistiche.

### 1. Patrimonio Iniziale
Il valore del patrimonio (liquidità + investimenti) registrato nel primo giorno del periodo selezionato nel file CSV.

### 2. Movimenti Totali
La somma algebrica di tutti i flussi di cassa in entrata e in uscita durante il periodo.
*   **Versamenti (Bonifici in entrata)**: Aumentano questo valore.
*   **Prelievi (Bonifici in uscita)**: Diminuiscono questo valore.
*   *Nota*: Questo valore rappresenta il capitale netto aggiunto o rimosso dal portafoglio dall'utente.

### 3. G/L Totale (Guadagno/Perdita)
Il guadagno o la perdita monetaria assoluta in Euro.
*   **Formula**: Viene calcolato sommando le variazioni giornaliere del portafoglio, *escludendo* l'impatto dei movimenti di liquidità.
*   `G/L Giornaliero = (Patrimonio Oggi - Patrimonio Ieri) - Movimenti Netti Oggi`
*   Include dividendi, cedole e capital gain/loss (realizzati e non).

### 4. G/L % (Money-Weighted Rate of Return - MWRR)
Rappresenta il rendimento percentuale ponderato per il denaro investito. Tiene conto non solo della performance di mercato, ma anche del *timing* e dell'entità dei versamenti/prelievi.
*   **Logica**: Se versi denaro poco prima di un rialzo di mercato, il tuo MWRR sarà più alto perché quel nuovo capitale ha beneficiato del rialzo.
*   **Calcolo**: Utilizza un'approssimazione simile al metodo *Modified Dietz*, rapportando il G/L Totale al capitale medio ponderato investito nel periodo.

### 5. TWRR (Time-Weighted Rate of Return)
Misura la performance pura della gestione/strategia, eliminando l'effetto distorsivo dei flussi di cassa (versamenti/prelievi).
*   **Utilità**: È la metrica standard per confrontare la propria performance con un benchmark o altri fondi, poiché non penalizza né premia le decisioni di aggiungere o togliere liquidità dal conto.
*   **Calcolo**: Si calcola moltiplicando i rendimenti giornalieri: `(1 + r1) * (1 + r2) * ... * (1 + rn) - 1`, dove `r` è il rendimento del singolo giorno calcolato sul capitale disponibile all'inizio della giornata (dopo aver contabilizzato eventuali flussi).

### 6. Patrimonio Finale
Il valore totale del portafoglio (liquidità + investimenti) all'ultimo giorno del periodo selezionato.
*   Corrisponde a: `Patrimonio Iniziale + Movimenti Totali + G/L Totale`.

---

### Note Tecniche
*   **Allineamento Date**: Lo strumento tenta di allineare i movimenti di liquidità (che nel CSV potrebbero avere date leggermente diverse rispetto alla rilevazione del patrimonio) con una finestra di tolleranza di 3 giorni per garantire la massima precisione nel calcolo del G/L giornaliero.
