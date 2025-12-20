# Gruenerator MCP Server

Ein [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) Server, der KI-Assistenten direkten Zugriff auf Grüne Parteiprogramme ermöglicht.

## Features

- **Hybrid-Suche** - Kombiniert Vektor- und Textsuche mit RRF-Fusion
- **Deutsche Optimierung** - Umlaut-Handling (ä→ae, ö→oe, etc.) und Query-Varianten
- **Qualitäts-Scoring** - Ergebnisse gewichtet nach Dokumentenqualität
- **Semantisches Caching** - Schnelle Antworten für wiederholte Anfragen
- **Metadaten-Filter** - Filterung nach Dokumenttyp, Titel, etc.
- **MCP Resources** - Direkter Zugriff auf Sammlungsinformationen

## Verfügbare Dokumentensammlungen

| Sammlung | Beschreibung |
|----------|--------------|
| `oesterreich` | Die Grünen Österreich: EU-Wahlprogramm, Grundsatzprogramm, Nationalratswahl-Programm |
| `deutschland` | Bündnis 90/Die Grünen: Grundsatzprogramm 2020 |

---

## Installation & Konfiguration

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

### Lokal entwickeln

```bash
# Repository klonen
git clone https://github.com/Movm/Gruenerator-MCP.git
cd Gruenerator-MCP

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

### Mit Coolify

1. Neues Projekt erstellen
2. Git Repository verbinden: `https://github.com/Movm/Gruenerator-MCP`
3. Umgebungsvariablen setzen (siehe unten)
4. Deployen

### Umgebungsvariablen

| Variable | Beschreibung | Erforderlich |
|----------|--------------|--------------|
| `QDRANT_URL` | URL zur Qdrant-Instanz | Ja |
| `QDRANT_API_KEY` | API-Key für Qdrant | Ja |
| `MISTRAL_API_KEY` | API-Key für Mistral Embeddings | Ja |
| `PORT` | Server-Port | Nein (Standard: 3000) |
| `PUBLIC_URL` | Öffentliche URL für Config-Generierung | Nein |
| `LOG_LEVEL` | Log-Level: DEBUG, INFO, WARN, ERROR | Nein (Standard: INFO) |

---

## MCP Client Konfiguration

### Cursor / Claude Desktop

Füge in deiner MCP-Konfiguration hinzu:

```json
{
  "mcpServers": {
    "gruenerator": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

Nach der Konfiguration kannst du Fragen stellen wie:

- "Suche in den österreichischen Grünen-Programmen nach Klimapolitik"
- "Was sagt das Grundsatzprogramm der deutschen Grünen zur Energiewende?"

---

## API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/mcp` | POST | MCP Kommunikation |
| `/mcp` | GET | SSE Stream |
| `/mcp` | DELETE | Session beenden |
| `/health` | GET | Health Check mit Cache- und Request-Statistiken |
| `/metrics` | GET | Detaillierte Server-Metriken |
| `/.well-known/mcp.json` | GET | Auto-Discovery Metadata |
| `/config/:client` | GET | Client-Konfiguration generieren |
| `/info` | GET | Server-Informationen |

### Health Check Response

```json
{
  "status": "ok",
  "service": "gruenerator-mcp",
  "version": "1.0.0",
  "collections": ["oesterreich", "deutschland"],
  "uptime": { "ms": 3600000, "hours": 1.0 },
  "cache": {
    "embeddingHitRate": "65%",
    "searchHitRate": "42%"
  },
  "requests": { "total": 150, "searches": 120, "errors": 0 },
  "performance": { "avgResponseTimeMs": 250, "cacheHitRate": "65%" }
}
```

### Metrics Response

```json
{
  "server": { "name": "gruenerator-mcp", "version": "1.0.0" },
  "uptime": { "hours": 1.0 },
  "requests": { "total": 150, "searches": 120 },
  "breakdown": {
    "byCollection": { "deutschland": 80, "oesterreich": 40 },
    "bySearchMode": { "hybrid": 100, "vector": 15, "text": 5 }
  },
  "cache": {
    "embeddings": { "entries": 50, "hitRate": "65%" },
    "search": { "entries": 30, "hitRate": "42%" }
  },
  "memory": { "heapUsedMB": 45, "rssMB": 120 }
}
```

---

## Verfügbare Tools

### `gruenerator_search`

Durchsucht die Parteiprogramme mit Hybrid-, Vektor- oder Textsuche.

**Parameter:**

| Parameter | Typ | Beschreibung | Standard |
|-----------|-----|--------------|----------|
| `query` | string | Suchbegriff oder Frage | erforderlich |
| `collection` | string | `oesterreich` oder `deutschland` | erforderlich |
| `searchMode` | string | `hybrid`, `vector` oder `text` | `hybrid` |
| `limit` | number | Maximale Anzahl Ergebnisse | 5 |
| `filters` | object | Metadaten-Filter (documentType, title) | optional |
| `useCache` | boolean | Cache verwenden | true |

**Beispiel:**
```json
{
  "query": "Klimaschutz und erneuerbare Energien",
  "collection": "oesterreich",
  "searchMode": "hybrid",
  "limit": 5,
  "filters": { "documentType": "wahlprogramm" }
}
```

### `gruenerator_cache_stats`

Zeigt Cache-Statistiken für Embeddings und Suchergebnisse.

**Parameter:** Keine

**Beispiel-Antwort:**
```json
{
  "embeddings": { "entries": 50, "hits": 120, "misses": 30, "hitRate": "80%" },
  "search": { "entries": 30, "hits": 80, "misses": 40, "hitRate": "67%" }
}
```

### `get_client_config`

Generiert fertige MCP-Konfigurationen für verschiedene Clients.

**Parameter:**
- `client` (string, erforderlich) - `claude`, `cursor` oder `vscode`

---

## MCP Resources

Der Server stellt folgende Resources über das MCP-Protokoll bereit:

| URI | Beschreibung |
|-----|--------------|
| `gruenerator://info` | Server-Informationen und Fähigkeiten |
| `gruenerator://collections` | Liste aller verfügbaren Sammlungen |
| `gruenerator://collections/oesterreich` | Details zur österreichischen Sammlung |
| `gruenerator://collections/deutschland` | Details zur deutschen Sammlung |

---

## Suchmodi

### Hybrid (Standard)
Kombiniert Vektor- und Textsuche mit Reciprocal Rank Fusion (RRF). Beste Ergebnisse für die meisten Anfragen.

### Vector
Reine semantische Suche basierend auf Embeddings. Gut für konzeptuelle Fragen.

### Text
Klassische Textsuche mit deutschen Optimierungen. Gut für exakte Begriffe oder Namen.

---

## Lizenz

MIT License - siehe [LICENSE](LICENSE)
