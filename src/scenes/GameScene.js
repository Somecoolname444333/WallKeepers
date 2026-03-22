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
    this.wall        = new Wall(this.wallX, 0, this.wallW, this.playH);
    this.monsters    = [];
    this.soldiers    = [];
    this.projectiles = [];

    // Systems
    this.economy       = new Economy(50);
    this.upgradeSystem = new UpgradeSystem(this.economy);
    this.waveManager   = new WaveManager();
    this.sidePanel     = new SidePanel();

    // UI state
    this.menuButtons   = [];
    this.addArcherCost = 100;
    this.gameOver      = false;

    // Buildings & machines
    this.buildings     = { kaserne: 0, schmiede: 0, magierturm: 0 };
    this.catapults     = [];
    this.schmiede_mult = 1.0;

    // Visual FX
    this.wallFlash         = 0;     // red flash timer
    this.wallShake         = 0;     // wall shake timer
    this.deathEffects      = [];    // expanding rings
    this.floatingTexts     = [];    // +Xg / spell popups
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
    s.damage      = 15 + this.upgradeSystem.upgrades.archerDamage.level * 5;
    s.attackSpeed =  1 + this.upgradeSystem.upgrades.archerSpeed.level  * 0.2;
    // Apply schmiede bonus
    if (this.schmiede_mult > 1) s.damage = Math.round(s.damage * this.schmiede_mult);
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
    this.wall          = new Wall(this.wallX, 0, this.wallW, this.playH);
    this.monsters      = [];
    this.soldiers      = [];
    this.projectiles   = [];
    this.economy       = new Economy(50);
    this.upgradeSystem = new UpgradeSystem(this.economy);
    this.waveManager   = new WaveManager();
    this.addArcherCost = 100;
    this.gameOver      = false;
    this.buildings     = { kaserne: 0, schmiede: 0, magierturm: 0 };
    this.catapults     = [];
    this.schmiede_mult = 1.0;
    this.deathEffects  = [];
    this.floatingTexts = [];
    this.wallFlash     = 0;
    this.wallShake     = 0;
    this.waveAnnounce  = null;
    this.waveAnnounceTimer = 0;
    this.sidePanel.close();
    this.addArcher();
    this.addArcher();
  }

  // ── Spawning ─────────────────────────────────────────────────────────────────
  _spawnMonster(type, hpMult) {
    // Stagger Y into formation tiers based on wave number
    const tiers = Math.min(5, 2 + Math.floor(this.waveManager.wave / 3));
    const tier  = Math.floor(Math.random() * tiers);
    const margin = 50;
    const spacing = (this.playH - margin * 2) / (tiers - 1 || 1);
    const baseY  = margin + tier * spacing;
    const jitter = (Math.random() - 0.5) * 20;
    const y = Math.max(30, Math.min(this.playH - 30, baseY + jitter));
    this.monsters.push(new Monster(type, this.canvas.width + 30, y, hpMult));
  }

  // ── Update ───────────────────────────────────────────────────────────────────
  update(dt) {
    if (this.gameOver) return;

    // Safety clamp
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
        this.wallShake = 0.3;
        if (dead) { this.gameOver = true; return; }
      }
    }

    // Collect gold from dead monsters, spawn death effects
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
    for (const e of this.deathEffects)  { e.r += 35 * dt; e.alpha -= 2.5 * dt; }
    for (const t of this.floatingTexts) { t.y -= 22 * dt; t.life  -= dt; }
    this.deathEffects  = this.deathEffects.filter(e => e.alpha > 0);
    this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);

    if (this.wallFlash > 0) this.wallFlash -= dt;
    if (this.wallShake > 0) this.wallShake -= dt;
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
      if (!m.dead && m.applySlowed) { m.applySlowed(5); hits++; }
    }
    if (hits > 0) {
      this.floatingTexts.push({ x: this.canvas.width / 2, y: this.playH * 0.35, text: '❄ Eisblitz!', life: 1.4 });
    }
  }

  // ── Draw ─────────────────────────────────────────────────────────────────────
  draw() {
    const { ctx, canvas } = this;

    // ── Background ───────────────────────────────────────────────────────────
    // Sky gradient (dark blue → deep purple at horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, this.playH);
    skyGrad.addColorStop(0,   '#080820');
    skyGrad.addColorStop(0.6, '#0e0e2a');
    skyGrad.addColorStop(1,   '#2a0e3a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, this.playH);

    // Stars
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    for (const [sx, sy] of STARS) {
      if (sx < canvas.width && sy < this.playH) {
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Ground strip (grass + dirt)
    const groundY = this.playH - 18;
    ctx.fillStyle = '#1a2e0a';
    ctx.fillRect(0, groundY, canvas.width, 18);
    ctx.fillStyle = '#243810';
    ctx.fillRect(0, groundY, canvas.width, 5);

    // Building area (left of wall) — darker night overlay
    ctx.fillStyle = 'rgba(0,0,0,0.40)';
    ctx.fillRect(0, 0, this.wallX, this.playH);

    // Village silhouette behind wall
    this._drawVillage(ctx);

    // ── Wall flash overlay ────────────────────────────────────────────────────
    if (this.wallFlash > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.55, this.wallFlash * 2.2);
      ctx.fillStyle   = '#ff2020';
      ctx.fillRect(this.wallX - 6, 0, this.wallW + 12, this.playH);
      ctx.restore();
    }

    // ── Wall (with shake offset) ──────────────────────────────────────────────
    const shakeOff = this.wallShake > 0
      ? Math.sin(this.wallShake * 80) * 3 * (this.wallShake / 0.3)
      : 0;
    ctx.save();
    ctx.translate(shakeOff, 0);
    this.wall.draw(ctx);
    ctx.restore();

    // ── Death effects ─────────────────────────────────────────────────────────
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

    // ── Monsters ──────────────────────────────────────────────────────────────
    for (const m of this.monsters) m.draw(ctx);

    // ── Soldiers ──────────────────────────────────────────────────────────────
    for (const s of this.soldiers) s.draw(ctx);

    // ── Projectiles ───────────────────────────────────────────────────────────
    for (const p of this.projectiles) p.draw(ctx);

    // ── Floating texts ────────────────────────────────────────────────────────
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, t.life);
      ctx.fillStyle   = '#f0c030';
      ctx.font        = 'bold 13px sans-serif';
      ctx.textAlign   = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur  = 4;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    // ── HUD ───────────────────────────────────────────────────────────────────
    this._drawHUD(ctx, canvas);

    // ── Menu bar ──────────────────────────────────────────────────────────────
    this._drawMenuBar(ctx, canvas);

    // ── Side panel ────────────────────────────────────────────────────────────
    this.sidePanel.draw(ctx, canvas, this);

    // ── Wave announcement ─────────────────────────────────────────────────────
    if (this.waveAnnounceTimer > 0) this._drawWaveAnnounce(ctx, canvas);

    // ── Game over ─────────────────────────────────────────────────────────────
    if (this.gameOver) this._drawGameOver(ctx, canvas);
  }

  // ── Village silhouette ───────────────────────────────────────────────────────
  _drawVillage(ctx) {
    // Rooftop silhouettes (dark rectangles = village skyline)
    const roofs = [
      { x: this.wallX - 70,  y: this.playH - 72, w: 48, h: 62, color: '#5a3e18', roof: '#3a2008' },
      { x: this.wallX - 148, y: this.playH - 98, w: 58, h: 88, color: '#4a3215', roof: '#2c1808' },
      { x: this.wallX - 230, y: this.playH - 60, w: 42, h: 50, color: '#6a4a20', roof: '#482e0e' },
      { x: this.wallX - 310, y: this.playH - 50, w: 36, h: 40, color: '#504025', roof: '#352810' },
    ];
    for (const b of roofs) {
      if (b.x + b.w < 0) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      // Triangular roof
      ctx.fillStyle = b.roof;
      ctx.beginPath();
      ctx.moveTo(b.x - 4, b.y);
      ctx.lineTo(b.x + b.w + 4, b.y);
      ctx.lineTo(b.x + b.w / 2, b.y - 20);
      ctx.closePath();
      ctx.fill();
      // Door
      ctx.fillStyle = '#100800';
      ctx.fillRect(b.x + b.w / 2 - 7, b.y + b.h - 22, 14, 22);
      // Lit window
      ctx.fillStyle = 'rgba(240,210,80,0.6)';
      ctx.fillRect(b.x + 8, b.y + 14, 10, 9);
    }
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  _drawHUD(ctx, canvas) {
    // Gold box (top-left)
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 148, 38, 8);
    ctx.fill();
    ctx.fillStyle = '#f0c030';
    ctx.font = 'bold 19px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`💰  ${Math.floor(this.economy.gold)} g`, 20, 35);

    // Mana bar (below gold)
    const manaBarW = 128;
    const manaBarH = 10;
    const manaFill = this.economy.mana / this.economy.maxMana;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(14, 54, manaBarW, manaBarH, 4);
    ctx.fill();
    // Mana gradient fill
    const manaGrad = ctx.createLinearGradient(14, 0, 14 + manaBarW, 0);
    manaGrad.addColorStop(0, '#2055cc');
    manaGrad.addColorStop(1, '#60aaff');
    ctx.fillStyle = manaGrad;
    ctx.beginPath();
    ctx.roundRect(14, 54, manaBarW * manaFill, manaBarH, 4);
    ctx.fill();
    ctx.strokeStyle = '#1840aa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(14, 54, manaBarW, manaBarH, 4);
    ctx.stroke();
    ctx.fillStyle = '#aac8ff';
    ctx.font = '9px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`✨ ${Math.floor(this.economy.mana)} / ${this.economy.maxMana} mana`, 14, 76);

    // Wave box (top-right)
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.beginPath();
    ctx.roundRect(canvas.width - 160, 10, 150, 58, 8);
    ctx.fill();

    ctx.fillStyle = '#e8c040';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⚔ Welle: ${this.waveManager.wave}`, canvas.width - 14, 35);

    const nw = this.waveManager.timeToNextWave;
    if (nw > 0) {
      // Wave timer countdown bar
      const barW = 130, barH = 6;
      const barX = canvas.width - 144;
      const barY = 44;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 2);
      ctx.fill();
      const progress = 1 - nw / this.waveManager.waveInterval;
      ctx.fillStyle = `hsl(${Math.floor(120 - progress * 120)}, 80%, 50%)`;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * progress, barH, 2);
      ctx.fill();
      ctx.fillStyle = '#9ab';
      ctx.font = '11px sans-serif';
      ctx.fillText(`Nächste Welle: ${Math.ceil(nw)}s`, canvas.width - 14, 62);
    } else {
      ctx.fillStyle = '#ff7766';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('⚔  ANGRIFF!', canvas.width - 14, 58);
    }
  }

  // ── Menu bar ─────────────────────────────────────────────────────────────────
  _drawMenuBar(ctx, canvas) {
    const barY = canvas.height - this.MENU_H;

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

  // ── Wave announcement ─────────────────────────────────────────────────────────
  _drawWaveAnnounce(ctx, canvas) {
    const alpha = Math.min(1, this.waveAnnounceTimer * 1.4);
    ctx.save();
    ctx.globalAlpha = alpha;

    const bw = 300, bh = 80;
    const bx = canvas.width / 2 - bw / 2;
    const by = this.playH / 2 - bh / 2 - 20;

    // Glow effect
    ctx.shadowColor = '#ff4040';
    ctx.shadowBlur  = 20;
    ctx.fillStyle = 'rgba(160,25,25,0.92)';
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#ff6050';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.stroke();

    ctx.fillStyle   = '#fff';
    ctx.font        = 'bold 38px sans-serif';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#ff2020';
    ctx.shadowBlur  = 8;
    ctx.fillText(this.waveAnnounce, canvas.width / 2, by + bh / 2 + 13);

    ctx.restore();
  }

  // ── Game over ─────────────────────────────────────────────────────────────────
  _drawGameOver(ctx, canvas) {
    ctx.fillStyle = 'rgba(0,0,0,0.80)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width  / 2;
    const cy = canvas.height / 2;
    const bw = 440, bh = 300;

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
    ctx.font        = 'bold 52px sans-serif';
    ctx.textAlign   = 'center';
    ctx.shadowColor = '#ff2020';
    ctx.shadowBlur  = 16;
    ctx.fillText('GAME  OVER', cx, cy - 70);
    ctx.shadowBlur  = 0;

    ctx.fillStyle = '#e8c040';
    ctx.font      = 'bold 26px sans-serif';
    ctx.fillText(`Welle ${this.waveManager.wave} erreicht`, cx, cy - 16);

    ctx.fillStyle = '#889';
    ctx.font      = '16px sans-serif';
    ctx.fillText(`Gold übrig: ${Math.floor(this.economy.gold)} g`, cx, cy + 22);

    // Play Again button
    const pbx = cx - 100, pby = cy + 58, pbw = 200, pbh = 50;
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
    ctx.fillText('▶  Nochmal spielen', cx, pby + pbh / 2 + 7);
  }
}
