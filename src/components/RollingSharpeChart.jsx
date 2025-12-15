import React, { useState } from 'react';
import { Info } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { calculateRollingSharpe } from '../utils/advancedCalculations';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

export function RollingSharpeChart({ dailyGains, referenceChartHiddenDatasets = [] }) {
    const [showInfo, setShowInfo] = useState(false);
    const rollingSharpe = calculateRollingSharpe(dailyGains, 60); // 60 days window

    // Calculate padding to align with PerformanceChart
    const isMovimentiHidden = referenceChartHiddenDatasets.includes(2);
    const isPatrimonioHidden = referenceChartHiddenDatasets.includes(3);
    const showY1 = !(isMovimentiHidden && isPatrimonioHidden);

    // Align with PerformanceChart's fixed left width (130px)
    const rightSpace = (showY1 ? 80 : 0);
    const myAxisWidth = 50;
    const maxLeftWidth = 130;
    const paddingLeft = maxLeftWidth - myAxisWidth;
    const paddingRight = rightSpace;

    const data = {
        labels: rollingSharpe.map(d => d.date),
        datasets: [
            {
                label: 'Rolling Sharpe Ratio (60 days)',
                data: rollingSharpe.map(d => d.sharpe),
                borderColor: 'rgb(147, 51, 234)', // purple-600
                backgroundColor: 'rgba(147, 51, 234, 0.1)',
                borderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4,
                tension: 0.1
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: {
                left: paddingLeft,
                right: paddingRight
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false
            },
            title: {
                display: false
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxTicksLimit: 8
                }
            },
            y: {
                grid: {
                    color: '#f3f4f6'
                },
                afterFit: (axis) => {
                    axis.width = myAxisWidth;
                }
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-bold text-gray-900">Rolling Sharpe Ratio (60 Days)</h3>
                <div
                    className="relative"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    onClick={() => setShowInfo(!showInfo)}
                >
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    {showInfo && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 font-normal">
                            <p className="font-bold mb-1">Cos'è questo grafico?</p>
                            <p>L'indice di Sharpe misura il rendimento corretto per il rischio. Questo grafico mostra l'indice calcolato su una finestra mobile di 60 giorni.</p>
                            <p className="mt-2">Un valore più alto indica un miglior rendimento per unità di rischio.</p>
                            <p className="mt-1 font-mono text-[10px]">Formula: (Rendimento Medio / Dev. Std) * √252</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="h-[300px] w-full">
                <Line data={data} options={options} />
            </div>
        </div>
    );
}