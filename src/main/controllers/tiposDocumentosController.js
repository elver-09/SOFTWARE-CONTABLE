const { getGlobalDB, getDB } = require('../database/db');

function getDocumentos() {
  try {
    const globalDb = getGlobalDB();
    const globalDocs = globalDb.prepare("SELECT *, 'Global' as origen FROM tipos_documentos").all();

    let localDocs = [];
    try {
      const localDb = getDB();
      localDocs = localDb.prepare("SELECT *, 'Local' as origen FROM tipos_documentos").all();
    } catch (e) {
      // Sin empresa conectada aún
    }

    const combined = [...globalDocs, ...localDocs].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
    return combined;
  } catch (error) {
    console.error("Error obteniendo tipos de documentos:", error);
    return [];
  }
}

function addDocumento(data) {
  try {
    const globalDb = getGlobalDB();
    const existsGlobal = globalDb.prepare('SELECT 1 FROM tipos_documentos WHERE codigo = ?').get(data.codigo);
    if (existsGlobal) {
      return { success: false, error: "Este código de documento ya existe." };
    }

    const localDb = getDB();
    const stmt = localDb.prepare(`
      INSERT INTO tipos_documentos (codigo, descripcion) 
      VALUES (?, ?)
      ON CONFLICT(codigo) DO UPDATE SET descripcion=excluded.descripcion
    `);
    stmt.run(data.codigo, data.descripcion);
    return { success: true };
  } catch (error) {
    console.error("Error agregando documento:", error);
    return { success: false, error: error.message };
  }
}

function updateDocumento(data) {
  try {
    const localDb = getDB();
    let stmt = localDb.prepare('UPDATE tipos_documentos SET codigo = ?, descripcion = ? WHERE codigo = ?');
    let info = stmt.run(data.codigo, data.descripcion, data.old_codigo);
    
    if (info.changes === 0) {
      const globalDb = getGlobalDB();
      stmt = globalDb.prepare('UPDATE tipos_documentos SET codigo = ?, descripcion = ? WHERE codigo = ?');
      info = stmt.run(data.codigo, data.descripcion, data.old_codigo);
    }
    if (info.changes === 0) return { success: false, error: "El documento no existe." };
    return { success: true };
  } catch (error) {
    if (error.message.includes('UNIQUE')) return { success: false, error: "El nuevo código ya está en uso." };
    console.error("Error actualizando documento:", error);
    return { success: false, error: error.message };
  }
}

function deleteDocumento(codigo) {
  try {
    const localDb = getDB();
    let stmt = localDb.prepare('DELETE FROM tipos_documentos WHERE codigo = ?');
    let info = stmt.run(codigo);
    
    if (info.changes === 0) {
      const globalDb = getGlobalDB();
      stmt = globalDb.prepare('DELETE FROM tipos_documentos WHERE codigo = ?');
      info = stmt.run(codigo);
    }
    if (info.changes === 0) return { success: false, error: "El documento no existe." };
    return { success: true };
  } catch (error) {
    console.error("Error eliminando documento:", error);
    return { success: false, error: error.message };
  }
}

function importFromExcel(filePath) {
  try {
    const xlsx = require('xlsx');
    const db = getGlobalDB(); // Importamos a la global por defecto
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    let headerRowIndex = -1;
    let colCodigo = -1;
    let colDesc = -1;

    // 1. Buscar cabeceras "N°" y "DESCRIPCIÓN"
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      for (let j = 0; j < row.length; j++) {
        const cellVal = String(row[j] || '').toUpperCase().trim();
        if (cellVal === 'N°' || cellVal === 'Nº' || cellVal === 'N' || cellVal === 'CÓDIGO') colCodigo = j;
        if (cellVal.includes('DESCRIPCIÓN') || cellVal.includes('DESCRIPCION') || cellVal.includes('DOCUMENTO')) colDesc = j;
      }

      if (colCodigo !== -1 && colDesc !== -1) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return { success: false, error: "No se encontraron las columnas 'N°' y 'DESCRIPCIÓN' en el Excel." };
    }

    let imported = 0;
    const insert = db.prepare(`
      INSERT INTO tipos_documentos (codigo, descripcion) 
      VALUES (?, ?)
      ON CONFLICT(codigo) DO UPDATE SET descripcion=excluded.descripcion
    `);

    const transaction = db.transaction((dataRows) => {
      for (let i = headerRowIndex + 1; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) continue;

        let codigo = String(row[colCodigo] || '').trim();
        const descripcion = String(row[colDesc] || '').trim();
        
        if (!codigo || !descripcion) continue;
        
        // Rellenar con ceros si Excel lo interpretó como número (ej: 1 -> 01, 0 -> 00)
        if (codigo.length === 1) codigo = '0' + codigo;

        insert.run(codigo, descripcion);
        imported++;
      }
    });

    transaction(rows);
    return { success: true, count: imported };
  } catch (error) {
    console.error("Error importando Excel (Documentos):", error);
    return { success: false, error: error.message };
  }
}

module.exports = { getDocumentos, addDocumento, updateDocumento, deleteDocumento, importFromExcel };