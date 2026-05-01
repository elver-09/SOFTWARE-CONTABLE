let entInitialized = false;
let selectedEnt = null;

export async function initEntidades() {
  await renderTablaEntidades();

  if (entInitialized) return;
  entInitialized = true;

  // Exportar
  document.getElementById('btnExportarExcelEnt').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exportando...';
    const result = await window.api.exportarExcelEntidades();
    btn.innerHTML = '<i class="fa-solid fa-file-export"></i> Exportar';
    if (result && result.success) alert('¡Exportación exitosa!');
    else if (result && !result.canceled) alert('Error: ' + result.error);
  });

  // Importar
  document.getElementById('btnImportarExcelEnt').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';
    const result = await window.api.importarExcelEntidades();
    btn.innerHTML = '<i class="fa-solid fa-file-excel"></i> Importar';
    if (result && result.success) {
      alert(`¡Importación exitosa! Se procesaron ${result.count} registros.`);
      await renderTablaEntidades();
    } else if (result && !result.canceled) alert('Error: ' + result.error);
  });

  // Buscar
  document.getElementById('inputBuscarEnt').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    document.querySelectorAll('#tabla-entidades tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
  });

  // Editar
  document.getElementById('btnEditarEnt').addEventListener('click', () => {
    if (!selectedEnt) return alert('Seleccione un registro primero.');
    document.getElementById('modalEntTitle').textContent = 'Editar Registro';
    document.getElementById('ent_codigo').value = selectedEnt.codigo;
    document.getElementById('ent_old_codigo').value = selectedEnt.codigo;
    document.getElementById('ent_razon_social').value = selectedEnt.razon_social;
    document.getElementById('ent_tipo').value = selectedEnt.tipo;
    document.getElementById('ent_is_edit').value = 'true';
    document.getElementById('modalEnt').style.display = 'flex';
  });

  // Eliminar
  document.getElementById('btnEliminarEnt').addEventListener('click', async () => {
    if (!selectedEnt) return alert('Seleccione un registro primero.');
    if (confirm(`¿Eliminar el registro ${selectedEnt.codigo}?`)) {
      const result = await window.api.deleteEntidad(selectedEnt.codigo);
      if (result.success) await renderTablaEntidades();
      else alert('Error: ' + result.error);
    }
  });

  // Nuevo
  document.getElementById('btnNuevaEnt').addEventListener('click', () => {
    document.getElementById('formEnt').reset();
    document.getElementById('modalEntTitle').textContent = 'Nuevo Registro';
    document.getElementById('ent_is_edit').value = 'false';
    document.getElementById('ent_codigo').readOnly = false;
    document.getElementById('modalEnt').style.display = 'flex';
  });

  // Cerrar Modal
  document.getElementById('btnCerrarModalEnt').addEventListener('click', () => {
    document.getElementById('modalEnt').style.display = 'none';
  });

  // Guardar
  document.getElementById('formEnt').addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = document.getElementById('ent_is_edit').value === 'true';
    const data = {
      old_codigo: document.getElementById('ent_old_codigo').value,
      codigo: document.getElementById('ent_codigo').value.trim(),
      razon_social: document.getElementById('ent_razon_social').value.trim(),
      tipo: document.getElementById('ent_tipo').value
    };

    let result = isEdit ? await window.api.updateEntidad(data) : await window.api.addEntidad(data);
    if (result.success) {
      document.getElementById('modalEnt').style.display = 'none';
      await renderTablaEntidades();
    } else {
      alert('Error: ' + result.error);
    }
  });

  // Seleccionar fila
  document.getElementById('tabla-entidades').addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (tr) {
      document.querySelectorAll('#tabla-entidades tr').forEach(r => r.style.backgroundColor = '');
      tr.style.backgroundColor = '#d4e6f1';
      selectedEnt = { 
        codigo: tr.dataset.code, 
        razon_social: tr.dataset.razon,
        tipo: tr.dataset.tipo 
      };
    }
  });
}

async function renderTablaEntidades() {
  selectedEnt = null;
  const entidades = await window.api.getEntidades() || [];
  const tbody = document.getElementById('tabla-entidades');
  
  if (entidades.length === 0) return tbody.innerHTML = `<tr><td colspan="3" style="text-align: center;">No hay clientes ni proveedores registrados.</td></tr>`;

  tbody.innerHTML = entidades.map(e => {
    return `<tr data-code="${e.codigo}" data-razon="${e.razon_social.replace(/"/g, '&quot;')}" data-tipo="${e.tipo}" style="cursor: pointer;">
      <td>${e.codigo}</td>
      <td>${e.razon_social}</td>
      <td>${e.tipo}</td>
    </tr>`;
  }).join('');
}