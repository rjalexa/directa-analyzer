import { useState, useCallback, useEffect } from 'react';
import { parseCSV } from '../utils/csvParser';
import { alignMovementDates, calculateStats } from '../utils/calculations';

export function usePortfolioAnalysis() {
    const [globalPortfolioData, setGlobalPortfolioData] = useState([]);
    const [globalMovimentiData, setGlobalMovimentiData] = useState([]);
    const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
    const [minMaxDates, setMinMaxDates] = useState({ minDate: null, maxDate: null });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileUpload = useCallback(async (file) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await parseCSV(file);
            
            if (data.error) {
                setError(data.error);
                setIsLoading(false);
                return;
            }

            if (data.warnings.length > 0) {
                console.warn('CSV Parsing Warnings:', data.warnings);
            }

            setGlobalPortfolioData(data.portfolioData);
            setGlobalMovimentiData(data.movimentiData);

            // Calculate min/max dates
            const dates = data.portfolioData.map(d => new Date(d.date.split('/').reverse().join('-')));
            const minDate = new Date(Math.min(...dates)).toISOString().split('T')[0];
            const maxDate = new Date(Math.max(...dates)).toISOString().split('T')[0];

            setMinMaxDates({ minDate, maxDate });
            setDateRange({ startDate: minDate, endDate: maxDate });

        } catch (err) {
            setError(err.message || "An unexpected error occurred during file parsing.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const [analysisResults, setAnalysisResults] = useState(null);

    useEffect(() => {
        if (!globalPortfolioData.length) {
            setAnalysisResults(null);
            return;
        }

        // Wait for valid dates before recomputing
        if (!dateRange.startDate || !dateRange.endDate) {
            return;
        }

        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return;
        }

        if (startDate > endDate) {
            return;
        }

        try {
            const filteredPortfolioData = globalPortfolioData.filter(d => {
                const date = new Date(d.date.split('/').reverse().join('-'));
                return date >= startDate && date <= endDate;
            });

            const filteredMovimentiData = globalMovimentiData.filter(d => {
                const date = new Date(d.date.split('/').reverse().join('-'));
                return date >= startDate && date <= endDate;
            });

            const alignedMovements = alignMovementDates(filteredPortfolioData, filteredMovimentiData);
            const stats = calculateStats(filteredPortfolioData, alignedMovements);

            setAnalysisResults({ stats, alignedMovements });
        } catch (e) {
            console.error("Error calculating analysis results:", e);
        }
    }, [globalPortfolioData, globalMovimentiData, dateRange]);

    const resetDateRange = useCallback(() => {
        if (minMaxDates.minDate && minMaxDates.maxDate) {
            setDateRange({ startDate: minMaxDates.minDate, endDate: minMaxDates.maxDate });
        }
    }, [minMaxDates]);

    return {
        handleFileUpload,
        dateRange,
        setDateRange,
        minMaxDates,
        analysisResults,
        error,
        isLoading,
        resetDateRange
    };
}