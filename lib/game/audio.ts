export class GameAudio {
  private context: AudioContext | null = null;
  enabled = false;

  unlock() {
    if (!this.enabled) return;
    try {
      this.context ??= new AudioContext();
      void this.context.resume().catch(() => {});
    } catch {
      this.context = null;
    }
  }

  play(type: 'start' | 'pickup' | 'crash' | 'horn') {
    if (!this.enabled || !this.context) return;
    const notes =
      type === 'pickup'
        ? [660, 990]
        : type === 'start'
          ? [330, 440, 660]
          : type === 'horn'
            ? [220, 277]
            : [100, 65];
    notes.forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator();
      const volume = this.context!.createGain();
      const startsAt = this.context!.currentTime + index * 0.075;
      oscillator.type = type === 'crash' ? 'sawtooth' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, startsAt);
      volume.gain.setValueAtTime(0, startsAt);
      volume.gain.linearRampToValueAtTime(0.07, startsAt + 0.01);
      volume.gain.exponentialRampToValueAtTime(0.001, startsAt + 0.18);
      oscillator.connect(volume);
      volume.connect(this.context!.destination);
      oscillator.start(startsAt);
      oscillator.stop(startsAt + 0.2);
    });
  }

  destroy() {
    void this.context?.close().catch(() => {});
    this.context = null;
  }
}
