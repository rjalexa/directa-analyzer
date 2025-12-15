import React from 'react';
import { Layout } from './components/Layout';
import { FileUpload } from './components/FileUpload';
import { DateRangeFilter } from './components/DateRangeFilter';
import { StatsCards } from './components/StatsCards';
import { PerformanceChart } from './components/PerformanceChart';
import { UnderwaterChart } from './components/UnderwaterChart';
import { RollingSharpeChart } from './components/RollingSharpeChart';
import { MonthlyReturnsHeatmap } from './components/MonthlyReturnsHeatmap';
import { Instructions } from './components/Instructions';
import { usePortfolioAnalysis } from './hooks/usePortfolioAnalysis';

function App() {
    const {
        handleFileUpload,
        dateRange,
        setDateRange,
        minMaxDates,
        analysisResults,
        error,
        isLoading,
        resetDateRange
    } = usePortfolioAnalysis();

    const [performanceChartHiddenDatasets, setPerformanceChartHiddenDatasets] = React.useState([]);

    return (
        <Layout>
            <FileUpload
                onFileUpload={handleFileUpload}
                isLoading={isLoading}
                error={error}
                hasFile={!!analysisResults}
            />

            {analysisResults && (
                <>
                    <DateRangeFilter
                        dateRange={dateRange}
                        setDateRange={setDateRange}
                        minMaxDates={minMaxDates}
                        onReset={resetDateRange}
                    />

                    <StatsCards stats={analysisResults.stats} />
                    
                    <div className="mt-8 space-y-8">
                        <PerformanceChart
                            dailyGains={analysisResults.stats.dailyGains}
                            hiddenDatasets={performanceChartHiddenDatasets}
                            setHiddenDatasets={setPerformanceChartHiddenDatasets}
                        />
                        
                        <UnderwaterChart
                            dailyGains={analysisResults.stats.dailyGains}
                            referenceChartHiddenDatasets={performanceChartHiddenDatasets}
                        />
                        <RollingSharpeChart
                            dailyGains={analysisResults.stats.dailyGains}
                            referenceChartHiddenDatasets={performanceChartHiddenDatasets}
                        />
                        
                        <MonthlyReturnsHeatmap dailyGains={analysisResults.stats.dailyGains} />
                    </div>
                </>
            )}

            <Instructions />
        </Layout>
    );
}

export default App;
