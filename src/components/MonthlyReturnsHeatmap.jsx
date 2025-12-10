import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { calculateMonthlyReturns } from '../utils/advancedCalculations';

export function MonthlyReturnsHeatmap({ dailyGains }) {
    const [showInfo, setShowInfo] = useState(false);
    const monthlyReturns = calculateMonthlyReturns(dailyGains);
    
    // Group by year for display
    const years = [...new Set(monthlyReturns.map(m => m.year))].sort((a, b) => b - a);
    const months = [
        'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 
        'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ];

    const getColor = (value) => {
        if (value === undefined) return 'bg-gray-50';
        if (value > 0) {
            // Green scale
            if (value > 5) return 'bg-green-500 text-white';
            if (value > 2) return 'bg-green-400 text-white';
            if (value > 0) return 'bg-green-200 text-green-900';
        } else if (value < 0) {
            // Red scale
            if (value < -5) return 'bg-red-500 text-white';
            if (value < -2) return 'bg-red-400 text-white';
            if (value < 0) return 'bg-red-200 text-red-900';
        }
        return 'bg-gray-100 text-gray-500';
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-bold text-gray-900">Rendimenti Mensili</h3>
                <div
                    className="relative"
                    onMouseEnter={() => setShowInfo(true)}
                    onMouseLeave={() => setShowInfo(false)}
                    onClick={() => setShowInfo(!showInfo)}
                >
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                    {showInfo && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-80 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 font-normal">
                            <p className="font-bold mb-1">Come leggere la tabella?</p>
                            <p>Questa tabella mostra i rendimenti percentuali per ogni mese dell'anno.</p>
                            <p className="mt-2">Permette di identificare rapidamente stagionalità o periodi di performance positiva (verde) o negativa (rosso).</p>
                            <p className="mt-1">Il totale annuale è calcolato componendo i rendimenti mensili.</p>
                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                        </div>
                    )}
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left p-2 text-gray-500 font-medium">Anno</th>
                            {months.map(m => (
                                <th key={m} className="p-2 text-gray-500 font-medium">{m}</th>
                            ))}
                            <th className="p-2 text-gray-900 font-bold">Tot</th>
                        </tr>
                    </thead>
                    <tbody>
                        {years.map(year => {
                            const yearReturns = monthlyReturns.filter(m => m.year === year);
                            // Calculate yearly return from monthly returns
                            // (1+r1)*(1+r2)... - 1
                            const yearlyTotal = yearReturns.reduce((acc, curr) => acc * (1 + curr.value / 100), 1) - 1;
                            
                            return (
                                <tr key={year} className="border-t border-gray-50">
                                    <td className="p-2 font-bold text-gray-900">{year}</td>
                                    {months.map((_, index) => {
                                        const monthData = yearReturns.find(m => m.month === index + 1);
                                        const value = monthData ? monthData.value : undefined;
                                        return (
                                            <td key={index} className="p-1">
                                                <div className={`w-full h-full p-2 rounded text-center ${getColor(value)}`}>
                                                    {value !== undefined ? value.toFixed(1) + '%' : '-'}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-2 font-bold text-right">
                                        {(yearlyTotal * 100).toFixed(1)}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}