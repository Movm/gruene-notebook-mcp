# Ausführliche Setup-Anleitung

## Voraussetzungen

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Qdrant-Zugang** - URL und API-Key zur Qdrant-Instanz mit den Grünen-Dokumenten
3. **Mistral API-Key** - Für Embeddings ([mistral.ai](https://mistral.ai/))

## Schritt 1: Repository klonen

```bash
git clone https://github.com/Movm/Gruenerator-MCP.git
cd Gruenerator-MCP
```

## Schritt 2: Abhängigkeiten installieren

```bash
npm install
```

## Schritt 3: Umgebungsvariablen konfigurieren

```bash
# Beispieldatei kopieren
cp .env.example .env

# .env bearbeiten
nano .env  # oder dein bevorzugter Editor
```

Trage ein:
```
QDRANT_URL=https://deine-qdrant-instanz.com
QDRANT_API_KEY=dein-api-key
MISTRAL_API_KEY=dein-mistral-key

# Optional: Öffentliche URL für Config-Generierung
# PUBLIC_URL=https://mcp.gruenerator.de
```

## Schritt 4: Server testen

```bash
npm start
```

Du solltest sehen:
```
==================================================
Gruenerator MCP Server
==================================================
Port: 3000
Qdrant: https://deine-qdrant-instanz.com
Sammlungen: oesterreich, deutschland
==================================================
Endpoints:
  MCP:        http://localhost:3000/mcp
  Health:     http://localhost:3000/health
  Discovery:  http://localhost:3000/.well-known/mcp.json
  Info:       http://localhost:3000/info
  Config:     http://localhost:3000/config/:client
==================================================
```

## Schritt 5: In Claude/Cursor einbinden

### Schnellste Methode: Config abrufen

Der Server kann dir die fertige Konfiguration generieren:

```bash
# Für Claude Desktop
curl http://localhost:3000/config/claude

# Für Cursor
curl http://localhost:3000/config/cursor

# Für VS Code
curl http://localhost:3000/config/vscode
```

### Manuelle Konfiguration

#### Cursor

Bearbeite `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gruenerator": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Oder für den gehosteten Server:

```json
{
  "mcpServers": {
    "gruenerator": {
      "url": "https://mcp-notebook.gruenerator.de/mcp"
    }
  }
}
```

#### Claude Desktop

Bearbeite die Claude Desktop Konfiguration (Pfad abhängig vom Betriebssystem):

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Gleiche Konfiguration wie oben.

## Fehlerbehebung

### "QDRANT_URL ist nicht gesetzt"

Die `.env` Datei fehlt oder ist leer. Siehe Schritt 3.

### "MISTRAL_API_KEY ist nicht gesetzt"

Du brauchst einen Mistral API-Key für Embeddings. Erstelle einen unter [console.mistral.ai](https://console.mistral.ai/).

### "Verbindungsfehler"

- Prüfe ob die Qdrant-URL erreichbar ist
- Prüfe ob der API-Key korrekt ist
- Prüfe ob Firewall-Regeln den Zugriff blockieren

### "Keine Ergebnisse gefunden"

- Die Sammlung existiert möglicherweise nicht
- Die Dokumente wurden noch nicht in Qdrant geladen

## Sammlungen prüfen

Verfügbare Sammlungen:

| Sammlung | Beschreibung |
|----------|--------------|
| `oesterreich` | Die Grünen Österreich: EU-Wahlprogramm, Grundsatzprogramm, Nationalratswahl-Programm |
| `deutschland` | Bündnis 90/Die Grünen: Grundsatzprogramm 2020 |

Du kannst die verfügbaren Sammlungen in Qdrant prüfen mit:

```bash
curl -H "api-key: DEIN_API_KEY" https://deine-qdrant-instanz.com/collections
```

## Mit Docker starten

Alternativ kannst du den Server mit Docker starten:

```bash
# Image bauen
docker build -t gruenerator-mcp .

# Container starten
docker run -d \
  --name gruenerator-mcp \
  -p 3000:3000 \
  -e QDRANT_URL=https://your-qdrant.com \
  -e QDRANT_API_KEY=your-api-key \
  -e MISTRAL_API_KEY=your-mistral-key \
  gruenerator-mcp
```

Oder mit Docker Compose:

```bash
docker compose up -d
```

## Mit Coolify deployen

1. **New Application** → **Public Repository**
2. Repository URL: `https://github.com/Movm/Gruenerator-MCP`
3. Branch: `main`
4. Build Pack: **Docker Compose**
5. Docker Compose Location: `/docker-compose.yaml` (Standard)
6. **Continue** → Umgebungsvariablen werden automatisch erkannt:
   - `QDRANT_URL` (Pflichtfeld, rot markiert)
   - `QDRANT_API_KEY` (Pflichtfeld)
   - `MISTRAL_API_KEY` (Pflichtfeld)
   - `PUBLIC_URL` (optional - hier deine Domain eintragen)
7. **Deploy**
