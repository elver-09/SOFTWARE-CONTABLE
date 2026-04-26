// src/renderer/js/modules/facturacion.js

export async function cargarSelectClientes() {
  const clientes = await window.api.getClientes();
  const select = document.getElementById('fac_cliente');
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione un Cliente...</option>';
  clientes.forEach(c => {
    if(c.tipo_entidad === 'CLIENTE') {
      select.innerHTML += `<option value="${c.id}">${c.numero_documento} - ${c.razon_social}</option>`;
    }
  });
}

export function initFacturacionModule() {
  const tbodyDetalles = document.getElementById('filasDetalle');
  if (!tbodyDetalles) return;

  function calcularTotales() {
    let totalFactura = 0;
    const filas = tbodyDetalles.querySelectorAll('tr');
    filas.forEach(fila => {
      const cant = parseFloat(fila.querySelector('.i-cant').value) || 0;
      const precio = parseFloat(fila.querySelector('.i-precio').value) || 0;
      const subtotal = cant * precio;
      fila.querySelector('.subtotal-row').innerText = subtotal.toFixed(2);
      totalFactura += subtotal;
    });
    document.getElementById('fac_total_vista').innerText = totalFactura.toFixed(2);
    return totalFactura;
  }

  function agregarFilaDetalle() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="i-desc" required></td>
      <td><input type="number" step="0.01" class="i-cant" value="1" required></td>
      <td><input type="number" step="0.01" class="i-precio" value="0.00" required></td>
      <td class="text-right subtotal-row">0.00</td>
      <td><button type="button" class="btn-danger btn-eliminar">X</button></td>
    `;
    tr.querySelector('.i-cant').addEventListener('input', calcularTotales);
    tr.querySelector('.i-precio').addEventListener('input', calcularTotales);
    tr.querySelector('.btn-eliminar').addEventListener('click', () => {
      tr.remove();
      calcularTotales();
    });
    tbodyDetalles.appendChild(tr);
  }

  document.getElementById('btnAgregarFila').addEventListener('click', agregarFilaDetalle);

  document.getElementById('formFactura').addEventListener('submit', async (e) => {
    e.preventDefault();
    const totalImporte = calcularTotales();
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

    const detalles = [];
    tbodyDetalles.querySelectorAll('tr').forEach(fila => {
      detalles.push({
        descripcion: fila.querySelector('.i-desc').value,
        cantidad: parseFloat(fila.querySelector('.i-cant').value),
        precio_unitario: parseFloat(fila.querySelector('.i-precio').value),
        subtotal: parseFloat(fila.querySelector('.subtotal-row').innerText)
      });
    });

    const response = await window.api.createComprobante({ cabecera, detalles });
    
    if (response.success) {
      const confirmarImpresion = confirm('Comprobante registrado con éxito.\n\n¿Desea exportar el PDF ahora?');
      if (confirmarImpresion) {
        const pdfRes = await window.api.exportarPDF({ cabecera, detalles });
        if (pdfRes && pdfRes.success) {
          alert(`PDF guardado exitosamente en:\n${pdfRes.filePath}`);
        } else if (pdfRes && !pdfRes.canceled) {
          alert('Error al generar el PDF.');
        }
      }
      document.getElementById('formFactura').reset();
      tbodyDetalles.innerHTML = '';
      agregarFilaDetalle();
      calcularTotales();
    } else {
      alert('Error: ' + response.error);
    }
  });

  // Inicialización de vista
  agregarFilaDetalle();
  document.getElementById('fac_fecha').valueAsDate = new Date();
}