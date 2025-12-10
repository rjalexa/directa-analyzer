# Test Portfolio - Expected Values Documentation

## Overview

This test file simulates a 3-month portfolio (Jan 1 - Mar 31, 2025) with predictable, 
easy-to-verify patterns designed to validate your portfolio analyzer calculations.

---

## Data Structure

### Movements (Deposits)
| Date       | Amount   | Description                |
|------------|----------|----------------------------|
| 01/01/2025 | 10,000 € | Initial deposit            |
| 01/02/2025 | 10,000 € | Second monthly deposit     |
| 01/03/2025 | 10,000 € | Third monthly deposit      |

**Total Movements: 30,000 €**

---

## Monthly Performance Patterns

### January: Steady +10% gain (no new deposits during month)
- Start: 10,000 € (Jan 1)
- End: 11,000 € (Jan 31)
- Pattern: +100 € every ~3 days (1% increments)
- **Monthly Return: +10.00%**
- Gain: +1,000 €

### February: Steady -8% loss (after deposit on Feb 1)
- Start of period: 21,000 € (11,000 portfolio + 10,000 deposit on Feb 1)
- End: 19,320 € (Feb 28)
- Pattern: -210 € every ~3 days (-1% of 21,000)
- **Monthly Return: -8.00%** (on the 21,000 base)
- Loss: -1,680 €

### March: Steady +1% per week gain (after deposit on Mar 1)
- Start of period: 29,320 € (19,320 portfolio + 10,000 deposit on Mar 1)
- End: 33,038.51 € (Mar 31)
- Pattern: +1% compounding weekly (4 weeks + extra days)
- Approximate weekly multiplier: 1.01
- **Monthly Return: ~12.68%** (calculated as 33,038.51 / 29,320 - 1)
- Gain: +3,718.51 €

---

## Expected Aggregate Metrics

### Basic Metrics
| Metric                  | Expected Value    | Calculation                              |
|-------------------------|-------------------|------------------------------------------|
| Patrimonio Iniziale     | 10,000.00 €       | First day value                          |
| Patrimonio Totale       | 33,038.51 €       | Last day value                           |
| Movimenti Cumulativi    | 30,000.00 €       | Sum of all deposits                      |
| G/L Totale              | 3,038.51 €        | 33,038.51 - 30,000                       |
| G/L %                   | 10.13%            | 3,038.51 / 30,000 (simple return on invested) |

### Time-Weighted Return (TWRR)

TWRR eliminates the effect of cash flows. We calculate sub-period returns:

**Period 1: Jan 1 → Jan 31** (before Feb 1 deposit)
- Start: 10,000 €
- End: 11,000 €
- Return: 11,000 / 10,000 = 1.10 (+10%)

**Period 2: Feb 1 → Feb 28** (before Mar 1 deposit)
- Start: 21,000 € (11,000 + 10,000 deposit)
- End: 19,320 €
- Return: 19,320 / 21,000 = 0.92 (-8%)

**Period 3: Mar 1 → Mar 31**
- Start: 29,320 € (19,320 + 10,000 deposit)
- End: 33,038.51 €
- Return: 33,038.51 / 29,320 = 1.1268 (+12.68%)

**TWRR = (1.10 × 0.92 × 1.1268) - 1 = 1.1403 - 1 = 14.03%**

### CAGR (Compound Annual Growth Rate)

Period: 90 days (Jan 1 to Mar 31)
TWRR for period: 14.03%

**CAGR = (1 + TWRR)^(365/90) - 1 = (1.1403)^4.056 - 1 = 70.08%**

(This high CAGR reflects annualizing a strong 3-month period)

---

## Performance Extremes

### Best Daily Performance
| Metric        | Expected Value |
|---------------|----------------|
| Date          | 04/03/2025     |
| Amount        | +293.20 €      |
| Calculation   | 29,613.20 - 29,320.00 (first +1% after March deposit) |

### Worst Daily Performance  
| Metric        | Expected Value |
|---------------|----------------|
| Date          | 03/02/2025     |
| Amount        | -210.00 €      |
| Calculation   | 20,790 - 21,000 (first -1% drop in February) |

### Best Consecutive Gain Streak
| Metric        | Expected Value |
|---------------|----------------|
| Period        | 04/03/2025 - 31/03/2025 |
| Days          | 28 days (entire March gains) |
| Amount        | +3,718.51 €    |

