// src/main/controllers/comprobanteController.js
const { db } = require('../database/db');

// Obtener todos los comprobantes (con el nombre del cliente usando un JOIN)
function getComprobantes() {
  try {
    const stmt = db.prepare(`
      SELECT 
        c.id, c.serie, c.correlativo, c.fecha_emision, c.moneda, c.total_importe,
        p.razon_social as cliente_nombre
      FROM comprobantes c
      LEFT JOIN clientes_proveedores p ON c.entidad_id = p.id
      ORDER BY c.id DESC
    `);
    return stmt.all();
  } catch (error) {
    console.error("Error al obtener comprobantes:", error);
    return [];
  }
}

// Crear un comprobante y sus detalles de forma segura (Transacción)
function createComprobante(datosFactura) {
  // Extraemos la cabecera y los detalles del objeto que envíe el frontend
  const { cabecera, detalles } = datosFactura;

  // Preparamos las sentencias SQL (aún no se ejecutan)
  const insertCabecera = db.prepare(`
    INSERT INTO comprobantes 
    (entidad_id, tipo_comprobante, serie, correlativo, fecha_emision, moneda, total_impuestos, total_importe) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertDetalle = db.prepare(`
    INSERT INTO comprobante_detalles 
    (comprobante_id, descripcion, cantidad, precio_unitario, subtotal) 
    VALUES (?, ?, ?, ?, ?)
  `);

  // Definimos la transacción: Todo lo que esté aquí dentro se ejecutará en bloque
  const guardarTransaccion = db.transaction((cabecera, detalles) => {
    // 1. Guardar la cabecera
    const infoCabecera = insertCabecera.run(
      cabecera.entidad_id,
      cabecera.tipo_comprobante,
      cabecera.serie,
      cabecera.correlativo,
      cabecera.fecha_emision,
      cabecera.moneda,
      cabecera.total_impuestos,
      cabecera.total_importe
    );

    const comprobante_id = infoCabecera.lastInsertRowid;

    // 2. Guardar cada ítem del detalle, vinculándolo al ID de la cabecera
    for (const item of detalles) {
      insertDetalle.run(
        comprobante_id,
        item.descripcion,
        item.cantidad,
        item.precio_unitario,
        item.subtotal
      );
    }

    return comprobante_id;
  });

  try {
    // Ejecutamos la transacción de forma segura
    const nuevoId = guardarTransaccion(cabecera, detalles);
    return { success: true, id: nuevoId };
  } catch (error) {
    console.error("Error al crear el comprobante:", error);
    // Si algo falla, SQLite deshace todo automáticamente (Rollback)
    return { success: false, error: error.message };
  }
}

module.exports = { getComprobantes, createComprobante };