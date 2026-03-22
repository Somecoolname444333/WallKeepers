const MONSTER_DEFS = {
  goblin: {
    name:    'Goblin',
    hp:      10,
    speed:   65,
    damage:  8,   // wall damage per attack (1 attack/sec)
    gold:    5,
    color:   '#3ddc84',
    outline: '#1a8a50',
    radius:  8,
  },
  orc: {
    name:    'Orc',
    hp:      70,
    speed:   40,
    damage:  18,
    gold:    15,
    color:   '#e74c3c',
    outline: '#8B0000',
    radius:  13,
  },
  troll: {
    name:    'Troll',
    hp:      200,
    speed:   25,
    damage:  35,
    gold:    40,
    color:   '#9b59b6',
    outline: '#5a1e7a',
    radius:  19,
  },
};

class Monster {
  constructor(type, x, y, hpMultiplier = 1) {
    const def = MONSTER_DEFS[type];
    this.type        = type;
    this.name        = def.name;
    this.maxHp       = Math.round(def.hp * hpMultiplier);
    this.hp          = this.maxHp;
    this.speed       = def.speed;
    this.wallDamage  = def.damage;
    this.goldReward  = def.gold;
    this.color       = def.color;
    this.outline     = def.outline;
    this.radius      = def.radius;

    this.x           = x;
    this.y           = y;
    this.attacking   = false;
    this.dead        = false;

    // Attack accumulator — fires once per second
    this.attackTimer = 0;

    // Wobble animation
    this.wobble    = 0;
    this.wobbleDir = 1;
  }

  takeDamage(amount) {
    this.hp -= amount;
    if (this.hp <= 0) {
      this.hp   = 0;
      this.dead = true;
    }
  }

  // Returns wall damage dealt this frame (consumes timer)
  update(dt, wallFaceX) {
    if (this.dead) return;

    // Animate
    this.wobble += dt * 9 * this.wobbleDir;
    if (Math.abs(this.wobble) > 0.35) this.wobbleDir *= -1;

    if (!this.attacking) {
      this.x -= this.speed * dt;
      // Stop when left-edge of monster touches wall's right face
      if (this.x - this.radius <= wallFaceX) {
        this.x        = wallFaceX + this.radius;
        this.attacking = true;
      }
    }

    if (this.attacking) {
      this.attackTimer += dt;
    }
  }

  // Returns damage to deal to wall this frame; resets internal counter
  getWallDamage() {
    if (!this.attacking || this.dead) return 0;
    const attacks = Math.floor(this.attackTimer);
    if (attacks === 0) return 0;
    this.attackTimer -= attacks;
    return attacks * this.wallDamage;
  }

  draw(ctx) {
    if (this.dead) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.wobble * 0.08);

    // Drop shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, this.radius + 2, this.radius * 0.85, this.radius * 0.25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.outline;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Eyes
    const er = this.radius * 0.22;
    const ex = this.radius * 0.28;
    const ey = -this.radius * 0.18;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(-ex, ey, er, 0, Math.PI * 2);
    ctx.arc( ex, ey, er, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-ex, ey, er * 0.5, 0, Math.PI * 2);
    ctx.arc( ex, ey, er * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Attack flash ring
    if (this.attacking) {
      ctx.strokeStyle = 'rgba(255,200,0,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // HP bar
    const barW = this.radius * 2.8;
    const barH = 4;
    const barX = this.x - barW / 2;
    const barY = this.y - this.radius - 9;
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    const hpPct = this.hp / this.maxHp;
    ctx.fillStyle = hpPct > 0.5 ? '#4caf50' : hpPct > 0.25 ? '#ff9800' : '#f44336';
    ctx.fillRect(barX, barY, barW * hpPct, barH);
  }
}
