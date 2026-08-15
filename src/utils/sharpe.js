/**
 * Sharpe ratio maths for the rolling Sharpe card.
 *
 * Everything in the Sharpe path lives here so the annualisation convention is
 * defined exactly once. Do not hard-code 252 or 365 anywhere else.
 */

// Periods per year for the return series. The series is calendar-daily
// (weekends present as zero-return rows), so this is 365, not 252.
export const PERIODS_PER_YEAR = 365;
export const ANNUALISATION = Math.sqrt(PERIODS_PER_YEAR);

// Below this many daily returns the chart is not rendered at all.
export const MIN_HISTORY = 120;

// Annual risk-free rate subtracted by default. Roughly the EUR short rate
// (ECB deposit facility / €STR); the user can override it in the card.
export const DEFAULT_RISK_FREE = 0.02;

const MS_PER_DAY = 86400000;
const DAYS_PER_MONTH = 30.4375;

/** Parse the internal "DD/MM/YYYY" format to a UTC timestamp (DST-safe). */
function toUtcMs(dateStr) {
    const [day, month, year] = String(dateStr).split('/').map(Number);
    return Date.UTC(year, month - 1, day);
}

/**
 * Average spacing between consecutive rows, in days.
 *
 * Deliberately the mean and not the median: a weekday-only series has gaps of
 * 1,1,1,1,3 repeating, whose median is 1 — identical to a calendar-day series.
 * Only the mean separates them (1.0 calendar vs 7/5 = 1.4 weekdays-only).
 */
export function meanGapDays(dates) {
    if (!dates || dates.length < 2) return NaN;
    const span = toUtcMs(dates[dates.length - 1]) - toUtcMs(dates[0]);
    return span / MS_PER_DAY / (dates.length - 1);
}

/** Periods per year implied by the row spacing, or null if neither convention fits. */
export function inferPeriodsPerYear(dates) {
    const gap = meanGapDays(dates);
    if (!Number.isFinite(gap)) return null;
    if (gap < 1.15) return 365; // one row per calendar day
    if (gap < 1.7) return 252; // weekdays only
    return null;
}

/**
 * Fail loudly at ingest if the data's sampling frequency does not match the
 * annualisation constant, rather than silently producing a wrong ratio.
 */
export function assertSamplingFrequency(dates) {
    if (!dates || dates.length < 2) return;
    const inferred = inferPeriodsPerYear(dates);
    if (inferred === PERIODS_PER_YEAR) return;

    const gap = meanGapDays(dates).toFixed(2);
    throw new Error(
        `Frequenza dei dati inattesa: una riga ogni ${gap} giorni in media ` +
        `(attese ${PERIODS_PER_YEAR} osservazioni/anno). ` +
        `Aggiornare PERIODS_PER_YEAR in src/utils/sharpe.js prima di fidarsi dello Sharpe ratio.`
    );
}

/**
 * Per-period returns, net of cash flows.
 *
 * Uses returnExFlow from calculateStats: gainLoss is already the market move
 * with the contribution removed, over the previous day's value. A deposit
 * therefore cannot register as a return.
 */
export function toDailyReturns(dailyGains) {
    return dailyGains.map((day) => day.returnExFlow ?? 0);
}

/** Annualised Sharpe ratio of a return window. NaN when it is undefined. */
export function sharpe(returns, rfAnnual) {
    const n = returns.length;
    if (n < 2) return NaN;
    const mean = returns.reduce((a, b) => a + b, 0) / n;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
    const sd = Math.sqrt(variance);
    if (sd <= 0) return NaN;
    return (mean * PERIODS_PER_YEAR - rfAnnual) / (sd * ANNUALISATION);
}

/**
 * Standard error of an annualised Sharpe estimated from `window` observations
 * (Lo, 2002, IID case).
 *
 * Real returns are mildly autocorrelated and fat-tailed, so the true error is
 * wider than this. Treat the band as a floor, not a ceiling.
 */
export function standardError(sharpeAnnual, window) {
    const perPeriod = sharpeAnnual / ANNUALISATION;
    return Math.sqrt((1 + perPeriod ** 2 / 2) / window) * ANNUALISATION;
}

/**
 * Rolling Sharpe over a trailing window, one point per date.
 * The warm-up period emits null, never 0 — a zero would read as a real value.
 */
export function rollingSharpe(returns, dates, window, rfAnnual) {
    return dates.map((date, i) => {
        if (i < window - 1) return { date, sharpe: null, se: null };
        const w = returns.slice(i - window + 1, i + 1);
        const s = sharpe(w, rfAnnual);
        return Number.isFinite(s)
            ? { date, sharpe: s, se: standardError(s, window) }
            : { date, sharpe: null, se: null };
    });
}

/**
 * Slider bounds from history length, balancing two independent constraints:
 * precision (a standard deviation needs observations) against independence
 * (a window of W leaves only N/W non-overlapping periods, and below ~3 the
 * line is smooth by construction rather than because the portfolio is stable).
 *
 * Returns null when there is too little history to plot at all.
 */
export function windowBounds(n) {
    if (n < MIN_HISTORY) return null;
    const min = Math.max(30, Math.round(n * 0.06));
    const max = Math.max(min + 10, Math.floor(n / 3));
    const def = max >= 180 ? Math.min(365, max) : max;
    return { min, max, default: def };
}

/** Status line driven by the error bar and the number of independent windows. */
export function windowAdvice(se, n, window) {
    const independent = n / window;
    if (se > 2.0) return {
        level: 'danger',
        message: "L'intervallo di errore è più ampio dell'intero grafico: questa linea non può rilevare un cambiamento di abilità."
    };
    if (se > 1.2) return {
        level: 'warning',
        message: 'Molto rumoroso: oscillazioni di ±2 sono attese anche se nulla è realmente cambiato.'
    };
    if (independent < 3) return {
        level: 'warning',
        message: 'Finestra lunga rispetto allo storico: i punti adiacenti condividono quasi tutti i dati, quindi la linea appare stabile per costruzione.'
    };
    return {
        level: 'ok',
        message: 'Buon equilibrio fra precisione e indipendenza per questa lunghezza di storico.'
    };
}

/** "175 g · 5,7 mesi" — days alone are misleading on a calendar-day series. */
export function formatWindow(days) {
    const months = days / DAYS_PER_MONTH;
    return `${days} g · ${months.toLocaleString('it-IT', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    })} mesi`;
}
