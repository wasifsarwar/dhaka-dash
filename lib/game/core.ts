export const WORLD = {
  width: 420,
  height: 660,
  playerY: 542,
  lanes: [118, 210, 302],
} as const;
export type RunMode = 'ready' | 'running' | 'paused' | 'crashed';
export type ObjectKind = 'bus' | 'car' | 'pothole' | 'barrier' | 'cha';
export type Direction = -1 | 1;
export interface RoadObject {
  id: number;
  kind: ObjectKind;
  lane: number;
  y: number;
}
export interface RunState {
  mode: RunMode;
  lane: number;
  playerX: number;
  elapsed: number;
  distance: number;
  cha: number;
  score: number;
  speed: number;
  scroll: number;
  spawnIn: number;
  safeLane: number;
  nextId: number;
  objects: RoadObject[];
  crashCause: ObjectKind | null;
}
export interface RunSnapshot {
  mode: RunMode;
  score: number;
  distance: number;
  cha: number;
  speed: number;
  elapsed: number;
  crashCause: ObjectKind | null;
}
export type GameEvent =
  | { type: 'pickup' }
  | { type: 'crash'; kind: ObjectKind };
export const HITBOXES: Record<ObjectKind, { width: number; height: number }> = {
  bus: { width: 42, height: 91 },
  car: { width: 35, height: 60 },
  pothole: { width: 43, height: 22 },
  barrier: { width: 49, height: 21 },
  cha: { width: 34, height: 34 },
};

export function createRun(): RunState {
  return {
    mode: 'ready',
    lane: 1,
    playerX: WORLD.lanes[1],
    elapsed: 0,
    distance: 0,
    cha: 0,
    score: 0,
    speed: 220,
    scroll: 0,
    spawnIn: 1,
    safeLane: 1,
    nextId: 1,
    objects: [],
    crashCause: null,
  };
}

export function snapshot(state: RunState): RunSnapshot {
  return {
    mode: state.mode,
    score: state.score,
    distance: Math.floor(state.distance),
    cha: state.cha,
    speed: Math.round(state.speed / 6),
    elapsed: state.elapsed,
    crashCause: state.crashCause,
  };
}

export function movePlayer(state: RunState, direction: Direction) {
  if (state.mode === 'running')
    state.lane = Math.max(0, Math.min(2, state.lane + direction));
}

export function seededRandom(seed: number) {
  let value = seed >>> 0 || 1;
  return () => {
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    return (value >>> 0) / 4294967296;
  };
}

export function spawnWave(state: RunState, random: () => number) {
  const reachable = [0, 1, 2].filter(
    (lane) => Math.abs(lane - state.safeLane) <= 1,
  );
  state.safeLane = reachable[Math.floor(random() * reachable.length)];
  const blocked = [0, 1, 2].filter((lane) => lane !== state.safeLane);
  if (random() < 0.5) blocked.reverse();
  const count = state.elapsed > 22 && random() < 0.48 ? 2 : 1;
  for (const lane of blocked.slice(0, count)) {
    const roll = random();
    const kind: ObjectKind =
      roll < 0.38
        ? 'bus'
        : roll < 0.67
          ? 'car'
          : roll < 0.84
            ? 'pothole'
            : 'barrier';
    state.objects.push({ id: state.nextId++, kind, lane, y: -80 });
  }
  if (random() < 0.65)
    state.objects.push({
      id: state.nextId++,
      kind: 'cha',
      lane: state.safeLane,
      y: -80,
    });
}

export function stepRun(
  state: RunState,
  seconds: number,
  random: () => number,
): GameEvent[] {
  if (state.mode !== 'running' || !Number.isFinite(seconds) || seconds <= 0)
    return [];
  const delta = Math.min(seconds, 0.05);
  const events: GameEvent[] = [];
  state.elapsed += delta;
  state.speed = Math.min(390, 220 + state.elapsed * 2.5);
  const advance = state.speed * delta;
  state.scroll += advance;
  state.distance += advance / 10;
  const target = WORLD.lanes[state.lane];
  const difference = target - state.playerX;
  state.playerX +=
    Math.sign(difference) * Math.min(Math.abs(difference), delta * 700);
  state.spawnIn -= delta;
  if (state.spawnIn <= 0) {
    spawnWave(state, random);
    state.spawnIn += Math.max(1.05, 1.4 - state.elapsed * 0.004);
  }
  for (const object of state.objects) {
    object.y += advance;
    const box = HITBOXES[object.kind];
    const overlapX =
      Math.abs(WORLD.lanes[object.lane] - state.playerX) < (box.width + 29) / 2;
    const overlapY = Math.abs(object.y - WORLD.playerY) < (box.height + 43) / 2;
    if (!overlapX || !overlapY) continue;
    if (object.kind === 'cha') {
      state.cha += 1;
      object.y = WORLD.height + 200;
      events.push({ type: 'pickup' });
    } else {
      state.mode = 'crashed';
      state.crashCause = object.kind;
      events.push({ type: 'crash', kind: object.kind });
      break;
    }
  }
  state.objects = state.objects.filter(
    (object) => object.y < WORLD.height + 140,
  );
  state.score = Math.floor(state.distance) + state.cha * 50;
  return events;
}
