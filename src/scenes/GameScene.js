// Static star positions (deterministic for consistent background)
const STARS = [
  [55,28],[130,55],[210,18],[370,42],[520,12],[640,52],[720,22],
  [820,38],[940,8],[1060,48],[1150,28],[85,75],[295,68],[470,82],
  [680,72],[880,60],[1020,80],[160,95],[400,30],[750,88],[300,15],
  [570,65],[990,35],[1100,70],[440,50],
];

class GameScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    this.MENU_H = 70;

    // Derived layout (recomputed on resize)
    this._computeLayout();

    // Core entities
    this.wall       = new Wall(this.wallX, 0, this.wallW, this.playH);
    this.monsters   = [];
    this.soldiers   = [];
    this.projectiles = [];

    // Systems
    this.economy       = new Economy(50);
    this.upgradeSystem = new UpgradeSystem(this.economy);
    this.waveManager   = new WaveManager();
    this.sidePanel     = new SidePanel();

    // UI state
    this.menuButtons       = [];
    this.addArcherCost     = 100;
    this.gameOver          = false;

    // Buildings & machines
    this.buildings    = { kaserne: 0, schmiede: 0, magierturm: 0 };
    this.catapults    = [];          // { timer }
    this.schmiede_mult = 1.0;

    // Visual FX
    this.wallFlash         = 0;     // red flash timer
    this.deathEffects      = [];    // expanding rings
    this.floatingTexts     = [];    // +Xg popups
    this.waveAnnounce      = null;  // "WELLE N" text
    this.waveAnnounceTimer = 0;

    // Start with 2 archers
    this.addArcher();
    this.addArcher();

    this._setupInput();
  }

  // ── Layout ──────────────────────────────────────────────────────────────────
  _computeLayout() {
    this.playH = this.canvas.height - this.MENU_H;
    this.wallX = Math.floor(this.canvas.width * 0.42);
    this.wallW = 34;
    // Right face of wall — where monsters stop
    this.wallFaceX = this.wallX + this.wallW;
  }

  onResize() {
    this._computeLayout();
    if (this.wall) {
      this.wall.x      = this.wallX;
      this.wall.height = this.playH;
    }
    this._repositionSoldiers();
  }

  // ── Soldiers ────────────────────────────────────────────────────────────────
  addArcher() {
    const newCount = this.soldiers.length + 1;
    const pos = this._soldierPositions(newCount);
    const s   = new Soldier(pos[newCount - 1].x, pos[newCount - 1].y);
    // Inherit current upgrade levels
    s.damage      = 15 + this.upgradeSystem.upgrades.archerDamage.level * 5;
    s.attackSpeed =  1 + this.upgradeSystem.upgrades.archerSpeed.level  * 0.2;
    this.soldiers.push(s);
    this._repositionSoldiers();
  }

  _repositionSoldiers() {
    const positions = this._soldierPositions(this.soldiers.length);
    for (let i = 0; i < this.soldiers.length; i++) {
      this.soldiers[i].x = positions[i].x;
      this.soldiers[i].y = positions[i].y;
    }
  }

  _soldierPositions(count) {
    const cx      = this.wallX + this.wallW / 2;
    const margin  = 50;
    const usable  = this.playH - margin * 2;
    const positions = [];
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      positions.push({ x: cx, y: margin + t * usable });
    }
    return positions;
  }

  // ── Input ───────────────────────────────────────────────────────────────────
  _setupInput() {
    this.canvas.addEventListener('click', e => {
      const r = this.canvas.getBoundingClientRect();
      this._handleClick(e.clientX - r.left, e.clientY - r.top);
    });

    window.addEventListener('resize', () => {
      this.canvas.width  = window.innerWidth;
      this.canvas.height = window.innerHeight;
      this.onResize();
    });
  }

  _handleClick(x, y) {
    if (this.gameOver) { this._restart(); return; }

    // Panel absorbs clicks on its area
    if (this.sidePanel.visible && x < this.sidePanel.width) {
      this.sidePanel.handleClick(x, y, this);
      return;
    }

    // Menu bar
    if (y > this.canvas.height - this.MENU_H) {
      for (const btn of this.menuButtons) {
        if (x >= btn.x && x <= btn.x + btn.w &&
            y >= btn.y && y <= btn.y + btn.h) {
          this.sidePanel.toggle(btn.id);
          return;
        }
      }
    }

    // Click elsewhere: close panel
    if (this.sidePanel.visible) this.sidePanel.close();
  }

  // ── Restart ─────────────────────────────────────────────────────────────────
  _restart() {
    this._computeLayout();
    this.wall         = new Wall(this.wallX, 0, this.wallW, this.playH);
    this.monsters     = [];
    this.soldiers     = [];
    this.projectiles  = [];
    this.economy      = new Economy(50);
    this.upgradeSystem = new UpgradeSystem(this.economy);
    this.waveManager  = new WaveManager();
    this.addArcherCost = 100;
    this.gameOver     = false;
    this.buildings    = { kaserne: 0, schmiede: 0, magierturm: 0 };
    this.catapults    = [];
    this.schmiede_mult = 1.0;
    this.deathEffects = [];
    this.floatingTexts = [];
    this.sidePanel.close();
    this.addArcher();
    this.addArcher();
  }

  // ── Spawning ─────────────────────────────────────────────────────────────────
  _spawnMonster(type, hpMult) {
    const y = 40 + Math.random() * (this.playH - 80);
    this.monsters.push(new Monster(type, this.canvas.width + 30, y, hpMult));
  }

  // ── Update ───────────────────────────────────────────────────────────────────
  update(dt) {
    if (this.gameOver) return;

    // Safety clamp — prevents spiral of death on tab switch
    dt = Math.min(dt, 0.05);

    this.economy.update(dt);

    // Wave manager
    this.waveManager.update(
      dt,
      this.monsters,
      (type, hpMult) => this._spawnMonster(type, hpMult),
      (wave) => {
        this.waveAnnounce      = `WELLE ${wave}`;
        this.waveAnnounceTimer = 2.5;
      }
    );

    // Monsters
    for (const m of this.monsters) {
      m.update(dt, this.wallFaceX);
      const dmg = m.getWallDamage();
      if (dmg > 0) {
        const dead = this.wall.takeDamage(dmg);
        this.wallFlash = 0.25;
        if (dead) { this.gameOver = true; return; }
      }
    }

    // Collect gold from newly-dead monsters, spawn death effects
    const alive = [];
    for (const m of this.monsters) {
      if (m.dead) {
        this.economy.addGold(m.goldReward);
        this.deathEffects.push({ x: m.x, y: m.y, r: m.radius, alpha: 1, color: m.color });
        this.floatingTexts.push({ x: m.x, y: m.y - m.radius - 4, text: `+${m.goldReward}g`, life: 1.4 });
      } else {
        alive.push(m);
      }
    }
    this.monsters = alive;

    // Soldiers
    for (const s of this.soldiers) {
      s.update(dt, this.monsters, (soldier, target) => {
        this.projectiles.push(new Projectile(soldier.x, soldier.y, target, soldier.damage));
      });
    }

    // Projectiles
    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter(p => !p.hit);

    // Catapults — fire AoE every 5 seconds
    for (const cat of this.catapults) {
      cat.timer -= dt;
      if (cat.timer <= 0) {
        cat.timer = 5;
        let hits = 0;
        for (const m of this.monsters) {
          if (!m.dead) { m.takeDamage(60); hits++; }
        }
        if (hits > 0) {
          this.floatingTexts.push({
            x: this.canvas.width * 0.6,
            y: this.playH * 0.4,
            text: '💥 Katapult!',
            life: 1.2,
          });
        }
      }
    }

    // Visual FX decay
    for (const e of this.deathEffects)   { e.r += 35 * dt; e.alpha -= 2.5 * dt; }
    for (const t of this.floatingTexts)  { t.y -= 22 * dt; t.life  -= dt; }
    this.deathEffects  = this.deathEffects.filter(e => e.alpha > 0);
    this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);

    if (this.wallFlash > 0) this.wallFlash -= dt;
    if (this.waveAnnounceTimer > 0) this.waveAnnounceTimer -= dt;
  }

  // ── Spells ───────────────────────────────────────────────────────────────────
  castFireball() {
    if (!this.economy.spendMana(30)) return;
    let hits = 0;
    for (const m of this.monsters) {
      if (!m.dead) { m.takeDamage(80); hits++; }
    }
    if (hits > 0) {
      this.floatingTexts.push({ x: this.canvas.width / 2, y: this.playH * 0.35, text: '🔥 Feuerball!', life: 1.4 });
    }
  }

  castEisblitz() {
    if (!this.economy.spendMana(50)) return;
    let hits = 0;
    for (const m of this.monsters) {
      if (!m.dead) {
        if (m.applySlowed) m.applySlowed(5);
        hits++;
      }
    }
    if (hits > 0) {
      this.floatingTexts.push({ x: this.canvas.width / 2, y: this.playH * 0.35, text: '❄ Eisblitz!', life: 1.4 });
    }
  }

  // ── Draw ─────────────────────────────────────────────────────────────────────
  draw() {
    const { ctx, canvas } = this;

    // ── Background ───────────────────────────────────────────────────────────
    // Sky (attack field right side)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.playH);
    skyGrad.addColorStop(0, '#0e0e2a');
    skyGrad.addColorStop(1, '#1c0e2e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, this.playH);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (const [sx, sy] of STARS) {
      if (sx < canvas.width && sy < this.playH) {
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Building area (left of wall) — darker overlay
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, this.wallX, this.playH);

    // Ground strip
    ctx.fillStyle = '#2a1d0c';
    ctx.fillRect(0, this.playH - 10, canvas.width, 10);
    ctx.fillStyle = '#3a2c14';
    ctx.fillRect(0, this.playH - 10, canvas.width, 3);

    // Placeholder buildings behind wall
    this._drawBuildings(ctx);

    // ── Wall flash ───────────────────────────────────────────────────────────
    if (this.wallFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.55, this.wallFlash * 2.2);
      ctx.fillStyle   = '#ff2020';
      ctx.fillRect(this.wallX - 6, 0, this.wallW + 12, this.playH);
      ctx.restore();
    }

    // ── Wall ─────────────────────────────────────────────────────────────────
    this.wall.draw(ctx);

    // ── Death effects ────────────────────────────────────────────────────────
    for (const e of this.deathEffects) {
      ctx.save();
      ctx.globalAlpha   = Math.max(0, e.alpha);
      ctx.strokeStyle   = e.color;
      ctx.lineWidth     = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // ── Monsters ─────────────────────────────────────────────────────────────
    for (const m of this.monsters) m.draw(ctx);

    // ── Soldiers ─────────────────────────────────────────────────────────────
    for (const s of this.soldiers) s.draw(ctx);

    // ── Projectiles ──────────────────────────────────────────────────────────
    for (const p of this.projectiles) p.draw(ctx);

    // ── Floating gold text ───────────────────────────────────────────────────
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.life);
      ctx.fillStyle   = '#f0c030';
      ctx.font        = 'bold 13px sans-serif';
      ctx.textAlign   = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    // ── HUD ──────────────────────────────────────────────────────────────────
    this._drawHUD(ctx, canvas);

    // ── Menu bar ─────────────────────────────────────────────────────────────
    this._drawMenuBar(ctx, canvas);

    // ── Side panel ───────────────────────────────────────────────────────────
    this.sidePanel.draw(ctx, canvas, this);

    // ── Wave announcement ────────────────────────────────────────────────────
    if (this.waveAnnounceTimer > 0) this._drawWaveAnnounce(ctx, canvas);

    // ── Game over ────────────────────────────────────────────────────────────
    if (this.gameOver) this._drawGameOver(ctx, canvas);
  }

  // ── Placeholder buildings ────────────────────────────────────────────────────
  _drawBuildings(ctx) {
    const bldgs = [
      { x: this.wallX - 70,  y: this.playH - 72, w: 48, h: 62, color: '#7a5820', roof: '#4a2c08' },
      { x: this.wallX - 148, y: this.playH - 88, w: 58, h: 78, color: '#5e4218', roof: '#3a2008' },
      { x: this.wallX - 230, y: this.playH - 60, w: 42, h: 50, color: '#8a6428', roof: '#5a3a10' },
    ];
    for (const b of bldgs) {
      if (b.x < 0) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // Roof
      ctx.fillStyle = b.roof;
      ctx.beginPath();
      ctx.moveTo(b.x - 5, b.y);
      ctx.lineTo(b.x + b.w + 5, b.y);
      ctx.lineTo(b.x + b.w / 2, b.y - 18);
      ctx.closePath();
      ctx.fill();
      // Door
      ctx.fillStyle = '#1a0c00';
      ctx.fillRect(b.x + b.w / 2 - 7, b.y + b.h - 22, 14, 22);
      // Window
      ctx.fillStyle = 'rgba(240,210,100,0.7)';
      ctx.fillRect(b.x + 8, b.y + 14, 10, 9);
    }
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────
  _drawHUD(ctx, canvas) {
    // Gold box
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 138, 38, 8);
    ctx.fill();
    ctx.fillStyle = '#f0c030';
    ctx.font = 'bold 19px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`💰  ${Math.floor(this.economy.gold)} g`, 20, 35);

    // Mana bar (top-left, below gold)
    const manaBarW = 120;
    const manaBarH = 8;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(14, 54, manaBarW, manaBarH, 3);
    ctx.fill();
    ctx.fillStyle = '#4080ff';
    ctx.beginPath();
    ctx.roundRect(14, 54, manaBarW * (this.economy.mana / this.economy.maxMana), manaBarH, 3);
    ctx.fill();
    ctx.fillStyle = '#aac0ff';
    ctx.font = '9px monospace';
    ctx.fillText(`✨ ${Math.floor(this.economy.mana)} / ${this.economy.maxMana}`, 14, 74);

    // Wave box (top-right)
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - 155, 10, 145, 58, 8);
    ctx.fill();

    ctx.fillStyle = '#e8c040';
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Wave: ${this.waveManager.wave}`, canvas.width - 14, 32);

    const nw = this.waveManager.timeToNextWave;
    if (nw > 0) {
      ctx.fillStyle = '#9ab';
      ctx.font = '12px sans-serif';
      ctx.fillText(`Next wave: ${Math.ceil(nw)}s`, canvas.width - 14, 52);
    } else {
      ctx.fillStyle = '#ff7766';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⚔  INCOMING!', canvas.width - 14, 52);
    }
  }

  // ── Menu bar ─────────────────────────────────────────────────────────────────
  _drawMenuBar(ctx, canvas) {
    const barY = canvas.height - this.MENU_H;

    // Background
    ctx.fillStyle = '#0a0e18';
    ctx.fillRect(0, barY, canvas.width, this.MENU_H);
    ctx.strokeStyle = '#1e3050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, barY);
    ctx.lineTo(canvas.width, barY);
    ctx.stroke();

    const items = [
      { id: 'upgrades', label: '⚔ Upgrades' },
      { id: 'gebaeude', label: '🏰 Gebäude' },
      { id: 'mauer',    label: '🧱 Mauer'   },
      { id: 'zauber',   label: '✨ Zauber'  },
      { id: 'maschine', label: '⚙ Maschine'},
    ];

    const btnW  = Math.min(145, Math.floor((canvas.width - 30) / items.length - 8));
    const btnH  = this.MENU_H - 16;
    const totalW = items.length * btnW + (items.length - 1) * 8;
    let bx = Math.floor((canvas.width - totalW) / 2);
    const by = barY + 8;

    this.menuButtons = [];
    for (const item of items) {
      const active = this.sidePanel.activePanel === item.id;

      ctx.fillStyle = active ? '#163060' : 'rgba(18,26,48,0.9)';
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 6);
      ctx.fill();

      ctx.strokeStyle = active ? '#4080c0' : '#1e3050';
      ctx.lineWidth   = active ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(bx, by, btnW, btnH, 6);
      ctx.stroke();

      ctx.fillStyle = active ? '#e8eeff' : '#8090a8';
      ctx.font      = `${canvas.width < 800 ? 10 : 12}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(item.label, bx + btnW / 2, by + btnH / 2 + 5);

      this.menuButtons.push({ x: bx, y: by, w: btnW, h: btnH, id: item.id });
      bx += btnW + 8;
    }
  }

  // ── Wave announcement ────────────────────────────────────────────────────────
  _drawWaveAnnounce(ctx, canvas) {
    const alpha = Math.min(1, this.waveAnnounceTimer * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;

    const bw = 280, bh = 70;
    const bx = canvas.width / 2 - bw / 2;
    const by = this.playH / 2 - bh / 2 - 20;

    ctx.fillStyle = 'rgba(160,30,30,0.88)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 10);
    ctx.fill();
    ctx.strokeStyle = '#ff6050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 10);
    ctx.stroke();

    ctx.fillStyle   = '#fff';
    ctx.font        = 'bold 34px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText(this.waveAnnounce, canvas.width / 2, by + bh / 2 + 12);

    ctx.restore();
  }

  // ── Game over ────────────────────────────────────────────────────────────────
  _drawGameOver(ctx, canvas) {
    ctx.fillStyle = 'rgba(0,0,0,0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const bw = 420, bh = 280;

    ctx.fillStyle = '#0e141e';
    ctx.beginPath();
    ctx.roundRect(cx - bw/2, cy - bh/2, bw, bh, 16);
    ctx.fill();
    ctx.strokeStyle = '#c03020';
    ctx.lineWidth   = 3;
    ctx.beginPath();
    ctx.roundRect(cx - bw/2, cy - bh/2, bw, bh, 16);
    ctx.stroke();

    ctx.fillStyle   = '#e84030';
    ctx.font        = 'bold 50px sans-serif';
    ctx.textAlign   = 'center';
    ctx.fillText('GAME  OVER', cx, cy - 60);

    ctx.fillStyle = '#e8c040';
    ctx.font      = 'bold 26px sans-serif';
    ctx.fillText(`Wave Reached:  ${this.waveManager.wave}`, cx, cy - 10);

    ctx.fillStyle = '#889';
    ctx.font      = '16px sans-serif';
    ctx.fillText(`Gold remaining:  ${Math.floor(this.economy.gold)} g`, cx, cy + 28);

    // Play Again button
    const pbx = cx - 90, pby = cy + 58, pbw = 180, pbh = 48;
    ctx.fillStyle   = 'rgba(30,120,60,0.9)';
    ctx.beginPath();
    ctx.roundRect(pbx, pby, pbw, pbh, 10);
    ctx.fill();
    ctx.strokeStyle = '#40c060';
    ctx.lineWidth   = 2;
    ctx.beginPath();
    ctx.roundRect(pbx, pby, pbw, pbh, 10);
    ctx.stroke();
    ctx.fillStyle   = '#fff';
    ctx.font        = 'bold 20px sans-serif';
    ctx.fillText('▶  Play Again', cx, pby + pbh / 2 + 7);
  }
}
