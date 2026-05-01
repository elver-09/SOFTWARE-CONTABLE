const { getGlobalDB, getDB } = require('../database/db');

function determinarTipoPorElemento(codigo) {
  const elemento = String(codigo).trim().charAt(0);
  switch (elemento) {
    case '1': case '2': case '3': return 'Activo';
    case '4': return 'Pasivo';
    case '5': return 'Patrimonio';
    case '6': return 'Gastos';
    case '7': return 'Ingresos';
    case '8': return 'Resultados';
    case '9': return 'Gestión';
    case '0': return 'Cuentas de Orden';
    default: return 'Desconocido';
  }
}

function getPlanCuentas() {
  try {
    // 1. Obtener cuentas Globales
    const globalDb = getGlobalDB();
    const globalCuentas = globalDb.prepare("SELECT *, 'Global' as origen FROM plan_cuentas").all();

    // 2. Obtener cuentas Locales de la empresa (si hay una abierta)
    let localCuentas = [];
    try {
      const localDb = getDB();
      localCuentas = localDb.prepare("SELECT *, 'Local' as origen FROM plan_cuentas").all();
    } catch (e) {
      // Sin empresa conectada aún
    }

    // 3. Combinar y ordenar por código
    const combined = [...globalCuentas, ...localCuentas].sort((a, b) => String(a.codigo).localeCompare(String(b.codigo)));
    return combined;
  } catch (error) {
    console.error("Error obteniendo plan de cuentas:", error);
    return [];
  }
}

function addCuenta(data) {
  try {
    // Restricción: No crear cuentas de 1 o 2 dígitos manualmente
    if (String(data.codigo).trim().length <= 2) {
      return { success: false, error: "No se pueden crear cuentas de 1 o 2 dígitos manualmente." };
    }

    const globalDb = getGlobalDB();
    
    // Validar que no intente crear un código que ya existe en el Excel Global
    const existsGlobal = globalDb.prepare('SELECT 1 FROM plan_cuentas WHERE codigo = ?').get(data.codigo);
    if (existsGlobal) {
      return { success: false, error: "Este código de cuenta ya existe en el plan de cuentas." };
    }

    const localDb = getDB();
    // Utilizamos ON CONFLICT para actualizar si el código ya existe, en lugar de dar error o duplicar
    const stmt = localDb.prepare(`
      INSERT INTO plan_cuentas (codigo, descripcion, tipo, nivel) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo) DO UPDATE SET 
        descripcion=excluded.descripcion, 
        tipo=excluded.tipo, 
        nivel=excluded.nivel
    `);
    stmt.run(data.codigo, data.descripcion, data.tipo, data.nivel);
    return { success: true };
  } catch (error) {
    console.error("Error agregando cuenta:", error);
    return { success: false, error: error.message };
  }
}

function updateCuenta(data) {
  try {
    if (String(data.old_codigo || data.codigo).trim().length <= 3) {
      return { success: false, error: "Las cuentas principales de 3 dígitos o menos no pueden ser editadas." };
    }

    const localDb = getDB();
    let stmt = localDb.prepare('UPDATE plan_cuentas SET codigo = ?, descripcion = ?, tipo = ?, nivel = ? WHERE codigo = ?');
    let info = stmt.run(data.codigo, data.descripcion, data.tipo, data.nivel, data.old_codigo);
    
    if (info.changes === 0) {
      const globalDb = getGlobalDB();
      stmt = globalDb.prepare('UPDATE plan_cuentas SET codigo = ?, descripcion = ?, tipo = ?, nivel = ? WHERE codigo = ?');
      info = stmt.run(data.codigo, data.descripcion, data.tipo, data.nivel, data.old_codigo);
    }
    if (info.changes === 0) return { success: false, error: "La cuenta no existe." };
    return { success: true };
  } catch (error) {
    if (error.message.includes('UNIQUE')) return { success: false, error: "El nuevo código de cuenta ya está en uso." };
    console.error("Error actualizando cuenta:", error);
    return { success: false, error: error.message };
  }
}

