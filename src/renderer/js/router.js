// src/renderer/js/router.js
export function initRouter(onViewChange) {
  document.querySelectorAll('.menu-btn').forEach(button => {
    button.addEventListener('click', () => {
      // Limpiar clases activas
      document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
      
      // Activar la vista seleccionada
      button.classList.add('active');
      const targetId = button.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');

      // Avisar si la vista cambió (para refrescar datos si es necesario)
      if (onViewChange) onViewChange(targetId);
    });
  });
}