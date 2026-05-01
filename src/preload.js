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
    updateEmpresaInfo: (data) => ipcRenderer.invoke('empresa:update-info', data),

    // --- PLAN DE CUENTAS ---
    getPlanCuentas: () => ipcRenderer.invoke('plan-cuentas:get'),
    addCuenta: (data) => ipcRenderer.invoke('plan-cuentas:add', data),
    updateCuenta: (data) => ipcRenderer.invoke('plan-cuentas:update', data),
    deleteCuenta: (codigo) => ipcRenderer.invoke('plan-cuentas:delete', codigo),
    importarExcelCuentas: () => ipcRenderer.invoke('plan-cuentas:import-excel'),

    // --- TIPOS DE DOCUMENTOS ---
    getDocumentos: () => ipcRenderer.invoke('documentos:get'),
    addDocumento: (data) => ipcRenderer.invoke('documentos:add', data),
    updateDocumento: (data) => ipcRenderer.invoke('documentos:update', data),
    deleteDocumento: (codigo) => ipcRenderer.invoke('documentos:delete', codigo),
    importarExcelDocumentos: () => ipcRenderer.invoke('documentos:import-excel'),

    // --- ENTIDADES (Cliente / Proveedor) ---
    getEntidades: () => ipcRenderer.invoke('entidades:get'),
    addEntidad: (data) => ipcRenderer.invoke('entidades:add', data),
    updateEntidad: (data) => ipcRenderer.invoke('entidades:update', data),
    deleteEntidad: (codigo) => ipcRenderer.invoke('entidades:delete', codigo),
    importarExcelEntidades: () => ipcRenderer.invoke('entidades:import-excel'),
    exportarExcelEntidades: () => ipcRenderer.invoke('entidades:export-excel')
});