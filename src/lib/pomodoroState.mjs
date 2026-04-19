export const PHASE = {
  WORK: "work",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
};

export const DEFAULT_DURATIONS = {
  [PHASE.WORK]: 25 * 60,
  [PHASE.SHORT_BREAK]: 5 * 60,
  [PHASE.LONG_BREAK]: 15 * 60,
};

export const DEFAULT_SETTINGS = {
  durations: { ...DEFAULT_DURATIONS },
  longBreakEvery: 4,
};

export function createInitialState(settings = DEFAULT_SETTINGS) {
  return {
    settings: {
      durations: { ...DEFAULT_DURATIONS, ...(settings.durations || {}) },
      longBreakEvery: Number(settings.longBreakEvery) || DEFAULT_SETTINGS.longBreakEvery,
    },
    phase: PHASE.WORK,
    remainingSeconds: settings.durations?.[PHASE.WORK] ?? DEFAULT_DURATIONS[PHASE.WORK],
    isRunning: false,
    completedWorkSessions: 0,
    startedAtMs: null,
    lastTickAtMs: null,
    version: 1,
  };
}

export function nextPhase(currentPhase, completedWorkSessions, longBreakEvery = 4) {
  if (currentPhase === PHASE.WORK) {
    return completedWorkSessions > 0 && completedWorkSessions % longBreakEvery === 0
      ? PHASE.LONG_BREAK
      : PHASE.SHORT_BREAK;
  }
  return PHASE.WORK;
}

function clampSeconds(v) {
  return Math.max(0, Math.floor(v));
}

function phaseDuration(state, phase) {
  return state.settings.durations[phase] ?? DEFAULT_DURATIONS[phase];
}

export function transitionToPhase(state, phase) {
  return {
    ...state,
    phase,
    remainingSeconds: phaseDuration(state, phase),
    isRunning: false,
    startedAtMs: null,
    lastTickAtMs: null,
  };
}

export function start(state, nowMs = Date.now()) {
  if (state.isRunning) return state;
  return { ...state, isRunning: true, startedAtMs: nowMs, lastTickAtMs: nowMs };
}

export function pause(state) {
  if (!state.isRunning) return state;
  return { ...state, isRunning: false, startedAtMs: null, lastTickAtMs: null };
}

export function resume(state, nowMs = Date.now()) {
  return start(state, nowMs);
}

export function resetCurrentPhase(state) {
  return {
    ...state,
    remainingSeconds: phaseDuration(state, state.phase),
    isRunning: false,
    startedAtMs: null,
    lastTickAtMs: null,
  };
}

export function skipPhase(state) {
  const completedWorkSessions =
    state.phase === PHASE.WORK ? state.completedWorkSessions + 1 : state.completedWorkSessions;
  const phase = nextPhase(state.phase, completedWorkSessions, state.settings.longBreakEvery);
  return {
    ...state,
    completedWorkSessions,
    phase,
    remainingSeconds: phaseDuration(state, phase),
    isRunning: false,
    startedAtMs: null,
    lastTickAtMs: null,
  };
}

export function tick(state, nowMs = Date.now()) {
  if (!state.isRunning || state.lastTickAtMs == null) return state;

  const elapsed = clampSeconds((nowMs - state.lastTickAtMs) / 1000);
  if (elapsed <= 0) return state;

  const nextRemaining = state.remainingSeconds - elapsed;
  if (nextRemaining > 0) {
    return {
      ...state,
      remainingSeconds: nextRemaining,
      lastTickAtMs: nowMs,
    };
  }

  if (state.phase === PHASE.WORK) {
    const completedWorkSessions = state.completedWorkSessions + 1;
    const phase = nextPhase(PHASE.WORK, completedWorkSessions, state.settings.longBreakEvery);
    return {
      ...state,
      completedWorkSessions,
      phase,
      remainingSeconds: phaseDuration(state, phase),
      isRunning: false,
      startedAtMs: null,
      lastTickAtMs: null,
    };
  }

  const phase = PHASE.WORK;
  return {
    ...state,
    phase,
    remainingSeconds: phaseDuration(state, phase),
    isRunning: false,
    startedAtMs: null,
    lastTickAtMs: null,
  };
}

export function serializeState(state) {
  return JSON.stringify(state);
}

export function deserializeState(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") throw new Error("invalid_state");
  if (!Object.values(PHASE).includes(parsed.phase)) throw new Error("invalid_phase");
  if (typeof parsed.remainingSeconds !== "number") throw new Error("invalid_remaining");
  if (typeof parsed.completedWorkSessions !== "number") throw new Error("invalid_cycle");
  return parsed;
}

export function saveState(storage, key, state) {
  storage.setItem(key, serializeState(state));
}

export function loadState(storage, key, fallback = createInitialState()) {
  const raw = storage.getItem(key);
  if (!raw) return fallback;
  try {
    return deserializeState(raw);
  } catch {
    return fallback;
  }
}
