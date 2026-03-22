class WaveManager {
  constructor() {
    this.wave         = 0;
    this.waveInterval = 30;   // seconds between waves
    this.timer        = 27;   // start first wave ~3 s after game start
    this.spawning     = false;
    this.spawnQueue   = [];
    this.spawnTimer   = 0;
    this.spawnDelay   = 0.55; // seconds between individual spawns
  }

  // How many seconds until the next wave (0 while spawning)
  get timeToNextWave() {
    if (this.spawning || this.spawnQueue.length > 0) return 0;
    return Math.max(0, this.waveInterval - this.timer);
  }

  // monsters: current alive monster array
  // onSpawn(type, hpMult): called to create a monster in the scene
  // onWaveStart(waveNumber): called when a new wave begins
  update(dt, monsters, onSpawn, onWaveStart) {
    const alive = monsters.filter(m => !m.dead).length;

    if (this.spawnQueue.length > 0) {
      // Currently spawning monsters
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnDelay) {
        this.spawnTimer = 0;
        const entry = this.spawnQueue.shift();
        onSpawn(entry.type, entry.hpMult);
        if (this.spawnQueue.length === 0) this.spawning = false;
      }
    } else if (!this.spawning && alive === 0) {
      // All monsters dead, count down to next wave
      this.timer += dt;
      if (this.timer >= this.waveInterval) {
        this.timer = 0;
        this._launchWave(onWaveStart);
      }
    }
  }

  _launchWave(onWaveStart) {
    this.wave++;
    this.spawning   = true;
    this.spawnTimer = 0;

    const count   = this._waveCount(this.wave);
    const hpMult  = this._hpMult(this.wave);

    this.spawnQueue = [];
    for (let i = 0; i < count; i++) {
      this.spawnQueue.push({ type: this._pickType(this.wave), hpMult });
    }

    if (onWaveStart) onWaveStart(this.wave);
  }

  _waveCount(wave) {
    return 5 + (wave - 1) * 2;
  }

  _hpMult(wave) {
    return Math.pow(1.15, wave - 1);
  }

  _pickType(wave) {
    if (wave >= 16) {
      const r = Math.random();
      if (r < 0.25) return 'goblin';
      if (r < 0.60) return 'orc';
      return 'troll';
    }
    if (wave >= 6) {
      return Math.random() < 0.35 ? 'goblin' : 'orc';
    }
    return 'goblin';
  }
}
