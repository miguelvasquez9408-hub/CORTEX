import electron from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { FileScanner } from './core/scanner.ts'
import { FileOrganizer } from './core/organizer.ts'
import type { OrganizationReport } from '../src/types' // Assuming I can import this or redefine

const { app, BrowserWindow, ipcMain, dialog, shell } = electron

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─ dist
// │ ├─┬─ electron
// │ │ ├── main.js
// │ │ └── preload.js
// │ ├── index.html
// │ ├── ...other-static-files-from-public
// │
process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#0a0a0a', // Cyber black
        titleBarStyle: 'hidden', // Custom title bar
        titleBarOverlay: {
            color: '#0a0a0a',
            symbolColor: '#00f3ff',
            height: 30
        },
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(process.env.DIST, 'index.html'))
    }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
        win = null
    }
})

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(createWindow)

// --- IPC Handlers for Migration Logic ---
let lastActions: { src: string; dest: string }[] = [];

ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog(win!, {
        properties: ['openDirectory']
    })
    return result.filePaths[0]
})

ipcMain.handle('scan-directory', async (_event, dirPath) => {
    const scanner = new FileScanner()
    return await scanner.scan(dirPath)
})

ipcMain.handle('organize-directory', async (_event, dirPath, dryRun) => {
    const organizer = new FileOrganizer()
    const report = await organizer.organize(dirPath, dryRun)
    if (!dryRun) {
        lastActions = report.actions;
    }
    return report
})

ipcMain.handle('undo-last-organization', async () => {
    if (lastActions.length === 0) return { success: false, message: 'No actions to undo' };

    const organizer = new FileOrganizer();
    const errors = await organizer.undo(lastActions);

    lastActions = []; // Clear after undo

    return {
        success: errors.length === 0,
        errors
    };
})

ipcMain.handle('open-file', async (_event, filePath) => {
    // shell.showItemInFolder is better for "finding" the file
    // shell.openPath is better for "launching" it.
    // Let's use showItemInFolder to avoid accidental execution of exe/scripts
    shell.showItemInFolder(filePath)
})
