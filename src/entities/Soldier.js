class Soldier {
  constructor(x, y) {
    this.x           = x;
    this.y           = y;
    this.range       = 200;
    this.damage      = 15;
    this.attackSpeed = 1.0; // shots per second
    this.attackTimer = 0;
    this.target      = null;
    this.angle       = 0;   // radians, facing direction
  }

  update(dt, monsters, onShoot) {
    // Find nearest alive monster in range
    let nearest = null;
    let nearestDist = Infinity;
    for (const m of monsters) {
      if (m.dead) continue;
      const dx = m.x - this.x;
      const dy = m.y - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= this.range && dist < nearestDist) {
        nearest     = m;
        nearestDist = dist;
      }
    }
    this.target = nearest;

    if (nearest) {
      this.angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
      this.attackTimer += dt;
      if (this.attackTimer >= 1 / this.attackSpeed) {
        this.attackTimer -= 1 / this.attackSpeed;
        onShoot(this, nearest);
      }
    } else {
      // Bleed off timer so the first shot after finding a target is immediate-ish
      this.attackTimer = Math.min(this.attackTimer + dt, 1 / this.attackSpeed);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    // Body
    ctx.fillStyle = '#2980b9';
    ctx.strokeStyle = '#1a5276';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-7, -10, 14, 18, 2);
    ctx.fill();
    ctx.stroke();

    // Helmet / head
    ctx.fillStyle = '#ddb060';
    ctx.beginPath();
    ctx.arc(0, -15, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.arc(0, -19, 6, Math.PI, 0); // helmet top
    ctx.fill();

    // Bow arm pointing toward target
    if (this.target) {
      ctx.save();
      ctx.rotate(this.angle);
      // Bow string
      ctx.strokeStyle = '#c8a060';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();
      // Arrow tip
      ctx.fillStyle = '#ccc';
      ctx.beginPath();
      ctx.moveTo(18,  0);
      ctx.lineTo(14, -2.5);
      ctx.lineTo(14,  2.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();

    // Subtle range ring when targeting
    if (this.target) {
      ctx.strokeStyle = 'rgba(80,140,255,0.12)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}
