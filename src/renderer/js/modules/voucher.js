// src/renderer/js/modules/voucher.js

let voucherInitialized = false;

export function initVoucher() {
  if (voucherInitialized) return;
  voucherInitialized = true;

  const btnMago = document.getElementById('btnVoucherMago');
  const modalMago = document.getElementById('modalVoucherMago');
  const btnCerrarMago = document.getElementById('btnCerrarModalMago');

  // Función interna para actualizar sumatorias
  function actualizarTotales() {
    let totalDebe = 0;
    let totalHaber = 0;
    document.querySelectorAll('#tabla-voucher-detalle tr').forEach(tr => {
      totalDebe += parseFloat(tr.cells[2].textContent) || 0;
      totalHaber += parseFloat(tr.cells[3].textContent) || 0;
    });
    document.getElementById('voucher_total_debe').textContent = totalDebe.toFixed(2);
    document.getElementById('voucher_total_haber').textContent = totalHaber.toFixed(2);
  }

  // Manejar el borrado de filas y recalcular
  document.getElementById('tabla-voucher-detalle').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-eliminar-fila');
    if (btn) {
      btn.closest('tr').remove();
      actualizarTotales();
    }
  });

  // Abrir Modal MAGO
  if (btnMago && modalMago) {
    btnMago.addEventListener('click', async () => {
      try {
        await window.api.getEmpresaInfo();
        modalMago.style.display = 'flex';
      } catch (error) {
        alert("Acción denegada: No hay ninguna empresa seleccionada. Debe abrir una empresa para usar el Mago.");
      }
    });
  }

  // Cerrar Modal MAGO
  if (btnCerrarMago && modalMago) {
    btnCerrarMago.addEventListener('click', () => {
      modalMago.style.display = 'none';
    });
  }

  // ---- 1. Cálculos Automáticos del IGV y Total ----
  const inputBase = document.getElementById('mago_base');
  const inputIgv = document.getElementById('mago_igv');
  const inputTotal = document.getElementById('mago_total');

  if (inputBase && inputIgv && inputTotal) {
    inputBase.addEventListener('input', () => {
      const base = parseFloat(inputBase.value) || 0;
      const igv = base * 0.18;
      const total = base + igv;
      inputIgv.value = igv.toFixed(2);
      inputTotal.value = total.toFixed(2);
    });
  }

  // ---- 2. Autocompletar Cuenta Contable ----
  const inputCuenta = document.getElementById('mago_cuenta');
  const inputNombreCuenta = document.getElementById('mago_cuenta_nombre');
  if (inputCuenta && inputNombreCuenta) {
    inputCuenta.addEventListener('blur', async (e) => {
      const val = e.target.value.trim();
      if (val) {
        try {
          const cuentas = await window.api.getPlanCuentas();
          const cuentaEncontrada = cuentas.find(c => String(c.codigo) === val);
          if (cuentaEncontrada) {
            inputNombreCuenta.value = cuentaEncontrada.descripcion;
          } else {
            inputNombreCuenta.value = 'Cuenta no encontrada';
          }
        } catch (error) {
          console.error(error);
        }
      }
    });
  }

  // ---- 3. Autocompletar Razón Social ----
  const inputCodigo = document.getElementById('mago_codigo');
  const inputRazonSocial = document.getElementById('mago_razon_social');
  if (inputCodigo && inputRazonSocial) {
    inputCodigo.addEventListener('blur', async (e) => {
      const val = e.target.value.trim();
      if (val.length >= 8) {
        try {
          // Llamamos a la base de datos de entidades registradas
          const entidades = await window.api.getEntidades();
          const entidadEncontrada = entidades.find(ent => String(ent.codigo) === val);
          
          if (entidadEncontrada) {
            inputRazonSocial.value = entidadEncontrada.razon_social;
          } else {
            inputRazonSocial.value = "Entidad no encontrada";
          }
        } catch (error) {
          console.error("Error al buscar entidad:", error);
        }
      } else {
        inputRazonSocial.value = "";
      }
    });
  }

  // ---- 4. Al dar a 'Grabar', añadir la fila a la tabla y actualizar totales ----
  const formMago = document.getElementById('formVoucherMago');
  if (formMago) {
    formMago.addEventListener('submit', (e) => {
      e.preventDefault();

      // Recoger los valores del Mago
      const cuenta = document.getElementById('mago_cuenta').value;
      const nombreCuenta = document.getElementById('mago_cuenta_nombre').value;
      const base = parseFloat(document.getElementById('mago_base').value) || 0;
      const moneda = document.getElementById('mago_moneda').value;
      const tc = parseFloat(document.getElementById('mago_tc').value) || 1;
      const equivalente = base * tc;
      const docTipo = document.getElementById('mago_doc_tipo').value;
      const docNumero = document.getElementById('mago_doc_numero').value;
      const codigo = document.getElementById('mago_codigo').value;
      const razonSocial = document.getElementById('mago_razon_social').value;
      const glosa = document.getElementById('mago_glosa').value;

      // Crear y agregar la fila a la tabla
      const tbody = document.getElementById('tabla-voucher-detalle');
      const tr = document.createElement('tr');
      const baseStr = base.toFixed(2);
      
      tr.innerHTML = `
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${cuenta}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${nombreCuenta}</td>
        <td class="col-debe" style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1; text-align: right;">${baseStr}</td>
        <td class="col-haber" style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1; text-align: right;">0.00</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${moneda}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${tc.toFixed(3)}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1; text-align: right;">${equivalente.toFixed(2)}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${docTipo}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${docNumero}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${codigo}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${razonSocial}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1;">${glosa}</td>
        <td style="padding: 6px 10px; font-size: 12px; border-bottom: 1px solid #ecf0f1; text-align: center;">
          <button type="button" class="btn-eliminar-fila" style="background: transparent; border: none; color: #e74c3c; cursor: pointer;"><i class="fa-solid fa-trash"></i></button>
        </td>
      `;
      tbody.appendChild(tr);
      actualizarTotales();

      // Cerrar y limpiar formulario
      modalMago.style.display = 'none';
      formMago.reset();
    });
  }

  // ---- 5. Guardar el Voucher en Base de Datos ----
  const btnGuardarVoucher = document.getElementById('btnGuardarVoucher');
  if (btnGuardarVoucher) {
    btnGuardarVoucher.addEventListener('click', async () => {
      try {
        await window.api.getEmpresaInfo();
      } catch (error) {
        alert("Acción denegada: No hay ninguna empresa seleccionada.");
        return;
      }

      const origen = document.getElementById('voucher_origen').value;
      const numero = document.getElementById('voucher_numero').value;
      const fecha = document.getElementById('voucher_fecha').value;

      if (!origen || !numero || !fecha) return alert("Por favor, complete los datos de la cabecera (Origen, Número y Fecha).");
      
      const rows = document.querySelectorAll('#tabla-voucher-detalle tr');
      if (rows.length === 0) return alert("El voucher debe tener al menos un detalle.");

      const detalles = Array.from(rows).map(tr => ({
        cuenta: tr.cells[0].textContent,
        nombre_cuenta: tr.cells[1].textContent,
        debe: parseFloat(tr.cells[2].textContent) || 0,
        haber: parseFloat(tr.cells[3].textContent) || 0,
        moneda: tr.cells[4].textContent,
        tc: parseFloat(tr.cells[5].textContent) || 1,
        equivalente: parseFloat(tr.cells[6].textContent) || 0,
        doc_tipo: tr.cells[7].textContent,
        doc_numero: tr.cells[8].textContent,
        codigo: tr.cells[9].textContent,
        razon_social: tr.cells[10].textContent,
        glosa: tr.cells[11].textContent
      }));

      const result = await window.api.addVoucher({ origen, numero, fecha, detalles });
      if (result.success) {
        alert("Voucher guardado correctamente en la base de datos.");
        document.getElementById('formVoucherHeader').reset();
        document.getElementById('tabla-voucher-detalle').innerHTML = '';
        actualizarTotales();
      } else {
        alert("Error al guardar: " + result.error);
      }
    });
  }
}