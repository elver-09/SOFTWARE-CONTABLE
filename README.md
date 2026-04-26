# Software Contable

Aplicación de escritorio para gestión de empresas contables construida con Electron, Node.js y SQLite.

## Qué hace este proyecto

- Gestiona múltiples empresas de forma independiente, cada una con su propia base de datos SQLite.
- Configura información básica de cada empresa (nombre comercial, RUC, dirección, teléfono, correo, período contable).
- Permite subir y gestionar logos de empresa.
- Conecta cada empresa a una base de datos SQLite local dentro de la carpeta seleccionada.
- Guarda la última carpeta de empresa utilizada en la configuración del usuario.

## Características principales

- Interfaz de escritorio basada en Electron.
- Conexión a bases de datos SQLite locales con `better-sqlite3`.
- Persistencia de datos en archivos `*_contable.db` dentro de la carpeta de empresa.
- Gestión completa de información de empresa con logo personalizado.
- Interfaz intuitiva para crear y gestionar empresas.

## Estructura del proyecto

- **src/**: Código fuente principal.
  - **preload.js**: Script de precarga para la ventana de Electron.
  - **main/**: Lógica principal de la aplicación.
    - **main.js**: Inicializa la ventana de Electron y registra los handlers IPC.
    - **config/**
      - **settings.js**: Lectura/escritura de configuración del usuario.
    - **controllers/**
      - **empresaController.js**: Gestión de configuración de empresa.
    - **database/**
      - **db.js**: Conexión y creación de tablas SQLite.
- **renderer/**: Interfaz de usuario.
  - **index.html**: HTML principal.
  - **css/**: Estilos de la aplicación.
    - **styles.css**
  - **js/**: Lógica de la interfaz.
    - **app.js**
    - **router.js**
    - **modules/**
      - **empresas.js**

## Dependencias

- `electron`: Plataforma de escritorio.
- `electron-builder`: Construcción de instaladores.
- `better-sqlite3`: Base de datos SQLite.

## Instalación

```bash
npm install
```

> Después de la instalación, `electron-builder` también instala las dependencias nativas necesarias para Electron.

## Uso

Inicia la aplicación en modo desarrollo:

```bash
npm start
```

## Construcción de paquetes

- Windows x64:

```bash
npm run build:win
```

- macOS:

```bash
npm run build:mac
```

## Notas importantes

- Antes de configurar una empresa, selecciona una carpeta para que se genere el archivo de base de datos.
- La aplicación recuerda la última carpeta de empresa usada mediante `app_settings.json`.
- Cada empresa tiene su propia base de datos SQLite independiente.

## Licencia

Este proyecto utiliza la licencia `ISC`.
