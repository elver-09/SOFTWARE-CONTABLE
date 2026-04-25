const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    getClientes: () => ipcRenderer.invoke('clientes:get'),
    createCliente: (data) => ipcRenderer.invoke('clientes:create', data),
    getComprobantes: () => ipcRenderer.invoke('comprobantes:get'),
    createComprobante: (data) => ipcRenderer.invoke('comprobantes:create', data),
    exportarPDF: (data) => ipcRenderer.invoke('comprobantes:pdf', data)
});