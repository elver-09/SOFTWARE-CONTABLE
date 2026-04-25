const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

// En desarrollo, la BD se guarda en la carpeta del proyecto.
// En producción, se guarda de forma segura en la carpeta de datos del sistema (Application Support / AppData).
const isDev = !app.isPackaged;
const dbPath = isDev 
  ? path.join(__dirname, '../../..', 'contabilidad_dev.db')
  : path.join(app.getPath('userData'), 'contabilidad_prod.db');

// Iniciar la conexión a la base de datos
const db = new Database(dbPath, { verbose: console.log });

function initDB() {
  // Usamos un bloque de texto para ejecutar la creación de todas las tablas
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
    )`;

    try {
    // exec() es ideal para ejecutar múltiples sentencias SQL de una sola vez
    db.exec(initScript);
    console.log("Tablas inicializadas correctamente.");
    } catch (error) {
    console.error("Error al inicializar la base de datos:", error);
    }
}

module.exports = { db, initDB };