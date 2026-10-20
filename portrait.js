(() => {
  const gallery = document.querySelector('.portrait');
  const cards = Array.from(gallery.querySelectorAll('.portrait-card'));
  const dots = Array.from(document.querySelectorAll('.portrait-dots span'));
  const status = document.querySelector('#portrait-status');
  let index = 0;
  let switching = false;

  function render() {
    cards.forEach((card, i) => {
      card.dataset.position = (i - index + cards.length) % cards.length;
      card.setAttribute('aria-hidden', String(i !== index));
      card.hidden = false;
      dots[i].classList.toggle('is-current', i === index);
    });
    status.textContent = `Photo ${index + 1} of ${cards.length}`;
    gallery.setAttribute('aria-label', `Show next photo. ${status.textContent}: ${cards[index].querySelector('img').alt}`);
  }

  async function showPhoto(step) {
    if (switching) return;
    switching = true;
    let animation;
    try {
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animation = cards[index].animate([
          { transform: 'none', opacity: 1 },
          { transform: `translate(${step * 34}px, -10px) rotate(${step * 6}deg)`, opacity: 0 },
        ], { duration: 240, easing: 'ease-in', fill: 'forwards' });
        await animation.finished;
      }
      index = (index + step + cards.length) % cards.length;
      render();
    } finally {
      animation?.cancel();
      switching = false;
    }
  }

  gallery.addEventListener('click', () => showPhoto(1));
  gallery.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  render();
  document.querySelector('.portrait-dots').hidden = false;
  gallery.disabled = false;
})();
