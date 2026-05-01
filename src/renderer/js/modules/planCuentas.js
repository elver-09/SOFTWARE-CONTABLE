// src/renderer/js/modules/planCuentas.js

let planCuentasInitialized = false;
let selectedCuenta = null; // Guardará la cuenta seleccionada en la tabla

export async function initPlanCuentas() {
  await renderTablaCuentas();

  if (planCuentasInitialized) return;
  planCuentasInitialized = true;

  // Botón Importar Excel
  const btnImportarExcel = document.getElementById('btnImportarExcel');
  if (btnImportarExcel) {
    btnImportarExcel.addEventListener('click', async () => {
      btnImportarExcel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';
      btnImportarExcel.disabled = true;
      
      const result = await window.api.importarExcelCuentas();
      
      btnImportarExcel.innerHTML = '<i class="fa-solid fa-file-excel"></i> Importar Excel';
      btnImportarExcel.disabled = false;

      if (result.canceled) return;

      if (result.success) {
        alert(`¡Importación exitosa! Se agregaron o actualizaron ${result.count} cuentas.`);
        await renderTablaCuentas();
      } else {
        alert('Error al importar Excel: ' + result.error);
      }
    });
  }

  // Botón Exportar Excel
  const btnExportarExcel = document.getElementById('btnExportarExcel');
  if (btnExportarExcel) {
    btnExportarExcel.addEventListener('click', async () => {
      btnExportarExcel.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exportando...';
      btnExportarExcel.disabled = true;
      
      const result = await window.api.exportarExcelCuentas();
      
      btnExportarExcel.innerHTML = '<i class="fa-solid fa-file-export"></i> Exportar';
      btnExportarExcel.disabled = false;

      if (result && result.canceled) return;
      if (result && result.success) {
        alert('¡Exportación exitosa!');
      } else {
        alert('Error al exportar Excel: ' + (result ? result.error : 'Error desconocido'));
      }
    });
  }

  // Barra de Búsqueda
  const inputBuscarCuenta = document.getElementById('inputBuscarCuenta');
  if (inputBuscarCuenta) {
    inputBuscarCuenta.addEventListener('input', (e) => {
      const term = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('#tabla-plan-cuentas tr');

      if (term === '') {
        renderTablaCuentas(); // Restablece el árbol al borrar la búsqueda
        return;
      }

      rows.forEach(row => {
        const text1 = row.cells[0].textContent.toLowerCase();
        const text2 = row.cells[1].textContent.toLowerCase();
        row.style.display = (text1.includes(term) || text2.includes(term)) ? '' : 'none';
      });
    });
  }

  // Botón Editar Cuenta (Global)
  const btnEditarCuenta = document.getElementById('btnEditarCuenta');
  if (btnEditarCuenta) {
    btnEditarCuenta.addEventListener('click', () => {
      if (!selectedCuenta) {
        alert('Por favor, seleccione una cuenta de la tabla primero.');
        return;
      }
      if (selectedCuenta.codigo.length <= 3) {
        alert('Las cuentas principales de 3 dígitos o menos son estructurales y no pueden ser editadas.');
        return;
      }
      document.getElementById('modalCuentaTitle').textContent = 'Editar Cuenta';
      document.getElementById('cuenta_codigo').value = selectedCuenta.codigo;
      document.getElementById('cuenta_old_codigo').value = selectedCuenta.codigo;
      document.getElementById('cuenta_descripcion').value = selectedCuenta.descripcion;
      document.getElementById('cuenta_tipo').value = selectedCuenta.tipo || '';
      document.getElementById('cuenta_is_edit').value = 'true';
      document.getElementById('modalCuenta').style.display = 'flex';
    });
  }

  // Botón Eliminar Cuenta (Global)
  const btnEliminarCuenta = document.getElementById('btnEliminarCuenta');
  if (btnEliminarCuenta) {
    btnEliminarCuenta.addEventListener('click', async () => {
      if (!selectedCuenta) {
        alert('Por favor, seleccione una cuenta de la tabla primero.');
        return;
      }
      if (selectedCuenta.codigo.length <= 3) {
        alert('Las cuentas principales de 3 dígitos o menos son estructurales y no pueden ser eliminadas.');
        return;
      }
      if (confirm(`¿Estás seguro de eliminar la cuenta ${selectedCuenta.codigo}?`)) {
        const result = await window.api.deleteCuenta(selectedCuenta.codigo);
        if (result.success) await renderTablaCuentas();
        else alert('Error al eliminar: ' + result.error);
      }
    });
  }

  // Botón Nueva Cuenta
  document.getElementById('btnNuevaCuenta').addEventListener('click', () => {
    document.getElementById('modalCuentaTitle').textContent = 'Nueva Cuenta';
    document.getElementById('formCuenta').reset();
    document.getElementById('cuenta_is_edit').value = 'false';
    document.getElementById('cuenta_codigo').readOnly = false;
    document.getElementById('modalCuenta').style.display = 'flex';
  });

  // Cerrar Modal
  document.getElementById('btnCerrarModalCuenta').addEventListener('click', () => {
    document.getElementById('modalCuenta').style.display = 'none';
  });

  // Auto-completar Tipo según el Elemento (primer dígito)
  document.getElementById('cuenta_codigo').addEventListener('input', (e) => {
    const isEdit = document.getElementById('cuenta_is_edit').value === 'true';
    if (isEdit) return; // No auto-cambiar si estamos editando
    
    const val = e.target.value.trim();
    const tipoSelect = document.getElementById('cuenta_tipo');
    if (val.length > 0) {
      const elemento = val.charAt(0);
      switch (elemento) {
        case '1': case '2': case '3': tipoSelect.value = 'Activo'; break;
        case '4': tipoSelect.value = 'Pasivo'; break;
        case '5': tipoSelect.value = 'Patrimonio'; break;
        case '6': tipoSelect.value = 'Gastos'; break;
        case '7': tipoSelect.value = 'Ingresos'; break;
        case '8': tipoSelect.value = 'Resultados'; break;
        case '9': tipoSelect.value = 'Gestión'; break;
        case '0': tipoSelect.value = 'Cuentas de Orden'; break;
      }
    } else {
      tipoSelect.value = '';
    }
  });

  // Enviar Formulario
  document.getElementById('formCuenta').addEventListener('submit', async (e) => {
    e.preventDefault();

    const isEdit = document.getElementById('cuenta_is_edit').value === 'true';
    const data = {
      old_codigo: document.getElementById('cuenta_old_codigo').value,
      codigo: document.getElementById('cuenta_codigo').value.trim(),
      descripcion: document.getElementById('cuenta_descripcion').value.trim(),
      tipo: document.getElementById('cuenta_tipo').value,
      nivel: document.getElementById('cuenta_codigo').value.trim().length // Auto-calcula el nivel por longitud de dígitos
    };

    // Validación: No permitir crear cuentas de 1 o 2 dígitos manualmente
    if (!isEdit && data.codigo.length <= 2) {
      alert('No está permitido crear cuentas principales de 1 o 2 dígitos manualmente. Estas deben provenir del formato estándar.');
      return;
    }

    let result = isEdit ? await window.api.updateCuenta(data) : await window.api.addCuenta(data);

    if (result.success) {
      document.getElementById('modalCuenta').style.display = 'none';
      await renderTablaCuentas();
    } else {
      alert('Error: ' + result.error);
    }
  });

  // Delegación de eventos para editar y eliminar en la tabla
  document.getElementById('tabla-plan-cuentas').addEventListener('click', async (e) => {
    const btnEdit = e.target.closest('.btn-edit-cuenta');
    const btnDelete = e.target.closest('.btn-delete-cuenta');
    const btnToggle = e.target.closest('.toggle-btn');

    // --- Lógica para Desplegar/Contraer Subcuentas ---
    if (btnToggle) {
      const code = btnToggle.dataset.code;
      const isExpanded = btnToggle.dataset.expanded === 'true';

      if (isExpanded) {
        // Contraer: ocultar todos los descendientes (subcuentas)
        btnToggle.dataset.expanded = 'false';
        btnToggle.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        const allRows = document.querySelectorAll('#tabla-plan-cuentas tr');
        allRows.forEach(row => {
          const rowCode = row.dataset.code;
          if (rowCode && rowCode !== code && rowCode.startsWith(code)) {
            row.style.display = 'none';
            const childToggle = row.querySelector('.toggle-btn');
            if (childToggle) {
              childToggle.dataset.expanded = 'false';
              childToggle.innerHTML = '<i class="fa-solid fa-chevron-right"></i>'; // Reiniciar iconos hijos
            }
          }
        });
      } else {
        // Expandir: mostrar solo los hijos directos
        btnToggle.dataset.expanded = 'true';
        btnToggle.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        const childRows = document.querySelectorAll(`#tabla-plan-cuentas tr[data-parent="${code}"]`);
        childRows.forEach(row => {
          row.style.display = '';
        });
      }
      return; // Detener la ejecución si fue un clic de despliegue
    }

    // --- Lógica para Seleccionar Fila ---
    const tr = e.target.closest('tr');
    if (tr) {
      // Desmarcar todas las filas
      document.querySelectorAll('#tabla-plan-cuentas tr').forEach(row => {
        row.style.backgroundColor = '';
      });
      
      // Marcar fila seleccionada
      tr.style.backgroundColor = '#d4e6f1'; 

      selectedCuenta = {
        codigo: tr.dataset.code,
        descripcion: tr.dataset.descripcion,
        tipo: tr.dataset.tipo
      };
    }
  });
}

