/* Shared, build-free reconstruction viewer for the main and standalone pages. */
(() => {
  const root = document.getElementById('reconstruction-gallery');
  const tasks = window.RECONSTRUCTION_TASKS;
  if (!root || !tasks?.length) return;
  root.innerHTML = `
    <div class="rv-heading"><h3>Look closer at the interaction.</h3><p>Compare full reconstructions, then inspect the contact refinement.</p></div>
    <div class="rv-taskbar"><div class="task-carousel" id="rv-carousel" role="group" aria-label="Browse reconstruction tasks" tabindex="0"><button type="button" data-previous aria-label="Previous task">←</button><div class="carousel-label" aria-live="polite"><span data-count></span><strong data-title></strong><div class="carousel-track" aria-hidden="true"><span data-progress></span></div></div><button type="button" data-next aria-label="Next task">→</button></div><span id="rv-info"></span></div>
    <div class="rv-viewbar"><div class="rv-modes" role="group" aria-label="Reconstruction view">
      <button type="button" data-mode="original" aria-pressed="false">Original camera</button>
      <button type="button" data-mode="baselines" aria-pressed="false">Object-centered</button>
      <button type="button" data-mode="contact" aria-pressed="true">Contact refinement</button>
    </div><button type="button" id="rv-layout" aria-pressed="false" hidden>Side-by-side view</button></div>
    <div class="rv-player">
      <video id="rv-video" controls playsinline muted preload="none" aria-describedby="rv-caption"></video>
      <div class="rv-toolbar">
        <button type="button" id="rv-previous" aria-label="Previous frame">← Frame</button><button type="button" id="rv-next" aria-label="Next frame">Frame →</button>
        <button type="button" id="rv-midpoint">Clip midpoint</button>
        <label>Speed <select id="rv-speed"><option value="0.5">0.25×</option><option value="1" selected>0.5×</option><option value="2">1×</option></select></label>
        <label id="rv-pairs-label"><input type="checkbox" id="rv-pairs" checked> Stable pairs</label>
        <label><input type="checkbox" id="rv-loop" checked> Loop</label>
        <output id="rv-counter" aria-label="Source frame and playback speed"></output>
      </div>
      <p id="rv-caption"></p>
      <p id="rv-contact-legend" hidden><span class="rv-pair-orange">Orange links</span> show stable pairs. <span class="rv-pair-purple">Purple links</span> show forced opposition pairs, added when the stable pairs provide insufficient opposing support for a stable grasp. See Section 3.1 and Appendix A.3, <em>Local Contact Refinement</em> (Opposition supplementation). Links represent geometric contact constraints, not measured forces.</p>
    </div>
    <p id="rv-error" role="alert" hidden>Video unavailable. Please try the MP4 link below.</p>
    <div class="rv-links"><a id="rv-download">Open current MP4 ↗</a><a id="rv-poster">View still frame ↗</a></div>`;
  const get = id => root.querySelector(`#rv-${id}`);
  const video = get('video');
  let task = tasks[0], mode = 'contact', layout = 'grouped', pendingFrame = null, resumePlayback = false;
  const view = () => task.views[mode];
  const frameIndex = () => Math.min(view().source_frames.length - 1, Math.floor(video.currentTime * view().fps + .001));
  const closestFrame = (frames, source) => frames.reduce((best, f, i) => Math.abs(f-source) < Math.abs(frames[best]-source) ? i : best, 0);
  function counter() {
    get('counter').textContent = `Source frame ${view().source_frames[frameIndex()]} · ${(video.playbackRate/2).toFixed(2)}× speed`;
  }
  function seekFrame(index) {
    video.pause();
    if (video.readyState < 1) return;
    video.currentTime = (Math.max(0, Math.min(view().source_frames.length-1, index)) + .01) / view().fps;
    counter();
  }
  function updateVideo(nextMode, reset = false) {
    pendingFrame = reset ? task.views[nextMode].source_frames[0] : (pendingFrame ?? view().source_frames[frameIndex()]);
    resumePlayback = resumePlayback || (!video.paused && !video.ended);
    video.pause(); mode = nextMode;
    const grouped = mode !== 'contact' && layout === 'grouped';
    const file = mode !== 'contact' ? `${mode}_${layout}` : !get('pairs').checked ? 'contact_clean' : mode;
    const base = `assets/${mode !== 'contact' ? 'reconstruction-compact-v1' : 'reconstruction-showcase-final'}/${task.key}`;
    const dimensions = mode === 'contact' ? view() : task.compact_layouts[mode][layout];
    video.width = dimensions.width; video.height = dimensions.height;
    video.style.aspectRatio = `${dimensions.width} / ${dimensions.height}`;
    video.dataset.layout = mode === 'contact' ? 'contact' : layout;
    get('layout').hidden = mode === 'contact';
    get('layout').textContent = layout === 'grouped' ? 'Side-by-side view' : 'Grouped view';
    get('layout').setAttribute('aria-pressed', String(layout === 'row'));
    get('layout').setAttribute('aria-label', layout === 'grouped' ? 'Switch to a single row of equally sized panels' : 'Switch to input and EgoMatrix above the three baselines');
    root.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mode === mode)));
    get('pairs-label').hidden = mode !== 'contact'; get('error').hidden = true;
    get('contact-legend').hidden = mode !== 'contact';
    get('info').textContent = `Source frames ${task.frames[0]}–${task.frames.at(-1)}`;
    const captions = {
      original: `Input · ${task.methods.join(' · ')}. Same source frame, native camera projection; no extra alignment.`,
      baselines: `${task.methods.join(' · ')}. Object-centered, with a shared fixed view and metric scale.`,
      contact: get('pairs').checked ? 'Multi-start → local contact refinement. The same stable pairs and object targets are shown before and after optimization.' : 'Multi-start → local contact refinement. Identical views and geometry, with correspondence markers hidden.'
    };
    get('caption').textContent = captions[mode] + (grouped ? ' Top: Input and EgoMatrix. Bottom: Do As I Do, DexImit and EgoInfinity.' : '');
    get('download').href = `${base}/${file}.mp4`; get('poster').href = `${base}/${file}.jpg`;
    video.setAttribute('aria-label', `${task.label}: ${mode === 'contact' ? 'contact refinement' : mode === 'original' ? 'original camera comparison' : 'object-centered comparison'}`);
    video.poster = `${base}/${file}.jpg`; video.src = `${base}/${file}.mp4`; video.load(); counter();
  }
  root.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { if (mode !== b.dataset.mode) updateVideo(b.dataset.mode); }));
  get('pairs').addEventListener('change', () => updateVideo(mode));
  get('layout').addEventListener('click', () => { layout = layout === 'grouped' ? 'row' : 'grouped'; updateVideo(mode); });
  video.addEventListener('loadedmetadata', () => { video.playbackRate = Number(get('speed').value); if (pendingFrame !== null) { seekFrame(closestFrame(view().source_frames, pendingFrame)); pendingFrame = null; } counter(); if (resumePlayback) { resumePlayback = false; video.play().catch(() => {}); } });
  video.addEventListener('timeupdate', counter); video.addEventListener('ratechange', counter);
  video.addEventListener('error', () => get('error').hidden = false);
  get('previous').addEventListener('click', () => seekFrame(frameIndex()-1));
  get('next').addEventListener('click', () => seekFrame(frameIndex()+1));
  get('midpoint').addEventListener('click', () => seekFrame(closestFrame(view().source_frames, task.reference_frame)));
  get('speed').addEventListener('change', e => video.playbackRate = Number(e.target.value));
  get('loop').addEventListener('change', e => video.loop = e.target.checked);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => entries.forEach(e => { if (!e.isIntersecting) video.pause(); }), {threshold:.05}).observe(video);
  video.loop = true;
  window.createTaskCarousel(get('carousel'), tasks, (nextTask, direction) => {
    task = nextTask; updateVideo(mode, true);
    window.animateTaskChange(root.querySelector('.rv-player'), direction);
  });
})();
