// Node 22+ and Chrome: node tests/portrait.test.cjs [https://spikew726.github.io/] [--screenshots]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const { spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'portrait-check-'));
const chrome = process.env.CHROME_PATH || (process.platform === 'win32'
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' : '/usr/bin/google-chrome');
const liveUrl = process.argv.find(arg => arg.startsWith('https://'));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
let browser, socket, server;

(async () => {
  let url = liveUrl;
  if (!url) {
    server = http.createServer((req, res) => {
      const resource = new URL(req.url, 'http://localhost');
      // Seed the unversioned URLs a returning visitor may have cached.
      const stale = {
        '/__cached': '<link rel="stylesheet" href="/style.css"><script src="/portrait.js"></script>',
        '/style.css': '.portrait img { display: block; } body { --stale-style: yes; }',
        '/portrait.js': 'window.stalePortraitScript = true;',
      };
      if (!resource.search && stale[resource.pathname]) {
        res.writeHead(200, { 'Content-Type': types[path.extname(resource.pathname)] || 'text/html',
          'Cache-Control': 'max-age=3600' });
        return res.end(stale[resource.pathname]);
      }
      const file = path.join(root, resource.pathname === '/' ? 'index.html' : resource.pathname);
      fs.readFile(file, (error, data) => {
        res.writeHead(error ? 404 : 200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
        res.end(error ? 'Not found' : data);
      });
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    url = `http://127.0.0.1:${server.address().port}/`;
  }
  browser = spawn(chrome, ['--headless=new', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
  let launchError;
  browser.on('error', error => { launchError = error; });
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; !fs.existsSync(portFile) && i < 100; i++) {
    if (launchError) throw launchError;
    await delay(100);
  }
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  const pending = new Map(), errors = [];
  let id = 0;
  socket.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const call = pending.get(message.id);
      pending.delete(message.id);
      message.error ? call.reject(message.error) : call.resolve(message.result);
    }
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params);
  };
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    assert(!result.exceptionDetails, JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const navigate = async target => {
    await send('Page.navigate', { url: target });
    for (let i = 0; i < 200; i++) {
      if (await evaluate('document.readyState === "complete"')) return;
      await delay(100);
    }
    throw new Error(`Page did not finish loading: ${target}`);
  };
  const check = async index => {
    await delay(650);
    const state = await evaluate(`(() => {
      const button = document.querySelector('.portrait');
      const cards = [...button.querySelectorAll('.portrait-card')];
      const front = cards.find(card => card.dataset.position === '0');
      const rect = button.getBoundingClientRect();
      return {
        index: cards.indexOf(front),
        label: button.getAttribute('aria-label'),
        currentDots: [...document.querySelectorAll('.portrait-dots .is-current')].length,
        dotIndex: [...document.querySelectorAll('.portrait-dots span')].findIndex(dot => dot.classList.contains('is-current')),
        topAtCenter: document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2).closest('.portrait-card') === front,
        sharedFrame: cards.every(card => card.offsetTop === 0 && card.offsetHeight === button.offsetHeight),
        loaded: cards.every(card => card.querySelector('img').naturalWidth > 0),
        overflow: document.documentElement.scrollWidth > innerWidth
      };
    })()`);
    assert.equal(state.index, index);
    assert(state.label.includes(`Photo ${index + 1} of 4`));
    assert.equal(state.currentDots, 1);
    assert.equal(state.dotIndex, index);
    assert(state.topAtCenter && state.sharedFrame && state.loaded && !state.overflow, JSON.stringify(state));
  };
  const point = () => evaluate(`(() => {
    const r = document.querySelector('.portrait').getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
  const click = async () => {
    const xy = await point();
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...xy });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...xy });
  };
  const key = async (key, code) => {
    const event = { key, code: key === ' ' ? 'Space' : key, windowsVirtualKeyCode: code };
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...event, text: key === 'Enter' ? '\r' : key === ' ' ? ' ' : undefined });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...event });
  };
  const screenshot = async name => {
    if (!process.argv.includes('--screenshots')) return;
    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(root, `.portrait-check-${name}.png`), Buffer.from(shot.data, 'base64'));
  };
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  if (!liveUrl) {
    await navigate(`${url}__cached`);
    assert.equal(await evaluate('window.stalePortraitScript'), true);
    assert.equal(await evaluate('getComputedStyle(document.body).getPropertyValue("--stale-style")'), 'yes');
  }
  await navigate(url);
  await evaluate('document.fonts.ready.then(() => true)');
  await evaluate('Promise.all([...document.querySelectorAll(".portrait img")].map(img => img.decode())).then(() => true)');
  assert.equal(await evaluate('Boolean(window.stalePortraitScript)'), false);
  assert.equal(await evaluate('getComputedStyle(document.body).getPropertyValue("--stale-style")'), '');
  for (let i = 0; i < 4; i++) {
    await check(i);
    await screenshot(`desktop-${i + 1}`);
    await click();
  }
  await check(0);
  await key('ArrowLeft', 37); await check(3);
  await key('ArrowRight', 39); await check(0);
  await key('Enter', 13); await check(1);
  await key(' ', 32); await check(2);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 1 });
  await evaluate("document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0)");
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await point()] });
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await check(3);
  await screenshot('mobile');
  await send('Emulation.setDeviceMetricsOverride', { width: 320, height: 740, deviceScaleFactor: 1, mobile: true });
  await check(3);
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await evaluate("document.querySelector('.portrait').click()");
  assert.equal(await evaluate("document.querySelector('.portrait-card[data-position=\"0\"] img').getAttribute('src')"), 'assets/portrait.jpg');
  assert.equal(await evaluate("document.querySelector('.portrait').getAnimations({subtree: true}).length"), 0);
  await check(0);
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await navigate(`${url}?no-script-check`);
  assert.equal(await evaluate("document.querySelector('.portrait').disabled"), true);
  assert.equal(await evaluate("[...document.querySelectorAll('.portrait-card')].filter(card => getComputedStyle(card).display !== 'none').length"), 1);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.portrait-dots')).display"), 'none');
  assert.equal(errors.length, 0, JSON.stringify(errors));
  console.log(`PASS (${liveUrl || 'local, including stale-cache regression'}): photo stacking, four-photo loop, mouse, keyboard, touch, mobile layout, reduced motion and no-JS fallback.`);
  await send('Browser.close');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  socket?.close();
  browser?.kill();
  server?.close();
  await delay(500);
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
});
