import { z } from 'zod';
import { config } from '../config.js';
import { getUniqueFieldValues } from '../qdrant/client.js';

/**
 * Tool to discover available filter values for a collection
 */
export const filtersTool = {
  name: 'gruenerator_get_filters',
  description: `Gibt verfügbare Filterwerte für eine Sammlung zurück.

Nutze dieses Tool um herauszufinden, welche Filter für eine Sammlung verfügbar sind
und welche Werte diese Filter haben können.

Beispiel: Für kommunalwiki gibt es die Filter article_type und category.`,

  inputSchema: {
    collection: z.enum([
      'oesterreich',
      'deutschland',
      'bundestagsfraktion',
      'gruene-de',
      'gruene-at',
      'kommunalwiki'
    ]).describe('Sammlung für die Filterwerte abgerufen werden sollen')
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
