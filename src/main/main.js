const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// --- 1. IMPORTACIONES DE CONFIGURACIÓN Y BASE DE DATOS ---
const { getSettings, saveSettings } = require('./config/settings');
const { conectarEmpresa } = require('./database/db');

// --- 2. IMPORTACIONES DE CONTROLADORES ---
const clienteController = require('./controllers/clienteController');
const comprobanteController = require('./controllers/comprobanteController');
const pdfController = require('./controllers/pdfController');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 800,
        minHeight: 600,
        title: "Software Contable Pro",
        webPreferences: {
            // El path del preload es relativo a este archivo (src/main/main.js)
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // Cargar la interfaz
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    // Limpiar la referencia cuando se cierra
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// --- 3. REGISTRO DE RUTAS IPC ---
function registrarRutasIPC() {
    // GESTIÓN DE EMPRESA (Carpetas)
    ipcMain.handle('empresa:seleccionar', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Seleccionar o Crear Carpeta de Empresa',
            properties: ['openDirectory', 'createDirectory']
        });

        if (result.canceled) return { success: false, canceled: true };

        const folderPath = result.filePaths[0];
        conectarEmpresa(folderPath);

        const settings = getSettings();
        settings.lastCompanyPath = folderPath;
        saveSettings(settings);

        return { success: true, folderPath };
    });

    ipcMain.handle('empresa:checkLast', () => {
        const settings = getSettings();
        if (settings.lastCompanyPath) {
            conectarEmpresa(settings.lastCompanyPath);
            return { success: true, folderPath: settings.lastCompanyPath };
        }
        return { success: false };
    });

    // CLIENTES
    ipcMain.handle('clientes:get', () => clienteController.getClientes());
    ipcMain.handle('clientes:create', (event, data) => clienteController.createCliente(data));

    // COMPROBANTES Y PDF
    ipcMain.handle('comprobantes:get', () => comprobanteController.getComprobantes());
    ipcMain.handle('comprobantes:create', (event, data) => comprobanteController.createComprobante(data));
    ipcMain.handle('comprobantes:pdf', (event, data) => pdfController.generarYGuardarPDF(data));
}

// --- 4. CICLO DE VIDA DE LA APLICACIÓN ---
app.whenReady().then(() => {
    registrarRutasIPC();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});