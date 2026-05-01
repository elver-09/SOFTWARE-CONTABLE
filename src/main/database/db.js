const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

let db = null;
let globalDb = null;

function conectarEmpresa(folderPath) {
  if (!fs.existsSync(folderPath)) {
    throw new Error("El directorio de la empresa ya no existe.");
  }
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

function getGlobalDB() {
  if (!globalDb) {
    // Se almacena en la carpeta de datos de usuario de la app (ej. AppData en Windows)
    const { app } = require('electron');
    const globalDbPath = path.join(app.getPath('userData'), 'global_contable.db');
    globalDb = new Database(globalDbPath, { verbose: console.log });
    globalDb.exec(`
      CREATE TABLE IF NOT EXISTS plan_cuentas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        descripcion TEXT NOT NULL,
        tipo TEXT,
        nivel INTEGER
      );

      CREATE TABLE IF NOT EXISTS tipos_documentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        descripcion TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS entidades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        razon_social TEXT NOT NULL,
        tipo TEXT NOT NULL
      );
    `);
  }
  return globalDb;
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

    CREATE TABLE IF NOT EXISTS plan_cuentas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      descripcion TEXT NOT NULL,
      tipo TEXT,
      nivel INTEGER
    );

    CREATE TABLE IF NOT EXISTS tipos_documentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      descripcion TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entidades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      razon_social TEXT NOT NULL,
      tipo TEXT NOT NULL
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

module.exports = { conectarEmpresa, getDB, getGlobalDB };