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
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { calculateDrawdowns } from '../utils/advancedCalculations';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export function UnderwaterChart({ dailyGains }) {
    const [showInfo, setShowInfo] = useState(false);
    const drawdowns = calculateDrawdowns(dailyGains);

    const data = {
        labels: drawdowns.map(d => d.date),
        datasets: [
            {
                label: 'Drawdown (%)',
                data: drawdowns.map(d => d.drawdown),
                borderColor: 'rgb(239, 68, 68)', // red-500
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderWidth: 1,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4,
            }
        ]
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    label: function(context) {
                        return `Drawdown: ${context.parsed.y.toFixed(2)}%`;
                    }
                }
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
                ticks: {
                    callback: function(value) {
                        return value + '%';
                    }
                }
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-6">
                <h3 className="text-lg font-bold text-gray-900">Underwater Plot (Drawdown)</h3>
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
                            <p>Il grafico Underwater mostra la percentuale di perdita rispetto al massimo storico (High Water Mark) raggiunto dal portafoglio.</p>
                            <p className="mt-2">Un valore di 0% indica che il portafoglio è ai massimi. Valori negativi indicano la profondità del calo (drawdown) in quel momento.</p>
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