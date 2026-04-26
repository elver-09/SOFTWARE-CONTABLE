// src/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
    // --- GESTIÓN GLOBAL DE EMPRESAS (Rutas) ---
    seleccionarEmpresa: () => ipcRenderer.invoke('empresa:seleccionar'),
    checkLastEmpresa: () => ipcRenderer.invoke('empresa:checkLast'),
    getEmpresasLista: () => ipcRenderer.invoke('empresa:get-list'),
    conectarRutaDirecta: (ruta) => ipcRenderer.invoke('empresa:conectar-directa', ruta),

    // --- DATOS INTERNOS DE LA EMPRESA ACTIVA ---
    getEmpresaInfo: () => ipcRenderer.invoke('empresa:get-info'),
    updateEmpresaInfo: (data) => ipcRenderer.invoke('empresa:update-info', data)
});