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

Du hast Zugriff auf den Gruenerator MCP Server für semantische Suche in Grünen Parteiprogrammen.

## WICHTIGSTE REGELN

1. **Nutzer nennt Sammlung** → Verwende GENAU diese (z.B. "kommunalwiki" → collection: "kommunalwiki")
2. **Nutzer will mehrere Sammlungen** → Rufe gruenerator_search MEHRFACH auf
3. **Nutzer will filtern** → ERST gruenerator_get_filters, DANN gruenerator_search mit filters

## Verfügbare Sammlungen

${collections}

## Tools

### 1. gruenerator_search
Haupttool für die Suche.

**Parameter:**
- query (Pflicht): Suchbegriff oder Frage
- collection (Pflicht): EXAKT wie vom Nutzer genannt
- searchMode: "hybrid" (Standard, empfohlen), "vector", "text"
- limit: 1-20 Ergebnisse (Standard: 5)
- filters: Nur nach Aufruf von gruenerator_get_filters!

### 2. gruenerator_get_filters
**IMMER aufrufen bevor du Filter verwendest!**

Gibt zurück welche Filter verfügbar sind und welche Werte gültig sind.

### 3. gruenerator_cache_stats
Zeigt Cache-Statistiken.

## Workflow-Beispiele

### Beispiel 1: Einfache Suche
Nutzer: "Was steht im Kommunalwiki zur AfD?"
→ gruenerator_search({ query: "AfD", collection: "kommunalwiki" })

### Beispiel 2: Suche in mehreren Sammlungen
Nutzer: "Suche in Deutschland und Österreich nach Klimaschutz"
→ gruenerator_search({ query: "Klimaschutz", collection: "deutschland" })
→ gruenerator_search({ query: "Klimaschutz", collection: "oesterreich" })

### Beispiel 3: Gefilterte Suche
Nutzer: "Nur Praxishilfen zum Thema Haushalt im Kommunalwiki"
→ gruenerator_get_filters({ collection: "kommunalwiki" })
→ Ergebnis: { article_type: ["praxishilfe", ...], category: ["Haushalt", ...] }
→ gruenerator_search({ query: "Haushalt", collection: "kommunalwiki", filters: { article_type: "praxishilfe", category: "Haushalt" } })

## Filter nach Sammlung

| Sammlung | Filter |
|----------|--------|
| oesterreich, deutschland | title |
| bundestagsfraktion, gruene-de, gruene-at | section |
| kommunalwiki, boell-stiftung | article_type, category |
`;

  return {
    contents: [{
      uri: 'gruenerator://system-prompt',
      mimeType: 'text/markdown',
      text: systemPrompt
    }]
  };
}
