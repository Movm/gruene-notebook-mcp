import { z } from 'zod';
import { config } from '../config.js';
import { getUniqueFieldValues } from '../qdrant/client.js';

/**
 * Tool to discover available filter values for a collection
 */
export const filtersTool = {
  name: 'gruenerator_get_filters',
  description: `Gibt verfügbare Filterwerte für eine Sammlung zurück.

WICHTIG: Rufe dieses Tool IMMER auf BEVOR du gruenerator_search mit Filtern verwendest!

## Wann aufrufen?

- Nutzer fragt nach bestimmtem Dokumenttyp (z.B. "nur Praxishilfen", "nur Grundsatzprogramm")
- Nutzer will nach Kategorie filtern (z.B. "nur zum Thema Umwelt")
- Du willst die Suche eingrenzen

## Beispiel-Workflow

1. Nutzer: "Suche Praxishilfen zum Thema Haushalt im Kommunalwiki"
2. Du rufst auf: gruenerator_get_filters({ collection: "kommunalwiki" })
3. Du erhältst: { article_type: ["praxishilfe", ...], category: ["Haushalt", ...] }
4. Du rufst auf: gruenerator_search({ query: "Haushalt", collection: "kommunalwiki", filters: { article_type: "praxishilfe", category: "Haushalt" } })`,

  inputSchema: {
    collection: z.enum([
      'oesterreich',
      'deutschland',
      'bundestagsfraktion',
      'gruene-de',
      'gruene-at',
      'kommunalwiki',
      'boell-stiftung'
    ]).describe('Sammlung für die Filterwerte - muss vor gefilterter Suche aufgerufen werden')
  },

  async handler({ collection }) {
    const col = config.collections[collection];
    if (!col) {
      return {
        error: true,
        message: `Unbekannte Sammlung: ${collection}. Verfügbar: ${Object.keys(config.collections).join(', ')}`
      };
    }

    if (!col.filterableFields || Object.keys(col.filterableFields).length === 0) {
      return {
        collection: col.displayName,
        collectionId: collection,
        message: 'Keine Filter für diese Sammlung verfügbar',
        filters: {}
      };
    }

    try {
      const filters = {};

      for (const [field, fieldConfig] of Object.entries(col.filterableFields)) {
        console.error(`[Filters] Fetching unique values for ${collection}.${field}`);
        const values = await getUniqueFieldValues(col.name, field);

        filters[field] = {
          label: fieldConfig.label,
          type: fieldConfig.type,
          values,
          count: values.length
        };
      }

      return {
        collection: col.displayName,
        collectionId: collection,
        description: col.description,
        filters
      };
    } catch (error) {
      console.error('[Filters] Error:', error.message);
      return {
        error: true,
        message: `Fehler beim Abrufen der Filter: ${error.message}`,
        collection: col.displayName,
        collectionId: collection
      };
    }
  }
};