async function renderTablaCuentas() {
  // Resetear estado y botones globales al redibujar
  selectedCuenta = null;

  const cuentas = await window.api.getPlanCuentas() || [];
  const tbody = document.getElementById('tabla-plan-cuentas');
  
  if (cuentas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: #7f8c8d;">No hay cuentas registradas. Empieza agregando una.</td></tr>`;
    return;
  }

  // 1. Mapear jerarquías: Buscar qué cuenta es padre de quién basándonos en el prefijo del código
  const cuentasMap = new Map();
  cuentas.forEach(c => cuentasMap.set(String(c.codigo), c));

  cuentas.forEach(c => {
    const cod = String(c.codigo);
    let parentCode = "";
    // Buscar el prefijo más largo que ya exista en el plan de cuentas
    for (let i = cod.length - 1; i > 0; i--) {
      const prefix = cod.substring(0, i);
      if (cuentasMap.has(prefix)) {
        parentCode = prefix;
        break;
      }
    }
    c.parentCode = parentCode;
    if (parentCode) {
      const parent = cuentasMap.get(parentCode);
      if (parent) parent.hasChildren = true;
    }
  });

  tbody.innerHTML = cuentas.map(c => {
    // 2. Elementos visuales: Sangría, ocultamiento y botón de flecha (Toggle)
    const cod = String(c.codigo);
    const parentAttr = c.parentCode ? `data-parent="${c.parentCode}"` : '';
    const displayStyle = c.parentCode ? 'display: none;' : ''; // Ocultar si tiene padre
    
    let depth = 0;
    let curr = c;
    while(curr.parentCode) {
      depth++;
      curr = cuentasMap.get(curr.parentCode);
    }
    const indent = depth * 20; // 20px de sangría por cada nivel hacia adentro
    
    const toggleIcon = c.hasChildren 
      ? `<span class="toggle-btn" data-code="${cod}" data-expanded="false" style="cursor: pointer; display: inline-block; width: 20px; text-align: center; color: #2c3e50; font-weight: bold; user-select: none;"><i class="fa-solid fa-chevron-right"></i></span>` 
      : `<span style="display: inline-block; width: 20px;"></span>`; // Espacio vacío si no tiene hijos

    // Estilos para hacer la tabla más compacta (menor alto de fila)
    const tdStyle = "padding: 6px 10px; font-size: 13px; line-height: 1.2; border-bottom: 1px solid #ecf0f1;";

    return `<tr data-code="${cod}" data-descripcion="${c.descripcion.replace(/"/g, '&quot;')}" data-tipo="${c.tipo || ''}" ${parentAttr} style="${displayStyle} cursor: pointer; transition: background-color 0.2s;">
      <td style="${tdStyle} font-weight: ${c.hasChildren ? '600' : 'normal'};">
        <div style="padding-left: ${indent}px; display: flex; align-items: center;">
          ${toggleIcon} ${c.codigo}
        </div>
      </td>
      <td style="${tdStyle}">${c.descripcion}</td>
      <td style="${tdStyle}">${c.tipo || ''}</td>
    </tr>`;
  }).join('');
}