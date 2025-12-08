export function alignMovementDates(portfolioData, movimentiData) {
    const windowDays = 3;
    const tolerance = 0.01;
    const alignedMovements = [];

    movimentiData.forEach(movement => {
        const movementDate = new Date(movement.date.split('/').reverse().join('-'));
        const movementValue = movement.value;
        let bestExactMatch = null;
        let bestClosestMatch = null;
        let smallestDayDiff = Infinity;

        for (let i = 0; i < portfolioData.length - 1; i++) {
            const currPortfolio = portfolioData[i];
            const nextPortfolio = portfolioData[i + 1];

            const currDate = new Date(currPortfolio.date.split('/').reverse().join('-'));
            const daysDiff = Math.abs((currDate - movementDate) / (86400000));

            if (daysDiff > windowDays) continue;

            // Calcola le variazioni
            const liquidityChange = nextPortfolio.liquidita - currPortfolio.liquidita;
            const finanziamentoChange = currPortfolio.finanziamento - nextPortfolio.finanziamento;
            const totalChange = liquidityChange + finanziamentoChange;

            // Verifica corrispondenze esatte
            if (Math.abs(totalChange - movementValue) <= tolerance) {
                bestExactMatch = {
                    date: nextPortfolio.date,
                    type: 'total',
                    diff: Math.abs(totalChange - movementValue)
                };
                break; // Priorità massima, interrompe la ricerca
            }

            // Verifica corrispondenza solo liquidità
            if (!bestExactMatch && Math.abs(liquidityChange - movementValue) <= tolerance) {
                bestExactMatch = {
                    date: nextPortfolio.date,
                    type: 'liquidità',
                    diff: Math.abs(liquidityChange - movementValue)
                };
            }

            // Verifica corrispondenza solo finanziamento
            if (!bestExactMatch && Math.abs(finanziamentoChange - movementValue) <= tolerance) {
                bestExactMatch = {
                    date: nextPortfolio.date,
                    type: 'finanziamento',
                    diff: Math.abs(finanziamentoChange - movementValue)
                };
            }

            // Aggiorna la data più vicina
            if (daysDiff < smallestDayDiff) {
                smallestDayDiff = daysDiff;
                bestClosestMatch = {
                    date: currPortfolio.date,
                    type: 'closest',
                    diff: daysDiff
                };
            }
        }

        // Gestione risultati
        if (bestExactMatch) {
            alignedMovements.push({
                date: bestExactMatch.date,
                value: movementValue,
                originalDate: movement.date,
                matchedType: bestExactMatch.type
            });
        } else if (bestClosestMatch) {
            alignedMovements.push({
                date: bestClosestMatch.date,
                value: movementValue,
                originalDate: movement.date,
                matchedType: bestClosestMatch.type
            });
            console.log(`Warning: No exact match for movement on ${movement.date} of ${movementValue}€. Assigned closest date ${bestClosestMatch.date}`);
        } else {
            alignedMovements.push({
                date: movement.date,
                value: movementValue,
                originalDate: movement.date,
                matchedType: 'none'
            });
            console.log(`Warning: No matching date found within window for movement on ${movement.date} of ${movementValue}€`);
        }
    });

    return alignedMovements;
}


export function calculateStats(portfolioData, alignedMovements) {
    let cumulativeGainLoss = 0;
    let cumulativeInvestment = 0;
    const dailyGains = [];

    let previousPatrimonio = null;
    let weightedAverageCapital = 0;
    let cumulativeTWRR = 1;
    const totalDays = portfolioData.length;

    if (totalDays > 0) {
        weightedAverageCapital = portfolioData[0].patrimonio;
    }

    portfolioData.forEach((day, index) => {
        // Aggiorna il cumulativo degli investimenti per il giorno corrente
        const movimentiGiorno = alignedMovements
            .filter(m => m.date === day.date)
            .reduce((sum, m) => sum + m.value, 0);
        cumulativeInvestment += movimentiGiorno;

        if (previousPatrimonio !== null) {
            const currentPatrimonio = day.patrimonio;
            const diffPatrimonio = currentPatrimonio - previousPatrimonio;
            const gainLoss = diffPatrimonio - movimentiGiorno;
            cumulativeGainLoss += gainLoss;

            // Calcolo capitale medio ponderato (Modified Dietz)
            if (totalDays > 1) {
                const daysRemaining = (totalDays - 1) - index;
                const weight = daysRemaining / (totalDays - 1);
                weightedAverageCapital += movimentiGiorno * weight;
            }

            // Calcolo TWRR
            const startCapital = previousPatrimonio + movimentiGiorno;
            if (startCapital > 0) {
                const dailyReturn = gainLoss / startCapital;
                cumulativeTWRR = cumulativeTWRR * (1 + dailyReturn);
            }

            dailyGains.push({
                date: day.date,
                gainLoss: gainLoss,
                cumulativeGainLoss: cumulativeGainLoss,
                cumulativeInvestment: cumulativeInvestment,
                twrr: cumulativeTWRR - 1
            });
        }
        previousPatrimonio = day.patrimonio;
    });

    let totalGainLossPercentage = 0;
    if (weightedAverageCapital !== 0) {
        totalGainLossPercentage = cumulativeGainLoss / weightedAverageCapital;
    }

    return {
        dailyGains,
        totalGainLoss: cumulativeGainLoss,
        totalGainLossPercentage,
        totalTwrr: cumulativeTWRR - 1,
        totalInvestments: cumulativeInvestment,
        patrimonyInitial: portfolioData[0].patrimonio,
        patrimonyFinal: portfolioData[portfolioData.length - 1].patrimonio,
        totalMovements: alignedMovements.reduce((sum, m) => sum + m.value, 0)
    };
}

