class Economy {
  constructor(startGold = 50) {
    this.gold    = startGold;
    this.mana    = 0;
    this.maxMana = 100;
    this.manaRegen = 1; // mana per second base
  }

  addGold(amount) {
    this.gold += amount;
  }

  spend(amount) {
    if (this.gold < amount) return false;
    this.gold -= amount;
    return true;
  }

  canAfford(amount) {
    return this.gold >= amount;
  }

  update(dt) {
    this.mana = Math.min(this.maxMana, this.mana + this.manaRegen * dt);
  }
}
