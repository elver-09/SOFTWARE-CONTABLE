let docInitialized = false;
let selectedDoc = null;

export async function initTiposDocumentos() {
  await renderTablaDocumentos();

  if (docInitialized) return;
  docInitialized = true;

  // Importar Excel
  const btnImportarExcelDoc = document.getElementById('btnImportarExcelDoc');
  if (btnImportarExcelDoc) {
    btnImportarExcelDoc.addEventListener('click', async () => {
      btnImportarExcelDoc.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';
      const result = await window.api.importarExcelDocumentos();
      btnImportarExcelDoc.innerHTML = '<i class="fa-solid fa-file-excel"></i> Importar';
      if (result && result.success) {
        alert(`¡Importación exitosa! Se procesaron ${result.count} documentos.`);
        await renderTablaDocumentos();
      } else if (result && !result.canceled) {
        alert('Error al importar: ' + result.error);
      }
    });
  }

  // Búsqueda
  document.getElementById('inputBuscarDoc').addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    document.querySelectorAll('#tabla-tipos-documentos tr').forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
  });

  // Editar
  document.getElementById('btnEditarDoc').addEventListener('click', () => {
    if (!selectedDoc) return alert('Seleccione un documento primero.');
    document.getElementById('modalDocTitle').textContent = 'Editar Documento';
    document.getElementById('doc_codigo').value = selectedDoc.codigo;
    document.getElementById('doc_old_codigo').value = selectedDoc.codigo;
    document.getElementById('doc_descripcion').value = selectedDoc.descripcion;
    document.getElementById('doc_is_edit').value = 'true';
    document.getElementById('modalDoc').style.display = 'flex';
  });

  // Eliminar
  document.getElementById('btnEliminarDoc').addEventListener('click', async () => {
    if (!selectedDoc) return alert('Seleccione un documento primero.');
    if (confirm(`¿Eliminar el documento ${selectedDoc.codigo}?`)) {
      const result = await window.api.deleteDocumento(selectedDoc.codigo);
      if (result.success) await renderTablaDocumentos();
      else alert('Error: ' + result.error);
    }
  });

  // Nuevo
  document.getElementById('btnNuevaDoc').addEventListener('click', () => {
    document.getElementById('formDoc').reset();
    document.getElementById('modalDocTitle').textContent = 'Nuevo Documento';
    document.getElementById('doc_is_edit').value = 'false';
    document.getElementById('doc_codigo').readOnly = false;
    document.getElementById('modalDoc').style.display = 'flex';
  });

  document.getElementById('btnCerrarModalDoc').addEventListener('click', () => {
    document.getElementById('modalDoc').style.display = 'none';
  });

  // Guardar Formulario
  document.getElementById('formDoc').addEventListener('submit', async (e) => {
    e.preventDefault();
    const isEdit = document.getElementById('doc_is_edit').value === 'true';
    const data = {
      old_codigo: document.getElementById('doc_old_codigo').value,
      codigo: document.getElementById('doc_codigo').value.trim(),
      descripcion: document.getElementById('doc_descripcion').value.trim()
    };

    let result = isEdit ? await window.api.updateDocumento(data) : await window.api.addDocumento(data);
    if (result.success) {
      document.getElementById('modalDoc').style.display = 'none';
      await renderTablaDocumentos();
    } else {
      alert('Error: ' + result.error);
    }
  });

  // Selección de fila
  document.getElementById('tabla-tipos-documentos').addEventListener('click', (e) => {
    const tr = e.target.closest('tr');
    if (tr) {
      document.querySelectorAll('#tabla-tipos-documentos tr').forEach(r => r.style.backgroundColor = '');
      tr.style.backgroundColor = '#d4e6f1';
      selectedDoc = { codigo: tr.dataset.code, descripcion: tr.dataset.desc };
    }
  });
}

async function renderTablaDocumentos() {
  selectedDoc = null;
  const docs = await window.api.getDocumentos() || [];
  const tbody = document.getElementById('tabla-tipos-documentos');
  
  if (docs.length === 0) return tbody.innerHTML = `<tr><td colspan="2" style="text-align: center;">No hay documentos registrados.</td></tr>`;

  tbody.innerHTML = docs.map(d => {
    return `<tr data-code="${d.codigo}" data-desc="${d.descripcion.replace(/"/g, '&quot;')}" style="cursor: pointer;">
      <td>${d.codigo}</td><td>${d.descripcion}</td>
    </tr>`;
  }).join('');
}