export function findMaxGainAndLoss(dailyGains) {
    let maxGain = { gainLoss: -Infinity };
    let maxLoss = { gainLoss: Infinity };

    dailyGains.forEach(day => {
        if (day.gainLoss > maxGain.gainLoss) {
            maxGain = day;
        }
        if (day.gainLoss < maxLoss.gainLoss) {
            maxLoss = day;
        }
    });

    return {
        maxGain: {
            date: maxGain.date,
            gainLoss: maxGain.gainLoss
        },
        maxLoss: {
            date: maxLoss.date,
            gainLoss: maxLoss.gainLoss
        }
    };
}

export function findLongestSequences(dailyGains) {
    let currentDropSequence = { start: null, end: null, sum: 0, days: 0 };
    let maxDropSequence = { start: null, end: null, sum: 0, days: 0 };

    let currentRiseSequence = { start: null, end: null, sum: 0, days: 0 };
    let maxRiseSequence = { start: null, end: null, sum: 0, days: 0 };

    dailyGains.forEach((day) => {
        // Drop sequence (gainLoss <= 0)
        if (day.gainLoss <= 0) {
            if (currentDropSequence.days === 0) {
                currentDropSequence.start = day.date;
            }
            currentDropSequence.end = day.date;
            currentDropSequence.sum += day.gainLoss;
            currentDropSequence.days++;
        } else {
            if (currentDropSequence.sum < maxDropSequence.sum) { // Lower sum is "larger" drop (more negative)
                maxDropSequence = { ...currentDropSequence };
            }
            currentDropSequence = { start: null, end: null, sum: 0, days: 0 };
        }

        // Rise sequence (gainLoss >= 0)
        if (day.gainLoss >= 0) {
            if (currentRiseSequence.days === 0) {
                currentRiseSequence.start = day.date;
            }
            currentRiseSequence.end = day.date;
            currentRiseSequence.sum += day.gainLoss;
            currentRiseSequence.days++;
        } else {
            if (currentRiseSequence.sum > maxRiseSequence.sum) {
                maxRiseSequence = { ...currentRiseSequence };
            }
            currentRiseSequence = { start: null, end: null, sum: 0, days: 0 };
        }
    });

    // Check last sequences
    if (currentDropSequence.sum < maxDropSequence.sum) {
        maxDropSequence = { ...currentDropSequence };
    }
    if (currentRiseSequence.sum > maxRiseSequence.sum) {
        maxRiseSequence = { ...currentRiseSequence };
    }

    return { maxDropSequence, maxRiseSequence };
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

export function formatPercentage(value) {
    return new Intl.NumberFormat('it-IT', {
        style: 'percent',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

export function calculateLongestRecovery(dailyGains) {
    if (!dailyGains || dailyGains.length === 0) return { days: 0, startDate: null, endDate: null };

    let maxPeak = -Infinity;
    let peakDate = null;
    
    let maxRecoveryDays = 0;
    let maxRecoveryStartDate = null;
    let maxRecoveryEndDate = null;

    // Helper to parse "dd/mm/yyyy" to Date object
    const parseDate = (dateStr) => {
        const [day, month, year] = dateStr.split('/');
        return new Date(year, month - 1, day);
    };

    dailyGains.forEach(day => {
        const currentVal = day.cumulativeGainLoss;
        const currentDate = parseDate(day.date);

        // Initialize first peak
        if (peakDate === null) {
            maxPeak = currentVal;
            peakDate = currentDate;
            return;
        }

        // If we found a new peak (surpassed previous high)
        if (currentVal > maxPeak) {
            // Calculate how long it took to get back here
            const diffTime = Math.abs(currentDate - peakDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            // If this recovery took longer than any previous one, record it
            if (diffDays > maxRecoveryDays) {
                maxRecoveryDays = diffDays;
                maxRecoveryStartDate = peakDate;
                maxRecoveryEndDate = currentDate;
            }

            // Update the new High Water Mark
            maxPeak = currentVal;
            peakDate = currentDate;
        }
    });

    return {
        days: maxRecoveryDays,
        startDate: maxRecoveryStartDate ? maxRecoveryStartDate.toLocaleDateString('it-IT') : null,
        endDate: maxRecoveryEndDate ? maxRecoveryEndDate.toLocaleDateString('it-IT') : null
    };
}