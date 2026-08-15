/**
 * Section 7 regression fixtures, checked against a real Directa export.
 *
 * The export lives in data/, which is gitignored because it is personal
 * financial data, so these tests skip themselves when it is absent (CI, fresh
 * clones). The pure-function fixtures in sharpe.test.js always run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { parseCSVContent } from './csvParser';
import { alignMovementDates, calculateStats } from './calculations';
import {
    ANNUALISATION,
    PERIODS_PER_YEAR,
    rollingSharpe,
    sharpe,
    toDailyReturns
} from './sharpe';

const TOL = 0.001;
const DATA_DIR = path.resolve(process.cwd(), 'data');

function findExport() {
    if (!fs.existsSync(DATA_DIR)) return null;
    const candidates = fs
        .readdirSync(DATA_DIR)
        .filter((f) => /^PatrimonioTotale_.*\.csv$/i.test(f))
        .sort();
    return candidates.length ? path.join(DATA_DIR, candidates[candidates.length - 1]) : null;
}

const exportPath = findExport();

function loadReturns() {
    const { portfolioData, movimentiData } = parseCSVContent(fs.readFileSync(exportPath, 'utf8'));
    const stats = calculateStats(portfolioData, alignMovementDates(portfolioData, movimentiData));
    return {
        returns: toDailyReturns(stats.dailyGains),
        dates: stats.dailyGains.map((d) => d.date)
    };
}

describe.skipIf(!exportPath)('section 7 fixtures (real 526-day export)', () => {
    it('has the expected history length', () => {
        expect(loadReturns().returns).toHaveLength(526);
    });

    it('matches the full-sample figures', () => {
        const { returns } = loadReturns();
        const n = returns.length;
        const mean = returns.reduce((a, b) => a + b, 0) / n;
        const sd = Math.sqrt(returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));

        expect(mean * PERIODS_PER_YEAR).toBeCloseTo(0.107209, 3);
        expect(sd * ANNUALISATION).toBeCloseTo(0.065812, 3);
        expect(sharpe(returns, 0)).toBeCloseTo(1.629, 3);
        expect(sharpe(returns, 0.02)).toBeCloseTo(1.3251, 3);
    });

    it.each([
        [60, '15/08/2026', 1.9825],
        [60, '27/02/2026', 5.6728],
        [60, '14/11/2025', 2.7574],
        [175, '15/08/2026', 0.7616],
        [175, '27/02/2026', 3.9735],
        [252, '15/08/2026', 1.5053],
        [252, '14/11/2025', 2.0036]
    ])('rolling window %i at %s', (window, date, expected) => {
        const { returns, dates } = loadReturns();
        const point = rollingSharpe(returns, dates, window, 0).find((p) => p.date === date);
        expect(point, `date ${date} missing from the export`).toBeDefined();
        expect(point.sharpe).toBeCloseTo(expected, 3);
    });

    it('never reads a contribution as a return', () => {
        // 24 real movements, including a 40k deposit, are in this history.
        const { returns } = loadReturns();
        expect(Math.max(...returns.map(Math.abs))).toBeLessThan(0.25);
    });

    it('is sampled on calendar days, matching the annualisation constant', () => {
        expect(PERIODS_PER_YEAR).toBe(365);
        const { returns } = loadReturns();
        const flat = returns.filter((r) => Math.abs(r) < 1e-12).length;
        // Weekends are present as zero-return rows, roughly 2 days in 7.
        expect(flat / returns.length).toBeGreaterThan(0.25);
        expect(TOL).toBe(0.001);
    });
});
