// src/renderer/js/app.js

import { initRouter } from './router.js';
import { initPlanCuentas } from './modules/planCuentas.js';
import { initTiposDocumentos } from './modules/tiposDocumentos.js';
import { initEntidades } from './modules/entidades.js';

let empresaConfigInitialized = false;

document.addEventListener('DOMContentLoaded', async () => {
  // Función para mostrar solo el nombre final de la carpeta (ej: Gloria_SAC)
  const obtenerNombreCarpeta = (rutaCompleta) => {
    if (!rutaCompleta) return "Contabilidad Pro";
    return rutaCompleta.split(/[/\\]/).pop();
  };

  // 1. Estado inicial sin empresa conectada
  document.getElementById('sidebar-title').textContent = "Contabilidad Pro";
  document.getElementById('sidebar-logo').style.display = 'none';

  // Configurar el botón de contraer / expandir sidebar
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('collapsed');
  });

  // 2. Inicializar el menú lateral y decirle qué hacer al cambiar de vista
  initRouter((targetId) => {
      if (targetId === 'view-empresa-gestion') {
          renderListaEmpresas();
          initEmpresaConfig();
      } else if (targetId === 'view-plan-cuentas') {
          initPlanCuentas();
      } else if (targetId === 'view-tipos-documentos') {
          initTiposDocumentos();
      } else if (targetId === 'view-entidades') {
          initEntidades();
      }
  });

  // Cargar la vista de empresa desde el inicio, sin requerir clic adicional
  renderListaEmpresas();
  initEmpresaConfig();
});

async function renderListaEmpresas() {
  const empresas = await window.api.getEmpresasLista() || [];
  const lista = document.getElementById('lista-empresas-items');
  lista.innerHTML = '';
  
  empresas.forEach(ruta => {
    const div = document.createElement('div');
    div.className = 'empresa-item';
    div.innerHTML = `
      <span>${ruta.split(/[/\\]/).pop()}</span>
      <button class="btn-edit" data-ruta="${ruta}" style="background: none; border: none; font-size: 16px; cursor: pointer;"><i class="fa-solid fa-pencil"></i></button>
    `;
    div.title = ruta;
    div.addEventListener('dblclick', async () => {
      const res = await window.api.conectarRutaDirecta(ruta);
      if (res.success) {
        window.location.reload();
      } else {
        alert(res.error);
        renderListaEmpresas(); // Refrescar lista de UI
      }
    });
    lista.appendChild(div);
  });

  // Agregar eventos a los botones de editar
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const ruta = btn.getAttribute('data-ruta');
      abrirModalEditar(ruta);
    });
  });
}

function initEmpresaConfig() {
  // Cargar datos actuales (solo lectura)
  loadEmpresaInfo();

  // Evitar registrar listeners múltiples veces
  if (empresaConfigInitialized) return;
  empresaConfigInitialized = true;

  // Evento para nueva empresa
  document.getElementById('btnNuevaEmpresa').addEventListener('click', async () => {
    const result = await window.api.seleccionarEmpresa();
    if (result.success) {
      // Actualizar título del sidebar
      const nombreCarpeta = result.folderPath.split(/[/\\]/).pop();
      document.getElementById('sidebar-title').textContent = nombreCarpeta;
      renderListaEmpresas();
      loadEmpresaInfo();
    }
  });

  // Eventos del modal
  document.getElementById('formEditarEmpresa').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('edit_emp_nombre').value;
    const ruc = document.getElementById('edit_emp_ruc').value;
    const direccion = document.getElementById('edit_emp_direccion').value;
    const telefono = document.getElementById('edit_emp_telefono').value;
    const correo = document.getElementById('edit_emp_correo').value;
    const periodo = document.getElementById('edit_emp_periodo').value;
    
    // Obtener logo
    let logo = null;
    const fileInput = document.getElementById('edit_emp_logo');
    if (fileInput.files[0]) {
      logo = document.getElementById('preview-logo').src;
    } else {
      // Mantener logo actual si no se cambió
      const info = await window.api.getEmpresaInfo();
      logo = info.logo;
    }
    
    const result = await window.api.updateEmpresaInfo({
      nombre: nombre,
      ruc: ruc,
      direccion: direccion,
      telefono: telefono,
      correo: correo,
      periodo: periodo,
      logo: logo
    });
    if (result.success) {
      alert('Empresa editada correctamente');
      cerrarModal();
      // Recargar datos en la sección de solo lectura
      loadEmpresaInfo();
    } else {
      alert('Error: ' + result.error);
    }
  });

  // Evento para preview del logo
  document.getElementById('edit_emp_logo').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        document.getElementById('preview-logo').src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('btnCerrarModal').addEventListener('click', cerrarModal);
}

