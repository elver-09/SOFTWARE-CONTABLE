// src/main/controllers/pdfController.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { dialog } = require('electron');
const { getSettings } = require('../config/settings'); // Importamos la configuración para saber la ruta activa

async function generarYGuardarPDF(facturaData) {
  // Obtenemos la ruta de la empresa actual
  const settings = getSettings();
  const carpetaEmpresa = settings.lastCompanyPath || ''; 

  // Construimos el nombre del archivo y lo unimos a la carpeta de la empresa
  const nombreSugerido = `Comprobante_${facturaData.cabecera.serie}-${facturaData.cabecera.correlativo}.pdf`;
  const rutaSugerida = path.join(carpetaEmpresa, nombreSugerido);

  // 1. Abrir la ventana nativa "Guardar como..."
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: 'Guardar Comprobante PDF',
    // Ahora sugerirá guardar directamente dentro de la carpeta de la empresa seleccionada
    defaultPath: rutaSugerida,
    filters: [
      { name: 'Documentos PDF', extensions: ['pdf'] }
    ]
  });

  // Si el usuario presiona "Cancelar" o cierra la ventana
  if (canceled || !filePath) {
    return { success: false, canceled: true };
  }

  // 2. Generar el PDF y guardarlo en la ruta elegida
  return new Promise((resolve, reject) => {
    try {
      // Crear documento PDF
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      
      // Conectar el PDF con el archivo en el disco duro
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // --- DISEÑO DEL PDF ---
      doc.fontSize(22).text('COMPROBANTE DE PAGO', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text(`Tipo: ${facturaData.cabecera.tipo_comprobante}`);
      doc.text(`Serie y Número: ${facturaData.cabecera.serie} - ${facturaData.cabecera.correlativo}`);
      doc.text(`Fecha de Emisión: ${facturaData.cabecera.fecha_emision}`);
      doc.moveDown();

      // Línea divisoria
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Tabla de Detalles (Diseño simple)
      doc.fontSize(14).text('Detalle de los Servicios/Productos', { underline: true });
      doc.moveDown();

      doc.fontSize(11);
      facturaData.detalles.forEach(item => {
        // Formato: Cantidad | Descripción | Precio Unitario | Subtotal
        const linea = `${item.cantidad} x  ${item.descripcion}`;
        const montos = `P.U: ${item.precio_unitario.toFixed(2)}  |  Subtotal: ${item.subtotal.toFixed(2)}`;
        doc.text(linea);
        doc.text(montos, { align: 'right' });
        doc.moveDown(0.5);
      });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Total
      doc.fontSize(16).text(
        `TOTAL A PAGAR: ${facturaData.cabecera.moneda} ${facturaData.cabecera.total_importe.toFixed(2)}`, 
        { align: 'right' }
      );

      // Finalizar y cerrar el archivo
      doc.end();

      // Avisar cuando el archivo se termine de escribir en el disco
      stream.on('finish', () => resolve({ success: true, filePath }));
      stream.on('error', (err) => reject({ success: false, error: err.message }));

    } catch (error) {
      reject({ success: false, error: error.message });
    }
  });
}

module.exports = { generarYGuardarPDF };