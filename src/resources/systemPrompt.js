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

**Rückgabe pro Ergebnis:**
- source: Titel/Name des Dokuments
- url: Link zur Originalquelle (wenn verfügbar)
- excerpt: Textauszug
- relevance: Relevanz in Prozent

### 2. gruenerator_get_filters
**IMMER aufrufen bevor du Filter verwendest!**

Gibt zurück welche Filter verfügbar sind und welche Werte gültig sind.

### 3. gruenerator_cache_stats
Zeigt Cache-Statistiken.

### 4. gruenerator_person_search
Sucht nach Grünen-Abgeordneten mit angereicherten Daten aus der DIP-API.

**Parameter:**
- query (Pflicht): Name oder Frage über einen Abgeordneten (z.B. "Robert Habeck", "Anträge von Baerbock")
- contentLimit: Max. Erwähnungen auf gruene-bundestag.de (Standard: 15)
- drucksachenLimit: Max. Drucksachen (Standard: 20)
- aktivitaetenLimit: Max. Aktivitäten (Standard: 30)

**Rückgabe:**
- isPersonQuery: true wenn Abgeordneter erkannt wurde
- person: Profildaten (Name, Fraktion, Wahlkreis, Biografie)
- drucksachen: Anträge, Anfragen, Gesetzentwürfe
- aktivitaeten: Reden, Abstimmungen, etc.
- contentMentions: Erwähnungen auf gruene-bundestag.de

### 5. gruenerator_examples_search
Sucht nach Social-Media-Beispielen der Grünen (Instagram, Facebook).

**Parameter:**
- query (Pflicht): Thema für Beispielsuche (z.B. "Klimaschutz", "Bildungspolitik")
- platform: "instagram", "facebook", oder "all" (Standard)
- country: "DE", "AT", oder "all" (Standard)
- limit: 1-20 Ergebnisse (Standard: 5)

**Rückgabe pro Beispiel:**
- content: Der Social-Media-Text
- platform: instagram/facebook
- country: DE/AT
- score: Relevanz-Score
- metadata: likes, comments, url

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
→ Ergebnis: { content_type: { values: [{ value: "praxishilfe", count: 45 }, ...] }, ... }
→ gruenerator_search({ query: "Haushalt", collection: "kommunalwiki", filters: { content_type: "praxishilfe" } })

### Beispiel 4: Suche nach Region (Böll-Stiftung)
Nutzer: "Analysen zur Europapolitik bei der Böll-Stiftung"
→ gruenerator_get_filters({ collection: "boell-stiftung" })
→ Ergebnis: { region: { values: [{ value: "europa", count: 128 }, ...] }, ... }
→ gruenerator_search({ query: "Europapolitik", collection: "boell-stiftung", filters: { region: "europa" } })

### Beispiel 5: Suche nach Land
Nutzer: "Nur deutsche Inhalte auf gruene.de"
→ gruenerator_get_filters({ collection: "gruene-de" })
→ gruenerator_search({ query: "Klimaschutz", collection: "gruene-de", filters: { country: "DE" } })

### Beispiel 6: Abgeordneten-Suche
Nutzer: "Was hat Robert Habeck im Bundestag beantragt?"
→ gruenerator_person_search({ query: "Robert Habeck" })
→ Rückgabe: Profil + Drucksachen + Aktivitäten

### Beispiel 7: Social-Media-Beispiele
Nutzer: "Zeig mir Instagram-Beispiele zum Thema Klimaschutz"
→ gruenerator_examples_search({ query: "Klimaschutz", platform: "instagram", limit: 5 })
→ Rückgabe: 5 relevante Instagram-Posts

## Filter nach Sammlung

| Sammlung | Verfügbare Filter |
|----------|-------------------|
| oesterreich, deutschland | primary_category |
| bundestagsfraktion, gruene-de, gruene-at | primary_category, country (DE/AT) |
| kommunalwiki | content_type, primary_category, subcategories |
| boell-stiftung | content_type, primary_category, subcategories, region |

**Hinweis:** gruenerator_get_filters gibt jetzt Dokumentanzahl pro Filterwert zurück (faceted search).
`;

  return {
    contents: [{
      uri: 'gruenerator://system-prompt',
      mimeType: 'text/markdown',
      text: systemPrompt
    }]
  };
}
