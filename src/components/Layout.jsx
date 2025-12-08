import React from 'react';
import { LineChart } from 'lucide-react';

export function Layout({ children }) {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <header className="mb-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                            <LineChart className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Directa Portfolio Analyzer</h1>
                    <p className="text-gray-500 max-w-2xl mx-auto">
                        Visualizza le performance dei tuoi investimenti Directa con precisione. Carica il tuo CSV per iniziare.
                    </p>
                </header>
                <main>
                    {children}
                </main>
                <footer className="mt-12 text-center text-gray-400 text-sm">
                    <p>© {new Date().getFullYear()} Directa Analyzer. Progetto Open Source.</p>
                    <p className="mt-2">
                        Basato sul <a href="https://github.com/ilbonte/directa-analyzer" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">codice originale</a> di ilbonte
                    </p>
                </footer>
            </div>
        </div>
    );
}