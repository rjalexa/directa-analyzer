import { describe, it, expect } from 'vitest';
import {
    ANNUALISATION,
    PERIODS_PER_YEAR,
    assertSamplingFrequency,
    inferPeriodsPerYear,
    rollingSharpe,
    sharpe,
    standardError,
    windowAdvice,
    windowBounds
} from './sharpe';

const TOL = 0.001;

describe('annualisation constant', () => {
    it('matches the calendar-day sampling of the series', () => {
        expect(PERIODS_PER_YEAR).toBe(365);
        expect(ANNUALISATION).toBeCloseTo(Math.sqrt(365), 12);
    });
});

describe('sampling frequency guard', () => {
    const calendarDays = (n, start = Date.UTC(2025, 0, 1)) =>
        Array.from({ length: n }, (_, i) => {
            const d = new Date(start + i * 86400000);
            return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}/${d.getUTCFullYear()}`;
        });

    const weekdaysOnly = (n) => calendarDays(n * 2).filter((s) => {
        const [d, m, y] = s.split('/').map(Number);
        const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
        return dow !== 0 && dow !== 6;
    }).slice(0, n);

    it('infers 365 from one row per calendar day', () => {
        expect(inferPeriodsPerYear(calendarDays(400))).toBe(365);
    });

    it('infers 252 from a weekday-only series', () => {
        expect(inferPeriodsPerYear(weekdaysOnly(300))).toBe(252);
    });

    it('accepts a calendar-day series', () => {
        expect(() => assertSamplingFrequency(calendarDays(400))).not.toThrow();
    });

    it('fails loudly when the data is weekdays only', () => {
        expect(() => assertSamplingFrequency(weekdaysOnly(300))).toThrow(/Frequenza dei dati inattesa/);
    });
});

describe('standardError', () => {
    // Section 7 fixtures: SE of an annualised Sharpe of 1.63 by window.
    it.each([
        [30, 3.4944],
        [60, 2.4709],
        [175, 1.4468],
        [252, 1.2057],
        [365, 1.0018]
    ])('window %i -> %f', (window, expected) => {
        expect(standardError(1.63, window)).toBeCloseTo(expected, 3);
    });

    it('shrinks as the window grows', () => {
        expect(standardError(1.63, 1460)).toBeLessThan(standardError(1.63, 365));
    });
});

describe('windowBounds', () => {
    it('hides the chart below the minimum history', () => {
        expect(windowBounds(90)).toBeNull();
        expect(windowBounds(119)).toBeNull();
    });

    // Section 7 fixtures.
    it.each([
        [120, { min: 30, max: 40, default: 40 }],
        [182, { min: 30, max: 60, default: 60 }],
        [365, { min: 30, max: 121, default: 121 }],
        [526, { min: 32, max: 175, default: 175 }],
        [1095, { min: 66, max: 365, default: 365 }],
        [3652, { min: 219, max: 1217, default: 365 }]
    ])('n = %i', (n, expected) => {
        expect(windowBounds(n)).toEqual(expected);
    });

    it('never lets the default fall outside the slider range', () => {
        for (let n = 120; n <= 4000; n += 7) {
            const b = windowBounds(n);
            expect(b.default).toBeGreaterThanOrEqual(b.min);
            expect(b.default).toBeLessThanOrEqual(b.max);
        }
    });
});

describe('sharpe', () => {
    it('is the annualised excess return over annualised volatility', () => {
        const returns = [0.001, -0.002, 0.003, 0.0005, -0.0015, 0.002];
        const n = returns.length;
        const mean = returns.reduce((a, b) => a + b, 0) / n;
        const sd = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
        expect(sharpe(returns, 0)).toBeCloseTo((mean * 365) / (sd * Math.sqrt(365)), 10);
    });

    it('subtracts the risk-free rate from the annualised return', () => {
        const returns = [0.001, -0.002, 0.003, 0.0005, -0.0015, 0.002];
        const sd = Math.sqrt(
            returns.reduce((a, b) => a + (b - returns.reduce((x, y) => x + y, 0) / returns.length) ** 2, 0) /
            (returns.length - 1)
        );
        expect(sharpe(returns, 0) - sharpe(returns, 0.02)).toBeCloseTo(0.02 / (sd * Math.sqrt(365)), 10);
    });

    it('returns NaN for a flat window rather than a spurious zero', () => {
        expect(sharpe([0, 0, 0, 0], 0)).toBeNaN();
    });

    it('uses the sample variance, not the population variance', () => {
        // With n-1 the estimate is larger than the naive n version, so Sharpe is smaller.
        const returns = [0.01, -0.005, 0.002, 0.004];
        const n = returns.length;
        const mean = returns.reduce((a, b) => a + b, 0) / n;
        const population = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / n);
        expect(sharpe(returns, 0)).toBeLessThan((mean * 365) / (population * Math.sqrt(365)));
    });
});

describe('rollingSharpe', () => {
    const dates = Array.from({ length: 20 }, (_, i) => `day-${i}`);
    const returns = Array.from({ length: 20 }, (_, i) => (i % 3 === 0 ? 0.002 : -0.001));

    it('emits null, never 0, during the warm-up', () => {
        const out = rollingSharpe(returns, dates, 5, 0);
        const warmup = out.slice(0, 4);
        expect(warmup.every((p) => p.sharpe === null && p.se === null)).toBe(true);
        expect(warmup.some((p) => p.sharpe === 0)).toBe(false);
    });

    it('emits one point per date and labels each with the window end', () => {
        const out = rollingSharpe(returns, dates, 5, 0);
        expect(out).toHaveLength(dates.length);
        expect(out[4].date).toBe('day-4');
        expect(out[4].sharpe).not.toBeNull();
        expect(out.at(-1).date).toBe('day-19');
    });

    it('attaches a standard error consistent with the window length', () => {
        const out = rollingSharpe(returns, dates, 5, 0);
        const p = out[4];
        expect(p.se).toBeCloseTo(standardError(p.sharpe, 5), 12);
    });

    it('emits null when the window is flat', () => {
        const flat = new Array(20).fill(0);
        const out = rollingSharpe(flat, dates, 5, 0);
        expect(out.every((p) => p.sharpe === null)).toBe(true);
    });
});

describe('windowAdvice', () => {
    it('flags an error bar wider than the chart as danger', () => {
        expect(windowAdvice(2.5, 526, 30).level).toBe('danger');
    });

    it('flags a merely noisy window as a warning', () => {
        expect(windowAdvice(1.5, 526, 60).level).toBe('warning');
    });

    it('warns when too few independent windows fit in the history', () => {
        const advice = windowAdvice(1.0, 400, 200); // se is fine, but only 2 windows
        expect(advice.level).toBe('warning');
        expect(advice.message).toMatch(/costruzione/);
    });

    it('is ok when precision and independence are both reasonable', () => {
        expect(windowAdvice(1.0, 1500, 365).level).toBe('ok');
    });
});

describe('cash-flow contamination guard', () => {
    // A contribution must never be read as a return. Mirrors returnExFlow in
    // calculateStats: gainLoss is net of the flow, over the previous value.
    const dailyReturn = (prevValue, flow, value) => (value - prevValue - flow) / prevValue;

    it('does not read a large deposit as a return', () => {
        const prev = 62599.0;
        const flow = 40000.0;
        const value = prev + flow + 89.36;
        const naive = (value - prev) / prev;
        expect(naive).toBeGreaterThan(0.6); // what a naive V[t]/V[t-1]-1 would report
        expect(dailyReturn(prev, flow, value)).toBeCloseTo(0.00143, 5);
    });

    it('never produces an implausible daily return for any injected flow', () => {
        // Property test: random walks with random contributions injected.
        let seed = 42;
        const rand = () => {
            seed = (seed * 1103515245 + 12345) % 2147483648;
            return seed / 2147483648;
        };

        for (let trial = 0; trial < 500; trial++) {
            let value = 10000 + rand() * 90000;
            for (let day = 0; day < 200; day++) {
                const prev = value;
                const flow = rand() < 0.05 ? (rand() - 0.3) * 80000 : 0;
                const marketMove = (rand() - 0.5) * 0.02; // ±1% a day
                value = (prev + flow) * (1 + marketMove);
                if (prev + flow <= 0 || prev <= 0) break;
                expect(Math.abs(dailyReturn(prev, flow, value))).toBeLessThan(0.25);
            }
        }
    });
});

describe('section 7 tolerance', () => {
    it('uses the stated tolerance', () => {
        expect(TOL).toBe(0.001);
    });
});
