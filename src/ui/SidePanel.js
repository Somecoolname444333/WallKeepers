class SidePanel {
  constructor() {
    this.activePanel = null;
    this.visible     = false;
    this.width       = 260;
    this._buttons    = {}; // populated each draw call
  }

  toggle(name) {
    if (this.activePanel === name) {
      this.activePanel = null;
      this.visible     = false;
    } else {
      this.activePanel = name;
      this.visible     = true;
    }
  }

  close() {
    this.activePanel = null;
    this.visible     = false;
  }

  // ── Main draw entry ────────────────────────────────────────────────────────
  draw(ctx, canvas, game) {
    if (!this.visible) return;

    this.width = Math.min(270, Math.floor(canvas.width * 0.22));
    this._buttons = {};

    const h = canvas.height;

    // Background
    ctx.fillStyle = 'rgba(10, 15, 30, 0.96)';
    ctx.fillRect(0, 0, this.width, h);
    ctx.strokeStyle = '#2a4a7a';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, this.width, h);

    // Title
    ctx.fillStyle = '#e8c040';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';

    const titles = {
      upgrades: '⚔  UPGRADES',
      gebaeude: '🏰  GEBÄUDE',
      mauer:    '🧱  MAUER',
      zauber:   '✨  ZAUBER',
      maschine: '⚙  MASCHINE',
    };
    ctx.fillText(titles[this.activePanel] || '', this.width / 2, 34);

    // Divider
    ctx.strokeStyle = '#2a4a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(10, 44);
    ctx.lineTo(this.width - 10, 44);
    ctx.stroke();

    // Panel content
    switch (this.activePanel) {
      case 'upgrades': this._drawUpgrades(ctx, game); break;
      case 'mauer':    this._drawMauer(ctx, game);    break;
      default:         this._drawComingSoon(ctx);      break;
    }
  }

  _drawComingSoon(ctx) {
    ctx.fillStyle = '#556';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Coming soon...', this.width / 2, 80);
  }

  // ── Upgrades panel ─────────────────────────────────────────────────────────
  _drawUpgrades(ctx, game) {
    const { upgradeSystem: us, economy, soldiers } = game;
    const btnX = 10;
    const btnW = this.width - 20;
    let y = 56;

    // Stat summary
    const s = soldiers[0];
    ctx.fillStyle = '#778899';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    if (s) {
      ctx.fillText(
        `Archers: ${soldiers.length}   DMG: ${s.damage}   SPD: ${s.attackSpeed.toFixed(1)}/s`,
        btnX, y - 4
      );
    }

    // Archer Damage
    const dmgUp = us.upgrades.archerDamage;
    this._drawBtn(ctx, btnX, y, btnW, 62, {
      key:       'archerDamage',
      title:     '⬆ Archer Damage  +5',
      desc:      `Current: ${s ? s.damage : 15} dmg`,
      level:     dmgUp.level,
      maxLevel:  dmgUp.maxLevel,
      cost:      us.getCost('archerDamage'),
      canAfford: economy.canAfford(us.getCost('archerDamage')) && dmgUp.level < dmgUp.maxLevel,
    });
    y += 72;

    // Archer Speed
    const spdUp = us.upgrades.archerSpeed;
    this._drawBtn(ctx, btnX, y, btnW, 62, {
      key:       'archerSpeed',
      title:     '⬆ Archer Speed  +0.2/s',
      desc:      `Current: ${s ? s.attackSpeed.toFixed(1) : '1.0'} shots/s`,
      level:     spdUp.level,
      maxLevel:  spdUp.maxLevel,
      cost:      us.getCost('archerSpeed'),
      canAfford: economy.canAfford(us.getCost('archerSpeed')) && spdUp.level < spdUp.maxLevel,
    });
    y += 72;

    // Add Archer
    const archerCost = game.addArcherCost;
    this._drawBtn(ctx, btnX, y, btnW, 62, {
      key:       'addArcher',
      title:     '+ Add Archer',
      desc:      `Total archers: ${soldiers.length}`,
      level:     soldiers.length - 2,
      maxLevel:  10,
      cost:      archerCost,
      canAfford: economy.canAfford(archerCost) && soldiers.length < 12,
    });
  }

  // ── Mauer panel ────────────────────────────────────────────────────────────
  _drawMauer(ctx, game) {
    const { wall, economy } = game;
    const btnX = 10;
    const btnW = this.width - 20;
    let y = 56;

    ctx.fillStyle = '#778899';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${Math.ceil(wall.hp)} / ${wall.maxHp}`, btnX, y - 4);

    this._drawBtn(ctx, btnX, y, btnW, 62, {
      key:       'repairWall',
      title:     '🔧 Repair Wall  +50 HP',
      desc:      `Current: ${Math.ceil(wall.hp)} / ${wall.maxHp}`,
      level:     0,
      maxLevel:  99,
      cost:      20,
      canAfford: economy.canAfford(20) && wall.hp < wall.maxHp,
    });
    y += 72;

    this._drawBtn(ctx, btnX, y, btnW, 62, {
      key:       'reinforceWall',
      title:     '🛡 Reinforce Wall  +100 HP',
      desc:      `Max HP: ${wall.maxHp}`,
      level:     0,
      maxLevel:  99,
      cost:      40,
      canAfford: economy.canAfford(40),
    });
  }

  // ── Generic button renderer ─────────────────────────────────────────────────
  _drawBtn(ctx, x, y, w, h, data) {
    const { key, title, desc, level, maxLevel, cost, canAfford } = data;

    ctx.fillStyle = canAfford ? 'rgba(30,60,110,0.85)' : 'rgba(28,28,38,0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = canAfford ? '#3a7ac4' : '#333344';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.stroke();

    ctx.fillStyle = canAfford ? '#e8e8f0' : '#555566';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 19);

    ctx.fillStyle = '#8899aa';
    ctx.font = '11px sans-serif';
    ctx.fillText(desc, x + 10, y + 34);

    ctx.fillStyle = '#556677';
    ctx.fillText(`Lv ${level} / ${maxLevel}`, x + 10, y + 50);

    ctx.fillStyle = canAfford ? '#f0c030' : '#555566';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${cost} g`, x + w - 10, y + 34);

    this._buttons[key] = { x, y, w, h };
  }

  // ── Click handling ─────────────────────────────────────────────────────────
  handleClick(cx, cy, game) {
    if (!this.visible) return false;
    if (cx > this.width) return false;

    for (const [key, btn] of Object.entries(this._buttons)) {
      if (cx >= btn.x && cx <= btn.x + btn.w &&
          cy >= btn.y && cy <= btn.y + btn.h) {
        this._activate(key, game);
        return true;
      }
    }
    return true; // absorbed by panel
  }

  _activate(key, game) {
    const { upgradeSystem: us, economy, soldiers, wall } = game;

    switch (key) {
      case 'archerDamage':
        us.buy('archerDamage', () => soldiers.forEach(s => s.damage += 5));
        break;

      case 'archerSpeed':
        us.buy('archerSpeed', () => soldiers.forEach(s => s.attackSpeed += 0.2));
        break;

      case 'addArcher':
        if (soldiers.length < 12 && economy.spend(game.addArcherCost)) {
          game.addArcher();
          game.addArcherCost = Math.round(game.addArcherCost * 1.5);
        }
        break;

      case 'repairWall':
        if (wall.hp < wall.maxHp && economy.spend(20)) wall.repair(50);
        break;

      case 'reinforceWall':
        if (economy.spend(40)) wall.reinforce(100);
        break;
    }
  }
}
