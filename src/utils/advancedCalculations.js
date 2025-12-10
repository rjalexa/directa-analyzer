export function calculateDrawdowns(dailyGains) {
    let peak = -Infinity;
    const drawdowns = dailyGains.map(day => {
        // Assuming twrr is the cumulative return (e.g., 0.05 for 5%)
        // We convert to an index starting at 1.
        const currentValue = 1 + day.twrr;
        
        if (currentValue > peak) {
            peak = currentValue;
        }
        
        const drawdown = (currentValue - peak) / peak;
        return {
            date: day.date,
            drawdown: drawdown * 100 // Convert to percentage
        };
    });
    return drawdowns;
}

export function calculateRollingSharpe(dailyGains, windowSize = 60) {
    const rollingSharpe = [];
    
    // We need daily returns, not cumulative.
    // dailyGains has cumulativeTWRR.
    // Daily Return[i] = (1 + TWRR[i]) / (1 + TWRR[i-1]) - 1
    
    const dailyReturns = dailyGains.map((day, index) => {
        if (index === 0) {
            // For the first day, we can assume the return is (1 + twrr) - 1 if start was 0
            return day.twrr; 
        }
        const prevCum = 1 + dailyGains[index - 1].twrr;
        const currCum = 1 + day.twrr;
        return (currCum / prevCum) - 1;
    });

    for (let i = windowSize; i < dailyGains.length; i++) {
        const windowReturns = dailyReturns.slice(i - windowSize, i);
        
        const averageReturn = windowReturns.reduce((sum, val) => sum + val, 0) / windowSize;
        
        const variance = windowReturns.reduce((sum, val) => sum + Math.pow(val - averageReturn, 2), 0) / windowSize;
        const stdDev = Math.sqrt(variance);
        
        // Annualize (assuming 252 trading days)
        // Sharpe = (Avg Daily Return - Risk Free) / Std Dev
        // We'll assume Risk Free = 0
        
        let sharpe = 0;
        if (stdDev !== 0) {
            // Annualized Sharpe = Daily Sharpe * sqrt(252)
            // Daily Sharpe = Avg Daily Return / Daily Std Dev
            sharpe = (averageReturn / stdDev) * Math.sqrt(252);
        }
        
        rollingSharpe.push({
            date: dailyGains[i].date,
            sharpe: sharpe
        });
    }
    
    return rollingSharpe;
}

export function calculateMonthlyReturns(dailyGains) {
    const monthlyReturns = {};
    
    // Group by Year-Month
    dailyGains.forEach((day, index) => {
        const [, m, y] = day.date.split('/');
        const key = `${y}-${m}`;
        
        if (!monthlyReturns[key]) {
            monthlyReturns[key] = {
                year: parseInt(y),
                month: parseInt(m),
                startTwrr: index > 0 ? dailyGains[index - 1].twrr : 0,
                endTwrr: day.twrr
            };
        } else {
            monthlyReturns[key].endTwrr = day.twrr;
        }
    });
    
    // Calculate return for each month
    // Return = (1 + EndCum) / (1 + StartCum) - 1
    const results = Object.values(monthlyReturns).map(month => {
        const startVal = 1 + month.startTwrr;
        const endVal = 1 + month.endTwrr;
        const monthlyReturn = (endVal / startVal) - 1;
        
        return {
            year: month.year,
            month: month.month,
            value: monthlyReturn * 100 // Percentage
        };
    });
    
    return results;
}