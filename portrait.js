(() => {
  const gallery = document.querySelector('.portrait');
  const photos = Array.from(gallery.querySelectorAll('img'));
  const counter = gallery.querySelector('[data-photo-count]');
  let index = 0;

  function showPhoto(step) {
    photos[index].hidden = true;
    index = (index + step + photos.length) % photos.length;
    photos[index].hidden = false;
    counter.textContent = `${index + 1} / ${photos.length}`;
    gallery.setAttribute('aria-label', `Show next photo. Photo ${index + 1} of ${photos.length}: ${photos[index].alt}`);
  }

  gallery.addEventListener('click', () => showPhoto(1));
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  showPhoto(0);
  gallery.disabled = false;
})();
