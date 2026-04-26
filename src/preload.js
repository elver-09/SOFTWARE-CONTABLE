const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // --- 1. GESTIÓN DE EMPRESAS ---
    seleccionarEmpresa: () => ipcRenderer.invoke('empresa:seleccionar'),
    checkLastEmpresa: () => ipcRenderer.invoke('empresa:checkLast'),

    // --- 2. MÓDULO DE CLIENTES ---
    getClientes: () => ipcRenderer.invoke('clientes:get'),
    createCliente: (data) => ipcRenderer.invoke('clientes:create', data),

    // --- 3. MÓDULO DE FACTURACIÓN Y PDF ---
    getComprobantes: () => ipcRenderer.invoke('comprobantes:get'),
    createComprobante: (data) => ipcRenderer.invoke('comprobantes:create', data),
    exportarPDF: (data) => ipcRenderer.invoke('comprobantes:pdf', data)
});