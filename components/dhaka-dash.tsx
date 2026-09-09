'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Coffee,
  Flag,
  Gauge,
  MoveHorizontal,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Shield,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  createRun,
  snapshot,
  type ObjectKind,
  type RunSnapshot,
} from '@/lib/game/core';
import {
  EMPTY_BEST,
  readBest,
  readSound,
  saveBest,
  saveSound,
  type PersonalBest,
} from '@/lib/game/storage';
import type { GameController } from '@/lib/game/scene';

const crashMessages: Record<ObjectKind, string> = {
  pedestrian: 'Emergency stop! Give pedestrians room to cross, mama.',
  bus: 'The bus had other plans. Classic Dhaka.',
  car: 'That gap was a little too ambitious.',
  pothole: 'The road won this round, mama.',
  barrier: 'Roadworks. Somehow, always roadworks.',
  cha: 'That was a good run. One more?',
  jhalmuri: 'That was a good run. One more?',
  shield: 'That was a good run. One more?',
};

const digits = (value: number) => String(value).padStart(5, '0');

export default function DhakaDash() {
  const canvasHost = useRef<HTMLDivElement>(null);
  const controller = useRef<GameController | null>(null);
  const bestRef = useRef<PersonalBest>({ ...EMPTY_BEST });
  const previousMode = useRef('ready');
  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(
    null,
  );
  const [run, setRun] = useState<RunSnapshot>(() => snapshot(createRun()));
  const [best, setBest] = useState<PersonalBest>({ ...EMPTY_BEST });
  const [ready, setReady] = useState(false);
  const [sound, setSound] = useState(false);
  const [newRecord, setNewRecord] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let mounted: GameController | null = null;
    bestRef.current = readBest();
    setBest(bestRef.current);
    const soundEnabled = readSound();
    setSound(soundEnabled);
    void import('@/lib/game/scene')
      .then(({ mountGame }) => {
        if (cancelled || !canvasHost.current) return;
        mounted = mountGame(
          canvasHost.current,
          (next) => {
            if (cancelled) return;
            if (next.mode === 'crashed' && previousMode.current !== 'crashed') {
              const record = next.score > bestRef.current.score;
              setNewRecord(record);
              if (record) {
                const nextBest = {
                  score: next.score,
                  distance: next.distance,
                  cha: next.cha,
                };
                bestRef.current = nextBest;
                setBest(nextBest);
                setStorageAvailable(saveBest(nextBest));
              }
            }
            previousMode.current = next.mode;
            setRun(next);
          },
          () => {
            if (!cancelled) setReady(true);
          },
        );
        mounted.sound(soundEnabled);
        controller.current = mounted;
      })
      .catch((cause: unknown) => {
        if (!cancelled)
          setError(
            cause instanceof Error
              ? cause.message
              : 'The game could not start.',
          );
      });
    return () => {
      cancelled = true;
      mounted?.destroy();
      controller.current = null;
    };
  }, []);

  const start = () => {
    setNewRecord(false);
    controller.current?.start();
  };
  const togglePause = () => {
    if (run.mode === 'running') controller.current?.pause();
    else if (run.mode === 'paused') controller.current?.resume();
  };
  const toggleSound = () => {
    const enabled = !sound;
    setSound(enabled);
    saveSound(enabled);
    controller.current?.sound(enabled);
    if (enabled) controller.current?.horn();
  };
  const playing = run.mode === 'running';
  const difficulty =
    run.elapsed < 22
      ? 'MORNING CRAWL'
      : run.elapsed < 50
        ? 'RUSH HOUR'
        : 'FULL DHAKA';

  return (
    <main className="dash-shell">
      <header className="masthead">
        <a className="wordmark" href="./" aria-label="Dhaka Dash home">
          DHAKA<span>DASH</span>
          <i lang="bn">ঢাকা</i>
        </a>
        <span className="edition">
          <span className="status-dot" /> FLIGHT-BUILT · V1.1.0
        </span>
      </header>
      <div className="game-layout">
        <section className="intro-panel">
          <p className="eyebrow">A LITTLE CHAOS. A LOT OF DHAKA.</p>
          <h1>
            The streets
            <br />
            are <em>yours.</em>
          </h1>
          <p className="intro-copy">
            One CNG. Three lanes. Absolutely no patience.
            <br />
            Find your gap. Grab some cha. Keep going.
          </p>
          <div className="route-label">
            <span className="status-dot" /> ENDLESS RUN · DHAKA, BANGLADESH
          </div>
          <div className="personal-best">
            <Trophy size={20} strokeWidth={1.6} />
            <div>
              <span>YOUR PERSONAL BEST</span>
              <strong>
                {digits(best.score)}
                <small> PTS</small>
              </strong>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <figure className="postcard">
            <img
              src="./og.png"
              alt="Vintage Dhaka Dash poster featuring a green CNG in Dhaka traffic"
              width={1730}
              height={909}
            />
          </figure>
          <div className="dispatch">
            <span className="dispatch-number">01</span>
            <div>
              <span className="eyebrow">THE FIRST DISPATCH</span>
              <p>
                Built on a 16-hour flight.
                <br />
                Inspired by a city that never brakes.
              </p>
            </div>
          </div>
        </section>

        <section className="arcade-cabinet" aria-label="Dhaka Dash arcade game">
          <div className="cabinet-top">
            <span>DH-01 / CITY RUN</span>
            <span>BEST {digits(best.score)}</span>
          </div>
          <div
            className="game-stage"
            onPointerDown={(event) => {
              if (event.button !== 0 || !playing) return;
              pointerStart.current = {
                x: event.clientX,
                y: event.clientY,
                id: event.pointerId,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onPointerUp={(event) => {
              const origin = pointerStart.current;
              pointerStart.current = null;
              if (!origin || origin.id !== event.pointerId) return;
              const horizontal = event.clientX - origin.x;
              if (
                Math.abs(horizontal) > 20 &&
                Math.abs(horizontal) > Math.abs(event.clientY - origin.y)
              )
                controller.current?.move(horizontal > 0 ? 1 : -1);
            }}
            onPointerCancel={() => {
              pointerStart.current = null;
            }}
          >
            <div ref={canvasHost} className="canvas-host" aria-hidden="true" />
            <div className="game-hud" aria-label="Run statistics">
              <div>
                <span>SCORE</span>
                <strong>{digits(run.score)}</strong>
              </div>
              <div className="cha-counter">
                <Coffee size={17} />
                <strong>{String(run.cha).padStart(2, '0')}</strong>
              </div>
            </div>
            {run.mode !== 'ready' && (
              <div className="powerup-hud" aria-label="Active power-ups">
                {run.boostLeft > 0 && (
                  <span className="powerup-boost">
                    <Zap size={13} /> JHALMURI {run.boostLeft.toFixed(1)}s
                  </span>
                )}
                {run.shieldLeft > 0 && (
                  <span className="powerup-shield">
                    <Shield size={13} /> SHIELD {run.shieldLeft.toFixed(1)}s
                  </span>
                )}
              </div>
            )}
            {run.mode !== 'ready' && (
              <div className="road-caption">
                <span>
                  {
                    ['MIRPUR', 'FARMGATE', 'SHAHBAG', 'PURAN DHAKA'][
                      Math.floor(run.elapsed / 25) % 4
                    ]
                  }{' '}
                  · {difficulty}
                </span>
                <span>{run.speed} KM/H</span>
              </div>
            )}
            {run.mode === 'ready' && !error && (
              <div className="game-overlay welcome-overlay">
                <div className="start-emblem">
                  <Flag size={28} strokeWidth={1.4} />
                </div>
                <p className="eyebrow">WELCOME TO THE STREETS</p>
                <h2>Ready, mama?</h2>
                <p>
                  Dodge the traffic. Collect the cha.
                  <br />
                  Make it just a little further.
                </p>
                <Button
                  className="primary-action"
                  onClick={start}
                  disabled={!ready}
                >
                  <Play size={16} fill="currentColor" />
                  {ready ? 'Cholo! Let’s go' : 'Preparing your CNG…'}
                </Button>
                <span className="overlay-hint">OR PRESS SPACE TO START</span>
                <span className="license-plate" lang="bn">
                  ঢাকা মেট্রো · ০১
                </span>
              </div>
            )}
            {run.mode === 'paused' && (
              <section
                className="game-overlay"
                aria-live="polite"
                aria-label="Game paused"
              >
                <div className="start-emblem">
                  <Coffee size={28} />
                </div>
                <p className="eyebrow">TAKE A CHA BREAK</p>
                <h2>No rush, mama.</h2>
                <p>
                  Your meter is paused.
                  <br />
                  The traffic can wait for once.
                </p>
                <Button
                  className="primary-action"
                  onClick={() => controller.current?.resume()}
                >
                  <Play size={16} />
                  Back to the streets
                </Button>
                <span className="overlay-hint">SPACE TO RESUME</span>
              </section>
            )}
            {run.mode === 'crashed' && (
              <section
                className="game-overlay crash-overlay"
                aria-live="polite"
                aria-label="Run finished"
              >
                <p className="eyebrow">
                  {newRecord
                    ? '★ NEW PERSONAL BEST ★'
                    : 'END OF THE ROAD. FOR NOW.'}
                </p>
                <h2>{newRecord ? 'Shabash, mama!' : 'Areh, mama!'}</h2>
                <p>{crashMessages[run.crashCause ?? 'bus']}</p>
                <strong className="final-score">{digits(run.score)}</strong>
                <span className="overlay-hint score-caption">
                  POINTS ON THE METER
                </span>
                <div className="run-receipt">
                  <span>
                    <Flag size={14} />
                    {run.distance} m
                  </span>
                  <span>
                    <Coffee size={14} />
                    {run.cha} cha
                  </span>
                  <span>{Math.floor(run.elapsed)} sec</span>
                </div>
                <Button className="primary-action" onClick={start}>
                  <RotateCcw size={16} />
                  One more run
                </Button>
                <span className="overlay-hint">PRESS SPACE OR R TO RETRY</span>
              </section>
            )}
            {error && (
              <div className="game-overlay" role="alert">
                <h2>Engine trouble.</h2>
                <p>The game couldn’t load. Try refreshing the page.</p>
                <Button
                  className="primary-action"
                  onClick={() => window.location.reload()}
                >
                  Reload game
                </Button>
                <details className="error-details">
                  <summary>Technical details</summary>
                  {error}
                </details>
              </div>
            )}
          </div>
          <div className="drive-controls">
            <Button
              variant="ghost"
              className="steer-button"
              aria-label="Steer left"
              disabled={!playing}
              onClick={() => controller.current?.move(-1)}
            >
              <ArrowLeft size={23} />
            </Button>
            <Button
              variant="ghost"
              className="utility-button"
              aria-label={run.mode === 'paused' ? 'Resume game' : 'Pause game'}
              disabled={run.mode === 'ready' || run.mode === 'crashed'}
              onClick={togglePause}
            >
              {run.mode === 'paused' ? <Play size={17} /> : <Pause size={17} />}
            </Button>
            <Button
              variant="ghost"
              className="utility-button"
              aria-label={sound ? 'Mute sound' : 'Enable sound'}
              aria-pressed={sound}
              onClick={toggleSound}
            >
              {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </Button>
            <Button
              variant="ghost"
              className="steer-button"
              aria-label="Steer right"
              disabled={!playing}
              onClick={() => controller.current?.move(1)}
            >
              <ArrowRight size={23} />
            </Button>
          </div>
          <div className="cabinet-bottom">
            <span>← → / A D STEER</span>
            <span>SPACE PAUSE · H HORN</span>
          </div>
        </section>

        <aside className="field-notes">
          <p className="eyebrow">THE SURVIVAL GUIDE</p>
          <h2>
            Keep the meter
            <br />
            running.
          </h2>
          <div className="guide-item">
            <span className="guide-icon">
              <MoveHorizontal size={19} />
            </span>
            <div>
              <strong>Find your gap</strong>
              <p>
                Use ← → or A / D to change lanes. On your phone, swipe or tap
                the arrows.
              </p>
            </div>
          </div>
          <div className="guide-item">
            <span className="guide-icon cha-icon">
              <Coffee size={19} />
            </span>
            <div>
              <strong>Cha is fuel for the soul</strong>
              <p>
                Collect a cup for <b>+50 points.</b> Your distance adds points,
                too.
              </p>
            </div>
          </div>
          <div className="guide-item">
            <span className="guide-icon cha-icon">
              <Zap size={19} />
            </span>
            <div>
              <strong>Jhalmuri Rush · J</strong>
              <p>
                Grab the orange J for 4 seconds of extra speed and crash
                protection. More distance, more points.
              </p>
            </div>
          </div>
          <div className="guide-item">
            <span className="guide-icon">
              <Shield size={19} />
            </span>
            <div>
              <strong>Rickshaw Shield · R</strong>
              <p>
                Grab the mint R for 6 seconds of immunity. Pickups activate
                automatically; watch the countdown.
              </p>
            </div>
          </div>
          <div className="guide-item">
            <span className="guide-icon">
              <Gauge size={19} />
            </span>
            <div>
              <strong>Give pedestrians room</strong>
              <p>
                Watch for occasional crossing warnings. Steer clear: pedestrian
                contact ends the run even with a shield or boost. Traffic leaves
                space during crossings.
              </p>
            </div>
          </div>
          <div className="local-note">
            <span className="status-dot" />
            <div>
              <strong>Just you and the streets.</strong>
              <p>
                {storageAvailable
                  ? 'Your best score stays on this device. No accounts. No internet needed during a run.'
                  : 'Storage is unavailable. Your best score lasts for this session only.'}
              </p>
            </div>
          </div>
          <p className="bengali-note" lang="bn">
            ধীরে চালান, বাড়ি ফিরুন।<span>Drive safe. Come home.</span>
          </p>
        </aside>
      </div>
      <footer className="site-footer">
        <span>MADE SOMEWHERE ABOVE THE CLOUDS.</span>
        <span>
          SEATTLE <span className="flight-arrow">→</span> DOHA{' '}
          <span className="flight-arrow">→</span> DHAKA
        </span>
      </footer>
    </main>
  );
}
