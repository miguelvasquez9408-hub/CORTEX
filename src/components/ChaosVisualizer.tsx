import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ScanReport } from '../types';
import { SoundManager } from '../systems/SoundManager';

interface ChaosVisualizerProps {
    report: ScanReport | null;
    isOrganizing: boolean;
    onOrganizationComplete?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
    '.pdf': '#ef4444', // Red
    '.doc': '#3b82f6', // Blue
    '.docx': '#3b82f6',
    '.xls': '#22c55e', // Green
    '.xlsx': '#22c55e',
    '.jpg': '#eab308', // Yellow
    '.png': '#eab308',
    '.mp4': '#a855f7', // Purple
    '.txt': '#d1d5db', // Gray
    '.zip': '#ec4899', // Pink
    '.rar': '#ec4899',
    '.exe': '#f43f5e', // Rose
    'default': '#6366f1' // Indigo
};


export const ChaosVisualizer: React.FC<ChaosVisualizerProps> = ({ report, isOrganizing }) => {
    const [viewMode, setViewMode] = useState<'particles' | 'network'>('particles');

    const [nodes, setNodes] = useState<{
        id: number;
        x: number;
        y: number;
        color: string;
        size: number;
        glyph: string;
        category: string;
        path: string;
        name: string;
    }[]>([]);

    // Generate Network Topology
    const networkLayout = useMemo(() => {
        if (!report || nodes.length === 0) return {};

        const layout: Record<number, { x: number, y: number, parentX?: number, parentY?: number }> = {};
        const categories = Object.keys(report.byExtension);
        const centerX = 50;
        const centerY = 50;

        // Radius settings
        const catRadius = 25; // Inner circle for categories
        const fileRadius = 15; // Local radius around category

        categories.forEach((cat, idx) => {
            const angle = (idx / categories.length) * 2 * Math.PI;
            const catX = centerX + Math.cos(angle) * catRadius;
            const catY = centerY + Math.sin(angle) * catRadius;

            // Find nodes belonging to this category
            const catNodes = nodes.filter(n => n.category === cat);

            catNodes.forEach((node, nodeIdx) => {
                const nodeAngle = (nodeIdx / catNodes.length) * 2 * Math.PI + angle; // Add angle to orient outwards
                // Vary radius slightly for organic look
                const r = fileRadius + (Math.random() * 5);

                layout[node.id] = {
                    x: catX + Math.cos(nodeAngle) * r,
                    y: catY + Math.sin(nodeAngle) * r,
                    parentX: catX,
                    parentY: catY
                };
            });
        });

        return layout;
    }, [report, nodes]);

    const [selectedNode, setSelectedNode] = useState<typeof nodes[0] | null>(null);

    // Initialize random nodes (Chaos State)
    useEffect(() => {
        if (report?.fileSample) {
            const newNodes = report.fileSample.map((file, i) => ({
                id: i,
                // Keep mainly center screen 5-95%
                x: Math.random() * 90 + 5,
                y: Math.random() * 90 + 5,
                color: CATEGORY_COLORS[file.extension] || CATEGORY_COLORS['default'],
                size: Math.max(12, Math.min(24, Math.log(file.size + 1) * 2)),
                glyph: file.extension.replace('.', '').substring(0, 4).toUpperCase() || 'FILE',
                category: file.extension,
                path: file.path,
                name: file.name
            }));
            setNodes(newNodes);
        }
    }, [report]);

    // Cleanup selection if report clears
    useEffect(() => {
        if (!report) setSelectedNode(null);
    }, [report]);

    // Calculate layout positions based on state
    const layoutPositions = useMemo(() => {
        if (nodes.length === 0) return {};

        const positions: Record<number, { x: string, y: string, scale: number, opacity: number }> = {};

        if (isOrganizing) {
            // 1. Group nodes by category
            const groups: Record<string, typeof nodes> = {};
            nodes.forEach(node => {
                const cat = node.color;
                if (!groups[cat]) groups[cat] = [];
                groups[cat].push(node);
            });

            // 2. Define Cluster Centers 
            const uniqueCats = Object.keys(groups);
            const clusterCenters: Record<string, { x: number, y: number }> = {};

            const radius = 30; // 30% screen width radius circle
            uniqueCats.forEach((cat, i) => {
                const angle = (i / uniqueCats.length) * Math.PI * 2;
                clusterCenters[cat] = {
                    x: 50 + Math.cos(angle) * radius,
                    y: 50 + Math.sin(angle) * radius
                };
            });

            // 3. Layout nodes in Hexagons 
            const hexLayout = (index: number) => {
                if (index === 0) return { x: 0, y: 0 };
                const angle = index * 0.5;
                const dist = Math.sqrt(index) * 0.8;
                return {
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist
                };
            };

            nodes.forEach(node => {
                const group = groups[node.color] || [];
                const indexInGroup = group.findIndex(n => n.id === node.id);
                const center = clusterCenters[node.color] || { x: 50, y: 50 };
                const offset = hexLayout(indexInGroup);

                positions[node.id] = {
                    x: `${center.x + offset.x * 2}%`,
                    y: `${center.y + offset.y * 3}%`, // Scale Y slightly more to account for aspect ratio visual
                    scale: 1,
                    opacity: 1
                };
            });

        } else {
            // Chaos State
            nodes.forEach(node => {
                positions[node.id] = {
                    x: `${node.x}%`,
                    y: `${node.y}%`,
                    scale: 0.8, // Initial scale for chaos
                    opacity: 0.8
                };
            });
        }
        return positions;
    }, [nodes, isOrganizing]);


    const handleNodeClick = (node: typeof nodes[0]) => {
        SoundManager.getInstance().playClick();
        setSelectedNode(node);
    };

    const handleNodeDoubleClick = (path: string) => {
        SoundManager.getInstance().playClick();
        window.ipcRenderer.invoke('open-file', path);
    };

    const handleMouseEnter = () => {
        SoundManager.getInstance().playHover();
    };

    if (!report) return null;

    return (
        <div
            className="relative w-full h-full min-h-screen overflow-hidden bg-black/40"
            onClick={() => setSelectedNode(null)} // Deselect on bg click
        >
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0%,transparent_70%)] pointer-events-none"></div>

            {/* Network Connections */}
            {/* Network Connections Layer (SVG) */}
            {viewMode === 'network' && !isOrganizing && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    {/* Draw lines from layout center to categories (virtual) and categories to files */}
                    {nodes.map(node => {
                        const pos = networkLayout[node.id];
                        if (!pos) return null;

                        return (
                            <React.Fragment key={`edge-${node.id}`}>
                                {/* Connection to Category Center */}
                                <motion.line
                                    x1={`${pos.parentX}%`}
                                    y1={`${pos.parentY}%`}
                                    x2={`${pos.x}%`}
                                    y2={`${pos.y}%`}
                                    stroke={node.color}
                                    strokeWidth="0.5"
                                    opacity="0.3"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, delay: Math.random() }}
                                />
                                {/* Connection to Root (Center) */}
                                <motion.line
                                    x1="50%"
                                    y1="50%"
                                    x2={`${pos.parentX}%`}
                                    y2={`${pos.parentY}%`}
                                    stroke="rgba(0, 243, 255, 0.2)"
                                    strokeWidth="1" // Thicker for main branches
                                    opacity="0.2"
                                />
                            </React.Fragment>
                        );
                    })}
                </svg>
            )}

            {/* View Toggle */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                <button
                    onClick={() => setViewMode('particles')}
                    className={`p-2 rounded border transition-all ${viewMode === 'particles' ? 'bg-cyber-cyan text-black border-cyber-cyan shadow-[0_0_10px_rgba(0,243,255,0.5)]' : 'bg-black/50 text-cyber-cyan border-cyber-dim hover:border-cyber-cyan'}`}
                    title="Chaos View"
                >
                    <div className="w-5 h-5 flex items-center justify-center font-mono text-xs">⚛</div>
                </button>
                <button
                    onClick={() => setViewMode('network')}
                    className={`p-2 rounded border transition-all ${viewMode === 'network' ? 'bg-cyber-purple text-white border-cyber-purple shadow-[0_0_10px_rgba(189,0,255,0.5)]' : 'bg-black/50 text-cyber-purple border-cyber-dim hover:border-cyber-purple'}`}
                    title="Network View"
                >
                    <div className="w-5 h-5 flex items-center justify-center font-mono text-xs">🕸</div>
                </button>
            </div>

            <AnimatePresence>
                {isOrganizing && (
                    <motion.svg
                        className="absolute inset-0 w-full h-full pointer-events-none z-0"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <defs>
                            <pattern id="network-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                                <circle cx="1" cy="1" r="1" fill="rgba(0, 243, 255, 0.1)" />
                                <path d="M0 40 L40 0" stroke="rgba(99, 102, 241, 0.1)" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#network-grid)" />
                    </motion.svg>
                )}
            </AnimatePresence>

            {nodes.map((node) => {
                const pos = layoutPositions[node.id];
                // Chaos floating animation variant


                return (
                    <motion.div
                        key={node.id}
                        onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
                        onDoubleClick={(e) => { e.stopPropagation(); handleNodeDoubleClick(node.path); }}
                        onMouseEnter={handleMouseEnter}
                        className={`chaos-node absolute flex items-center justify-center font-mono text-[10px] font-bold border border-current shadow-[0_0_15px_currentColor] backdrop-blur-sm cursor-pointer
                            ${selectedNode?.id === node.id ? 'z-50 shadow-[0_0_50px_white] ring-2 ring-white' : 'hover:z-40 hover:shadow-[0_0_30px_white]'}
                        `}
                        initial={false}
                        animate={isOrganizing ? {
                            left: pos?.x || `${node.x}%`,
                            top: pos?.y || `${node.y}%`,
                            scale: pos?.scale || 1,
                            opacity: pos?.opacity || 1,
                            rotate: 0,
                            transition: { type: "spring", stiffness: 50, damping: 20, delay: node.id * 0.005 }
                        } : (viewMode === 'network' ? {
                            left: `${networkLayout[node.id]?.x || 50}%`,
                            top: `${networkLayout[node.id]?.y || 50}%`,
                            scale: 0.8,
                            opacity: 1,
                            rotate: 0,
                            transition: { type: "spring", stiffness: 40, damping: 15 }
                        } : {
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            scale: 1,
                            opacity: 0.8,
                            x: [0, -10, 10, -5, 5, 0],
                            y: [0, 10, -5, 10, -10, 0],
                            rotate: [0, 5, -5, 0],
                            transition: {
                                duration: 5 + (node.id % 5),
                                repeat: Infinity,
                                repeatType: "mirror",
                                ease: "easeInOut"
                            }
                        } as any)}
                        whileHover={{ scale: 1.5, zIndex: 100 }}
                        style={{
                            width: `${node.size}px`,
                            height: `${node.size}px`,
                            color: node.color,
                            backgroundColor: `${node.color}20`,
                            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                        }}
                    >
                        <span className="opacity-80">{node.glyph}</span>
                    </motion.div>
                );
            })}

            {/* Inspector Panel */}
            <div className={`absolute bottom-8 right-8 w-80 bg-cyber-black/90 border-l-4 border-cyber-cyan p-6 backdrop-blur-md transition-all duration-300 transform ${selectedNode ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
                {selectedNode && (
                    <div className="space-y-4">
                        <h3 className="text-cyber-cyan font-mono text-xl font-bold truncate" title={selectedNode.name}>
                            {selectedNode.name}
                        </h3>
                        <div className="space-y-2 text-xs font-mono text-cyber-dim">
                            <div className="flex justify-between border-b border-cyber-dim/30 pb-1">
                                <span>TYPE:</span>
                                <span className="text-white">{selectedNode.category.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between border-b border-cyber-dim/30 pb-1">
                                <span>SIZE:</span>
                                <span className="text-white">{(selectedNode.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <div className="break-all text-justify opacity-70">
                                {selectedNode.path}
                            </div>
                        </div>
                        <div className="pt-2 text-[10px] text-cyber-cyan/50 animate-pulse uppercase tracking-widest">
                            // DOUBLE CLICK TO OPEN SOURCE
                        </div>
                    </div>
                )}
            </div>

            {/* Status Overlays */}
            {!isOrganizing && !selectedNode && (
                <div className="absolute bottom-10 left-10 text-xs font-mono text-cyber-cyan/50 animate-pulse pointer-events-none">
                    // UNSTRUCTURED DATA DETECTED<br />
                    // ENTROPY LEVEL: CRITICAL
                </div>
            )}
            {isOrganizing && (
                <div className="absolute bottom-10 right-10 text-right text-xs font-mono text-cyber-green/80 pointer-events-none">
                     // CRYSTALLIZING DATA STRUCTURES<br />
                     // ESTABLISHING NEURAL LINKS...
                </div>
            )}
        </div>
    );
};
