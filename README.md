# Software Contable

Aplicación de escritorio contable construida con Electron, Node.js y SQLite.

## Qué hace este proyecto

- Gestiona clientes y proveedores.
- Administra comprobantes electrónicos (facturas, boletas, recibos).
- Genera y guarda comprobantes en formato PDF usando `pdfkit`.
- Conecta cada empresa a una base de datos SQLite local dentro de la carpeta seleccionada.
- Guarda la última carpeta de empresa utilizada en la configuración del usuario.

## Características principales

- Interfaz de escritorio basada en Electron.
- Conexión a una base de datos SQLite local con `better-sqlite3`.
- Persistencia de datos en `data_contable.db` dentro de la carpeta de empresa.
- Soporte para crear clientes, comprobantes y detallar ítems.
- Exportación de comprobantes a PDF mediante un diálogo nativo de "Guardar como".

## Estructura del proyecto

- **src/**: Código fuente principal.
  - **preload.js**: Script de precarga para la ventana de Electron.
  - **main/**: Lógica principal de la aplicación.
    - **main.js**: Inicializa la ventana de Electron y registra los handlers IPC.
    - **config/**
      - **settings.js**: Lectura/escritura de configuración del usuario.
    - **controllers/**
      - **clienteController.js**: Gestión de clientes y proveedores.
      - **comprobanteController.js**: Gestión de comprobantes y detalles.
      - **pdfController.js**: Generación y guardado de PDF.
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
      - **clientes.js**
      - **facturacion.js**

## Dependencias

- `electron`: Plataforma de escritorio.
- `electron-builder`: Construcción de instaladores.
- `better-sqlite3`: Base de datos SQLite.
- `pdfkit`: Generador de PDFs.

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

- Antes de crear comprobantes, selecciona una carpeta de empresa para que se genere el archivo `data_contable.db`.
- La aplicación recuerda la última carpeta de empresa usada mediante `app_settings.json`.

## Licencia

Este proyecto utiliza la licencia `ISC`.
