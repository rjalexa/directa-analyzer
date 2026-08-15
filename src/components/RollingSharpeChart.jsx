import React, { useMemo, useState } from 'react';
import { Info } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
    DEFAULT_RISK_FREE,
    MIN_HISTORY,
    formatWindow,
    rollingSharpe,
    sharpe,
    toDailyReturns,
    windowAdvice,
    windowBounds
} from '../utils/sharpe';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Title,
    Tooltip,
    Legend
);

const LINE_COLOR = 'rgb(147, 51, 234)'; // purple-600
const BAND_COLOR = 'rgba(147, 51, 234, 0.13)';
const REFERENCE_COLOR = 'rgb(107, 114, 128)'; // gray-500

const ADVICE_STYLES = {
    danger: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-amber-50 text-amber-900 border-amber-200',
    ok: 'bg-emerald-50 text-emerald-900 border-emerald-200'
};

const formatRatio = (value) =>
    Number.isFinite(value)
        ? value.toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : 'n/d';

export function RollingSharpeChart({ dailyGains, referenceChartHiddenDatasets = [] }) {
    const [showInfo, setShowInfo] = useState(false);
    const [riskFreePercent, setRiskFreePercent] = useState(DEFAULT_RISK_FREE * 100);

    const returns = useMemo(() => toDailyReturns(dailyGains), [dailyGains]);
    const bounds = useMemo(() => windowBounds(returns.length), [returns.length]);

    // null means "untouched, use the default for this history length". Deriving
    // the effective window keeps it valid when a new file or date filter moves
    // the bounds, without an effect that would re-render to correct itself.
    const [chosenWindow, setWindow] = useState(null);
    const windowDays = useMemo(() => {
        if (!bounds) return 0;
        if (chosenWindow === null) return bounds.default;
        return Math.min(bounds.max, Math.max(bounds.min, chosenWindow));
    }, [bounds, chosenWindow]);

    const riskFree = riskFreePercent / 100;

    const series = useMemo(() => {
        if (!bounds) return [];
        return rollingSharpe(returns, dailyGains.map((d) => d.date), windowDays, riskFree);
    }, [returns, dailyGains, windowDays, riskFree, bounds]);

    const fullSample = useMemo(
        () => (bounds ? sharpe(returns, riskFree) : NaN),
        [returns, riskFree, bounds]
    );

    // The error bar is the same for every point at a given window, so the last
    // valid reading is representative for the advice line.
    const latestSe = useMemo(() => {
        const withSe = series.filter((p) => p.se !== null);
        return withSe.length ? withSe[withSe.length - 1].se : null;
    }, [series]);

    const advice = latestSe === null ? null : windowAdvice(latestSe, returns.length, windowDays);

    // Align the plot area with PerformanceChart's fixed left width (130px).
    const isMovimentiHidden = referenceChartHiddenDatasets.includes(2);
    const isPatrimonioHidden = referenceChartHiddenDatasets.includes(3);
    const showY1 = !(isMovimentiHidden && isPatrimonioHidden);
    const myAxisWidth = 50;
    const paddingLeft = 130 - myAxisWidth;
    const paddingRight = showY1 ? 80 : 0;

    const data = useMemo(() => {
        const upper = series.map((p) => (p.sharpe === null ? null : p.sharpe + 1.96 * p.se));
        const lower = series.map((p) => (p.sharpe === null ? null : p.sharpe - 1.96 * p.se));

        return {
            labels: series.map((p) => p.date),
            datasets: [
                {
                    label: 'Limite superiore (95%)',
                    data: upper,
                    borderColor: 'transparent',
                    backgroundColor: BAND_COLOR,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: '+1',
                    order: 3
                },
                {
                    label: 'Limite inferiore (95%)',
                    data: lower,
                    borderColor: 'transparent',
                    backgroundColor: BAND_COLOR,
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: false,
                    order: 3
                },
                {
                    label: 'Sharpe ratio sull’intero periodo',
                    data: series.map(() => (Number.isFinite(fullSample) ? fullSample : null)),
                    borderColor: REFERENCE_COLOR,
                    borderWidth: 1.5,
                    borderDash: [6, 4],
                    pointRadius: 0,
                    pointHoverRadius: 0,
                    fill: false,
                    order: 2
                },
                {
                    label: `Sharpe ratio (${windowDays} g)`,
                    data: series.map((p) => p.sharpe),
                    borderColor: LINE_COLOR,
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    tension: 0.1,
                    spanGaps: false,
                    order: 1
                }
            ]
        };
    }, [series, fullSample, windowDays]);

    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { left: paddingLeft, right: paddingRight } },
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: { display: false },
            title: { display: false },
            tooltip: {
                filter: (item) => item.datasetIndex >= 2,
                callbacks: {
                    label: (item) => {
                        if (item.datasetIndex === 2) {
                            return `Intero periodo: ${formatRatio(item.parsed.y)}`;
                        }
                        const point = series[item.dataIndex];
                        if (!point || point.sharpe === null) return null;
                        const margin = 1.96 * point.se;
                        return `Sharpe: ${formatRatio(point.sharpe)} ± ${formatRatio(margin)} (95%)`;
                    }
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { maxTicksLimit: 8 } },
            y: {
                grid: { color: '#f3f4f6' },
                afterFit: (axis) => { axis.width = myAxisWidth; }
            }
        }
    }), [paddingLeft, paddingRight, series]);

    if (!bounds) {
        return (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Sharpe Ratio Mobile</h3>
                <div className="h-[200px] flex items-center justify-center text-center px-6">
                    <p className="text-sm text-gray-500 max-w-md">
                        Lo Sharpe ratio mobile richiede circa 4 mesi di storico
                        ({MIN_HISTORY} giorni). Il periodo selezionato ne contiene {returns.length}.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">Sharpe Ratio Mobile</h3>
                <div
                    className="relative"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    onClick={() => setShowInfo(!showInfo)}
                >
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    {showInfo && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-96 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 font-normal">
                            <p className="font-bold mb-1">Cos&apos;è questo grafico?</p>
                            <p>
                                Lo Sharpe ratio misura il rendimento in eccesso rispetto al tasso privo
                                di rischio, corretto per la volatilità. Qui è calcolato su una finestra
                                mobile: ogni punto usa i {windowDays} giorni che terminano in quella data.
                            </p>
                            <p className="mt-2">
                                La banda ombreggiata è l&apos;intervallo di confidenza al 95%. È larga
                                perché stimare uno Sharpe ratio richiede molti dati: se la banda copre
                                gran parte del grafico, le oscillazioni della linea sono rumore, non
                                un cambiamento di rendimento.
                            </p>
                            <p className="mt-2">
                                La linea tratteggiata è lo Sharpe ratio sull&apos;intero periodo.
                            </p>
                            <p className="mt-2 font-mono text-[10px]">
                                (Rendimento annualizzato − tasso privo di rischio) / Volatilità annualizzata,
                                con 365 osservazioni/anno (serie a giorni solari).
                            </p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                </div>
            </div>
            <p className="text-sm text-gray-500 mb-5">
                Intero periodo: <span className="font-semibold text-gray-700">{formatRatio(fullSample)}</span>
                {' · '}tasso privo di rischio {riskFreePercent.toLocaleString('it-IT', { maximumFractionDigits: 2 })}%
            </p>

            <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-5">
                <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-1.5">
                        <label htmlFor="sharpe-window" className="text-sm font-medium text-gray-500">
                            Finestra mobile
                        </label>
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">
                            {formatWindow(windowDays)}
                        </span>
                    </div>
                    <input
                        id="sharpe-window"
                        type="range"
                        min={bounds.min}
                        max={bounds.max}
                        step={1}
                        value={windowDays}
                        onChange={(e) => setWindow(Number(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1 tabular-nums">
                        <span>{formatWindow(bounds.min)}</span>
                        <span>{formatWindow(bounds.max)}</span>
                    </div>
                </div>
                <div className="sm:w-40">
                    <label htmlFor="sharpe-rf" className="text-sm font-medium text-gray-500 block mb-1.5">
                        Tasso privo di rischio
                    </label>
                    <div className="relative">
                        <input
                            id="sharpe-rf"
                            type="number"
                            min={0}
                            max={20}
                            step={0.25}
                            value={riskFreePercent}
                            onChange={(e) => setRiskFreePercent(Number(e.target.value) || 0)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm p-2.5 pr-8 border tabular-nums"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">%</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px] w-full">
                <Line data={data} options={options} />
            </div>

            {advice && (
                <p className={`mt-4 text-xs leading-relaxed px-3 py-2 rounded-lg border ${ADVICE_STYLES[advice.level]}`}>
                    <span className="font-semibold tabular-nums">± {formatRatio(1.96 * latestSe)}</span>
                    {' — '}{advice.message}
                </p>
            )}
        </div>
    );
}
