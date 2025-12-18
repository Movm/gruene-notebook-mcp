import { z } from 'zod';
import { config } from '../config.js';
import { searchCollection } from '../qdrant/client.js';
import { generateEmbedding } from '../embeddings/mistral.js';

export const searchTool = {
  name: 'search_gruene_documents',
  description: 'Durchsucht Grüne Parteiprogramme nach relevanten Textpassagen. Verfügbare Sammlungen: oesterreich (Die Grünen Österreich), deutschland (Bündnis 90/Die Grünen Grundsatzprogramm), bundestag (Bundestagsfraktion).',
  inputSchema: {
    query: z.string().describe('Suchbegriff oder Frage'),
    collection: z.enum(['oesterreich', 'deutschland', 'bundestag']).describe('Welche Dokumentensammlung durchsuchen'),
    limit: z.number().default(5).describe('Maximale Anzahl Ergebnisse (1-20)')
  },

  async handler({ query, collection, limit = 5 }) {
    // Validierung
    const collectionConfig = config.collections[collection];
    if (!collectionConfig) {
      return {
        error: true,
        message: `Unbekannte Sammlung: ${collection}. Verfügbar: oesterreich, deutschland, bundestag`
      };
    }

    if (!query || query.trim().length === 0) {
      return {
        error: true,
        message: 'Suchbegriff darf nicht leer sein'
      };
    }

    // Limit begrenzen
    const safeLimit = Math.min(Math.max(1, limit), 20);

    try {
      // Embedding generieren
      console.error(`[Search] Generiere Embedding für: "${query.substring(0, 50)}..."`);
      const embedding = await generateEmbedding(query);

      // In Qdrant suchen
      console.error(`[Search] Suche in ${collectionConfig.name}...`);
      const results = await searchCollection(
        collectionConfig.name,
        embedding,
        safeLimit
      );

      if (results.length === 0) {
        return {
          collection: collectionConfig.displayName,
          query: query,
          message: 'Keine Ergebnisse gefunden',
          results: []
        };
      }

      // Ergebnisse formatieren
      return {
        collection: collectionConfig.displayName,
        description: collectionConfig.description,
        query: query,
        resultsCount: results.length,
        results: results.map((r, i) => ({
          rank: i + 1,
          relevance: `${Math.round(r.score * 100)}%`,
          source: r.title,
          excerpt: r.text.length > 800 ? r.text.substring(0, 800) + '...' : r.text
        }))
      };

    } catch (error) {
      console.error('[Search] Fehler:', error.message);
      return {
        error: true,
        message: `Suchfehler: ${error.message}`
      };
    }
  }
};
