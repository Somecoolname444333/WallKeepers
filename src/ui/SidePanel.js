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
      case 'gebaeude': this._drawGebaeude(ctx, game); break;
      case 'zauber':   this._drawZauber(ctx, game);   break;
      case 'maschine': this._drawMaschine(ctx, game); break;
    }
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
        `Bogenschützen: ${soldiers.length}   DMG: ${s.damage}   SPD: ${s.attackSpeed.toFixed(1)}/s`,
        btnX, y - 4
      );
    }

    // Archer Damage
    const dmgUp = us.upgrades.archerDamage;
    this._drawBtn(ctx, btnX, y, btnW, 62, {
      key:       'archerDamage',
      title:     '⬆ Bogenschütze Schaden +5',
      desc:      `Aktuell: ${s ? s.damage : 15} Schaden`,
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
      title:     '⬆ Bogenschütze Tempo +0.2/s',
      desc:      `Aktuell: ${s ? s.attackSpeed.toFixed(1) : '1.0'} Schuss/s`,
      level:     spdUp.level,
      maxLevel:  spdUp.maxLevel,
      cost:      us.getCost('archerSpeed'),
      canAfford: economy.canAfford(us.getCost('archerSpeed')) && spdUp.level < spdUp.maxLevel,
    });
    y += 72;

    // Add Archer
    const archerCost = game.addArcherCost;
    const maxArchers = 12 + (game.buildings ? game.buildings.kaserne * 1 : 0);
    this._drawBtn(ctx, btnX, y, btnW, 62, {
      key:       'addArcher',
      title:     '+ Bogenschützen +1',
      desc:      `Gesamt: ${soldiers.length} / ${maxArchers}`,
      level:     soldiers.length - 2,
      maxLevel:  maxArchers - 2,
      cost:      archerCost,
      canAfford: economy.canAfford(archerCost) && soldiers.length < maxArchers,
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
      title:     '🔧 Mauer reparieren +50 HP',
      desc:      `Aktuell: ${Math.ceil(wall.hp)} / ${wall.maxHp}`,
      level:     0,
      maxLevel:  99,
      cost:      20,
      canAfford: economy.canAfford(20) && wall.hp < wall.maxHp,
    });
    y += 72;

    this._drawBtn(ctx, btnX, y, btnW, 62, {
      key:       'reinforceWall',
      title:     '🛡 Mauer verstärken +100 HP',
      desc:      `Max HP: ${wall.maxHp}`,
      level:     0,
      maxLevel:  99,
      cost:      40,
      canAfford: economy.canAfford(40),
    });
  }

  // ── Gebäude panel ──────────────────────────────────────────────────────────
  _drawGebaeude(ctx, game) {
    const { economy, buildings } = game;
    const btnX = 10;
    const btnW = this.width - 20;
    let y = 56;

    const bldgs = [
      {
        key:   'buildKaserne',
        title: '🏠 Kaserne',
        desc:  `+1 Bogenschützen-Slot  (${buildings.kaserne} gebaut)`,
        cost:  150,
        canBuy: economy.canAfford(150),
      },
      {
        key:   'buildSchmiede',
        title: '⚒ Schmiede',
        desc:  `+10% Bogenschütze Schaden  (${buildings.schmiede} gebaut)`,
        cost:  200,
        canBuy: economy.canAfford(200),
      },
      {
        key:   'buildMagierturm',
        title: '🔮 Magierturm',
        desc:  `+2 Mana/sec  (${buildings.magierturm} gebaut)`,
        cost:  300,
        canBuy: economy.canAfford(300),
      },
    ];

    for (const b of bldgs) {
      this._drawBuildBtn(ctx, btnX, y, btnW, 62, b);
      y += 72;
    }
  }

  // ── Zauber panel ───────────────────────────────────────────────────────────
  _drawZauber(ctx, game) {
    const { economy } = game;
    const btnX = 10;
    const btnW = this.width - 20;
    let y = 56;

    // Mana bar display
    const manaBarW = btnW;
    const manaBarH = 16;
    const manaFill = economy.mana / economy.maxMana;

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(btnX, y, manaBarW, manaBarH, 3);
    ctx.fill();

    ctx.fillStyle = '#4080ff';
    ctx.beginPath();
    ctx.roundRect(btnX, y, manaBarW * manaFill, manaBarH, 3);
    ctx.fill();

    ctx.strokeStyle = '#2050aa';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(btnX, y, manaBarW, manaBarH, 3);
    ctx.stroke();

    ctx.fillStyle = '#cce0ff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`✨ Mana: ${Math.floor(economy.mana)} / ${economy.maxMana}`, btnX + manaBarW / 2, y + 11);
    y += 26;

    // Feuerball
    this._drawSpellBtn(ctx, btnX, y, btnW, 62, {
      key:       'spellFireball',
      title:     '🔥 Feuerball',
      desc:      '80 Schaden an alle Monster',
      manaCost:  30,
      canCast:   economy.canAffordMana(30),
    });
    y += 72;

    // Eisblitz
    this._drawSpellBtn(ctx, btnX, y, btnW, 62, {
      key:       'spellEisblitz',
      title:     '❄ Eisblitz',
      desc:      'Verlangsamt alle Monster (5s)',
      manaCost:  50,
      canCast:   economy.canAffordMana(50),
    });
  }

  // ── Maschine panel ─────────────────────────────────────────────────────────
  _drawMaschine(ctx, game) {
    const { economy, catapults } = game;
    const btnX = 10;
    const btnW = this.width - 20;
    let y = 56;

    this._drawBuildBtn(ctx, btnX, y, btnW, 62, {
      key:   'buildKatapult',
      title: '💣 Katapult',
      desc:  `60 AoE alle 5s  (${catapults.length} aktiv)`,
      cost:  250,
      canBuy: economy.canAfford(250),
    });
    y += 72;

    // Coming soon items
    ctx.fillStyle = '#334455';
    ctx.font = 'italic 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Ballista — demnächst...', btnX + 4, y + 16);
    y += 32;
    ctx.fillText('Öl-Kessel — demnächst...', btnX + 4, y + 16);
  }

  // ── Generic button renderers ────────────────────────────────────────────────
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

  _drawBuildBtn(ctx, x, y, w, h, data) {
    const { key, title, desc, cost, canBuy } = data;

    ctx.fillStyle = canBuy ? 'rgba(30,60,110,0.85)' : 'rgba(28,28,38,0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = canBuy ? '#3a7ac4' : '#333344';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.stroke();

    ctx.fillStyle = canBuy ? '#e8e8f0' : '#555566';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 19);

    ctx.fillStyle = '#8899aa';
    ctx.font = '11px sans-serif';
    ctx.fillText(desc, x + 10, y + 36);

    // [Bauen] button
    const bbw = 60, bbh = 20;
    const bbx = x + w - bbw - 8;
    const bby = y + h - bbh - 8;
    ctx.fillStyle = canBuy ? '#1a5c30' : '#222233';
    ctx.beginPath();
    ctx.roundRect(bbx, bby, bbw, bbh, 4);
    ctx.fill();
    ctx.strokeStyle = canBuy ? '#40c060' : '#333344';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bbx, bby, bbw, bbh, 4);
    ctx.stroke();
    ctx.fillStyle = canBuy ? '#80ff80' : '#445566';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bauen', bbx + bbw / 2, bby + 13);

    ctx.fillStyle = canBuy ? '#f0c030' : '#555566';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${cost} g`, x + w - 10, y + 22);

    this._buttons[key] = { x, y, w, h };
  }

  _drawSpellBtn(ctx, x, y, w, h, data) {
    const { key, title, desc, manaCost, canCast } = data;

    ctx.fillStyle = canCast ? 'rgba(20,40,100,0.9)' : 'rgba(28,28,38,0.85)';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    ctx.strokeStyle = canCast ? '#6080e0' : '#333344';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.stroke();

    ctx.fillStyle = canCast ? '#cce0ff' : '#555566';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(title, x + 10, y + 20);

    ctx.fillStyle = '#8899aa';
    ctx.font = '11px sans-serif';
    ctx.fillText(desc, x + 10, y + 36);

    ctx.fillStyle = canCast ? '#80aaff' : '#445566';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${manaCost} ✨`, x + w - 10, y + 34);

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
    const { upgradeSystem: us, economy, soldiers, wall, buildings, catapults } = game;

    switch (key) {
      case 'archerDamage':
        us.buy('archerDamage', () => soldiers.forEach(s => s.damage += 5));
        break;

      case 'archerSpeed':
        us.buy('archerSpeed', () => soldiers.forEach(s => s.attackSpeed += 0.2));
        break;

      case 'addArcher': {
        const maxArchers = 12 + buildings.kaserne;
        if (soldiers.length < maxArchers && economy.spend(game.addArcherCost)) {
          game.addArcher();
          game.addArcherCost = Math.round(game.addArcherCost * 2);
        }
        break;
      }

      case 'repairWall':
        if (wall.hp < wall.maxHp && economy.spend(20)) wall.repair(50);
        break;

      case 'reinforceWall':
        if (economy.spend(40)) wall.reinforce(100);
        break;

      case 'buildKaserne':
        if (economy.spend(150)) {
          buildings.kaserne++;
          game.addArcher();
        }
        break;

      case 'buildSchmiede':
        if (economy.spend(200)) {
          buildings.schmiede++;
          // +10% damage to all current and future soldiers (tracked via schmiede_mult)
          game.schmiede_mult = (game.schmiede_mult || 1) * 1.1;
          soldiers.forEach(s => { s.damage = Math.round(s.damage * 1.1); });
        }
        break;

      case 'buildMagierturm':
        if (economy.spend(300)) {
          buildings.magierturm++;
          economy.manaRegen += 2;
        }
        break;

      case 'buildKatapult':
        if (economy.spend(250)) {
          catapults.push({ timer: 5 });
        }
        break;

      case 'spellFireball':
        game.castFireball();
        break;

      case 'spellEisblitz':
        game.castEisblitz();
        break;
    }
  }
}
