const Database = require('better-sqlite3');
const path = require('path');

let db = null; // La conexión inicial arranca vacía

function conectarEmpresa(folderPath) {
  // Si ya hay una base de datos abierta, la cerramos primero
  if (db) {
    db.close();
  }

  // El archivo de la base de datos se llamará 'data_contable.db' y vivirá dentro de la carpeta seleccionada
  const dbPath = path.join(folderPath, 'data_contable.db');
  
  db = new Database(dbPath, { verbose: console.log });
  
  // Ejecutamos la creación de tablas por si es una carpeta nueva
  initDB(); 
  
  return { success: true, path: dbPath };
}

// Función para exportar la conexión actual (getter) a los controladores
function getDB() {
  if (!db) throw new Error("No hay ninguna empresa seleccionada.");
  return db;
}

function initDB() {
  const initScript = `
    CREATE TABLE IF NOT EXISTS clientes_proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo_entidad TEXT CHECK(tipo_entidad IN ('CLIENTE', 'PROVEEDOR')),
      tipo_documento TEXT CHECK(tipo_documento IN ('DNI', 'RUC', 'CE', 'PASAPORTE')),
      numero_documento TEXT UNIQUE NOT NULL,
      razon_social TEXT NOT NULL,
      direccion TEXT,
      fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS comprobantes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entidad_id INTEGER,
      tipo_comprobante TEXT CHECK(tipo_comprobante IN ('FACTURA', 'BOLETA', 'RECIBO')),
      serie TEXT NOT NULL,
      correlativo INTEGER NOT NULL,
      fecha_emision DATE NOT NULL,
      moneda TEXT DEFAULT 'PEN',
      total_impuestos REAL DEFAULT 0,
      total_importe REAL NOT NULL,
      FOREIGN KEY (entidad_id) REFERENCES clientes_proveedores(id)
    );

    CREATE TABLE IF NOT EXISTS comprobante_detalles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      comprobante_id INTEGER,
      descripcion TEXT NOT NULL,
      cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (comprobante_id) REFERENCES comprobantes(id) ON DELETE CASCADE
    );
  `;
  try {
    db.exec(initScript);
    console.log("Tablas inicializadas o verificadas correctamente.");
  } catch (error) {
    console.error("Error inicializando tablas:", error);
  }
}

module.exports = { conectarEmpresa, getDB };