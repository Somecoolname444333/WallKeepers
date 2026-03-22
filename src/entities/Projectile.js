class Projectile {
  constructor(x, y, target, damage) {
    this.x      = x;
    this.y      = y;
    this.target = target;
    this.damage = damage;
    this.speed  = 380;
    this.hit    = false;
    this.trail  = []; // recent positions for motion blur
  }

  update(dt) {
    if (this.hit) return;

    // If target died, vanish
    if (this.target.dead) {
      this.hit = true;
      return;
    }

    const dx   = this.target.x - this.x;
    const dy   = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Hit detection: close enough OR would overshoot this frame
    if (dist < this.target.radius + 4) {
      this.target.takeDamage(this.damage);
      this.hit = true;
      return;
    }

    // Store trail point
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 6) this.trail.shift();

    const nx = dx / dist;
    const ny = dy / dist;
    this.x += nx * this.speed * dt;
    this.y += ny * this.speed * dt;
  }

  draw(ctx) {
    if (this.hit) return;

    // Trail
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 0.35;
      ctx.fillStyle = `rgba(255,200,80,${alpha})`;
      ctx.beginPath();
      ctx.arc(this.trail[i].x, this.trail[i].y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Arrow head
    ctx.fillStyle = '#e8c060';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}
