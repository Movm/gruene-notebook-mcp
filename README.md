# Gruenerator MCP Server

Ein [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) Server, der KI-Assistenten direkten Zugriff auf Grüne Parteiprogramme ermöglicht.

## Was macht dieser Server?

Der MCP Server verbindet sich mit einer Qdrant-Vektordatenbank, in der Parteiprogramme der Grünen gespeichert sind. KI-Assistenten wie Claude können damit:

- **Dokumente durchsuchen** - "Finde alle Stellen über Klimaschutz"
- **Fragen beantworten** - "Was ist die Position der Grünen zur Energiewende?"

## Verfügbare Dokumentensammlungen

| Sammlung | Beschreibung |
|----------|--------------|
| `oesterreich` | Die Grünen Österreich: EU-Wahlprogramm, Grundsatzprogramm, Nationalratswahl-Programm |
| `deutschland` | Bündnis 90/Die Grünen: Grundsatzprogramm 2020 |

**Wichtig:** Bei jeder Suche muss angegeben werden, ob in österreichischen oder deutschen Dokumenten gesucht werden soll.

---

## Für Nutzer: Verbindung zum gehosteten Server

Der Server läuft gehostet - du brauchst keine lokale Installation.

### Cursor / Claude Desktop Konfiguration

Füge in deiner MCP-Konfiguration hinzu:

```json
{
  "mcpServers": {
    "gruenerator": {
      "url": "https://mcp-notebook.gruenerator.de/mcp"
    }
  }
}
```

**Fertig!** Keine Installation, keine API-Keys nötig.

### Verwendung

Nach der Konfiguration kannst du in Claude/Cursor Fragen stellen wie:

- "Suche in den österreichischen Grünen-Programmen nach Klimapolitik"
- "Was sagt das Grundsatzprogramm der deutschen Grünen zur Energiewende?"

---

## Für Admins: Selbst hosten

### Mit Docker (empfohlen)

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

### Mit Coolify

1. Neues Projekt erstellen
2. Git Repository verbinden: `https://github.com/Movm/gruene-notebook-mcp`
3. Umgebungsvariablen setzen:
   - `QDRANT_URL` - URL zur Qdrant-Instanz
   - `QDRANT_API_KEY` - API-Key für Qdrant
   - `MISTRAL_API_KEY` - API-Key für Mistral (Embeddings)
   - `PORT` - (optional, Standard: 3000)
4. Deployen

### Umgebungsvariablen

| Variable | Beschreibung | Erforderlich |
|----------|--------------|--------------|
| `QDRANT_URL` | URL zur Qdrant-Instanz | Ja |
| `QDRANT_API_KEY` | API-Key für Qdrant | Ja |
| `MISTRAL_API_KEY` | API-Key für Mistral Embeddings | Ja |
| `PORT` | Server-Port | Nein (Standard: 3000) |

---

## API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/mcp` | POST | MCP Kommunikation |
| `/mcp` | GET | SSE Stream |
| `/mcp` | DELETE | Session beenden |
| `/health` | GET | Health Check |

### Health Check Response

```json
{
  "status": "ok",
  "service": "gruenerator-mcp",
  "version": "1.0.0",
  "collections": ["oesterreich", "deutschland"]
}
```

---

## Verfügbare Tools

### `gruenerator_search`

Durchsucht die Parteiprogramme nach relevanten Textpassagen.

**Parameter:**
- `query` (string, erforderlich) - Suchbegriff oder Frage
- `collection` (string, erforderlich) - Welche Sammlung: `oesterreich` oder `deutschland`
- `limit` (number, optional) - Maximale Anzahl Ergebnisse (Standard: 5)

**Beispiel:**
```json
{
  "query": "Klimaschutz und erneuerbare Energien",
  "collection": "oesterreich",
  "limit": 5
}
```

---

## Entwicklung

```bash
# Repository klonen
git clone https://github.com/Movm/gruene-notebook-mcp.git
cd gruene-notebook-mcp

# Dependencies installieren
npm install

# Umgebungsvariablen setzen
cp .env.example .env
# .env bearbeiten

# Server starten
npm start

# Oder mit Auto-Reload
npm run dev
```

---

## Lizenz

MIT License - siehe [LICENSE](LICENSE)
