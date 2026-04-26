const Database = require('better-sqlite3');
const path = require('path');

let db = null;

function conectarEmpresa(folderPath) {
  if (db) {
    db.close();
  }

  // Usar el nombre de la carpeta como nombre de la empresa para la base de datos
  const nombreEmpresa = path.basename(folderPath);
  const dbPath = path.join(folderPath, `${nombreEmpresa}_contable.db`);
  db = new Database(dbPath, { verbose: console.log });
  
  initDB(); 
  return { success: true, path: dbPath };
}

function getDB() {
  if (!db) throw new Error("No hay ninguna empresa seleccionada.");
  return db;
}

function initDB() {
  // NOTA: No uses "..." ni comentarios dentro del string del script si da problemas
  const initScript = `
    CREATE TABLE IF NOT EXISTS config_empresa (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      nombre_comercial TEXT,
      ruc TEXT UNIQUE,
      direccion_fiscal TEXT,
      telefono TEXT,
      correo TEXT,
      periodo_contable TEXT,
      logo TEXT
    );
  `;
  
  try {
    db.exec(initScript);
    
    // Migración: Agregar columna logo si no existe
    try {
      const tableInfo = db.prepare("PRAGMA table_info(config_empresa)").all();
      const hasLogoColumn = tableInfo.some(column => column.name === 'logo');
      if (!hasLogoColumn) {
        db.exec("ALTER TABLE config_empresa ADD COLUMN logo TEXT");
        console.log("Columna 'logo' agregada a config_empresa");
      }
    } catch (migrationError) {
      console.error("Error en migración de logo:", migrationError);
    }
    
    console.log("Tablas verificadas con éxito.");
  } catch (error) {
    console.error("Error crítico inicializando tablas:", error);
  }
}

module.exports = { conectarEmpresa, getDB };