class Wall {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxHp = 500;
    this.hp = 500;
  }

  takeDamage(amount) {
    this.hp = Math.max(0, this.hp - amount);
    return this.hp <= 0;
  }

  repair(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  reinforce(extraHp) {
    this.maxHp += extraHp;
    this.hp += extraHp;
  }

  get hpPercent() {
    return this.hp / this.maxHp;
  }

  draw(ctx) {
    // Wall gradient body
    const grad = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
    grad.addColorStop(0,   '#6a5030');
    grad.addColorStop(0.4, '#9a7850');
    grad.addColorStop(1,   '#6a5030');
    ctx.fillStyle = grad;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Horizontal brick lines
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 1;
    const brickH = 16;
    for (let by = this.y; by < this.y + this.height; by += brickH) {
      ctx.beginPath();
      ctx.moveTo(this.x, by);
      ctx.lineTo(this.x + this.width, by);
      ctx.stroke();
    }

    // Left shadow / right highlight
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(this.x, this.y, 5, this.height);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(this.x + this.width - 5, this.y, 5, this.height);

    // Crenellations at top
    this._drawCrenellations(ctx);

    // HP bar (centered above the wall mid-point)
    this._drawHpBar(ctx);
  }

  _drawCrenellations(ctx) {
    const merlonW = 8;
    const merlonH = 14;
    const gap = 6;
    ctx.fillStyle = '#8a6840';
    let cx = this.x - 2;
    while (cx < this.x + this.width + 2) {
      ctx.fillRect(cx, this.y, merlonW, merlonH);
      cx += merlonW + gap;
    }
  }

  _drawHpBar(ctx) {
    const barW = 110;
    const barH = 13;
    const barX = this.x + this.width / 2 - barW / 2;
    const barY = 18;

    // Background
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(barX - 1, barY - 1, barW + 2, barH + 2, 3);
    ctx.fill();

    // HP fill
    const pct = this.hpPercent;
    const hpColor = pct > 0.55 ? '#4caf50' : pct > 0.28 ? '#ff9800' : '#f44336';
    ctx.fillStyle = hpColor;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW * pct, barH, 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 2);
    ctx.stroke();

    // Text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`WALL  ${Math.ceil(this.hp)} / ${this.maxHp}`, barX + barW / 2, barY + barH - 2);
  }
}
