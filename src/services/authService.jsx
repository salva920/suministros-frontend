export const logout = () => {
  // Limpiar todos los almacenamientos
  localStorage.removeItem('token');
  sessionStorage.removeItem('isLoggedIn');
  
  // Forzar recarga completa
  window.location.href = '/';
  window.location.reload();
};