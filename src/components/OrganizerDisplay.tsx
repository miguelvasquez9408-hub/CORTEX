import React, { useState } from 'react';
import type { OrganizationReport } from '../types';
import clsx from 'clsx';

interface OrganizerDisplayProps {
    onRunOrganizer: () => Promise<void> | void;
    onConfirm: () => Promise<void> | void;
    dryRunReport: OrganizationReport | null;
    isProcessing: boolean;
    canUndo: boolean;
    onUndo: () => void;
}

export const OrganizerDisplay: React.FC<OrganizerDisplayProps> = ({ onRunOrganizer, onConfirm, dryRunReport, isProcessing, canUndo, onUndo }) => {
    const [confirmed, setConfirmed] = useState(false);

    const handleConfirm = async () => {
        setConfirmed(true);
        await onConfirm();
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-cyber-dim/50 border border-cyber-purple/30 rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(189,0,255,0.1)]">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-mono text-cyber-purple tracking-wider">
                    AUTO_ORGANIZER
                </h2>

                {!dryRunReport && (
                    <button
                        onClick={onRunOrganizer}
                        disabled={isProcessing}
                        className={clsx(
                            "px-6 py-2 font-bold font-mono uppercase tracking-widest text-cyber-black bg-cyber-purple hover:bg-white transition-all duration-300",
                            isProcessing && "opacity-50"
                        )}
                    >
                        {isProcessing ? 'CALCULATING...' : 'SIMULATE ORGANIZATION'}
                    </button>
                )}
            </div>

            {dryRunReport && (
                <div className="space-y-6">
                    <div className="bg-black/40 p-4 border-l-2 border-cyber-purple font-mono text-sm">
                        <p className="text-cyber-cyan mb-2">SIMULATION REPORT:</p>
                        <p className="text-white">Files to move: <span className="text-cyber-purple font-bold">{dryRunReport.actions.length}</span></p>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {dryRunReport.actions.map((action, idx) => (
                            <div key={idx} className="flex items-center text-xs font-mono bg-cyber-black/50 p-2 rounded border border-cyber-dim/50">
                                <span className="text-cyber-cyan/70 w-24 truncate">{action.category}</span>
                                <span className="text-gray-400 mx-2">→</span>
                                <span className="text-white truncate flex-1">{action.src.split('\\').pop()}</span>
                            </div>
                        ))}
                    </div>

                    {!confirmed && (
                        <div className="flex justify-end gap-4 mt-4">
                            <button
                                onClick={handleConfirm}
                                disabled={isProcessing}
                                className="px-8 py-3 bg-gradient-to-r from-cyber-cyan to-cyber-purple text-black font-bold font-mono tracking-widest hover:shadow-[0_0_20px_rgba(189,0,255,0.5)] transition-all"
                            >
                                {isProcessing ? 'EXECUTING...' : 'CONFIRM & EXECUTE'}
                            </button>
                        </div>
                    )}

                    {confirmed && (
                        <div className="text-center py-4 space-y-4">
                            <div className="text-cyber-green font-mono animate-pulse">
                                OPERATION COMPLETED SUCCESSFULLY
                            </div>

                            {canUndo && (
                                <button
                                    onClick={onUndo}
                                    className="px-4 py-2 text-xs font-mono border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all uppercase tracking-widest"
                                >
                                    ⚠ Revert Operations (Undo)
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
