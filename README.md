# Grüne Notebook MCP Server

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
| `bundestag` | Bundestagsfraktion: Pressemitteilungen und Positionen |

## Installation

### Voraussetzungen

- Node.js 18 oder höher
- Zugang zu einer Qdrant-Instanz mit den Grünen-Dokumenten

### Schritte

```bash
# Repository klonen
git clone https://github.com/MoritzWM/gruene-notebook-mcp.git
cd gruene-notebook-mcp

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# .env bearbeiten und Qdrant-Zugangsdaten eintragen
```

## Konfiguration

### Umgebungsvariablen

```bash
# Qdrant Vector Database
QDRANT_URL=https://your-qdrant-instance.com
QDRANT_API_KEY=your-api-key
```

### MCP Client Konfiguration

#### Cursor / Claude Desktop

Füge in deiner MCP-Konfiguration hinzu:

```json
{
  "mcpServers": {
    "gruene-notebook": {
      "command": "node",
      "args": ["/pfad/zu/gruene-notebook-mcp/src/index.js"],
      "env": {
        "QDRANT_URL": "https://your-qdrant-instance.com",
        "QDRANT_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Verwendung

Nach der Konfiguration kannst du in Claude/Cursor Fragen stellen wie:

- "Suche in den österreichischen Grünen-Programmen nach Klimapolitik"
- "Was sagt das Grundsatzprogramm der deutschen Grünen zur Energiewende?"
- "Finde Positionen der Bundestagsfraktion zum Thema Mobilität"

## Verfügbare Tools

### `search_gruene_documents`

Durchsucht die Parteiprogramme nach relevanten Textpassagen.

**Parameter:**
- `query` (string, erforderlich) - Suchbegriff oder Frage
- `collection` (string, erforderlich) - Welche Sammlung: `oesterreich`, `deutschland`, `bundestag`
- `limit` (number, optional) - Maximale Anzahl Ergebnisse (Standard: 5)

**Beispiel:**
```json
{
  "query": "Klimaschutz und erneuerbare Energien",
  "collection": "oesterreich",
  "limit": 5
}
```

## Entwicklung

```bash
# Server im Entwicklungsmodus starten (mit Auto-Reload)
npm run dev

# Tests ausführen
npm test
```

## Architektur

```
Benutzer → Claude/Cursor → MCP Server → Qdrant → Dokumente
                              ↓
                         FastEmbed
                      (Embedding-Generierung)
```

## Lizenz

MIT License - siehe [LICENSE](LICENSE)

## Beitragen

Pull Requests sind willkommen! Für größere Änderungen bitte zuerst ein Issue erstellen.
