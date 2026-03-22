# WallKeepers

**Browser-based Fantasy Tower Defense / Idle Clicker Game**

Defend your wall against endless monster waves. Each wave is stronger than the last. How far can you get?

## Play

Open `index.html` in any modern browser — no build step, no server needed.

> Hosted on GitHub Pages: https://Somecoolname444333.github.io/WallKeepers

## How to Play

| Action | Description |
|--------|-------------|
| **Click menu buttons** | Open upgrade/build/spell panels |
| **Space** | Pause / Unpause |
| **Click game area** | Close any open panel |

### Goal

Survive as many waves as possible. Your score = the wave number you reached.

---

## Core Loop

```
Monster waves attack the wall
  → Archers + machines kill monsters
    → Earn Gold
      → Buy upgrades, buildings, machines
        → Survive longer
          → Waves get harder
            → Eventually you fall
```

---

## Resources

| Resource | Earn By | Spend On |
|----------|---------|----------|
| **Gold** | Killing monsters | Upgrades, buildings, machines, wall repairs |
| **Mana** | Regenerates 1/sec base (+2/sec per Magierturm) | Spells |

---

## Menus

### ⚔ Upgrades
| Upgrade | Effect | Base Cost |
|---------|--------|-----------|
| Bogenschütze Schaden +5 | +5 damage per archer | 30g (×1.45 per level) |
| Bogenschütze Tempo +0.2/s | +0.2 shots/sec per archer | 50g (×1.45 per level) |
| Bogenschützen +1 | Adds one more archer | 100g (×2 per purchase) |

### 🏰 Gebäude (Buildings)
| Building | Effect | Cost |
|----------|--------|------|
| Kaserne | +1 archer slot, spawns an archer immediately | 150g |
| Schmiede | +10% archer damage (stacks per smithy) | 200g |
| Magierturm | +2 mana regeneration per second | 300g |

### 🧱 Mauer (Wall)
| Action | Effect | Cost |
|--------|--------|------|
| Reparieren | +50 HP (only if damaged) | 20g |
| Verstärken | +100 max HP | 40g |

### ✨ Zauber (Spells)
| Spell | Effect | Mana Cost |
|-------|--------|-----------|
| Feuerball | 80 damage to every monster on screen | 30 mana |
| Eisblitz | Slows all monsters by 50% for 5 seconds | 50 mana |

### ⚙ Maschine
| Machine | Effect | Cost |
|---------|--------|------|
| Katapult | 60 AoE damage to all monsters every 5 seconds | 250g |

---

## Monster Waves

| Monster | HP | Speed | Wall Damage | Gold | Waves |
|---------|----|-------|-------------|------|-------|
| Goblin | 10 | Fast | 8/hit | 5g | 1–5 |
| Orc | 70 | Medium | 18/hit | 15g | 6–15 |
| Troll | 200 | Slow | 35/hit | 40g | 16+ |

- Monster count: `5 + (wave − 1) × 2`
- Monster HP scales: `×1.15^(wave−1)`
- Boss every 10 waves (future update)

---

## Difficulty

| Setting | Monster HP Multiplier |
|---------|-----------------------|
| Leicht (Easy) | ×0.7 |
| Normal | ×1.0 |
| Schwer (Hard) | ×1.4 |

---

## Tech Stack

- Pure HTML5 Canvas + vanilla JavaScript
- No build tools, no dependencies, no npm
- localStorage for high score persistence

---

## Project Structure

```
WallKeepers/
├── index.html
├── src/
│   ├── main.js              — Game loop (requestAnimationFrame)
│   ├── scenes/
│   │   └── GameScene.js     — Main scene: state machine, update, draw
│   ├── entities/
│   │   ├── Wall.js          — Wall HP, draw, repair, reinforce
│   │   ├── Monster.js       — Monster types, movement, slowed state
│   │   ├── Soldier.js       — Archer targeting and shooting
│   │   └── Projectile.js    — Arrow with trail effect
│   ├── systems/
│   │   ├── WaveManager.js   — Wave spawning and timing
│   │   ├── Economy.js       — Gold + mana resource management
│   │   └── UpgradeSystem.js — Upgrade cost scaling
│   └── ui/
│       └── SidePanel.js     — All 5 panel UIs with click handling
└── assets/                  — (reserved for future sprites/audio)
```
