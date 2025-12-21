import { config } from '../config.js';

/**
 * Generate a comprehensive system prompt that explains how to use the MCP tools
 * This resource should be read by AI systems to understand the search capabilities
 */
export function getSystemPromptResource() {
  const collections = Object.entries(config.collections).map(([key, col]) => {
    const filters = col.filterableFields
      ? Object.entries(col.filterableFields)
          .map(([field, cfg]) => `${field} (${cfg.label})`)
          .join(', ')
      : 'keine';

    return `- **${key}**: ${col.displayName} - ${col.description}\n  Filter: ${filters}`;
  }).join('\n');

  const systemPrompt = `# Gruenerator MCP Server - Anleitung

Du hast Zugriff auf den Gruenerator MCP Server, der semantische Suche in Grünen Parteiprogrammen ermöglicht.

## Verfügbare Sammlungen

${collections}

## Tools

### 1. gruenerator_search
Haupttool für die Suche. Parameter:
- **query** (Pflicht): Suchbegriff oder Frage
- **collection** (Pflicht): Eine der oben genannten Sammlungen
- **searchMode**: "hybrid" (empfohlen), "vector" oder "text"
- **limit**: Anzahl Ergebnisse (1-20, Standard: 5)
- **filters**: Optionale Filter (siehe unten)

### 2. gruenerator_get_filters
Zeigt verfügbare Filterwerte für eine Sammlung. Nutze dieses Tool BEVOR du filterst, um gültige Werte zu erfahren.

### 3. gruenerator_cache_stats
Zeigt Cache-Statistiken.

## Filter-System

Jede Sammlung hat unterschiedliche Filter:

| Sammlung | Filter |
|----------|--------|
| oesterreich, deutschland | title (Programmname) |
| bundestagsfraktion, gruene-de, gruene-at | section (Bereich) |
| kommunalwiki | article_type, category |

### Filter-Werte ermitteln
\`\`\`
1. Rufe gruenerator_get_filters mit collection="kommunalwiki" auf
2. Du erhältst: { article_type: ["literatur", "praxishilfe", ...], category: ["Haushalt", ...] }
3. Nutze diese Werte in gruenerator_search
\`\`\`

### Beispiel: Suche mit Filter
\`\`\`json
{
  "query": "Klimaschutz",
  "collection": "kommunalwiki",
  "filters": {
    "article_type": "praxishilfe",
    "category": "Umwelt"
  }
}
\`\`\`

## Empfohlener Workflow

1. **Einfache Suche**: Direkt \`gruenerator_search\` mit query + collection
2. **Gefilterte Suche**:
   - Erst \`gruenerator_get_filters\` aufrufen
   - Dann \`gruenerator_search\` mit passenden Filtern
3. **Mehrere Quellen**: Mehrere Suchen in verschiedenen Sammlungen durchführen

## Tipps

- Nutze "hybrid" als searchMode für beste Ergebnisse
- Bei unklaren Begriffen: vector-Suche findet semantisch ähnliche Inhalte
- Bei exakten Begriffen: text-Suche für präzise Treffer
- KommunalWiki hat spezialisiertes Wissen zu Kommunalpolitik
- Bundestagsfraktion enthält aktuelle Positionen der Grünen im Bundestag
`;

  return {
    uri: 'gruenerator://system-prompt',
    name: 'System Prompt für AI-Assistenten',
    description: 'Anleitung zur Nutzung des Gruenerator MCP Servers',
    mimeType: 'text/markdown',
    contents: [{
      uri: 'gruenerator://system-prompt',
      mimeType: 'text/markdown',
      text: systemPrompt
    }]
  };
}
