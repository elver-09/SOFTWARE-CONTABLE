const { getDB } = require('../database/db');

// Obtener todos los comprobantes (con el nombre del cliente usando un JOIN)
function getComprobantes() {
  try {
    const db = getDB(); // Obtenemos la conexión dinámica
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
  try {
    const db = getDB(); // Obtenemos la conexión dinámica
    const { cabecera, detalles } = datosFactura;

    // Preparamos las sentencias SQL
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

    // Definimos la transacción
    const guardarTransaccion = db.transaction((cab, det) => {
      // 1. Guardar la cabecera
      const infoCabecera = insertCabecera.run(
        cab.entidad_id,
        cab.tipo_comprobante,
        cab.serie,
        cab.correlativo,
        cab.fecha_emision,
        cab.moneda,
        cab.total_impuestos,
        cab.total_importe
      );

      const comprobante_id = infoCabecera.lastInsertRowid;

      // 2. Guardar cada ítem del detalle
      for (const item of det) {
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

    // Ejecutamos la transacción
    const nuevoId = guardarTransaccion(cabecera, detalles);
    return { success: true, id: nuevoId };

  } catch (error) {
    console.error("Error al crear el comprobante:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { getComprobantes, createComprobante };