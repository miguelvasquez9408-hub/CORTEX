export interface FileStats {
    count: number;
    size: number;
}

export interface ScanReport {
    totalFiles: number;
    totalSize: number;
    byExtension: Record<string, FileStats>;
    fileSample: { name: string; path: string; extension: string; size: number }[]; // Sample for visualization
    errors: string[];
}

export interface OrganizationReport {
    moved: number;
    skipped: number;
    errors: string[];
    actions: { src: string; dest: string; category: string }[];
}
