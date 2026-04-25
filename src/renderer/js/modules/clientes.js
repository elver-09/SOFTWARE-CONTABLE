// src/renderer/js/modules/clientes.js
export async function loadClientesTable() {
  const clientes = await window.api.getClientes();
  const tbody = document.getElementById('tablaClientes');
  if (!tbody) return;
  tbody.innerHTML = clientes.map(c => `
    <tr>
      <td>${c.tipo_entidad}</td>
      <td>${c.tipo_documento}</td>
      <td>${c.numero_documento}</td>
      <td>${c.razon_social}</td>
    </tr>
  `).join('');
}

export function initClientesModule() {
  const form = document.getElementById('formCliente');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = {
      tipo_entidad: document.getElementById('tipo_entidad').value,
      tipo_documento: document.getElementById('tipo_documento').value,
      numero_documento: document.getElementById('numero_documento').value,
      razon_social: document.getElementById('razon_social').value,
      direccion: document.getElementById('direccion').value
    };
    const res = await window.api.createCliente(data);
    if (res.success) {
      form.reset();
      loadClientesTable();
    }
  });
  
  loadClientesTable();
}