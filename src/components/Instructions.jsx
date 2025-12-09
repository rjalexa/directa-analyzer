import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, FileText, Download, Upload } from 'lucide-react';
import { clsx } from 'clsx';

function AccordionItem({ title, children, isOpen, onClick }) {
    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-3">
            <button
                className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex items-center justify-between transition-colors"
                onClick={onClick}
            >
                <span className="font-medium text-gray-900">{title}</span>
                {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
            </button>
            <div
                className={clsx(
                    "bg-gray-50 transition-all duration-300 ease-in-out overflow-hidden",
                    isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                )}
            >
                <div className="p-6 text-gray-600 text-sm leading-relaxed">
                    {children}
                </div>
            </div>
        </div>
    );
}

export function Instructions() {
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (section) => {
        setOpenSection(openSection === section ? null : section);
    };

    return (
        <div className="max-w-3xl mx-auto mt-12">
            <div className="flex items-center space-x-2 mb-6">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Aiuto & Documentazione</h2>
            </div>

            <AccordionItem
                title="📌 Guida Rapida"
                isOpen={openSection === 'guide'}
                onClick={() => toggleSection('guide')}
            >
                <div className="space-y-6">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Cos'è questo strumento?</h3>
                        <p>
                            Questo strumento visualizza la performance dei tuoi investimenti Directa nel tempo.
                            Il grafico "Patrimonio" predefinito di Directa include depositi e prelievi, rendendo difficile vedere la reale performance degli investimenti.
                            Questo analizzatore filtra quei movimenti per mostrare il tuo vero Guadagno/Perdita.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Come usarlo?</h3>
                        <ol className="list-decimal list-inside space-y-3 ml-1">
                            <li className="pl-2">
                                <span className="font-medium">Accedi a Directa</span> (piattaforma Libera da browser, non dalle App).
                            </li>
                            <li className="pl-2">
                                Vai su: <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-800 text-xs font-mono">Conto &rarr; Patrimonio &rarr; Storico</span>.
                            </li>
                            <li className="pl-2">
                                Seleziona l'intervallo di date desiderato (max 3 anni).
                            </li>
                            <li className="pl-2">
                                Clicca sull'icona <Download className="w-4 h-4 inline mx-1" /> sopra il grafico per scaricare il file <strong>CSV</strong>.
                            </li>
                            <li className="pl-2">
                                Carica quel file qui usando il box sopra.
                            </li>
                        </ol>
                    </div>
                </div>
            </AccordionItem>

            <AccordionItem
                title="❓ Domande Frequenti"
                isOpen={openSection === 'faq'}
                onClick={() => toggleSection('faq')}
            >
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-gray-900">I miei dati sono al sicuro?</h4>
                        <p className="mt-1">
                            Sì. Tutta l'analisi avviene <strong>localmente nel tuo browser</strong>.
                            I tuoi dati finanziari non vengono mai inviati a nessun server.
                            Il codice è open source e disponibile su GitHub.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900">Perché il "Guadagno/Perdita Totale" non corrisponde a Directa?</h4>
                        <p className="mt-1">
                            Questo strumento include dividendi e cedole nel calcolo del guadagno totale, mentre la visualizzazione semplice di Directa potrebbe non includerli allo stesso modo a seconda della vista.
                        </p>
                    </div>
                </div>
            </AccordionItem>
        </div>
    );
}