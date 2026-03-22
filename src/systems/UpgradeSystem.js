class UpgradeSystem {
  constructor(economy) {
    this.economy = economy;
    this.upgrades = {
      archerDamage: {
        name:       'Archer Damage',
        baseCost:   30,
        costMult:   1.45,
        level:      0,
        maxLevel:   20,
        _cost:      30,
      },
      archerSpeed: {
        name:       'Archer Speed',
        baseCost:   50,
        costMult:   1.45,
        level:      0,
        maxLevel:   15,
        _cost:      50,
      },
    };
  }

  getCost(key) {
    return Math.round(this.upgrades[key]._cost);
  }

  canBuy(key) {
    const up = this.upgrades[key];
    return up.level < up.maxLevel && this.economy.canAfford(Math.round(up._cost));
  }

  // applyFn receives (level) so caller can mutate soldiers/entities
  buy(key, applyFn) {
    const up = this.upgrades[key];
    if (!this.canBuy(key)) return false;
    if (!this.economy.spend(Math.round(up._cost))) return false;
    up.level++;
    up._cost *= up.costMult;
    applyFn(up.level);
    return true;
  }
}
