const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Guardaremos la configuración en la carpeta segura de la aplicación en el sistema operativo
const settingsPath = path.join(app.getPath('userData'), 'app_settings.json');

function getSettings() {
  if (!fs.existsSync(settingsPath)) {
    return { lastCompanyPath: null };
  }
  
  try {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error leyendo app_settings.json. Restaurando valores por defecto:", error);
    // Si el archivo está corrupto, devolvemos la configuración por defecto
    return { lastCompanyPath: null };
  }
}

function saveSettings(settings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Error al guardar app_settings.json:", error);
  }
}

module.exports = { getSettings, saveSettings };