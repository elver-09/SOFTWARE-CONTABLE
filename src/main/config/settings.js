const fs = require('fs');
const path = require('path');
const { app } = require('electron');

const settingsPath = path.join(app.getPath('userData'), 'app_settings.json');

function getSettings() {
  const defaultSettings = { lastCompanyPath: null, companies: [] };

  if (!fs.existsSync(settingsPath)) {
    return defaultSettings;
  }

  try {
    const data = fs.readFileSync(settingsPath, 'utf-8');
    const parsed = JSON.parse(data);
    // Usamos el operador "spread" (...) para asegurar que si faltan campos, se usen los por defecto
    return { ...defaultSettings, ...parsed };
  } catch (error) {
    console.error("Error leyendo app_settings.json:", error);
    return defaultSettings;
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