const demonstrations = window.DEMONSTRATIONS;
const demoVideos = ['human-video','simulation-video','synthesis-video'].map(id => document.getElementById(id));
function showDemo(demo, direction) {
    const playing = demoVideos.some(video => !video.paused && !video.ended);
    demoVideos.forEach((video,i) => { video.pause(); const media = demo.media[i]; video.poster = `${media}.png`; video.src = `${media}.mp4`; video.load(); if (playing) video.play().catch(() => {}); });
    document.getElementById('demo-title').textContent = demo.title;
    document.getElementById('demo-dataset').textContent = demo.dataset;
    document.getElementById('demo-note').textContent = demo.note;
    window.animateTaskChange(document.getElementById('demo-panels'), direction);
}
const playButton = document.getElementById('play-demo');
function updatePlayButton() { playButton.textContent = demoVideos.some(v => !v.paused && !v.ended) ? 'Ⅱ Pause all' : '▶ Play all three'; }
demoVideos.forEach(v => ['play','pause','ended','emptied'].forEach(event => v.addEventListener(event,updatePlayButton)));
playButton.addEventListener('click', () => {
  if (demoVideos.some(v => !v.paused && !v.ended)) { demoVideos.forEach(v => v.pause()); return; }
  demoVideos.forEach(v => { if (v.ended) v.currentTime = 0; v.play().catch(() => { document.getElementById('demo-note').textContent = 'Playback could not start. Use the individual video controls to retry.'; }); });
});
window.createTaskCarousel(document.getElementById('demo-carousel'), demonstrations, showDemo,
  demonstrations.findIndex(demo => demo.id === 'bi4_pour_cups'));

const tasks = [
  {id:'bi4',task:'Pouring',scene:'Desk'}, {id:'bi8015',task:'Pouring between plates',scene:'White table'},
  {id:'bi9',task:'Spraying flowers',scene:'Wood table'}, {id:'taco55',task:'Gluing',scene:'Round table'},
  {id:'oak12',task:'Stirring',scene:'Green table'}
];
const matrix = document.getElementById('scene-matrix');
matrix.append(document.createElement('span'));
tasks.forEach(t => { const label = document.createElement('span'); label.className = 'matrix-label'; label.textContent = t.scene; matrix.append(label); });
tasks.forEach((source,row) => {
  const label = document.createElement('span'); label.className = 'matrix-label row'; label.textContent = source.task; matrix.append(label);
  tasks.forEach((target,col) => {
    const name = `${source.id}_to_${target.id}`;
    const button = document.createElement('button'); button.type = 'button'; button.className = `matrix-cell${row === col ? ' diagonal' : ''}`;
    button.setAttribute('aria-label',`${source.task} in ${target.scene.toLowerCase()} background`);
    button.setAttribute('aria-pressed',String(row === 0 && col === 0));
    const img = document.createElement('img'); img.src = `assets/matrix-v2/posters/${name}.png`; img.alt = ''; img.loading = 'lazy'; img.width = 384; img.height = 216; button.append(img);
    button.addEventListener('click', () => {
      matrix.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b === button)));
      const video = document.getElementById('scene-video'); video.pause(); video.poster = img.src; video.src = `assets/matrix-v2/videos/${name}.mp4`; video.load();
      document.getElementById('scene-title').textContent = `${source.task} → ${target.scene}`;
      let note = row === col ? 'The recorded interaction is rendered in its original background.' : 'The same recorded robot–object interaction is rendered in this target scene.';
      if (source.id === 'oak12') note += ' Floating-hand rendering preserves task visibility.';
      if (name === 'taco55_to_oak12') note += ' Small left-edge compositing residuals remain in 19 frames.';
      if (name === 'bi9_to_oak12') note += ' Some flower edges reach the image boundary.';
      document.getElementById('scene-note').textContent = note;
    });
    matrix.append(button);
  });
});

// Keep off-screen videos quiet; motion only starts through visitor interaction.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(({target,isIntersecting}) => { if (!isIntersecting) target.pause(); }), {threshold:0.05});
  document.querySelectorAll('video').forEach(v => observer.observe(v));
}
