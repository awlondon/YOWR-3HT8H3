import { runPipeline } from './core/steps.js';
import { loadModel, saveModel, MODEL_KEY } from './core/memory.js';

class StateManager {
  constructor() {
    this.listeners = new Set();
    this.current = {
      prompt: 'Find three creative study techniques for learning linear algebra quickly.',
      map: null
    };
    this.ready = false;
  }

  subscribe(fn) {
    this.listeners.add(fn);
    if (this.ready) fn(this.current);
    return () => this.listeners.delete(fn);
  }

  async hydrate() {
    try {
      const saved = await loadModel();
      if (saved) {
        this.current.map = saved;
      }
    } catch (error) {
      console.warn('Failed to hydrate model', error);
    } finally {
      this.ready = true;
      this.emit();
    }
  }

  emit() {
    for (const fn of this.listeners) {
      fn(this.current);
    }
  }

  async run(prompt) {
    this.current.prompt = prompt;
    const pipeline = runPipeline(prompt);
    this.current.map = pipeline;
    this.emit();
    try {
      await saveModel(pipeline.exported);
    } catch (error) {
      console.warn('Failed to persist map', error);
    }
  }
}

export const state = new StateManager();
export const MODEL_STORAGE_KEY = MODEL_KEY;
