# CLAUDE.md — WallKeepers Development Rules

> Diese Regeln MÜSSEN bei JEDER Änderung an index.html befolgt werden.
> Verstösse führen zu schwarzem Bildschirm oder kaputten Icons.

## KRITISCHE REGELN

### 1. Encoding — IMMER UTF-8 ohne BOM
**NIEMALS** PowerShell `Out-File`, `Set-Content`, `Add-Content` verwenden.
**IMMER** diese Methode:
```powershell
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("H:\Projects\WallKeepers\index.html", $content, $utf8NoBom)
```

### 2. Duplikat-Schutz — vor JEDEM Patch prüfen
Bevor Code eingefügt wird, IMMER prüfen ob der Code bereits existiert:
```powershell
$content = [System.IO.File]::ReadAllText("H:\Projects\WallKeepers\index.html", [System.Text.Encoding]::UTF8)
# Prüfen ob Ziel-String schon vorhanden
if ($content -match 'NEUER_FUNKTIONSNAME') { Write-Output "BEREITS VORHANDEN — nicht nochmals einfügen!" }
```

### 3. Nach JEDER Änderung — Integritätscheck
```powershell
$content = [System.IO.File]::ReadAllText("H:\Projects\WallKeepers\index.html", [System.Text.Encoding]::UTF8)
$repChars = ($content.ToCharArray() | Where-Object { [int]$_ -eq 65533 }).Count
$hpPct = ([regex]::Matches($content, 'const hp_pct')).Count
$scoreMap = ([regex]::Matches($content, 'const scoreMap')).Count
Write-Output "Replacement chars: $repChars (muss 0 sein)"
Write-Output "hp_pct Deklarationen: $hpPct (muss 1 sein)"
Write-Output "scoreMap Deklarationen: $scoreMap (muss 1 sein)"
if ($repChars -gt 0 -or $hpPct -gt 1 -or $scoreMap -gt 1) { Write-Output "FEHLER — nicht pushen!" }
```

### 4. Python als Alternative (encoding-safe)
```python
# Lesen
with open(r'H:\Projects\WallKeepers\index.html', 'r', encoding='utf-8') as f:
    content = f.read()
# Schreiben
with open(r'H:\Projects\WallKeepers\index.html', 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
```

### 5. Push — IMMER binary-safe
```powershell
$bytes = [System.IO.File]::ReadAllBytes("H:\Projects\WallKeepers\index.html")
$b64 = [Convert]::ToBase64String($bytes)
```
NIEMALS den file-content als String in PowerShell base64-encoden — das zerstört UTF-8.

## BEKANNTE BUGS (bereits gefixt — nicht nochmals einbauen)
- `const hp_pct` — darf nur 1x in wall.draw() existieren
- `const scoreMap` — darf nur 1x im Monster-Kill-Handler existieren
- Wave preview block — darf nur 1x im game loop existieren
- UTF-8 BOM (`\xef\xbb\xbf`) — darf NICHT im File sein

## GAME STRUKTUR
- Single file: H:\Projects\WallKeepers\index.html (~285KB)
- Repo: https://github.com/Somecoolname444333/WallKeepers
- Live: https://somecoolname444333.github.io/WallKeepers/
- Branch: master
- Letzter stabiler Commit vor Problemen: 641110f