export interface PersonalBest {
  score: number;
  distance: number;
  cha: number;
}
const BEST_KEY = 'dhaka-dash:best:v1';
const SOUND_KEY = 'dhaka-dash:sound:v1';
export const EMPTY_BEST: PersonalBest = { score: 0, distance: 0, cha: 0 };

export function readBest(): PersonalBest {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(BEST_KEY) ?? 'null');
    if (!saved || typeof saved !== 'object') return { ...EMPTY_BEST };
    const candidate = saved as PersonalBest;
    if (
      ![candidate.score, candidate.distance, candidate.cha].every(
        (value) =>
          typeof value === 'number' && Number.isFinite(value) && value >= 0,
      )
    )
      return { ...EMPTY_BEST };
    return {
      score: Math.floor(candidate.score),
      distance: Math.floor(candidate.distance),
      cha: Math.floor(candidate.cha),
    };
  } catch {
    return { ...EMPTY_BEST };
  }
}

export function saveBest(best: PersonalBest): boolean {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
    return true;
  } catch {
    return false;
  }
}

export function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) === 'on';
  } catch {
    return false;
  }
}

export function saveSound(enabled: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  } catch {
    return;
  }
}
