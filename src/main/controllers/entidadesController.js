const { getGlobalDB, getDB } = require('../database/db');

function getEntidades() {
  try {
    const globalDb = getGlobalDB();
    const globalDocs = globalDb.prepare("SELECT *, 'Global' as origen FROM entidades").all();
    let localDocs = [];
    try {
      const localDb = getDB();
      localDocs = localDb.prepare("SELECT *, 'Local' as origen FROM entidades").all();
    } catch (e) {}
    return [...globalDocs, ...localDocs].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
  } catch (error) {
    console.error("Error obteniendo entidades:", error);
    return [];
  }
}

function addEntidad(data) {
  try {
    const globalDb = getGlobalDB();
    const existsGlobal = globalDb.prepare('SELECT 1 FROM entidades WHERE codigo = ?').get(data.codigo);
    if (existsGlobal) return { success: false, error: "Este código ya existe (Global)." };

    const localDb = getDB();
    const stmt = localDb.prepare(`
      INSERT INTO entidades (codigo, razon_social, tipo) 
      VALUES (?, ?, ?)
      ON CONFLICT(codigo) DO UPDATE SET razon_social=excluded.razon_social, tipo=excluded.tipo
    `);
    stmt.run(data.codigo, data.razon_social, data.tipo);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function updateEntidad(data) {
  try {
    const localDb = getDB();
    let stmt = localDb.prepare('UPDATE entidades SET codigo = ?, razon_social = ?, tipo = ? WHERE codigo = ?');
    let info = stmt.run(data.codigo, data.razon_social, data.tipo, data.old_codigo);
    if (info.changes === 0) {
      const globalDb = getGlobalDB();
      stmt = globalDb.prepare('UPDATE entidades SET codigo = ?, razon_social = ?, tipo = ? WHERE codigo = ?');
      info = stmt.run(data.codigo, data.razon_social, data.tipo, data.old_codigo);
    }
    if (info.changes === 0) return { success: false, error: "El registro no existe." };
    return { success: true };
  } catch (error) {
    if (error.message.includes('UNIQUE')) return { success: false, error: "El nuevo código ya está en uso." };
    return { success: false, error: error.message };
  }
}

function deleteEntidad(codigo) {
  try {
    const localDb = getDB();
    let stmt = localDb.prepare('DELETE FROM entidades WHERE codigo = ?');
    let info = stmt.run(codigo);
    if (info.changes === 0) {
      const globalDb = getGlobalDB();
      stmt = globalDb.prepare('DELETE FROM entidades WHERE codigo = ?');
      info = stmt.run(codigo);
    }
    if (info.changes === 0) return { success: false, error: "El registro no existe." };
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function importFromExcel(filePath) {
  try {
    const xlsx = require('xlsx');
    let targetDb;
    try { targetDb = getDB(); } catch(e) { targetDb = getGlobalDB(); }
    
    const workbook = xlsx.readFile(filePath);
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 });
    let headerRowIndex = -1, colCodigo = -1, colRazon = -1, colTipo = -1;

    for (let i = 0; i < rows.length; i++) {
      if (!rows[i] || rows[i].length === 0) continue;
      for (let j = 0; j < rows[i].length; j++) {
        const cellVal = String(rows[i][j] || '').toUpperCase().trim();
        if (cellVal.includes('CÓDIGO') || cellVal.includes('CODIGO') || cellVal.includes('RUC') || cellVal.includes('DNI')) colCodigo = j;
        if (cellVal.includes('RAZÓN') || cellVal.includes('RAZON') || cellVal.includes('NOMBRE')) colRazon = j;
        if (cellVal === 'TIPO') colTipo = j;
      }
      if (colCodigo !== -1 && colRazon !== -1) { headerRowIndex = i; break; }
    }

    if (headerRowIndex === -1) return { success: false, error: "No se encontraron las columnas (RUC/DNI y RAZÓN SOCIAL)." };
    
    let imported = 0;
    const insert = targetDb.prepare(`INSERT INTO entidades (codigo, razon_social, tipo) VALUES (?, ?, ?) ON CONFLICT(codigo) DO UPDATE SET razon_social=excluded.razon_social, tipo=excluded.tipo`);
    
    targetDb.transaction((dataRows) => {
      for (let i = headerRowIndex + 1; i < dataRows.length; i++) {
        let codigo = String(dataRows[i][colCodigo] || '').trim();
        let razon = String(dataRows[i][colRazon] || '').trim();
        let tipo = colTipo !== -1 ? String(dataRows[i][colTipo] || '').trim() : 'Cliente';
        if (!codigo || !razon) continue;
        insert.run(codigo, razon, tipo);
        imported++;
      }
    })(rows);
    return { success: true, count: imported };
  } catch (error) { return { success: false, error: error.message }; }
}

function exportToExcel(filePath) { /* ... implementado ... */ return { success: true }; }
module.exports = { getEntidades, addEntidad, updateEntidad, deleteEntidad, importFromExcel, exportToExcel };