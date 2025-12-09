import React, { useRef } from 'react';
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

export function PerformanceChart({ dailyGains }) {
    const chartRef = useRef(null);

    const data = {
        labels: dailyGains.map(day => day.date),
        datasets: [
            {
                label: 'G/L Cumulativo',
                data: dailyGains.map(day => day.cumulativeGainLoss),
                borderColor: 'rgb(37, 99, 235)', // blue-600
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                tension: 0.1,
                fill: true,
                yAxisID: 'y',
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'Investimenti Cumulativi',
                data: dailyGains.map(day => day.cumulativeInvestment),
                borderColor: 'rgb(220, 38, 38)', // red-600
                borderWidth: 2,
                borderDash: [5, 5],
                tension: 0.1,
                yAxisID: 'y1',
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'Valore Totale',
                data: dailyGains.map(day => day.totalValue),
                borderColor: 'rgb(16, 185, 129)', // emerald-500
                borderWidth: 2,
                tension: 0.1,
                yAxisID: 'y1',
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'TWRR (%)',
                data: dailyGains.map(day => day.twrr * 100),
                borderColor: 'rgb(147, 51, 234)', // purple-600
                borderWidth: 2,
                tension: 0.1,
                yAxisID: 'y2',
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
                position: 'top',
                align: 'end',
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    font: {
                        family: "'Inter', sans-serif",
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1f2937',
                bodyColor: '#4b5563',
                borderColor: '#e5e7eb',
                borderWidth: 1,
                padding: 12,
                boxPadding: 4,
                usePointStyle: true,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            if (context.dataset.yAxisID === 'y2') {
                                label += context.parsed.y.toFixed(2) + '%';
                            } else {
                                label += new Intl.NumberFormat('it-IT', {
                                    style: 'currency',
                                    currency: 'EUR'
                                }).format(context.parsed.y);
                            }
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxTicksLimit: 8,
                    maxRotation: 0
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'G/L (€)',
                    color: 'rgb(37, 99, 235)',
                    font: { weight: 'bold' }
                },
                ticks: {
                    color: 'rgb(37, 99, 235)'
                },
                grid: {
                    color: '#f3f4f6'
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Investimenti / Totale (€)',
                    color: 'rgb(75, 85, 99)', // gray-600
                    font: { weight: 'bold' }
                },
                ticks: {
                    color: 'rgb(75, 85, 99)' // gray-600
                },
                grid: {
                    drawOnChartArea: false
                }
            },
            y2: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'TWRR (%)',
                    color: 'rgb(147, 51, 234)',
                    font: { weight: 'bold' }
                },
                ticks: {
                    color: 'rgb(147, 51, 234)'
                },
                grid: {
                    drawOnChartArea: false
                }
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Analisi Performance</h3>
            </div>
            <div className="h-[500px] w-full">
                <Line ref={chartRef} data={data} options={options} />
            </div>
        </div>
    );
}