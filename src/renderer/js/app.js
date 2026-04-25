// ==========================================
// 1. SISTEMA DE NAVEGACIÓN (Sidebar)
// ==========================================
document.querySelectorAll('.menu-btn').forEach(button => {
  button.addEventListener('click', () => {
    // Quitar clase active a todos los botones y secciones
    document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    
    // Activar el botón clickeado y su sección correspondiente
    button.classList.add('active');
    const targetId = button.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');

    // Refrescar datos si entramos a la vista de facturas
    if(targetId === 'view-facturas') {
      cargarSelectClientes();
    }
  });
});

// ==========================================
// 2. MÓDULO CLIENTES (Lo que ya teníamos)
// ==========================================
async function loadClientes() {
  const clientes = await window.api.getClientes();
  const tbody = document.getElementById('tablaClientes');
  tbody.innerHTML = '';
  clientes.forEach(c => {
    tbody.innerHTML += `<tr><td>${c.tipo_entidad}</td><td>${c.tipo_documento}</td><td>${c.numero_documento}</td><td>${c.razon_social}</td></tr>`;
  });
}

document.getElementById('formCliente').addEventListener('submit', async (e) => {
  e.preventDefault();
  const nuevoCliente = {
    tipo_entidad: document.getElementById('tipo_entidad').value,
    tipo_documento: document.getElementById('tipo_documento').value,
    numero_documento: document.getElementById('numero_documento').value,
    razon_social: document.getElementById('razon_social').value,
    direccion: document.getElementById('direccion').value
  };
  const response = await window.api.createCliente(nuevoCliente);
  if (response.success) {
    document.getElementById('formCliente').reset();
    loadClientes();
  } else { alert('Error: ' + response.error); }
});

// ==========================================
// 3. MÓDULO FACTURACIÓN (¡NUEVO!)
// ==========================================

// Cargar clientes en el desplegable de facturas
async function cargarSelectClientes() {
  const clientes = await window.api.getClientes();
  const select = document.getElementById('fac_cliente');
  select.innerHTML = '<option value="">Seleccione un Cliente...</option>';
  clientes.forEach(c => {
    if(c.tipo_entidad === 'CLIENTE') { // Filtramos solo clientes
      select.innerHTML += `<option value="${c.id}">${c.numero_documento} - ${c.razon_social}</option>`;
    }
  });
}

// Lógica de las filas dinámicas
const tbodyDetalles = document.getElementById('filasDetalle');

function agregarFilaDetalle() {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="i-desc" required></td>
    <td><input type="number" step="0.01" class="i-cant" value="1" required></td>
    <td><input type="number" step="0.01" class="i-precio" value="0.00" required></td>
    <td class="text-right subtotal-row">0.00</td>
    <td><button type="button" class="btn-danger btn-eliminar">X</button></td>
  `;
  
  // Eventos para recalcular al escribir
  tr.querySelector('.i-cant').addEventListener('input', calcularTotales);
  tr.querySelector('.i-precio').addEventListener('input', calcularTotales);
  
  // Evento para eliminar la fila
  tr.querySelector('.btn-eliminar').addEventListener('click', () => {
    tr.remove();
    calcularTotales();
  });

  tbodyDetalles.appendChild(tr);
}

// Calcular la matemática de la factura
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

document.getElementById('btnAgregarFila').addEventListener('click', agregarFilaDetalle);

// Guardar la factura completa
document.getElementById('formFactura').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const totalImporte = calcularTotales();
  if (totalImporte <= 0) return alert('La factura debe tener un total mayor a 0');

  // Armamos el objeto de la cabecera
  const cabecera = {
    entidad_id: document.getElementById('fac_cliente').value,
    tipo_comprobante: document.getElementById('fac_tipo').value,
    serie: document.getElementById('fac_serie').value,
    correlativo: document.getElementById('fac_correlativo').value,
    fecha_emision: document.getElementById('fac_fecha').value,
    moneda: document.getElementById('fac_moneda').value,
    total_impuestos: 0, // Simplificado por ahora
    total_importe: totalImporte
  };

  // Armamos el arreglo de los detalles
  const detalles = [];
  tbodyDetalles.querySelectorAll('tr').forEach(fila => {
    detalles.push({
      descripcion: fila.querySelector('.i-desc').value,
      cantidad: parseFloat(fila.querySelector('.i-cant').value),
      precio_unitario: parseFloat(fila.querySelector('.i-precio').value),
      subtotal: parseFloat(fila.querySelector('.subtotal-row').innerText)
    });
  });

  // Enviamos todo al backend de forma segura
  const response = await window.api.createComprobante({ cabecera, detalles });
  
  if (response.success) {
    alert('Comprobante guardado correctamente en la Base de Datos');
    document.getElementById('formFactura').reset();
    tbodyDetalles.innerHTML = ''; // Limpiamos la tabla
    agregarFilaDetalle(); // Agregamos una fila vacía
    calcularTotales();
  } else {
    alert('Error: ' + response.error);
  }
});

// ==========================================
// INICIALIZACIÓN AL ABRIR LA APP
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  loadClientes();
  agregarFilaDetalle(); // Agregar la primera fila vacía a la factura por defecto
  
  // Setear la fecha de hoy por defecto en el campo fecha
  document.getElementById('fac_fecha').valueAsDate = new Date();
});