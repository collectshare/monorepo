window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload();
});