function deleteCuenta(codigo) {
  try {
    const localDb = getDB();
    let stmt = localDb.prepare('DELETE FROM plan_cuentas WHERE codigo = ?');
    let info = stmt.run(codigo);
    
    if (info.changes === 0) {
      const globalDb = getGlobalDB();
      stmt = globalDb.prepare('DELETE FROM plan_cuentas WHERE codigo = ?');
      info = stmt.run(codigo);
    }
    if (info.changes === 0) return { success: false, error: "La cuenta no existe." };
    return { success: true };
  } catch (error) {
    console.error("Error eliminando cuenta:", error);
    return { success: false, error: error.message };
  }
}

function importFromExcel(filePath) {
  try {
    const xlsx = require('xlsx');
    const db = getGlobalDB();
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    
    // Leer como array de arrays para poder saltar los títulos del principio
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

    let headerRowIndex = -1;
    let colCodigo = -1;
    let colDesc = -1;
    let colTipo = -1;
    let colNivel = -1;

    // 1. Buscar la fila que contiene las cabeceras reales (CÓDIGO y DESCRIPCIÓN)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      for (let j = 0; j < row.length; j++) {
        const cellVal = String(row[j] || '').toUpperCase().trim();
        if (cellVal === 'CÓDIGO' || cellVal === 'CODIGO' || cellVal === 'CUENTA') colCodigo = j;
        if (cellVal.includes('DESCRIPCIÓN') || cellVal.includes('DESCRIPCION') || cellVal.includes('NOMBRE')) colDesc = j;
        if (cellVal === 'TIPO') colTipo = j;
        if (cellVal === 'NIVEL') colNivel = j;
      }

      if (colCodigo !== -1 && colDesc !== -1) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) {
      return { success: false, error: "No se encontraron las columnas 'CÓDIGO' y 'DESCRIPCIÓN' en el Excel." };
    }

    let imported = 0;
    const insert = db.prepare(`
      INSERT INTO plan_cuentas (codigo, descripcion, tipo, nivel) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(codigo) DO UPDATE SET 
        descripcion=excluded.descripcion, 
        tipo=excluded.tipo, 
        nivel=excluded.nivel
    `);

    const transaction = db.transaction((dataRows) => {
      // Empezar a leer justo debajo de la fila donde encontramos los encabezados
      for (let i = headerRowIndex + 1; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (!row || row.length === 0) continue;

        const codigo = String(row[colCodigo] || '').trim();
        const descripcion = String(row[colDesc] || '').trim();
        
        // Ignorar si la fila está vacía
        if (!codigo || !descripcion) continue;

        let tipo = colTipo !== -1 ? String(row[colTipo] || '').trim() : '';
        if (!tipo) tipo = determinarTipoPorElemento(codigo);

        let nivel = colNivel !== -1 ? parseInt(row[colNivel], 10) : NaN;
        if (!nivel || isNaN(nivel)) nivel = codigo.length;

        insert.run(codigo, descripcion, tipo, nivel);
        imported++;
      }
    });

    transaction(rows);
    return { success: true, count: imported };
  } catch (error) {
    console.error("Error importando Excel:", error);
    return { success: false, error: error.message };
  }
}

function exportToExcel(filePath) {
  try {
    const xlsx = require('xlsx');
    const cuentas = getPlanCuentas();
    
    const data = cuentas.map(c => ({
      'Cuenta': c.codigo,
      'Nombre de la cuenta': c.descripcion,
      'Tipo': c.tipo || '',
      'Nivel': c.nivel || String(c.codigo).length
    }));
    
    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'PlanContable');
    xlsx.writeFile(workbook, filePath);
    
    return { success: true };
  } catch (error) {
    console.error("Error exportando Excel:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { getPlanCuentas, addCuenta, updateCuenta, deleteCuenta, importFromExcel, exportToExcel };