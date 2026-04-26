// src/renderer/js/app.js

import { initRouter } from './router.js';
import { initClientesModule, loadClientes } from './modules/clientes.js';
import { initFacturacionModule, cargarSelectClientes } from './modules/facturacion.js';

document.addEventListener('DOMContentLoaded', async () => {
  const rutaUI = document.getElementById('ruta_empresa');
  const btnCambiar = document.getElementById('btnCambiarEmpresa');

  // Función para mostrar solo el nombre final de la carpeta (ej: Gloria_SAC)
  const obtenerNombreCarpeta = (rutaCompleta) => {
    if (!rutaCompleta) return "Ninguna";
    return rutaCompleta.split(/[/\\]/).pop();
  };

  // 1. Revisar si hay una empresa seleccionada
  const lastCompany = await window.api.checkLastEmpresa();
  
  if (lastCompany.success) {
    rutaUI.innerText = obtenerNombreCarpeta(lastCompany.folderPath);
    rutaUI.title = lastCompany.folderPath; // Tooltip con la ruta completa
    
    // Inicializar módulos porque ya hay Base de Datos
    initClientesModule();
    loadClientes(); 
    initFacturacionModule();
  } else {
    rutaUI.innerText = "Ninguna";
    alert("Por favor, seleccione o cree una carpeta para empezar a trabajar.");
    btnCambiar.click(); 
  }

  // 2. Evento del botón cambiar carpeta
  btnCambiar.addEventListener('click', async () => {
    const result = await window.api.seleccionarEmpresa();
    if (result.success) {
      rutaUI.innerText = obtenerNombreCarpeta(result.folderPath);
      window.location.reload(); // Recargar para limpiar la memoria
    }
  });

  // 3. Inicializar el menú lateral y decirle qué hacer al cambiar de vista
  initRouter((targetId) => {
    if (targetId === 'view-facturas') {
      cargarSelectClientes(); // Refrescar clientes al entrar a facturar
    }
  });
});