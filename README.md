# Software Contable

Este proyecto es una aplicación de software contable que permite gestionar clientes, comprobantes y generar documentos PDF. La aplicación está estructurada en un modelo MVC (Modelo-Vista-Controlador) y utiliza Node.js como backend.

## Estructura del Proyecto

- **src/**: Contiene el código fuente de la aplicación.
  - **preload.js**: Script de precarga para la aplicación.
  - **main/**: Contiene la lógica principal de la aplicación.
    - **main.js**: Archivo principal que inicia la aplicación.
    - **config/**: Configuraciones de la aplicación.
    - **controllers/**: Controladores que manejan la lógica de negocio.
      - **clienteController.js**: Controlador para la gestión de clientes.
      - **comprobanteController.js**: Controlador para la gestión de comprobantes.
      - **pdfController.js**: Controlador para la generación de PDFs.
    - **database/**: Conexiones y configuraciones de la base de datos.
      - **db.js**: Archivo de configuración de la base de datos.
    - **models/**: Modelos de datos utilizados en la aplicación.
- **renderer/**: Contiene los archivos de la interfaz de usuario.
  - **index.html**: Página principal de la aplicación.
  - **css/**: Archivos de estilo.
    - **styles.css**: Estilos globales de la aplicación.
  - **js/**: Archivos JavaScript para la interfaz de usuario.
    - **app.js**: Archivo principal de JavaScript para la interfaz.
    - **router.js**: Manejo de rutas en la aplicación.
    - **modules/**: Módulos específicos de la aplicación.
      - **clientes.js**: Módulo para la gestión de clientes.
      - **facturacion.js**: Módulo para la gestión de facturación.

## Instalación

Para instalar las dependencias del proyecto, ejecuta:

```bash
npm install
```

## Uso

Inicia la aplicación con el siguiente comando:

```bash
npm start
```

## Contribuciones

Las contribuciones son bienvenidas. Si deseas contribuir, por favor abre un issue o un pull request.

## Licencia

Este proyecto está bajo la Licencia MIT.