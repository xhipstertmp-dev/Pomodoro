import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PHASE,
  createInitialState,
  nextPhase,
  start,
  pause,
  resume,
  tick,
  skipPhase,
  resetCurrentPhase,
  saveState,
  loadState,
} from '../src/lib/pomodoroState.mjs';

test('initial state defaults', () => {
  const s = createInitialState();
  assert.equal(s.phase, PHASE.WORK);
  assert.equal(s.remainingSeconds, 1500);
  assert.equal(s.completedWorkSessions, 0);
});

test('nextPhase logic for work cycles', () => {
  assert.equal(nextPhase(PHASE.WORK, 1, 4), PHASE.SHORT_BREAK);
  assert.equal(nextPhase(PHASE.WORK, 4, 4), PHASE.LONG_BREAK);
  assert.equal(nextPhase(PHASE.SHORT_BREAK, 4, 4), PHASE.WORK);
});

test('start/pause/resume toggle running state', () => {
  const s = createInitialState();
  const started = start(s, 1000);
  assert.equal(started.isRunning, true);
  const paused = pause(started);
  assert.equal(paused.isRunning, false);
  const resumed = resume(paused, 2000);
  assert.equal(resumed.isRunning, true);
  assert.equal(resumed.lastTickAtMs, 2000);
});

test('tick decrements remaining and transitions after completion', () => {
  let s = createInitialState();
  s = start(s, 0);
  s = tick(s, 5000);
  assert.equal(s.remainingSeconds, 1495);

  // force near-end then complete
  s = { ...s, remainingSeconds: 1, lastTickAtMs: 5000, isRunning: true };
  s = tick(s, 7000);
  assert.equal(s.isRunning, false);
  assert.equal(s.phase, PHASE.SHORT_BREAK);
  assert.equal(s.completedWorkSessions, 1);
});

test('skipPhase increments work session only when skipping work', () => {
  let s = createInitialState();
  s = skipPhase(s);
  assert.equal(s.completedWorkSessions, 1);
  assert.equal(s.phase, PHASE.SHORT_BREAK);

  const afterBreakSkip = skipPhase(s);
  assert.equal(afterBreakSkip.completedWorkSessions, 1);
  assert.equal(afterBreakSkip.phase, PHASE.WORK);
});

test('resetCurrentPhase restores full duration and stops timer', () => {
  let s = createInitialState();
  s = { ...s, isRunning: true, remainingSeconds: 123 };
  s = resetCurrentPhase(s);
  assert.equal(s.remainingSeconds, 1500);
  assert.equal(s.isRunning, false);
});

test('save/load state persists and recovers, falls back on malformed data', () => {
  const map = new Map();
  const storage = {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };

  const state = createInitialState();
  saveState(storage, 'p', state);
  const loaded = loadState(storage, 'p');
  assert.equal(loaded.phase, PHASE.WORK);

  map.set('p', '{bad');
  const fallback = createInitialState({ durations: { work: 10, shortBreak: 5, longBreak: 20 }, longBreakEvery: 4 });
  const recovered = loadState(storage, 'p', fallback);
  assert.equal(recovered.phase, PHASE.WORK);
  assert.equal(recovered.remainingSeconds, 10);
});
