class Economy {
  constructor(startGold = 50) {
    this.gold    = startGold;
    this.mana    = 100;
    this.maxMana = 100;
    this.manaRegen = 2; // mana per second
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
