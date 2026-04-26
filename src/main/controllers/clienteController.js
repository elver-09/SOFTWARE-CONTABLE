const { getDB } = require('../database/db'); // Cambiamos a getDB

// Obtener todos los clientes
function getClientes() {
  try {
    const db = getDB(); // Obtenemos la conexión activa en ese momento
    const stmt = db.prepare('SELECT * FROM clientes_proveedores ORDER BY id DESC');
    return stmt.all();
  } catch (error) {
    console.error("Error al obtener clientes:", error);
    return [];
  }
}

// Crear un nuevo cliente
function createCliente(cliente) {
  try {
    const db = getDB(); // Obtenemos la conexión activa en ese momento
    const stmt = db.prepare(`
      INSERT INTO clientes_proveedores 
      (tipo_entidad, tipo_documento, numero_documento, razon_social, direccion) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      cliente.tipo_entidad, 
      cliente.tipo_documento, 
      cliente.numero_documento, 
      cliente.razon_social, 
      cliente.direccion
    );
    
    return { success: true, id: info.lastInsertRowid };
  } catch (error) {
    console.error("Error al crear cliente:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { getClientes, createCliente };