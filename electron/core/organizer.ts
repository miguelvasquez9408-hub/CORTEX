import fs from 'fs-extra';
import path from 'path';

export interface OrganizationReport {
    moved: number;
    skipped: number;
    errors: string[];
    actions: { src: string; dest: string; category: string }[];
}

export class FileOrganizer {
    // Define categories and their extensions
    private categories: Record<string, string[]> = {
        'Imágenes': ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff', '.ico'],
        'Documentos/PDF': ['.pdf'],
        'Documentos/Word': ['.docx', '.doc', '.odt', '.rtf'],
        'Documentos/Excel': ['.xlsx', '.xls', '.csv', '.ods'],
        'Documentos/PowerPoint': ['.pptx', '.ppt', '.odp'],
        'Documentos/Texto': ['.txt', '.md', '.log', '.json', '.xml', '.yaml', '.yml'],
        'Video': ['.mp4', '.mkv', `.avi`, `.mov`, `.wmv`, `.flv`, `.webm`],
        'Audio': ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a'],
        'Instaladores': ['.exe', '.msi', '.dmg', '.pkg', '.deb', '.rpm', '.iso'],
        'Comprimidos': ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2'],
        'Código': ['.js', '.ts', '.html', '.css', '.json', '.py', '.java', '.c', '.cpp', '.php', '.go', '.rb', '.sql', '.xml', '.yaml', '.yml'],
        'Ebooks': ['.epub', '.mobi', '.azw3'],
        'Fuentes': ['.ttf', '.otf', '.woff', '.woff2']
    };

    private report: OrganizationReport = {
        moved: 0,
        skipped: 0,
        errors: [],
        actions: []
    };

    getCategory(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase();
        for (const [category, extensions] of Object.entries(this.categories)) {
            if (extensions.includes(ext)) {
                return category;
            }
        }
        return 'Otros';
    }

    async organize(dirPath: string, dryRun: boolean = true): Promise<OrganizationReport> {
        this.report = { moved: 0, skipped: 0, errors: [], actions: [] };

        try {
            const files = await fs.readdir(dirPath);

            for (const file of files) {
                const filePath = path.join(dirPath, file);
                const stats = await fs.stat(filePath);

                if (stats.isFile()) {
                    if (file.startsWith('.') || file === 'desktop.ini') continue;

                    const category = this.getCategory(filePath);
                    const destDir = path.join(dirPath, category);
                    const destPath = path.join(destDir, file);

                    if (!dryRun) {
                        try {
                            const finalDest = await this.safeMove(filePath, destDir, file);
                            this.report.actions.push({ src: filePath, dest: finalDest, category });
                            this.report.moved++;
                        } catch (e) {
                            // Error already logged in safeMove
                        }
                    } else {
                        this.report.actions.push({ src: filePath, dest: destPath, category });
                    }
                }
            }
        } catch (error: any) {
            this.report.errors.push(`Error general: ${error.message}`);
        }

        return this.report;
    }

    async undo(actions: { src: string; dest: string }[]): Promise<string[]> {
        const errors: string[] = [];
        // Reverse order to handle potential dependencies (though less likely in flat move)
        for (const action of actions.reverse()) {
            try {
                if (await fs.pathExists(action.dest)) {
                    // Move back to src
                    await fs.move(action.dest, action.src, { overwrite: false });
                    // Note: If src already exists (e.g. user created a file there?), execute safe move logic for undo?
                    // For now, let's assume raw move back is the intent. 
                    // Ideally we should probably ensureDir(path.dirname(action.src)) too.
                }
            } catch (error: any) {
                errors.push(`Failed to undo ${action.dest} -> ${action.src}: ${error.message}`);
            }
        }
        return errors;
    }

    private async safeMove(srcPath: string, destDir: string, fileName: string): Promise<string> {
        try {
            await fs.ensureDir(destDir);
            let finalDestPath = path.join(destDir, fileName);
            let counter = 1;

            const name = path.parse(fileName).name;
            const ext = path.parse(fileName).ext;

            while (await fs.pathExists(finalDestPath)) {
                finalDestPath = path.join(destDir, `${name}_${counter}${ext}`);
                counter++;
            }

            await fs.move(srcPath, finalDestPath);
            return finalDestPath;
        } catch (error: any) {
            this.report.errors.push(`Error moviendo ${fileName}: ${error.message}`);
            throw error;
        }
    }
}
