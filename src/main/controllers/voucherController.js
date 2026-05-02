const { getDB } = require('../database/db');

function addVoucher(data) {
  try {
    const db = getDB(); // Retorna error si no hay base de empresa conectada
    const { origen, numero, fecha, detalles } = data;

    const insertVoucher = db.prepare('INSERT INTO vouchers (origen, numero, fecha) VALUES (?, ?, ?)');
    const insertDetalle = db.prepare(`
      INSERT INTO voucher_detalles (
        voucher_id, cuenta, nombre_cuenta, debe, haber, moneda, tc, equivalente, doc_tipo, doc_numero, codigo, razon_social, glosa
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      const info = insertVoucher.run(origen, numero, fecha);
      const voucherId = info.lastInsertRowid;

      for (const det of detalles) {
        insertDetalle.run(
          voucherId, det.cuenta, det.nombre_cuenta, det.debe, det.haber,
          det.moneda, det.tc, det.equivalente, det.doc_tipo, det.doc_numero,
          det.codigo, det.razon_social, det.glosa
        );
      }
    });

    transaction();
    return { success: true };
  } catch (error) {
    console.error("Error guardando voucher:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { addVoucher };