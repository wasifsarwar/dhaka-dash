import * as Phaser from 'phaser';
import {
  createRun,
  movePlayer,
  seededRandom,
  snapshot,
  stepRun,
  WORLD,
  type Direction,
  type RunSnapshot,
} from './core';
import { GameAudio } from './audio';

export interface GameController {
  start: () => void;
  pause: () => void;
  resume: () => void;
  move: (direction: Direction) => void;
  sound: (enabled: boolean) => void;
  horn: () => void;
  destroy: () => void;
}

export function mountGame(
  parent: HTMLElement,
  onUpdate: (state: RunSnapshot) => void,
  onReady: () => void,
): GameController {
  const audio = new GameAudio();
  let state = createRun();
  let random = seededRandom(Date.now());
  let sceneReady = false;
  let disposed = false;
  let hudElapsed = 0;
  const publish = () => onUpdate(snapshot(state));
  const pause = () => {
    if (state.mode === 'running') {
      state.mode = 'paused';
      publish();
    }
  };
  const resume = () => {
    if (state.mode === 'paused') {
      state.mode = 'running';
      audio.unlock();
      publish();
    }
  };
  const start = () => {
    if (!sceneReady) return;
    state = createRun();
    state.mode = 'running';
    random = seededRandom(Date.now());
    (game.scene.getScene('DhakaDash') as DashScene).resetObjects();
    audio.unlock();
    audio.play('start');
    hudElapsed = 0;
    publish();
  };
  const toggle = () => {
    if (state.mode === 'running') pause();
    else if (state.mode === 'paused') resume();
    else start();
  };

  class DashScene extends Phaser.Scene {
    road!: Phaser.GameObjects.Graphics;
    aura!: Phaser.GameObjects.Graphics;
    streetSigns: Phaser.GameObjects.Text[] = [];
    player!: Phaser.GameObjects.Image;
    objects = new Map<number, Phaser.GameObjects.Image>();
    pickupText!: Phaser.GameObjects.Text;
    constructor() {
      super('DhakaDash');
    }

    preload() {
      this.load.image('cng-dhaka', './cng-north-v1.1.png');
    }

    create() {
      if (disposed) return;
      sceneReady = true;
      this.makeTextures();
      this.road = this.add.graphics();
      this.aura = this.add.graphics().setDepth(2);
      const signs = ['চা\nCHA', 'ঢাকা\nDHAKA', 'ঝালমুড়ি', 'ফুচকা', 'মিরপুর', 'পুরান\nঢাকা'];
      this.streetSigns = signs.map((label, index) =>
        this.add
          .text(index % 2 ? 390 : 28, 0, label, {
            fontFamily: 'Arial',
            fontSize: '10px',
            color: '#fff1c2',
            backgroundColor: index % 2 ? '#a6462e' : '#194d3c',
            padding: { x: 3, y: 5 },
            align: 'center',
          })
          .setOrigin(0.5)
          .setDepth(1),
      );
      this.player = this.add
        .image(
          WORLD.lanes[1],
          WORLD.playerY,
          this.textures.exists('cng-dhaka') ? 'cng-dhaka' : 'cng',
        )
        .setDisplaySize(84, 108)
        .setDepth(3);
      this.pickupText = this.add
        .text(210, WORLD.playerY - 65, '+50 CHA!', {
          fontFamily: 'Courier New',
          fontSize: '18px',
          color: '#ffe28a',
          fontStyle: 'bold',
          stroke: '#14392e',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(5)
        .setAlpha(0);
      this.drawRoad();
      publish();
      onReady();
    }

    makeTextures() {
      const painter = this.make.graphics({ x: 0, y: 0 });
      const rect = (
        color: number,
        left: number,
        top: number,
        width: number,
        height: number,
        radius = 0,
      ) => {
        painter.fillStyle(color);
        if (radius) painter.fillRoundedRect(left, top, width, height, radius);
        else painter.fillRect(left, top, width, height);
      };
      const save = (name: string, width: number, height: number) => {
        painter.generateTexture(name, width, height);
        painter.clear();
      };
      rect(0x0a231e, 7, 14, 46, 68, 12);
      rect(0x102d28, 3, 52, 8, 21, 3);
      rect(0x102d28, 49, 52, 8, 21, 3);
      rect(0x2a9b67, 9, 11, 42, 65, 10);
      rect(0xf1d778, 13, 9, 34, 10, 5);
      rect(0x193b39, 15, 22, 30, 17, 4);
      rect(0x98c2b4, 18, 24, 24, 3);
      rect(0x68b379, 14, 43, 32, 20, 4);
      rect(0x328859, 18, 47, 24, 12, 2);
      rect(0xf2e7b3, 15, 69, 9, 4, 1);
      rect(0xf2e7b3, 36, 69, 9, 4, 1);
      rect(0xe2b756, 27, 44, 6, 18);
      rect(0xe2b756, 22, 49, 16, 6);
      save('cng', 60, 86);
      for (const [name, color] of [
        ['bus', 0xc77347],
        ['car', 0xc2ba8c],
      ] as const) {
        const tall = name === 'bus' ? 116 : 84;
        rect(0x112e28, 6, 9, 54, tall, 9);
        rect(0x132b28, 2, 23, 7, 22, 2);
        rect(0x132b28, 53, 23, 7, 22, 2);
        rect(color, 7, 3, 46, tall - 6, 7);
        rect(0xeee0ac, 8, 5, 44, 6, 3);
        rect(0x284d47, 12, 16, 36, 17, 3);
        rect(0x79a195, 15, 18, 30, 3);
        rect(name === 'bus' ? 0xebc674 : 0xe3d9ae, 14, 39, 32, tall - 68, 4);
        if (name === 'bus') {
          for (let stripe = 0; stripe < 4; stripe++)
            rect(0xa75237, 17, 47 + stripe * 9, 26, 3);
        }
        rect(0x1a3d37, 13, tall - 25, 34, 12, 3);
        rect(0xee7c51, 11, tall - 9, 8, 4);
        rect(0xee7c51, 41, tall - 9, 8, 4);
        save(name, 62, tall + 12);
      }
      painter.fillStyle(0x23322c);
      painter.fillEllipse(32, 20, 59, 29);
      painter.fillStyle(0x132923);
      painter.fillEllipse(30, 17, 46, 20);
      painter.lineStyle(2, 0x667966);
      painter.strokeEllipse(32, 18, 55, 26);
      save('pothole', 64, 40);
      rect(0x202f29, 5, 19, 7, 21);
      rect(0x202f29, 51, 19, 7, 21);
      rect(0xefcf67, 3, 4, 58, 21, 3);
      painter.fillStyle(0xa75338);
      for (let stripe = 0; stripe < 3; stripe++)
        painter.fillTriangle(
          8 + stripe * 19,
          4,
          21 + stripe * 19,
          4,
          8 + stripe * 19,
          25,
        );
      save('barrier', 64, 40);
      painter.fillStyle(0xf6d678, 0.13);
      painter.fillCircle(24, 24, 23);
      painter.fillStyle(0xf6d678);
      painter.fillEllipse(24, 32, 31, 7);
      painter.lineStyle(3, 0xf8e8b4);
      painter.strokeCircle(35, 21, 6);
      rect(0xf6e8bc, 12, 13, 22, 18, 5);
      painter.fillStyle(0xa66535);
      painter.fillEllipse(23, 14, 20, 5);
      painter.lineStyle(2, 0xf6e8bc, 0.8);
      painter.lineBetween(20, 4, 18, 9);
      painter.lineBetween(27, 3, 25, 8);
      save('cha', 48, 48);
      for (const [kind, color, symbol] of [
        ['jhalmuri', 0xffb64e, 'J'],
        ['shield', 0x83e0ce, 'R'],
      ] as const) {
        painter.fillStyle(color, 0.2);
        painter.fillCircle(24, 24, 24);
        painter.fillStyle(0x14392e);
        painter.fillCircle(24, 24, 19);
        painter.lineStyle(3, color);
        painter.strokeCircle(24, 24, 19);
        const label = this.make
          .text({
            x: 24,
            y: 24,
            text: symbol,
            style: {
              fontFamily: 'Arial',
              fontSize: '25px',
              fontStyle: 'bold',
              color: kind === 'jhalmuri' ? '#ffb64e' : '#83e0ce',
            },
          })
          .setOrigin(0.5);
        const texture = this.add.renderTexture(0, 0, 48, 48);
        texture.draw(painter);
        texture.draw(label);
        texture.saveTexture(kind);
        texture.destroy();
        label.destroy();
        painter.clear();
      }
      painter.destroy();
    }

    resetObjects() {
      for (const object of this.objects.values()) object.destroy();
      this.objects.clear();
      this.tweens.killAll();
      this.pickupText.setAlpha(0);
      this.player.clearTint().setAngle(0).setAlpha(1);
      this.cameras.main.resetFX();
    }

    drawRoad() {
      const graphics = this.road;
      const offset = state.scroll;
      graphics.clear();
      graphics.fillStyle(0x6c8060);
      graphics.fillRect(0, 0, 420, 660);
      graphics.fillStyle(0xb1ac87);
      graphics.fillRect(43, 0, 25, 660);
      graphics.fillRect(352, 0, 25, 660);
      graphics.fillStyle(0x424b3d);
      graphics.fillRect(68, 0, 284, 660);
      graphics.fillStyle(0x485141);
      graphics.fillRect(76, 0, 268, 660);
      for (let marker = -1; marker < 12; marker++) {
        const top = marker * 74 + (offset % 74);
        graphics.fillStyle(0xc7c09c, 0.65);
        graphics.fillRect(163, top, 3, 30);
        graphics.fillRect(255, top, 3, 30);
        graphics.fillStyle(marker % 2 ? 0xe2d7aa : 0x284638);
        graphics.fillRect(63, top, 6, 37);
        graphics.fillRect(351, top, 6, 37);
      }
      for (let strip = -1; strip < 6; strip++) {
        const top = strip * 160 + (offset % 160);
        graphics.fillStyle(0x899570);
        graphics.fillRect(3, top + 9, 31, 103);
        graphics.fillRect(386, top + 20, 34, 111);
        graphics.fillStyle(0x516d4f);
        graphics.fillCircle(28, top + 33, 20);
        graphics.fillCircle(16, top + 51, 18);
        graphics.fillCircle(391, top + 117, 24);
        graphics.fillStyle(0x66835a);
        graphics.fillCircle(22, top + 31, 13);
        graphics.fillCircle(394, top + 109, 15);
        graphics.fillStyle(0xc5b68b, 0.7);
        graphics.fillRect(47, top + 85, 11, 25);
        graphics.fillRect(363, top + 41, 8, 21);
      }
      graphics.fillStyle(0xf1dc91, 0.16);
      graphics.fillRect(79, 0, 2, 660);
      graphics.fillRect(339, 0, 2, 660);
    }

    update(_time: number, delta: number) {
      if (disposed) return;
      const events = stepRun(state, delta / 1000, random);
      if (state.mode === 'ready') state.scroll += Math.min(delta, 50) * 0.025;
      this.drawRoad();
      this.streetSigns.forEach((sign, index) =>
        sign.setY(((index * 130 + state.scroll) % 780) - 60),
      );
      this.aura.clear();
      if (state.boostLeft > 0 || state.shieldLeft > 0) {
        const color = state.boostLeft > 0 ? 0xffb64e : 0x83e0ce;
        this.aura.lineStyle(3, color, 0.9);
        this.aura.strokeEllipse(state.playerX, WORLD.playerY, 80, 114);
        this.aura.fillStyle(color, 0.12);
        this.aura.fillEllipse(state.playerX, WORLD.playerY, 80, 114);
        if (state.boostLeft > 0) {
          this.aura.lineStyle(3, color, 0.65);
          this.aura.lineBetween(
            state.playerX - 17,
            WORLD.playerY + 50,
            state.playerX - 17,
            WORLD.playerY + 82,
          );
          this.aura.lineBetween(
            state.playerX + 17,
            WORLD.playerY + 50,
            state.playerX + 17,
            WORLD.playerY + 82,
          );
        }
      }
      this.player.setPosition(state.playerX, WORLD.playerY);
      this.player.setAngle(
        state.mode === 'crashed'
          ? -13
          : Phaser.Math.Clamp(
              (WORLD.lanes[state.lane] - state.playerX) / 10,
              -7,
              7,
            ),
      );
      const active = new Set(state.objects.map((object) => object.id));
      for (const [id, sprite] of this.objects)
        if (!active.has(id)) {
          sprite.destroy();
          this.objects.delete(id);
        }
      for (const object of state.objects) {
        let sprite = this.objects.get(object.id);
        if (!sprite) {
          sprite = this.add
            .image(WORLD.lanes[object.lane], object.y, object.kind)
            .setDepth(object.kind === 'cha' ? 2 : 1);
          this.objects.set(object.id, sprite);
        }
        sprite.setY(object.y);
      }
      for (const event of events) {
        audio.play(
          event.type === 'powerup' || event.type === 'deflect'
            ? 'pickup'
            : event.type,
        );
        if (event.type !== 'crash') {
          this.tweens.killTweensOf(this.pickupText);
          this.pickupText
            .setText(
              event.type === 'pickup'
                ? '+50 CHA!'
                : event.type === 'deflect'
                  ? 'BACHLAM!'
                  : event.kind === 'jhalmuri'
                    ? 'JHALMURI RUSH!'
                    : 'RICKSHAW SHIELD!',
            )
            .setPosition(state.playerX, WORLD.playerY - 57)
            .setAlpha(1);
          this.tweens.add({
            targets: this.pickupText,
            y: WORLD.playerY - 110,
            alpha: 0,
            duration: 650,
          });
        } else {
          this.player.setTint(0xf69d73);
          if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            this.cameras.main.shake(200, 0.008);
        }
      }
      hudElapsed += delta;
      if (events.length || (state.mode === 'running' && hudElapsed >= 100)) {
        hudElapsed = 0;
        publish();
      }
    }
  }

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: WORLD.width,
    height: WORLD.height,
    backgroundColor: '#294b3c',
    antialias: true,
    banner: false,
    audio: { noAudio: true },
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    scene: DashScene,
    fps: { target: 60 },
    input: { keyboard: false },
  });
  const keydown = (event: KeyboardEvent) => {
    const element = event.target as HTMLElement;
    if (element.matches('input, textarea, select, [contenteditable="true"]'))
      return;
    const keys = [
      'ArrowLeft',
      'ArrowRight',
      'KeyA',
      'KeyD',
      'Space',
      'Escape',
      'KeyP',
      'KeyR',
      'KeyH',
    ];
    if (!keys.includes(event.code)) return;
    if (element.closest('button, a') && event.code === 'Space') return;
    event.preventDefault();
    if (event.repeat) return;
    if (event.code === 'ArrowLeft' || event.code === 'KeyA')
      movePlayer(state, -1);
    if (event.code === 'ArrowRight' || event.code === 'KeyD')
      movePlayer(state, 1);
    if (event.code === 'Space' || event.code === 'KeyP') toggle();
    if (event.code === 'Escape') pause();
    if (event.code === 'KeyR' && state.mode === 'crashed') start();
    if (event.code === 'KeyH') {
      audio.unlock();
      audio.play('horn');
    }
  };
  const visibility = () => {
    if (document.hidden) pause();
  };
  window.addEventListener('keydown', keydown);
  window.addEventListener('blur', pause);
  document.addEventListener('visibilitychange', visibility);
  return {
    start,
    pause,
    resume,
    move: (direction) => movePlayer(state, direction),
    sound: (enabled) => {
      audio.enabled = enabled;
      audio.unlock();
    },
    horn: () => {
      audio.unlock();
      audio.play('horn');
    },
    destroy: () => {
      disposed = true;
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
      audio.destroy();
      game.destroy(true);
    },
  };
}
