# Ausführliche Setup-Anleitung

## Voraussetzungen

1. **Node.js 18+** - [Download](https://nodejs.org/)
2. **Qdrant-Zugang** - URL und API-Key zur Qdrant-Instanz mit den Grünen-Dokumenten

## Schritt 1: Repository klonen

```bash
git clone https://github.com/MoritzWM/gruene-notebook-mcp.git
cd gruene-notebook-mcp
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
```

## Schritt 4: Server testen

```bash
npm start
```

Du solltest sehen:
```
==================================================
Grüne Notebook MCP Server
==================================================
Qdrant: https://deine-qdrant-instanz.com
Sammlungen: oesterreich, deutschland, bundestag
==================================================
[Server] Bereit für Anfragen
```

## Schritt 5: In Claude/Cursor einbinden

### Cursor

Bearbeite `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "gruene-notebook": {
      "command": "node",
      "args": ["/absoluter/pfad/zu/gruene-notebook-mcp/src/index.js"],
      "env": {
        "QDRANT_URL": "https://deine-qdrant-instanz.com",
        "QDRANT_API_KEY": "dein-api-key"
      }
    }
  }
}
```

### Claude Desktop

Bearbeite die Claude Desktop Konfiguration (Pfad abhängig vom Betriebssystem):

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Gleiche Konfiguration wie oben.

## Fehlerbehebung

### "QDRANT_URL ist nicht gesetzt"

Die `.env` Datei fehlt oder ist leer. Siehe Schritt 3.

### "Verbindungsfehler"

- Prüfe ob die Qdrant-URL erreichbar ist
- Prüfe ob der API-Key korrekt ist
- Prüfe ob Firewall-Regeln den Zugriff blockieren

### "Keine Ergebnisse gefunden"

- Die Sammlung existiert möglicherweise nicht
- Die Dokumente wurden noch nicht in Qdrant geladen

## Sammlungen prüfen

Du kannst die verfügbaren Sammlungen in Qdrant prüfen mit:

```bash
curl -H "api-key: DEIN_API_KEY" https://deine-qdrant-instanz.com/collections
```
