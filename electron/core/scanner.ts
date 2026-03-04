import fs from 'fs-extra';
import path from 'path';

export interface FileStats {
    count: number;
    size: number;
}

export interface ScanReport {
    totalFiles: number;
    totalSize: number;
    byExtension: Record<string, FileStats>;
    fileSample: { name: string; path: string; extension: string; size: number }[];
    errors: string[];
}

export class FileScanner {
    private report: ScanReport = {
        totalFiles: 0,
        totalSize: 0,
        byExtension: {},
        fileSample: [],
        errors: []
    };

    /**
     * Scans a directory recursively and updates the report.
     * @param dirPath The directory to scan.
     */
    async scan(dirPath: string): Promise<ScanReport> {
        // Reset report for new scan
        this.report = {
            totalFiles: 0,
            totalSize: 0,
            byExtension: {},
            fileSample: [],
            errors: []
        };

        await this.walk(dirPath);
        return this.report;
    }

    private async walk(currentPath: string): Promise<void> {
        try {
            const stats = await fs.stat(currentPath);

            if (stats.isDirectory()) {
                const files = await fs.readdir(currentPath);
                await Promise.all(
                    files.map(file => this.walk(path.join(currentPath, file)))
                );
            } else if (stats.isFile()) {
                this.processFile(currentPath, stats);
            }
        } catch (error: any) {
            if (error.code === 'EPERM' || error.code === 'EACCES') {
                this.report.errors.push(currentPath);
            }
        }
    }

    private processFile(filePath: string, stats: fs.Stats): void {
        this.report.totalFiles++;
        this.report.totalSize += stats.size;

        const ext = path.extname(filePath).toLowerCase() || '(sin extensión)';

        if (!this.report.byExtension[ext]) {
            this.report.byExtension[ext] = { count: 0, size: 0 };
        }

        this.report.byExtension[ext].count++;
        this.report.byExtension[ext].size += stats.size;

        // Add to sample for visualization (limit to 300 to avoid performance issues)
        if (this.report.fileSample.length < 300) {
            this.report.fileSample.push({
                name: path.basename(filePath),
                path: filePath,
                extension: ext,
                size: stats.size
            });
        }
    }
}
