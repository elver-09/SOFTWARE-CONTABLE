const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { initDB } = require('./database/db');
const clienteController = require('./controllers/clienteController');
const comprobanteController = require('./controllers/comprobanteController');
const pdfController = require('./controllers/pdfController');

function createWindow () {
  // Configuración de la ventana principal
    const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
        preload: path.join(__dirname, '../../src/preload.js'),
      // Por seguridad, Node.js no debe ejecutarse directamente en el frontend
        nodeIntegration: false, 
        contextIsolation: true
    }
    });

  // Cargar el archivo HTML de la interfaz
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  // Opcional: Abrir las herramientas de desarrollo (consola) automáticamente
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  // 1. Inicializar la base de datos SQLite
    initDB();
    // --- RUTAS IPC (Comunicación Frontend -> Backend) ---
    ipcMain.handle('clientes:get', () => {
        return clienteController.getClientes();
    });

    ipcMain.handle('clientes:create', (event, clienteData) => {
        return clienteController.createCliente(clienteData);
    });

    ipcMain.handle('comprobantes:get', () => {
      return comprobanteController.getComprobantes();
    });

    ipcMain.handle('comprobantes:create', (event, facturaData) => {
      return comprobanteController.createComprobante(facturaData);
    });

    ipcMain.handle('comprobantes:pdf', async (event, facturaData) => {
      return await pdfController.generarYGuardarPDF(facturaData);
    });
    // ----------------------------------------------------
    
    // 2. Crear la ventana de la aplicación
    createWindow();

app.on('activate', () => {
    // En macOS es común volver a crear una ventana al hacer clic en el icono del dock
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
    });
});

// Cerrar el proceso cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
    app.quit();
    }
});