### Worst Consecutive Loss Streak
| Metric        | Expected Value |
|---------------|----------------|
| Period        | 03/02/2025 - 27/02/2025 |
| Days          | 25 days (entire February decline) |
| Amount        | -1,680.00 €    |

---

## Drawdown Analysis

### Maximum Drawdown
The portfolio never exceeds its Jan 31 peak of 11,000 € until mid-March.

- Peak before drawdown: 11,000 € (Jan 31)
- Trough (excluding deposits): 19,320 € on Feb 28, but this includes 10,000 deposit
- Actual portfolio trough: The original 11,000 dropped to 9,320 € equivalent
- **Max Drawdown: -1,680 € or -15.27%** (from 11,000 peak)

However, if calculating drawdown on total patrimony (including deposits):
- Peak: 21,000 € (Feb 1, right after deposit)
- Trough: 19,320 € (Feb 28)
- **Max Drawdown on Patrimony: -1,680 € or -8.00%**

### Recovery Time
- Drawdown starts: Feb 3 (first drop below 21,000)
- Original value recovered: When patrimony exceeds 21,000 again
- Looking at March: 29,320 → needs to check when portfolio alone exceeds 11,000
- On Mar 1: Portfolio is 19,320, which is 9,320 of original + contributions
- The original 10,000 invested is now worth: 19,320 - 10,000 (Feb) = 9,320
- Recovery happens when: portfolio grows enough that original investment recovers
- By Mar 31: 33,038.51 total, original 10,000 now worth approximately 11,013 €
- **Recovery completed around: Mar 31 (approximately)**
- **Max Recovery Time: ~56 days** (Feb 3 to late March)

---

## Additional Calculable Metrics

### Volatility (Daily Standard Deviation)
Based on daily returns, approximate values:
- January: Low volatility (~0.3% daily when gains occur)
- February: Low volatility (~0.3% daily when losses occur)  
- March: Low volatility (~0.3% daily when gains occur)
- **Overall daily volatility: ~0.5-0.7%** (varies based on calculation method)

### Cash Drag
- Jan 1: 100% cash (10,000 in liquidity, 0 in portfolio)
- Jan 2 onwards: 0% cash (all invested)
- Feb 1: Brief cash (10,000 deposit), immediately invested Feb 2
- Mar 1: Brief cash (10,000 deposit), immediately invested Mar 2
- **Average Cash Allocation: ~1-2%** (minimal drag)

### Sharpe Ratio (assuming 4% annual risk-free rate)
- Excess return: 70.08% CAGR - 4% = 66.08%
- Annualized volatility: ~8-11% (daily vol × √252)
- **Approximate Sharpe: 6-8** (unrealistically high due to synthetic data)

---

## Validation Checklist

Use this checklist to verify your app's calculations:

- [ ] Patrimonio Iniziale = 10,000.00 €
- [ ] Patrimonio Totale = 33,038.51 €
- [ ] Movimenti Cumulativi = 30,000.00 €
- [ ] G/L Totale = 3,038.51 €
- [ ] G/L % ≈ 10.13%
- [ ] TWRR ≈ 14.03%
- [ ] CAGR ≈ 70% (annualized from 90 days)
- [ ] Best Daily Gain = +293.20 € on 04/03/2025
- [ ] Worst Daily Loss = -210.00 € on 03/02/2025
- [ ] Max Drawdown ≈ -8.00% (on patrimony basis)

---

## Notes on Test Design

1. **Weekends included**: Values stay flat on weekends (Sat/Sun) to simulate market closures
2. **Clean percentages**: Used round 1% increments for easy mental math
3. **Three distinct phases**: Up → Down → Up pattern tests various scenarios
4. **Regular deposits**: Monthly deposits on the 1st test TWRR calculation accuracy
5. **No fees/taxes**: Simplified for calculation verification

---

## Formula Reference

### TWRR (Time-Weighted Rate of Return)
```
TWRR = ∏(1 + Ri) - 1

Where Ri = (Ending Value before cash flow) / (Beginning Value after cash flow) - 1
```

### CAGR
```
CAGR = (Ending Value / Beginning Value)^(365/days) - 1

For TWRR-based: CAGR = (1 + TWRR)^(365/days) - 1
```

### Maximum Drawdown
```
DD = (Trough Value - Peak Value) / Peak Value

Max DD = minimum of all DD values in the period
```
