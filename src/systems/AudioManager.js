class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicVolume = 0.3;
    this.sfxVolume = 0.6;
    this.initialized = false;
    this.currentMusic = null;
    this.musicCache = {};
  }

  init() {
    if (this.initialized) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.initialized = true;
    } catch (e) {
      console.warn('Audio not available:', e.message);
    }
  }

  ensureResumed() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playNote(freq, duration, type = 'sine', gainNode = null) {
    if (!this.ctx) return;
    this.ensureResumed();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(gainNode || this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  sfxHit() {
    if (!this.ctx) return;
    this.ensureResumed();
    this.playNote(120 + Math.random() * 80, 0.12, 'sawtooth');
    this.playNote(60 + Math.random() * 40, 0.08, 'square');
  }

  sfxHeal() {
    if (!this.ctx) return;
    this.ensureResumed();
    this.playNote(440, 0.15, 'sine');
    setTimeout(() => this.playNote(550, 0.2, 'sine'), 80);
    setTimeout(() => this.playNote(660, 0.25, 'sine'), 160);
  }

  sfxSkill() {
    if (!this.ctx) return;
    this.ensureResumed();
    this.playNote(300, 0.1, 'triangle');
    setTimeout(() => this.playNote(500, 0.1, 'triangle'), 50);
    setTimeout(() => this.playNote(700, 0.15, 'triangle'), 100);
  }

  sfxEgo() {
    if (!this.ctx) return;
    this.ensureResumed();
    const notes = [220, 277, 330, 440, 550, 660, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playNote(f, 0.3, 'sawtooth'), i * 60);
    });
  }

  sfxDeath() {
    if (!this.ctx) return;
    this.ensureResumed();
    this.playNote(200, 0.3, 'sawtooth');
    setTimeout(() => this.playNote(150, 0.3, 'sawtooth'), 150);
    setTimeout(() => this.playNote(80, 0.5, 'sawtooth'), 300);
  }

  sfxClick() {
    if (!this.ctx) return;
    this.ensureResumed();
    this.playNote(800, 0.05, 'sine');
  }

  sfxLevelUp() {
    if (!this.ctx) return;
    this.ensureResumed();
    [330, 415, 523, 659, 784].forEach((f, i) => {
      setTimeout(() => this.playNote(f, 0.2, 'triangle'), i * 80);
    });
  }

  sfxVictory() {
    if (!this.ctx) return;
    this.ensureResumed();
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.playNote(f, 0.3, 'sine'), i * 120);
    });
  }

  loadMusic(key, url, loop = true) {
    return new Promise((resolve) => {
      const audio = new Audio(url);
      audio.loop = loop;
      audio.volume = this.musicVolume;
      audio.addEventListener('canplaythrough', () => resolve(), { once: true });
      audio.addEventListener('error', () => { console.warn(`Failed to load ${url}`); resolve(); }, { once: true });
      audio.load();
      this.musicCache[key] = audio;
    });
  }

  playMusicFile(key) {
    this.stopMusic();
    const audio = this.musicCache[key];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      this.currentMusic = audio;
    }
  }

  stopMusic() {
    if (this.currentMusic && this.currentMusic.pause) {
      this.currentMusic.pause();
      this.currentMusic.currentTime = 0;
    }
    if (this.currentMusicTimeout) {
      clearTimeout(this.currentMusicTimeout);
      this.currentMusicTimeout = null;
    }
    this.currentMusic = null;
  }

  setMusicVolume(v) {
    this.musicVolume = v;
    if (this.musicGain) this.musicGain.gain.value = v;
    for (const key in this.musicCache) {
      this.musicCache[key].volume = v;
    }
  }

  setSfxVolume(v) {
    this.sfxVolume = v;
    if (this.sfxGain) this.sfxGain.gain.value = v;
  }
}

const audio = new AudioManager();
