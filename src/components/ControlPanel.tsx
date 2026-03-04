import React from 'react'
import { ScannerDisplay } from './ScannerDisplay'
import { OrganizerDisplay } from './OrganizerDisplay'
import type { ScanReport, OrganizationReport } from '../types'

interface ControlPanelProps {
    currentPath: string | null
    onSelectDirectory: () => void
    scanReport: ScanReport | null
    isScanning: boolean
    onScan: () => void
    orgReport: OrganizationReport | null
    isOrganizing: boolean
    onRunOrganizer: () => Promise<void> | void
    onConfirm: () => Promise<void> | void
    canUndo: boolean
    onUndo: () => void
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    currentPath,
    onSelectDirectory,
    scanReport,
    isScanning,
    onScan,
    orgReport,
    isOrganizing,
    onRunOrganizer,
    onConfirm,
    canUndo,
    onUndo
}) => {
    return (
        <div className="w-[600px] h-full bg-cyber-black/90 border-r border-cyber-dim/50 flex flex-col backdrop-blur-md z-20 relative transition-all duration-300">
            {/* Header Panel */}
            <div className="p-6 border-b border-cyber-dim/30">
                <h1 className="text-2xl font-mono font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyber-cyan to-cyber-purple drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                    CORTEX<span className="text-xs ml-2 text-cyber-cyan/50 tracking-widest align-top">V2.0</span>
                </h1>
                <div className="text-xs font-mono text-cyber-dim mt-1">STATUS: OPERATIONAL</div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                {/* Target Selection */}
                <section>
                    <div className="text-xs font-mono text-cyber-dim mb-2 uppercase tracking-widest">Target System</div>
                    <button
                        onClick={onSelectDirectory}
                        className="w-full group relative flex items-center justify-center px-4 py-3 font-mono text-sm font-bold text-white transition-all duration-200 border border-cyber-dim hover:border-cyber-cyan bg-black/50"
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {currentPath ? 'CHANGE TARGET' : 'INITIATE UPLINK'}
                        </span>
                        <div className="absolute inset-0 bg-cyber-cyan/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    </button>

                    {currentPath && (
                        <div className="mt-2 font-mono text-xs text-cyber-cyan/70 break-all p-2 border-l-2 border-cyber-dim bg-cyber-cyan/5">
                            {currentPath}
                        </div>
                    )}
                </section>

                {/* Scanner Report */}
                {currentPath && (
                    <section className="animate-in fade-in slide-in-from-left-4 duration-500">
                        <ScannerDisplay
                            report={scanReport}
                            isLoading={isScanning}
                            onScan={onScan}
                        />
                    </section>
                )}

                {/* Organizer Controls */}
                {scanReport && (
                    <section className="animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                        <OrganizerDisplay
                            dryRunReport={orgReport}
                            onRunOrganizer={onRunOrganizer}
                            onConfirm={onConfirm}
                            isProcessing={isOrganizing}
                            canUndo={canUndo}
                            onUndo={onUndo}
                        />
                    </section>
                )}
            </div>

            {/* Footer Info */}
            <div className="p-4 border-t border-cyber-dim/30 text-[10px] font-mono text-cyber-dim/50 text-center">
                SYSTEM ID: 5b6b2566 // ENCRYPTED
            </div>
        </div>
    )
}
