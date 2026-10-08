/* Shared native task navigation; no automatic task changes or carousel dependency. */
window.createTaskCarousel = function(root, items, onChange, initial = 0) {
  if (root.dataset.carouselBound) return;
  root.dataset.carouselBound = 'true';
  const previous = root.querySelector('[data-previous]');
  const next = root.querySelector('[data-next]');
  const title = root.querySelector('[data-title]');
  const count = root.querySelector('[data-count]');
  const progress = root.querySelector('[data-progress]');
  const storageKey = `egomatrix:${root.id}:task`;
  const key = item => item.id || item.key;
  let index = Math.max(0, initial);
  try {
    const saved = window.sessionStorage.getItem(storageKey);
    const restored = items.findIndex(item => key(item) === saved);
    if (restored >= 0) index = restored;
  } catch (_) { /* Local-file browsers may disable session storage. */ }
  function show(delta = 0) {
    const nextIndex = Math.max(0, Math.min(items.length - 1, index + delta));
    if (delta && nextIndex === index) return;
    index = nextIndex;
    previous.disabled = index === 0;
    next.disabled = index === items.length - 1;
    title.textContent = items[index].label;
    count.textContent = `${String(index + 1).padStart(2, '0')} / ${items.length}`;
    progress.style.width = `${(index + 1) / items.length * 100}%`;
    previous.setAttribute('aria-label', index ? `Previous: ${items[index - 1].label}` : 'First task');
    next.setAttribute('aria-label', index < items.length - 1 ? `Next: ${items[index + 1].label}` : 'Last task');
    try { window.sessionStorage.setItem(storageKey, key(items[index])); } catch (_) {}
    onChange(items[index], delta);
  }
  previous.addEventListener('click', () => show(-1));
  next.addEventListener('click', () => show(1));
  root.addEventListener('keydown', event => {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); show(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  show();
};
window.animateTaskChange = function(element, direction) {
  if (!direction || !element.animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  element.getAnimations().forEach(animation => animation.cancel());
  element.animate([{opacity:.35, transform:`translateX(${direction * 16}px)`}, {opacity:1, transform:'translateX(0)'}],
    {duration:220, easing:'ease-out'});
};
