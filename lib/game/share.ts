import type { RunSnapshot } from './core';

export const GAME_URL = 'https://wasifsarwar.github.io/dhaka-dash/';

export function challengeText(
  run: Pick<RunSnapshot, 'score' | 'distance' | 'cha'>,
) {
  return `I scored ${Math.floor(run.score).toLocaleString('en-US')} in Dhaka Dash! ${Math.floor(run.distance)}m, ${run.cha} cha. Beat that, mama! ${GAME_URL}`;
}

export async function scoreCard(run: RunSnapshot): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image export is unavailable in this browser.');
  ctx.fillStyle = '#f2efdf';
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = '#173d31';
  ctx.fillRect(24, 24, 1152, 582);
  ctx.fillStyle = '#ba493b';
  ctx.fillRect(24, 24, 1152, 10);
  ctx.fillStyle = '#f2efdf';
  ctx.font = 'bold 42px Arial';
  ctx.fillText('DHAKA DASH', 72, 110);
  ctx.font = '20px monospace';
  ctx.fillText('ONE CNG. THREE LANES. ENDLESS CHAOS.', 72, 151);
  ctx.fillStyle = '#efcf67';
  let size = 132;
  const score = Math.floor(run.score).toLocaleString('en-US');
  do {
    ctx.font = `bold ${size--}px monospace`;
  } while (ctx.measureText(score).width > 1000 && size > 35);
  ctx.fillText(score, 72, 325);
  ctx.fillStyle = '#f2efdf';
  ctx.font = '24px monospace';
  ctx.fillText(`POINTS  /  ${run.distance}m  /  ${run.cha} CHA`, 72, 380);
  ctx.font = 'bold 38px Arial';
  ctx.fillText('Beat that, mama!', 72, 466);
  ctx.font = '23px monospace';
  ctx.fillText('wasifsarwar.github.io/dhaka-dash/', 72, 549);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('Could not export the score card.')),
      'image/png',
    ),
  );
}
