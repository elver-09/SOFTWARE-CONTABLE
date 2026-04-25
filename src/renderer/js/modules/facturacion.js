// src/renderer/js/modules/facturacion.js
export async function refreshClientesSelect() {
  const clientes = await window.api.getClientes();
  const select = document.getElementById('fac_cliente');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un Cliente...</option>' + 
    clientes.filter(c => c.tipo_entidad === 'CLIENTE')
            .map(c => `<option value="${c.id}">${c.numero_documento} - ${c.razon_social}</option>`)
            .join('');
}

export function initFacturacionModule() {
  const btnAdd = document.getElementById('btnAgregarFila');
  const tbody = document.getElementById('filasDetalle');
  
  const calcular = () => {
    let total = 0;
    tbody.querySelectorAll('tr').forEach(tr => {
      const c = parseFloat(tr.querySelector('.i-cant').value) || 0;
      const p = parseFloat(tr.querySelector('.i-precio').value) || 0;
      const sub = c * p;
      tr.querySelector('.subtotal-row').innerText = sub.toFixed(2);
      total += sub;
    });
    document.getElementById('fac_total_vista').innerText = total.toFixed(2);
  };

  const addRow = () => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="i-desc" required></td>
      <td><input type="number" class="i-cant" value="1"></td>
      <td><input type="number" class="i-precio" value="0.00"></td>
      <td class="subtotal-row">0.00</td>
      <td><button type="button" class="btn-danger btn-del">X</button></td>
    `;
    tr.querySelectorAll('input').forEach(i => i.addEventListener('input', calcular));
    tr.querySelector('.btn-del').addEventListener('click', () => { tr.remove(); calcular(); });
    tbody.appendChild(tr);
  };

  btnAdd?.addEventListener('click', addRow);
  
  document.getElementById('formFactura')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // 1. Recopilar datos y calcular total
    let totalImporte = 0;
    const detalles = [];
    tbody.querySelectorAll('tr').forEach(tr => {
      const cantidad = parseFloat(tr.querySelector('.i-cant').value) || 0;
      const precio_unitario = parseFloat(tr.querySelector('.i-precio').value) || 0;
      const subtotal = cantidad * precio_unitario;
      
      detalles.push({
        descripcion: tr.querySelector('.i-desc').value,
        cantidad, precio_unitario, subtotal
      });
      totalImporte += subtotal;
    });

    if (totalImporte <= 0) return alert('La factura debe tener un total mayor a 0');

    const cabecera = {
      entidad_id: document.getElementById('fac_cliente').value,
      tipo_comprobante: document.getElementById('fac_tipo').value,
      serie: document.getElementById('fac_serie').value,
      correlativo: document.getElementById('fac_correlativo').value,
      fecha_emision: document.getElementById('fac_fecha').value,
      moneda: document.getElementById('fac_moneda').value,
      total_impuestos: 0,
      total_importe: totalImporte
    };

    // 2. Guardar en Base de Datos (SQLite)
    const response = await window.api.createComprobante({ cabecera, detalles });
    
    if (response.success) {
      // 3. ¡NUEVO! Preguntar si quiere el PDF
      const confirmarImpresion = confirm('Comprobante registrado en la base de datos con éxito.\n\n¿Desea exportar el documento en PDF ahora?');
      
      if (confirmarImpresion) {
        // Llamar a la función que abre el cuadro de diálogo nativo
        const pdfRes = await window.api.exportarPDF({ cabecera, detalles });
        if (pdfRes.success) {
          alert(`PDF guardado exitosamente en:\n${pdfRes.filePath}`);
        } else if (!pdfRes.canceled) {
          alert('Error al generar el PDF.');
        }
      }

      // 4. Limpiar el formulario para la siguiente factura
      document.getElementById('formFactura').reset();
      tbody.innerHTML = ''; 
      document.getElementById('btnAgregarFila').click(); // Re-agrega fila vacía
      document.getElementById('fac_total_vista').innerText = '0.00';
    } else {
      alert('Error al guardar en BD: ' + response.error);
    }
  });

  addRow(); // Fila inicial
}