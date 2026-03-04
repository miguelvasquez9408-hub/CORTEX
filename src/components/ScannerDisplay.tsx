import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import type { ScanReport } from '../types';
import { SoundManager } from '../systems/SoundManager';

interface ScannerDisplayProps {
    report: ScanReport | null;
    isLoading: boolean;
    onScan: () => void;
}

export const ScannerDisplay: React.FC<ScannerDisplayProps> = ({ report, isLoading, onScan }) => {
    // Counter animation
    const count = useSpring(0, { duration: 1500 });
    const rounded = useTransform(count, (latest) => Math.round(latest));
    const [displayCount, setDisplayCount] = useState(0);

    useEffect(() => {
        if (report) {
            count.set(report.totalFiles);
        }
    }, [report, count]);

    useEffect(() => {
        return rounded.on("change", (v) => setDisplayCount(v));
    }, [rounded]);

    const sortedExtensions = report
        ? Object.entries(report.byExtension)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 8)
        : [];

    return (
        <div className="w-full max-w-4xl mx-auto p-6 bg-cyber-dim/50 border border-cyber-cyan/30 rounded-lg backdrop-blur-sm shadow-[0_0_15px_rgba(0,243,255,0.1)]">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-mono text-cyber-cyan tracking-wider flex items-center gap-4">
                    SYSTEM_SCANNER
                    {isLoading && <span className="animate-pulse text-sm text-cyber-purple">SCANNING...</span>}
                </h2>

                <button
                    onClick={() => {
                        SoundManager.getInstance().playClick();
                        SoundManager.getInstance().playScan(); // Play scan sound
                        onScan();
                    }}
                    onMouseEnter={() => SoundManager.getInstance().playHover()}
                    disabled={isLoading}
                    className={`
                        px-6 py-2 font-bold font-mono uppercase tracking-widest transition-all duration-300 relative overflow-hidden group border border-cyber-cyan
                        ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] bg-cyber-cyan/10"}
                    `}
                >
                    <span className="relative z-10 text-cyber-cyan group-hover:text-black transition-colors">
                        {isLoading ? 'PROCESSING' : 'INITIATE SCAN'}
                    </span>
                    <div className="absolute inset-0 bg-cyber-cyan translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                </button>
            </div>

            {report ? (
                <div className="flex flex-col gap-6">
                    {/* Summary Card */}
                    <div className="bg-cyber-black/80 p-6 border border-cyber-purple/20 rounded relative overflow-hidden shadow-lg">
                        <div className="absolute top-0 right-0 p-2 text-cyber-purple/50 text-xs font-mono">ID: TOTAL_ASSETS</div>
                        <div className="text-5xl font-bold font-mono text-white mb-2">
                            <span>{displayCount}</span>
                        </div>
                        <div className="text-cyber-cyan/70 text-sm uppercase tracking-widest mb-4">Files Detected</div>
                        <div className="text-2xl font-mono text-cyber-purple">
                            {(report.totalSize / 1024 / 1024).toFixed(2)} MB
                        </div>
                        <div className="text-cyber-purple/70 text-sm uppercase tracking-widest">Total Size</div>
                    </div>

                    {/* Distribution Bars */}
                    <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                        {sortedExtensions.map(([ext, stats]) => {
                            const percentage = (stats.count / report.totalFiles) * 100;
                            return (
                                <div key={ext} className="relative group">
                                    <div className="flex justify-between text-xs font-mono text-cyber-cyan/80 mb-1">
                                        <span>{ext.toUpperCase()}</span>
                                        <span>{stats.count}</span>
                                    </div>
                                    <div className="h-2 bg-cyber-black border border-cyber-dim w-full rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-cyber-cyan to-cyber-purple"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${percentage}%` }}
                                            transition={{ duration: 1, delay: 0.1 }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 text-cyber-cyan/30 font-mono text-sm">
                    AWAITING INPUT COMMAND...
                    <br />
                    SELECT TARGET DIRECTORY TO BEGIN
                </div>
            )}
        </div>
    );
};
