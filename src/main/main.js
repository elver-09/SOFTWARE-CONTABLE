// src/main/main.js
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// --- 1. IMPORTACIONES DE CONFIGURACIÓN Y BASE DE DATOS ---
const { getSettings, saveSettings } = require('./config/settings');
const { conectarEmpresa } = require('./database/db');

// --- 2. IMPORTACIONES DE CONTROLADORES ---
const empresaController = require('./controllers/empresaController');
const planCuentasController = require('./controllers/planCuentasController');
const tiposDocumentosController = require('./controllers/tiposDocumentosController');
const entidadesController = require('./controllers/entidadesController');
const voucherController = require('./controllers/voucherController');

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

    // ENTIDADES (CLIENTE / PROVEEDOR)
    ipcMain.handle('entidades:get', () => entidadesController.getEntidades());
    ipcMain.handle('entidades:add', (event, data) => entidadesController.addEntidad(data));
    ipcMain.handle('entidades:update', (event, data) => entidadesController.updateEntidad(data));
    ipcMain.handle('entidades:delete', (event, codigo) => entidadesController.deleteEntidad(codigo));
    ipcMain.handle('entidades:import-excel', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Seleccionar archivo Excel',
            filters: [{ name: 'Archivos Excel', extensions: ['xlsx', 'xls', 'csv'] }],
            properties: ['openFile']
        });
        if (result.canceled || result.filePaths.length === 0) return { success: false, canceled: true };
        return entidadesController.importFromExcel(result.filePaths[0]);
    });
    ipcMain.handle('entidades:export-excel', async () => {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Guardar archivo Excel',
            defaultPath: 'ClientesProveedores.xlsx',
            filters: [{ name: 'Archivos Excel', extensions: ['xlsx'] }]
        });
        if (result.canceled || !result.filePath) return { success: false, canceled: true };
        return entidadesController.exportToExcel(result.filePath);
    });
}

// --- 3. REGISTRO DE RUTAS IPC (SOLO UNA VEZ POR CANAL) ---
function registrarRutasIPC() {
    
    // GESTIÓN GLOBAL DE EMPRESAS (Rutas y Carpetas)
    ipcMain.handle('empresa:get-list', () => {
        const settings = getSettings();
        const validCompanies = settings.companies.filter(folderPath => fs.existsSync(folderPath));
        if (validCompanies.length !== settings.companies.length) {
            settings.companies = validCompanies;
            saveSettings(settings);
        }
        return settings.companies; 
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
        
        saveSettings(settings);
        conectarEmpresa(folderPath);

        return { success: true, folderPath };
    });

    ipcMain.handle('empresa:conectar-directa', (event, ruta) => {
        if (!fs.existsSync(ruta)) {
            const settings = getSettings();
            settings.companies = settings.companies.filter(c => c !== ruta);
            saveSettings(settings);
            return { success: false, error: "La carpeta de la empresa ya no existe y ha sido removida de la lista." };
        }
        try {
            conectarEmpresa(ruta);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    });

    // DATOS DEL PERFIL DE EMPRESA (Configuración Interna)
    ipcMain.handle('empresa:get-info', () => empresaController.getInfoEmpresa());
    ipcMain.handle('empresa:update-info', (event, data) => empresaController.updateInfoEmpresa(data));

    // PLAN DE CUENTAS
    ipcMain.handle('plan-cuentas:get', () => planCuentasController.getPlanCuentas());
    ipcMain.handle('plan-cuentas:add', (event, data) => planCuentasController.addCuenta(data));
    ipcMain.handle('plan-cuentas:update', (event, data) => planCuentasController.updateCuenta(data));
    ipcMain.handle('plan-cuentas:delete', (event, codigo) => planCuentasController.deleteCuenta(codigo));
    
    // IMPORTAR EXCEL
    ipcMain.handle('plan-cuentas:import-excel', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Seleccionar archivo Excel',
            filters: [{ name: 'Archivos Excel', extensions: ['xlsx', 'xls', 'csv'] }],
            properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) {
            return { success: false, canceled: true };
        }
        return planCuentasController.importFromExcel(result.filePaths[0]);
    });
    
    // EXPORTAR EXCEL
    ipcMain.handle('plan-cuentas:export-excel', async () => {
        const result = await dialog.showSaveDialog(mainWindow, {
            title: 'Guardar archivo Excel',
            defaultPath: 'PlanContable.xlsx',
            filters: [{ name: 'Archivos Excel', extensions: ['xlsx'] }]
        });

        if (result.canceled || !result.filePath) return { success: false, canceled: true };
        return planCuentasController.exportToExcel(result.filePath);
    });

    // TIPOS DE DOCUMENTOS
    ipcMain.handle('documentos:get', () => tiposDocumentosController.getDocumentos());
    ipcMain.handle('documentos:add', (event, data) => tiposDocumentosController.addDocumento(data));
    ipcMain.handle('documentos:update', (event, data) => tiposDocumentosController.updateDocumento(data));
    ipcMain.handle('documentos:delete', (event, codigo) => tiposDocumentosController.deleteDocumento(codigo));
    ipcMain.handle('documentos:import-excel', async () => {
        const result = await dialog.showOpenDialog(mainWindow, {
            title: 'Seleccionar archivo Excel',
            filters: [{ name: 'Archivos Excel', extensions: ['xlsx', 'xls', 'csv'] }],
            properties: ['openFile']
        });

        if (result.canceled || result.filePaths.length === 0) return { success: false, canceled: true };
        return tiposDocumentosController.importFromExcel(result.filePaths[0]);
    });

    // VOUCHERS
    ipcMain.handle('voucher:add', (event, data) => voucherController.addVoucher(data));
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