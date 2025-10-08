import { state } from './state.js';
import { mountInputPanel } from './ui/components/InputPanel.js';
import { mountTokenTable } from './ui/components/TokenTable.js';
import { mountThreadsPanel } from './ui/components/ThreadsPanel.js';
import { mountOutputPanel } from './ui/components/OutputPanel.js';
import { mountMetaPanel } from './ui/components/MetaPanel.js';
import { mountMiniMap } from './ui/components/MiniMap.js';
import { mountThemeToggle } from './ui/components/ThemeToggle.js';
import { mountHelpModal } from './ui/components/HelpModal.js';
import { mountSpaceFieldGL } from './ui/components/SpaceFieldGL.js';

const canvas = document.getElementById('glCanvas');
const atlasCanvas = document.getElementById('glyphAtlasWorker');
const inputPanel = document.getElementById('inputPanel');
const tokenTable = document.getElementById('tokenTable');
const threadsPanel = document.getElementById('threadsPanel');
const outputPanel = document.getElementById('outputPanel');
const metaPanel = document.getElementById('metaPanel');
const miniMap = document.getElementById('miniMap');
const themeToggleButton = document.getElementById('themeToggle');
const helpButton = document.getElementById('helpButton');
const helpModal = document.getElementById('helpModal');
const inspector = document.getElementById('inspector');

mountThemeToggle(themeToggleButton);
mountHelpModal(helpModal, helpButton);
const disposeRenderer = mountSpaceFieldGL(canvas, atlasCanvas, state, inspector);

state.subscribe((current) => {
  if (current.map) {
    mountTokenTable(tokenTable, current.map);
    mountThreadsPanel(threadsPanel, current.map);
    mountOutputPanel(outputPanel, current.map);
    mountMetaPanel(metaPanel, current.map);
    mountMiniMap(miniMap, current.map);
  }
});

mountInputPanel(inputPanel, state);

window.addEventListener('beforeunload', () => {
  disposeRenderer();
});

state.hydrate().then(() => {
  if (!state.current.map) {
    state.run(state.current.prompt);
  }
});
