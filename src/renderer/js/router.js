// src/renderer/js/router.js
export function initRouter() {
  document.querySelectorAll('.menu-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.menu-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
      
      button.classList.add('active');
      const targetId = button.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');

      // Disparamos un evento personalizado por si el módulo necesita recargar datos
      window.dispatchEvent(new CustomEvent('view-changed', { detail: targetId }));
    });
  });
}