// src/renderer/js/modules/empresas.js

/**
 * Renderiza la lista de carpetas/empresas registradas globalmente
 */
export async function renderListaEmpresas() {
    const rutas = await window.api.getEmpresasLista();
    const container = document.getElementById('lista-empresas-items');
    if (!container) return;

    if (rutas.length === 0) {
        container.innerHTML = '<p style="color: #bdc3c7; padding: 20px; text-align: center;">No hay empresas registradas. Use el botón de abajo para empezar.</p>';
        return;
    }

    // Generar el HTML de la lista
    container.innerHTML = rutas.map(ruta => {
        const nombreCarpeta = ruta.split(/[/\\]/).pop();
        return `
            <div class="empresa-item" title="Doble clic para abrir: ${ruta}">
                <div class="empresa-icon">🏢</div>
                <div class="empresa-details">
                    <strong>${nombreCarpeta}</strong>
                    <small>${ruta}</small>
                </div>
            </div>
        `;
    }).join('');

    // Agregar evento de doble clic para conectar a la empresa
    const items = container.querySelectorAll('.empresa-item');
    items.forEach((item, index) => {
        item.addEventListener('dblclick', async () => {
            const ruta = rutas[index];
            await window.api.conectarRutaDirecta(ruta);
            window.location.reload(); // Recarga la app para cargar la nueva BD
        });
    });
}

/**
 * Inicializa el formulario de configuración de la empresa actual
 */
export async function initEmpresaConfig() {
    const info = await window.api.getEmpresaInfo();
    const form = document.getElementById('formConfigEmpresa');
    if (!form) return;

    // 1. Mapeo de campos: ID del Input -> Valor de la DB
    const campos = {
        'emp_nombre': info.nombre_comercial,
        'emp_ruc': info.ruc,
        'emp_direccion': info.direccion_fiscal,
        'emp_telefono': info.telefono,
        'emp_correo': info.correo,
        'emp_periodo': info.periodo_contable
    };

    // 2. Llenar los inputs automáticamente
    for (let id in campos) {
        const input = document.getElementById(id);
        if (input) {
            input.value = campos[id] || '';
        }
    }

    // 3. Manejar el guardado (Update)
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            nombre: document.getElementById('emp_nombre').value,
            ruc: document.getElementById('emp_ruc').value,
            direccion: document.getElementById('emp_direccion').value,
            telefono: document.getElementById('emp_telefono').value,
            correo: document.getElementById('emp_correo').value,
            periodo: document.getElementById('emp_periodo').value
        };

        const res = await window.api.updateEmpresaInfo(data);
        
        if (res.success) {
            alert("Perfil de la empresa actualizado con éxito.");
        } else {
            alert("Error al actualizar: " + res.error);
        }
    });

    // 4. Configurar el botón de "Nueva Empresa" que está en esta vista
    const btnNueva = document.getElementById('btnNuevaEmpresa');
    if (btnNueva) {
        // Quitamos cualquier listener previo para evitar duplicados
        const newBtn = btnNueva.cloneNode(true);
        btnNueva.parentNode.replaceChild(newBtn, btnNueva);
        
        newBtn.addEventListener('click', async () => {
            const res = await window.api.seleccionarEmpresa();
            if (res.success) {
                window.location.reload();
            }
        });
    }
}