// Run with: node tests/portrait.test.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const photos = Array.from({ length: 4 }, (_, i) => ({ alt: `Photo ${i + 1}`, hidden: i !== 0 }));
const counter = {};
const handlers = {};
const gallery = {
  disabled: true,
  querySelectorAll: () => photos,
  querySelector: () => counter,
  setAttribute(name, value) { this[name] = value; },
  addEventListener(name, handler) { handlers[name] = handler; },
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../portrait.js'), 'utf8'), {
  document: { querySelector: () => gallery },
});
function expectPhoto(index) {
  assert.deepEqual(photos.map(photo => photo.hidden), photos.map((_, i) => i !== index));
  assert.equal(counter.textContent, `${index + 1} / 4`);
  assert.ok(gallery['aria-label'].includes(`Photo ${index + 1} of 4`));
}
function arrow(key) {
  let prevented = false;
  handlers.keydown({ key, preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
}
assert.equal(gallery.disabled, false);
expectPhoto(0);
for (const index of [1, 2, 3, 0]) { handlers.click(); expectPhoto(index); }
arrow('ArrowLeft'); expectPhoto(3);
arrow('ArrowRight'); expectPhoto(0);
handlers.keydown({ key: 'Tab', preventDefault() { assert.fail('Tab must remain available'); } });
expectPhoto(0);
console.log('Portrait click cycle, keyboard navigation, counter and accessible labels passed.');
