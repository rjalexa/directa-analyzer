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

// Rolling Sharpe now lives in src/utils/sharpe.js, which centralises the
// annualisation convention and the risk-free rate.

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