async function loadEmpresaInfo() {
  try {
    const info = await window.api.getEmpresaInfo();
    document.getElementById('emp_nombre').value = info.nombre_comercial || '';
    document.getElementById('emp_ruc').value = info.ruc || '';
    document.getElementById('emp_direccion').value = info.direccion_fiscal || '';
    document.getElementById('emp_telefono').value = info.telefono || '';
    document.getElementById('emp_correo').value = info.correo || '';
    document.getElementById('emp_periodo').value = info.periodo_contable || '2024';
    
    // Mostrar logo en sidebar
    const logoImg = document.getElementById('sidebar-logo');
    if (info.logo) {
      logoImg.src = info.logo;
      logoImg.style.display = 'block';
    } else {
      logoImg.style.display = 'none';
    }

    // Mostrar el nombre de la empresa en el sidebar
    document.getElementById('sidebar-title').textContent = info.nombre_comercial || 'Empresa Activa';

  } catch (error) {
    // No hay empresa activa todavía o no hay base de datos cargada.
    document.getElementById('emp_nombre').value = '';
    document.getElementById('emp_ruc').value = '';
    document.getElementById('emp_direccion').value = '';
    document.getElementById('emp_telefono').value = '';
    document.getElementById('emp_correo').value = '';
    document.getElementById('emp_periodo').value = '2024';
    document.getElementById('sidebar-logo').style.display = 'none';
    document.getElementById('sidebar-title').textContent = "Contabilidad Pro";
  }
}

async function abrirModalEditar(ruta) {
  // Primero conectar a esa empresa para cargar su info
  const connectRes = await window.api.conectarRutaDirecta(ruta);
  if (!connectRes.success) {
    alert(connectRes.error);
    renderListaEmpresas();
    return;
  }
  // Luego cargar info
  const info = await window.api.getEmpresaInfo();
  const nombreCarpeta = ruta.split(/[/\\]/).pop();
  
    // Pre-llenar con nombre de carpeta si no hay nombre comercial
    document.getElementById('edit_emp_nombre').value = info.nombre_comercial || nombreCarpeta;
    document.getElementById('edit_emp_ruc').value = info.ruc || '';
    document.getElementById('edit_emp_direccion').value = info.direccion_fiscal || '';
    document.getElementById('edit_emp_telefono').value = info.telefono || '';
    document.getElementById('edit_emp_correo').value = info.correo || '';
    document.getElementById('edit_emp_periodo').value = info.periodo_contable || '2024';
    
    // Mostrar logo actual
    const previewImg = document.getElementById('preview-logo');
    if (info.logo) {
      previewImg.src = info.logo;
      previewImg.style.display = 'block';
    } else {
      previewImg.style.display = 'none';
    }
    
    document.getElementById('modalEditarEmpresa').style.display = 'flex';
    
    // Evento para preview de nuevo logo
    document.getElementById('edit_emp_logo').addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          previewImg.src = event.target.result;
          previewImg.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
}

function cerrarModal() {
  document.getElementById('modalEditarEmpresa').style.display = 'none';
  // Reconectar a la empresa original si es necesario
  // Pero por ahora, dejar como está
}