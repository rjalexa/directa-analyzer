export function alignMovementDates(portfolioData, movimentiData) {
    const windowDays = 3;
    const tolerance = 0.01;
    const approxTolerancePercent = 0.05; // 5% tolerance allows linking deposits to days with market movement
    const alignedMovements = [];

    movimentiData.forEach(movement => {
        const movementDate = new Date(movement.date.split('/').reverse().join('-'));
        const movementValue = movement.value;
        
        let sameDayExactMatch = null;
        let sameDayApproxMatch = null;
        let windowExactMatch = null;
        let bestClosestMatch = null;
        let smallestDayDiff = Infinity;

        // Check the very first portfolio day as a candidate for "closest match"
        // This handles cases where a deposit happens on the start date (Day 0)
        // and is already included in the initial equity.
        if (portfolioData.length > 0) {
            const firstPortfolio = portfolioData[0];
            const firstDate = new Date(firstPortfolio.date.split('/').reverse().join('-'));
            const firstDiff = Math.abs((firstDate - movementDate) / (86400000));
            
            if (firstDiff < smallestDayDiff) {
                smallestDayDiff = firstDiff;
                bestClosestMatch = {
                    date: firstPortfolio.date,
                    type: 'closest',
                    diff: firstDiff
                };
            }
        }

        // Iterate through all portfolio days to find the best candidate
        for (let i = 0; i < portfolioData.length - 1; i++) {
            const currPortfolio = portfolioData[i];
            const nextPortfolio = portfolioData[i + 1];

            // In Directa/Portfolio math, the change happens *to* the next date (Change = Next - Curr)
            // So we compare the movement date against the Next Portfolio Date
            const nextDate = new Date(nextPortfolio.date.split('/').reverse().join('-'));
            const daysDiff = Math.abs((nextDate - movementDate) / (86400000));

            if (daysDiff > windowDays) continue;

            const liquidityChange = nextPortfolio.liquidita - currPortfolio.liquidita;
            const finanziamentoChange = currPortfolio.finanziamento - nextPortfolio.finanziamento;
            const cashChange = liquidityChange + finanziamentoChange;
            const patrimonioChange = nextPortfolio.patrimonio - currPortfolio.patrimonio;

            // Check for Exact Matches (Value matches perfectly within 1 cent)
            const isCashExact = Math.abs(cashChange - movementValue) <= tolerance;
            const isLiqExact = Math.abs(liquidityChange - movementValue) <= tolerance;
            const isFinExact = Math.abs(finanziamentoChange - movementValue) <= tolerance;
            const isPatrimonioExact = Math.abs(patrimonioChange - movementValue) <= tolerance;

            const matchObj = {
                date: nextPortfolio.date,
                diff: 0,
                type: isPatrimonioExact ? 'total' : (isCashExact ? 'cash' : (isLiqExact ? 'liquidità' : 'finanziamento'))
            };

            if (isPatrimonioExact || isCashExact || isLiqExact || isFinExact) {
                if (daysDiff < 0.5) {
                    sameDayExactMatch = matchObj;
                } else {
                    // If we already have a window match, only replace it if this one is closer in time
                    if (!windowExactMatch || daysDiff < Math.abs((new Date(windowExactMatch.date.split('/').reverse().join('-')) - movementDate) / 86400000)) {
                        windowExactMatch = matchObj;
                    }
                }
            }

            // Check for Approximate Match (Must be SAME DAY)
            // This handles cases where market movement happens on the same day as a deposit
            if (daysDiff < 0.5) {
                // Use Patrimonio Change for approx match, as it captures the full value even if invested
                const diffVal = Math.abs(patrimonioChange - movementValue);
                
                // If the Portfolio change is within 5% of the movement value, it's likely the right day
                if (diffVal <= (Math.abs(movementValue) * approxTolerancePercent)) {
                    // Only record if we don't have a better approx match yet
                    if (!sameDayApproxMatch || diffVal < sameDayApproxMatch.diff) {
                        sameDayApproxMatch = {
                            date: nextPortfolio.date,
                            type: 'approx_total',
                            diff: diffVal
                        };
                    }
                }
            }

            // Track purely the closest date as a fallback
            if (daysDiff < smallestDayDiff) {
                smallestDayDiff = daysDiff;
                bestClosestMatch = {
                    date: nextPortfolio.date,
                    type: 'closest',
                    diff: daysDiff
                };
            }
        }

        // --- SELECTION PRIORITY ---
        // 1. Exact Value match on the Same Date (Ideal)
        // 2. Approximate Value match on the Same Date (Fixes your issue: 50k deposit vs 50.5k portfolio change)
        // 3. Exact Value match on a Different Date (Bank delays)
        // 4. Closest Date fallback
        
        let finalMatch = null;

        if (sameDayExactMatch) {
            finalMatch = sameDayExactMatch;
        } else if (sameDayApproxMatch) {
            finalMatch = sameDayApproxMatch;
        } else if (windowExactMatch) {
            finalMatch = windowExactMatch;
        } else {
            finalMatch = bestClosestMatch;
        }

        if (finalMatch) {
            alignedMovements.push({
                date: finalMatch.date,
                value: movementValue,
                originalDate: movement.date,
                matchedType: finalMatch.type
            });
        } else {
            // Should theoretically not reach here if portfolio exists, but acts as safety net
            alignedMovements.push({
                date: movement.date,
                value: movementValue,
                originalDate: movement.date,
                matchedType: 'none'
            });
            console.log(`Warning: No match found for ${movement.date}`);
        }
    });

    return alignedMovements;
}

export function calculateStats(portfolioData, alignedMovements) {
    if (!portfolioData || portfolioData.length === 0) {
        return {
            dailyGains: [],
            totalGainLoss: 0,
            totalGainLossPercentage: 0,
            totalTwrr: 0,
            cagr: 0,
            totalInvestments: 0,
            patrimonyInitial: 0,
            patrimonyFinal: 0,
            totalMovements: 0
        };
    }

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
                totalValue: currentPatrimonio,
                twrr: cumulativeTWRR - 1
            });
        }
        previousPatrimonio = day.patrimonio;
    });

    let totalGainLossPercentage = 0;
    if (weightedAverageCapital !== 0) {
        totalGainLossPercentage = cumulativeGainLoss / weightedAverageCapital;
    }

    let cagr = null;
    if (totalDays > 0) {
        const startDate = new Date(portfolioData[0].date.split('/').reverse().join('-'));
        const endDate = new Date(portfolioData[portfolioData.length - 1].date.split('/').reverse().join('-'));
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        const monthsInPeriod = diffDays / 30.4375;

        if (monthsInPeriod >= 1) {
            cagr = Math.pow(cumulativeTWRR, 12 / monthsInPeriod) - 1;
        }
    }

    return {
        dailyGains,
        totalGainLoss: cumulativeGainLoss,
        totalGainLossPercentage,
        totalTwrr: cumulativeTWRR - 1,
        cagr,
        totalInvestments: cumulativeInvestment,
        patrimonyInitial: portfolioData[0].patrimonio,
        patrimonyFinal: portfolioData[portfolioData.length - 1].patrimonio,
        totalMovements: alignedMovements.reduce((sum, m) => sum + m.value, 0)
    };
}

export function findMaxGainAndLoss(dailyGains) {
    if (!dailyGains || dailyGains.length === 0) {
        return {
            maxGain: { date: null, gainLoss: 0 },
            maxLoss: { date: null, gainLoss: 0 }
        };
    }

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