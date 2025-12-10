import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';

export function DateRangeFilter({ dateRange, setDateRange, minMaxDates, onReset }) {
    if (!minMaxDates.minDate || !minMaxDates.maxDate) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setDateRange(prev => ({ ...prev, [name]: value }));
    };

    const getPredefinedRanges = () => {
        const today = new Date();
        const currentYear = today.getFullYear();
        const maxDate = new Date(minMaxDates.maxDate);
        
        const ranges = {
            'Ultimi 3 mesi': {
                startDate: new Date(today.getFullYear(), today.getMonth() - 3, today.getDate()).toISOString().split('T')[0],
                endDate: maxDate.toISOString().split('T')[0]
            },
            'Ultimi 6 mesi': {
                startDate: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()).toISOString().split('T')[0],
                endDate: maxDate.toISOString().split('T')[0]
            },
            'Ultimi 12 mesi': {
                startDate: new Date(today.getFullYear(), today.getMonth() - 12, today.getDate()).toISOString().split('T')[0],
                endDate: maxDate.toISOString().split('T')[0]
            }
        };
        
        return ranges;
    };

    const getAvailableYears = () => {
        const minDate = new Date(minMaxDates.minDate);
        const maxDate = new Date(minMaxDates.maxDate);
        const minYear = minDate.getFullYear();
        const maxYear = maxDate.getFullYear();
        
        const years = [];
        for (let year = maxYear; year >= minYear; year--) {
            years.push(year);
        }
        return years;
    };

    const applyYearRange = (year) => {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        applyPredefinedRange({ startDate, endDate });
    };

    const applyPredefinedRange = (range) => {
        const startDate = range.startDate < minMaxDates.minDate ? minMaxDates.minDate : range.startDate;
        const endDate = range.endDate > minMaxDates.maxDate ? minMaxDates.maxDate : range.endDate;
        setDateRange({ startDate, endDate });
    };

    const predefinedRanges = getPredefinedRanges();
    const availableYears = getAvailableYears();
    const isModified = dateRange.startDate !== minMaxDates.minDate || dateRange.endDate !== minMaxDates.maxDate;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                <div className="flex items-center space-x-2 text-gray-900">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold">Periodo di Analisi</h3>
                </div>
                {isModified && (
                    <button
                        onClick={onReset}
                        className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reimposta periodo completo</span>
                    </button>
                )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label htmlFor="startDate" className="text-sm font-medium text-gray-500">Data Inizio</label>
                    <input
                        type="date"
                        id="startDate"
                        name="startDate"
                        value={dateRange.startDate || ''}
                        min={minMaxDates.minDate}
                        max={minMaxDates.maxDate}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor="endDate" className="text-sm font-medium text-gray-500">Data Fine</label>
                    <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={dateRange.endDate || ''}
                        min={minMaxDates.minDate}
                        max={minMaxDates.maxDate}
                        onChange={handleChange}
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2.5 border"
                    />
                </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
                    {Object.entries(predefinedRanges).map(([label, range]) => (
                        <button
                            key={label}
                            onClick={() => applyPredefinedRange(range)}
                            className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200 hover:border-blue-300"
                        >
                            {label}
                        </button>
                    ))}
                    {availableYears.map((year) => (
                        <button
                            key={year}
                            onClick={() => applyYearRange(year)}
                            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 hover:border-gray-300"
                        >
                            {year}
                        </button>
                    ))}
                </div>
        </div>
    );
}