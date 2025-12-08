import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent, Activity, Wallet, ArrowUpRight, ArrowDownRight, Info, Mountain, Skull, Timer } from 'lucide-react';
import { formatCurrency, formatPercentage, findMaxGainAndLoss, findLongestSequences, calculateLongestRecovery } from '../utils/calculations';

function StatCard({ title, value, icon: Icon, trend, subValue, color = "blue", info }) {
    const [showInfo, setShowInfo] = useState(false);

    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        red: "bg-red-50 text-red-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600",
        teal: "bg-teal-50 text-teal-600"
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    {Icon && <Icon className="w-6 h-6" />}
                </div>
                {trend && (
                    <div className={`flex items-center space-x-1 text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trend > 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    {info && (
                        <div
                            className="relative"
                            onMouseEnter={() => setShowInfo(true)}
                            onMouseLeave={() => setShowInfo(false)}
                            onClick={() => setShowInfo(!showInfo)}
                        >
                            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" />
                            {showInfo && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-50 font-normal">
                                    {info}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
                {subValue && (
                    <p className="text-sm text-gray-400 mt-1">{subValue}</p>
                )}
            </div>
        </div>
    );
}

export function StatsCards({ stats }) {
    const { maxGain, maxLoss } = findMaxGainAndLoss(stats.dailyGains);
    const { maxRiseSequence, maxDropSequence } = findLongestSequences(stats.dailyGains);
    const longestRecovery = calculateLongestRecovery(stats.dailyGains);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            {/* Primary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard
                    title="Patrimonio Iniziale"
                    value={formatCurrency(stats.patrimonyInitial)}
                    icon={Wallet}
                    color="teal"
                />
                <StatCard
                    title="Movimenti Totali"
                    value={formatCurrency(stats.totalMovements)}
                    icon={DollarSign}
                    color="orange"
                    info="Somma netta di tutti i versamenti (positivi) e prelievi (negativi) effettuati nel periodo."
                />
                <StatCard
                    title="G/L Totale"
                    value={formatCurrency(stats.totalGainLoss)}
                    icon={stats.totalGainLoss >= 0 ? TrendingUp : TrendingDown}
                    color={stats.totalGainLoss >= 0 ? "green" : "red"}
                    info="Guadagno o perdita totale in euro. Calcolato sommando le variazioni giornaliere del portafoglio, escludendo l'impatto di versamenti e prelievi."
                />
                <StatCard
                    title="G/L %"
                    value={formatPercentage(stats.totalGainLossPercentage)}
                    icon={Percent}
                    color="blue"
                    info="Rendimento percentuale Money-Weighted (MWRR). Rappresenta la redditività del capitale mediamente investito, considerando l'impatto temporale di versamenti e prelievi."
                />
                <StatCard
                    title="TWRR"
                    value={formatPercentage(stats.totalTwrr)}
                    icon={Activity}
                    color="purple"
                    info="Time-Weighted Rate of Return. Misura la performance della gestione eliminando l'effetto dei flussi di cassa (versamenti/prelievi). Ideale per confrontare la strategia con il mercato."
                />
                <StatCard
                    title="Patrimonio Finale"
                    value={formatCurrency(stats.patrimonyFinal)}
                    icon={Wallet}
                    color="blue"
                    info="Valore complessivo del portafoglio al termine del periodo selezionato. Somma dei movimenti totali e del guadagno/perdita totale."
                />
            </div>

            {/* Secondary Stats (Max Gain/Loss) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800 mb-1">Miglior Performance Giornaliera</p>
                            <h4 className="text-xl font-bold text-green-900">{formatCurrency(maxGain.gainLoss)}</h4>
                            <p className="text-sm text-green-600 mt-1">{maxGain.date}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-red-50/50 p-6 rounded-2xl border border-red-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-red-800 mb-1">Peggior Performance Giornaliera</p>
                            <h4 className="text-xl font-bold text-red-900">{formatCurrency(maxLoss.gainLoss)}</h4>
                            <p className="text-sm text-red-600 mt-1">{maxLoss.date}</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <TrendingDown className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-green-50/50 p-6 rounded-2xl border border-green-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-green-800 mb-1">Miglior salita ininterrotta</p>
                            <h4 className="text-xl font-bold text-green-900">{formatCurrency(maxRiseSequence.sum)}</h4>
                            <p className="text-sm text-green-600 mt-1">{maxRiseSequence.start} - {maxRiseSequence.end} ({maxRiseSequence.days} gg)</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <Mountain className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-orange-800 mb-1">Peggior calo ininterrotto</p>
                            <h4 className="text-xl font-bold text-orange-900">{formatCurrency(maxDropSequence.sum)}</h4>
                            <p className="text-sm text-orange-600 mt-1">{maxDropSequence.start} - {maxDropSequence.end} ({maxDropSequence.days} gg)</p>
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <Skull className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-blue-800 mb-1">Tempo max recupero</p>
                            <h4 className="text-xl font-bold text-blue-900">{longestRecovery.days} giorni</h4>
                            {longestRecovery.days > 0 && (
                                <p className="text-sm text-blue-600 mt-1">{longestRecovery.startDate} - {longestRecovery.endDate}</p>
                            )}
                        </div>
                        <div className="bg-white p-3 rounded-xl shadow-sm">
                            <Timer className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}