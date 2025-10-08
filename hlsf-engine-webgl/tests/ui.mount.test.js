import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { JSDOM } from 'jsdom';

test('mounts Input/Output/Inspector and binds run-request', async () => {
  const dom = new JSDOM();
  global.window = dom.window; global.document = dom.window.document;
  const main = document.createElement('main');
  const left = document.createElement('aside'); left.id = 'leftPane';
  const center = document.createElement('section'); center.id = 'centerPane';
  const canvas = document.createElement('canvas'); canvas.id = 'glCanvas';
  center.appendChild(canvas);
  const right = document.createElement('aside'); right.id = 'rightPane';
  main.appendChild(left); main.appendChild(center); main.appendChild(right);
  document.body.appendChild(main);
  const { InputPanel } = await import('../src/ui/components/InputPanel.js');
  const { on } = await import('../src/state.js');

  const ip = InputPanel();
  document.getElementById('leftPane').appendChild(ip.el);
  let called = false; on('run-request', ()=> called = true);
  ip.el.querySelector('#runBtn').click();
  assert.equal(called, true);
  delete global.window; delete global.document;
});
