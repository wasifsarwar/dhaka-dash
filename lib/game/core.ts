export const WORLD = {
  width: 420,
  height: 660,
  playerY: 542,
  lanes: [118, 210, 302],
} as const;
export type RunMode = 'ready' | 'running' | 'paused' | 'crashed';
export type PowerupKind = 'jhalmuri' | 'shield';
export type ObjectKind =
  | 'bus'
  | 'car'
  | 'pothole'
  | 'barrier'
  | 'cha'
  | 'pedestrian'
  | PowerupKind;
export const POWERUPS = {
  boostSeconds: 4,
  shieldSeconds: 6,
  boostMultiplier: 1.45,
} as const;
export type Direction = -1 | 1;
export function baseSpeed(elapsed: number) {
  const progress = Math.max(0, Math.min(1, elapsed / 180));
  return 210 + 230 * progress * progress * (3 - 2 * progress);
}
export interface RoadObject {
  id: number;
  kind: ObjectKind;
  lane: number;
  y: number;
  passed?: boolean;
}
export interface RunState {
  crashPoint: { x: number; y: number } | null;
  crossingIn: number;
  crossing: { x: number; y: number; wait: number; direction: Direction } | null;
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
  powerupIn: number;
  nextPowerup: PowerupKind;
  boostLeft: number;
  shieldLeft: number;
  safeLane: number;
  nextId: number;
  objects: RoadObject[];
  crashCause: ObjectKind | null;
}
export interface RunSnapshot {
  boostLeft: number;
  shieldLeft: number;
  mode: RunMode;
  score: number;
  distance: number;
  cha: number;
  speed: number;
  elapsed: number;
  crashCause: ObjectKind | null;
}
export type GameEvent =
  | { type: 'near-miss' }
  | { type: 'pickup' }
  | { type: 'powerup'; kind: PowerupKind }
  | { type: 'deflect' }
  | { type: 'crash'; kind: ObjectKind };
export const HITBOXES: Record<ObjectKind, { width: number; height: number }> = {
  bus: { width: 42, height: 91 },
  car: { width: 35, height: 60 },
  pothole: { width: 43, height: 22 },
  barrier: { width: 49, height: 21 },
  cha: { width: 34, height: 34 },
  jhalmuri: { width: 38, height: 38 },
  shield: { width: 38, height: 38 },
  pedestrian: { width: 16, height: 22 },
};

export function createRun(): RunState {
  return {
    mode: 'ready',
    crashPoint: null,
    crossingIn: 16,
    crossing: null,
    lane: 1,
    playerX: WORLD.lanes[1],
    elapsed: 0,
    distance: 0,
    cha: 0,
    score: 0,
    speed: 210,
    scroll: 0,
    spawnIn: 1,
    powerupIn: 5,
    nextPowerup: 'jhalmuri',
    boostLeft: 0,
    shieldLeft: 0,
    safeLane: 1,
    nextId: 1,
    objects: [],
    crashCause: null,
  };
}

export function snapshot(state: RunState): RunSnapshot {
  return {
    mode: state.mode,
    boostLeft: state.boostLeft,
    shieldLeft: state.shieldLeft,
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
  const count =
    state.elapsed > 40 &&
    random() < Math.min(0.48, 0.2 + state.elapsed * 0.0015)
      ? 2
      : 1;
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
  if (state.powerupIn <= 0) {
    state.objects.push({
      id: state.nextId++,
      kind: state.nextPowerup,
      lane: state.safeLane,
      y: -80,
    });
    state.nextPowerup =
      state.nextPowerup === 'jhalmuri' ? 'shield' : 'jhalmuri';
    state.powerupIn = 9;
  } else if (random() < 0.65)
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
  state.boostLeft = Math.max(0, state.boostLeft - delta);
  state.shieldLeft = Math.max(0, state.shieldLeft - delta);
  state.powerupIn -= delta;
  state.crossingIn -= delta;
  state.elapsed += delta;
  state.speed =
    baseSpeed(state.elapsed) *
    (state.boostLeft > 0 ? POWERUPS.boostMultiplier : 1);
  const advance = state.speed * delta;
  state.scroll += advance;
  state.distance += advance / 10;
  const target = WORLD.lanes[state.lane];
  const difference = target - state.playerX;
  state.playerX += difference * (1 - Math.exp(-22 * delta));
  if (Math.abs(target - state.playerX) < 0.5) state.playerX = target;
  state.spawnIn -= delta;
  if (state.spawnIn <= 0 && state.crossingIn > 0 && !state.crossing) {
    spawnWave(state, random);
    state.spawnIn += Math.max(1.1, 1.5 - state.elapsed * 0.002);
  }
  if (
    state.crossingIn <= 0 &&
    !state.crossing &&
    !state.objects.some(
      (object) => !['cha', 'jhalmuri', 'shield'].includes(object.kind),
    )
  ) {
    const direction: Direction = random() < 0.5 ? 1 : -1;
    state.crossing = {
      x: direction === 1 ? 54 : 366,
      y: 100,
      wait: 1.2,
      direction,
    };
    state.crossingIn = 22 + random() * 10;
  }
  if (state.crossing) {
    const person = state.crossing;
    if (person.wait > 0) person.wait = Math.max(0, person.wait - delta);
    else {
      person.x += person.direction * 85 * delta;
      person.y += Math.min(state.speed, 300) * delta;
      if (
        Math.abs(person.x - state.playerX) < 22.5 &&
        Math.abs(person.y - WORLD.playerY) < 32.5
      ) {
        state.mode = 'crashed';
        state.crashCause = 'pedestrian';
        state.crashPoint = { x: person.x, y: person.y };
        events.push({ type: 'crash', kind: 'pedestrian' });
      }
      if (person.y > WORLD.height + 40 || person.x < 40 || person.x > 380) {
        state.crossing = null;
        state.spawnIn = 0.8;
      }
    }
  }
  for (const object of state.objects) {
    if (state.mode !== 'running') break;
    object.y += advance;
    const box = HITBOXES[object.kind];
    const overlapX =
      Math.abs(WORLD.lanes[object.lane] - state.playerX) < (box.width + 29) / 2;
    const overlapY = Math.abs(object.y - WORLD.playerY) < (box.height + 43) / 2;
    if (!object.passed && object.y > WORLD.playerY + (box.height + 43) / 2) {
      object.passed = true;
      const gap =
        Math.abs(WORLD.lanes[object.lane] - state.playerX) -
        (box.width + 29) / 2;
      if (
        ['bus', 'car', 'barrier', 'pothole'].includes(object.kind) &&
        gap >= 0 &&
        gap < 18 &&
        state.boostLeft === 0 &&
        state.shieldLeft === 0
      )
        events.push({ type: 'near-miss' });
    }
    if (!overlapX || !overlapY) continue;
    if (object.kind === 'cha') {
      state.cha += 1;
      object.y = WORLD.height + 200;
      events.push({ type: 'pickup' });
    } else if (object.kind === 'jhalmuri' || object.kind === 'shield') {
      if (object.kind === 'jhalmuri') state.boostLeft = POWERUPS.boostSeconds;
      else state.shieldLeft = POWERUPS.shieldSeconds;
      object.y = WORLD.height + 200;
      events.push({ type: 'powerup', kind: object.kind });
    } else if (state.boostLeft > 0 || state.shieldLeft > 0) {
      object.y = WORLD.height + 200;
      events.push({ type: 'deflect' });
    } else {
      state.mode = 'crashed';
      state.crashCause = object.kind;
      state.crashPoint = { x: WORLD.lanes[object.lane], y: object.y };
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
