export function parseCSV(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            const result = parseCSVContent(event.target.result);
            resolve(result);
        };
        reader.readAsText(file);
    });
}

export function parseCSVContent(csvText) {
    const lines = csvText.split('\n');
    const headerIndex = findHeaderIndex(lines);

    if (headerIndex === -1) {
        return {
            portfolioData: [],
            movimentiData: [],
            warnings: ["Header non trovato"],
            error: "Formato CSV non valido: impossibile trovare l'header"
        };
    }

    const headerLine = lines[headerIndex].trim();
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const headerColumns = headerLine.split(delimiter).map(c => c.trim().toLowerCase());
    const patrimonioIndex = headerColumns.indexOf('patrimonio');

    if (patrimonioIndex === -1) {
        return {
            portfolioData: [],
            movimentiData: [],
            warnings: ["Colonna Patrimonio non trovata"],
            error: "Formato CSV non valido: impossibile trovare la colonna Patrimonio"
        };
    }

    const portfolioData = [];
    const movimentiData = [];
    const warnings = [];

    // Si parte dalla riga dell'header stesso: nel nuovo formato i movimenti
    // iniziano sulla stessa riga dell'header del patrimonio (colonne 8+)
    lines.slice(headerIndex).forEach((line, index) => {
        if (!line.trim()) return; // Salta righe vuote

        const columns = line.split(delimiter);

        try {
            // Parsing dati portafoglio (prima parte della riga)
            if (isDate(columns[0])) {
                portfolioData.push({
                    date: normalizeDate(columns[0].trim()),
                    liquidita: parseNumber(columns[1]),
                    finanziamento: parseNumber(columns[2]),
                    patrimonio: parseNumber(columns[patrimonioIndex])
                });
            }

            // Parsing movimenti (seconda parte della riga)
            if (isDate(columns[8])) {
                movimentiData.push({
                    date: normalizeDate(columns[8].trim()),
                    value: parseNumber(columns[10])
                });
            }
        } catch (error) {
            warnings.push(`Errore alla riga ${index + headerIndex + 1}: ${error.message}`);
        }
    });

    return {
        portfolioData: portfolioData.filter(Boolean),
        movimentiData: movimentiData.filter(Boolean),
        warnings,
        headerIndex
    };
}

function isDate(value) {
    return /^\d{1,2}\/\d{1,2}\/(\d{2}|\d{4})$/.test(value?.trim() ?? '');
}

// Normalizza al formato interno DD/MM/YYYY.
// Vecchio formato: DD/MM/YYYY (già conforme).
// Nuovo formato: M/D/YY, con il mese prima del giorno e anno a due cifre.
function normalizeDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts[2].length === 4) {
        return dateStr;
    }
    const [month, day, year] = parts;
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/20${year}`;
}

// Il nuovo formato usa la virgola come separatore decimale (es. "52011,04")
function parseNumber(value) {
    return parseFloat(String(value ?? '').replace(',', '.'));
}

function findHeaderIndex(lines) {
    // Copre sia il vecchio formato (virgole, "Finanaziamento" con refuso,
    // colonna "Margini compnensati") sia il nuovo (punti e virgola, senza Margini)
    const headerPattern = /^Data[,;]Liquidità[,;]Finan\w*iamento long[,;]Garanzia short[,;]Portafoglio[,;]/i;

    // Cerca l'header in tutte le righe
    for (let i = 0; i < lines.length; i++) {
        if (headerPattern.test(lines[i].trim())) {
            return i;
        }
    }

    return -1; // Header non trovato
}
