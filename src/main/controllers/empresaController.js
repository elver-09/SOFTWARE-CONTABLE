const { getDB } = require('../database/db');

function getInfoEmpresa() {
  try {
    const db = getDB();
    return db.prepare('SELECT * FROM config_empresa WHERE id = 1').get() || {};
  } catch (error) { return {}; }
}

function updateInfoEmpresa(data) {
  try {
    const db = getDB();
    const stmt = db.prepare(`
      INSERT INTO config_empresa (id, nombre_comercial, ruc, direccion_fiscal, telefono, correo, periodo_contable, logo)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        nombre_comercial=excluded.nombre_comercial,
        ruc=excluded.ruc,
        direccion_fiscal=excluded.direccion_fiscal,
        telefono=excluded.telefono,
        correo=excluded.correo,
        periodo_contable=excluded.periodo_contable,
        logo=excluded.logo
    `);
    stmt.run(data.nombre, data.ruc, data.direccion, data.telefono, data.correo, data.periodo, data.logo);
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}

module.exports = { getInfoEmpresa, updateInfoEmpresa };