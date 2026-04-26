// src/main/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// --- 1. IMPORTACIONES DE CONFIGURACIÓN Y BASE DE DATOS ---
const { getSettings, saveSettings } = require('./config/settings');
const { conectarEmpresa } = require('./database/db');

// --- 2. IMPORTACIONES DE CONTROLADORES ---
const empresaController = require('./controllers/empresaController');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        minWidth: 800,
        minHeight: 600,
        title: "Software Contable Pro",
        webPreferences: {
            preload: path.join(__dirname, '../preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// --- 3. REGISTRO DE RUTAS IPC (SOLO UNA VEZ POR CANAL) ---
function registrarRutasIPC() {
    
    // GESTIÓN GLOBAL DE EMPRESAS (Rutas y Carpetas)
    ipcMain.handle('empresa:get-list', () => {
        return getSettings().companies; 
    });

    ipcMain.handle('empresa:seleccionar', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Seleccionar o Crear Carpeta de Empresa',
            properties: ['openDirectory', 'createDirectory']
        });

        if (result.canceled) return { success: false };

        const folderPath = result.filePaths[0];
        const settings = getSettings();
        
        if (!settings.companies.includes(folderPath)) {
            settings.companies.push(folderPath);
        }
        
        settings.lastCompanyPath = folderPath;
        saveSettings(settings);
        conectarEmpresa(folderPath);

        return { success: true, folderPath };
    });

    ipcMain.handle('empresa:conectar-directa', (event, ruta) => {
        const settings = getSettings();
        settings.lastCompanyPath = ruta;
        saveSettings(settings);
        conectarEmpresa(ruta);
        return { success: true };
    });

    ipcMain.handle('empresa:checkLast', () => {
        const settings = getSettings();
        if (settings.lastCompanyPath) {
            conectarEmpresa(settings.lastCompanyPath);
            return { success: true, folderPath: settings.lastCompanyPath };
        }
        return { success: false };
    });

    // DATOS DEL PERFIL DE EMPRESA (Configuración Interna)
    ipcMain.handle('empresa:get-info', () => empresaController.getInfoEmpresa());
    ipcMain.handle('empresa:update-info', (event, data) => empresaController.updateInfoEmpresa(data));
}

// --- 4. CICLO DE VIDA ---
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