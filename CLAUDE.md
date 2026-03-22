# CLAUDE.md — WallKeepers

## Projekt-Beschreibung
**WallKeepers** ist ein browserbasiertetes Fantasy-Tower-Defense / Idle-Clicker-Spiel. Der Spieler verteidigt eine Mauer gegen endlose Monster-Wellen. Wellen werden stärker bis der Spieler stirbt. Ziel: So weit wie möglich kommen.

## Status
🟢 AKTIV — Prototyp in Entwicklung

## Tech Stack
- **Plattform:** Browser (HTML5)
- **Sprache:** JavaScript (Ausnahme zur C#-Präferenz — C# macht für Browser-Games keinen Sinn)
- **Framework:** Phaser.js 3 (CDN) oder plain HTML5 Canvas
- **Build:** Kein Build-Tool nötig für Prototyp — direkt im Browser laufbar
- **Hosting:** GitHub Pages (Prototyp), später Netlify/itch.io
- **Repo:** https://github.com/Somecoolname444333/WallKeepers

## Spielkonzept

### Core Loop
Monster-Wellen angreifen die Mauer → Soldaten/Maschinen töten Monster → Gold verdienen → Gold ausgeben für Upgrades/Gebäude/Mauer → Nächste Welle übersteht besser → Wellen werden schwerer → Irgendwann stirbt man

### Ressourcen
- **Gold:** Verdient durch tote Monster. Bezahlt Upgrades, Gebäude, Mauer, Maschinen
- **Mana:** Regeneriert passiv. Bezahlt Zauber

### Siegbedingung
Keine — man spielt bis man stirbt. Score = erreichte Welle

## Bildschirm-Layout

```
+--------------------------------------------------+
|  [Top 2/3]  ANGRIFFSFLÄCHE                       |
|  Monster bewegen sich von rechts/oben zur Mauer  |
|                    |MAUER|                        |
|  [Hinter Mauer] Gebäude sichtbar                 |
+--------------------------------------------------+
| [Menüleiste] Upgrades | Gebäude | Mauer | Zauber | Maschine |
+--------------------------------------------------+
```

Bei Klick auf Menüpunkt öffnet sich links ein Panel (1/5 Bildschirmbreite, volle Höhe):
- **Upgrades:** Soldaten-Upgrades (Bogenschützen, Lanzenreiter, etc.)
- **Gebäude:** Gebäude bauen hinter der Mauer (Kaserne, Turm, Schmiede, etc.)
- **Mauer:** Mauer-HP, Verstärkung, Türme
- **Zauber:** Feuerkugel, Eis, Blitz — bezahlt mit Mana
- **Maschine:** Katapult, Ballista, etc.

## Einheiten & Entities

### Verteidiger (auf der Mauer)
- Bogenschütze: Schiesst Pfeile, hohe Reichweite, wenig Schaden
- Lanzenreiter: Nahkampf, viel Schaden, kurze Reichweite
- Magier: AoE-Schaden, langsame Angriffsrate

### Monster-Typen (Progression)
- Welle 1-5: Goblins (wenig HP, schnell)
- Welle 6-15: Orks (mehr HP, normal schnell)
- Welle 16+: Trolle (viel HP, langsam aber stark)
- Boss jede 10. Welle

### Maschinen
- Katapult: Schwerer AoE-Schaden, langsam
- Ballista: Einzelziel, sehr hoher Schaden
- Öl-Kessel: Verlangsamt Monster

### Gebäude (hinter Mauer)
- Kaserne: Erhöht Soldaten-Kapazität
- Schmiede: Verbessert Waffen-Schaden passiv
- Magierturm: Erhöht Mana-Regeneration
- Lagerhaus: Erhöht Gold-Limit

## Prototyp-Ziele (MVP)
1. Mauer mit HP-Bar sichtbar
2. Monster spawnen in Wellen, bewegen sich zur Mauer
3. Bogenschützen auf der Mauer schiessen automatisch
4. Gold verdienen wenn Monster sterben
5. Einfaches Upgrade-Menü (Bogenschütze upgraden)
6. Wellen-Counter und Wave-Difficulty-Scaling
7. Game Over wenn Mauer-HP = 0

## Ordnerstruktur
```
WallKeepers/
├── CLAUDE.md
├── index.html
├── src/
│   ├── main.js          ← Einstiegspunkt
│   ├── game.js          ← Phaser Game-Konfiguration
│   ├── scenes/
│   │   ├── GameScene.js ← Haupt-Spielszene
│   │   ├── UIScene.js   ← HUD und Menüs
│   │   └── MenuScene.js ← Hauptmenü
│   ├── entities/
│   │   ├── Wall.js
│   │   ├── Monster.js
│   │   ├── Soldier.js
│   │   └── Projectile.js
│   ├── systems/
│   │   ├── WaveManager.js
│   │   ├── Economy.js
│   │   └── UpgradeSystem.js
│   └── ui/
│       └── SidePanel.js
├── assets/
│   ├── sprites/
│   └── audio/
└── README.md
```

## Kontext für Claude
- Priorität: Funktion vor Ästhetik im Prototyp
- Placeholder-Grafiken (farbige Rechtecke/Kreise) sind OK für Prototyp
- Keine externen Assets nötig — alles Canvas-gezeichnet
- Code auf Deutsch kommentieren ist nicht nötig
- Nach jeder grossen Änderung: Git commit + push zu GitHub
