import { z } from 'zod';
import { config } from '../config.js';
import { searchCollection, hybridSearchCollection, textSearchCollection } from '../qdrant/client.js';
import { generateEmbedding } from '../embeddings/mistral.js';
import {
  getCachedEmbedding,
  cacheEmbedding,
  getCachedSearch,
  cacheSearch,
  getCacheStats
} from '../utils/cache.js';

export const searchTool = {
  name: 'gruenerator_search',
  description: `Durchsucht Grüne Parteiprogramme und Inhalte mit semantischer und textbasierter Suche.

WICHTIG: Du musst eine Sammlung auswählen.

Sammlungen:
- oesterreich: Die Grünen Österreich (EU-Wahl, Grundsatz, Nationalrat)
- deutschland: Bündnis 90/Die Grünen (Grundsatzprogramm, EU-Wahlprogramm, Regierungsprogramm)
- bundestagsfraktion: Grüne Bundestagsfraktion (Positionen, Fachtexte)
- gruene-de: Grüne Deutschland (gruene.de Inhalte)
- gruene-at: Grüne Österreich (gruene.at Inhalte)
- kommunalwiki: KommunalWiki (Kommunalpolitik-Fachwissen)

Suchmodi:
- hybrid (empfohlen): Kombiniert semantische und textbasierte Suche für beste Ergebnisse
- vector: Rein semantische Suche basierend auf Bedeutung
- text: Rein textbasierte Suche mit deutscher Umlaut-Unterstützung

Filter (optional):
- documentType: Filtert nach Dokumenttyp (grundsatzprogramm, wahlprogramm, eu-wahlprogramm)
- title: Filtert nach exaktem Dokumenttitel
- section: Filtert nach Bereich (für bundestagsfraktion, gruene-de, gruene-at)
- article_type: Filtert nach Artikeltyp (für kommunalwiki)
- category: Filtert nach Kategorie (für kommunalwiki)`,

  inputSchema: {
    query: z.string().describe('Suchbegriff oder Frage'),
    collection: z.enum(['oesterreich', 'deutschland', 'bundestagsfraktion', 'gruene-de', 'gruene-at', 'kommunalwiki']).describe('PFLICHT: Sammlung auswählen'),
    searchMode: z.enum(['hybrid', 'vector', 'text']).default('hybrid').describe('Suchmodus: hybrid (empfohlen), vector, oder text'),
    limit: z.number().default(5).describe('Maximale Anzahl Ergebnisse (1-20)'),
    filters: z.object({
      documentType: z.string().optional().describe('Dokumenttyp: grundsatzprogramm, wahlprogramm, eu-wahlprogramm'),
      title: z.string().optional().describe('Exakter Dokumenttitel zum Filtern'),
      section: z.string().optional().describe('Bereich: Positionen, Themen, Aktuelles, Fraktion, Presse'),
      article_type: z.enum(['literatur', 'praxishilfe', 'faq', 'personalien', 'sachgebiet', 'artikel']).optional().describe('Artikeltyp (nur für kommunalwiki)'),
      category: z.string().optional().describe('Thematische Kategorie (z.B. Haushalt, Umwelt)')
    }).optional().describe('Optionale Filter für die Suche'),
    useCache: z.boolean().default(true).describe('Cache verwenden für schnellere Ergebnisse')
  },

  async handler({ query, collection, searchMode = 'hybrid', limit = 5, filters = null, useCache = true }) {
    const collectionConfig = config.collections[collection];
    if (!collectionConfig) {
      return {
        error: true,
        message: `Unbekannte Sammlung: ${collection}. Verfügbar: oesterreich, deutschland`
      };
    }

    if (!query || query.trim().length === 0) {
      return {
        error: true,
        message: 'Suchbegriff darf nicht leer sein'
      };
    }

    const safeLimit = Math.min(Math.max(1, limit), 20);

    try {
      // Check search cache first
      if (useCache) {
        const cachedResults = getCachedSearch(collection, query, searchMode, filters);
        if (cachedResults) {
          console.error(`[Search] Cache hit for "${query.substring(0, 30)}..."`);
          return {
            ...cachedResults,
            cached: true
          };
        }
      }

      let results;
      let metadata = {};

      console.error(`[Search] Mode: ${searchMode}, Query: "${query.substring(0, 50)}..."`);
      if (filters) {
        console.error(`[Search] Filters: ${JSON.stringify(filters)}`);
      }

      // Build Qdrant filter from metadata filters
      const qdrantFilter = buildQdrantFilter(filters);

      if (searchMode === 'text') {
        console.error(`[Search] Performing text-only search in ${collectionConfig.name}`);
        results = await textSearchCollection(collectionConfig.name, query, safeLimit, qdrantFilter);
        metadata.searchType = 'text';
      } else if (searchMode === 'hybrid') {
        // Check embedding cache
        let embedding = useCache ? getCachedEmbedding(query) : null;

        if (!embedding) {
          console.error(`[Search] Generating embedding for hybrid search`);
          embedding = await generateEmbedding(query);
          if (useCache) {
            cacheEmbedding(query, embedding);
          }
        } else {
          console.error(`[Search] Using cached embedding`);
        }

        console.error(`[Search] Performing hybrid search in ${collectionConfig.name}`);
        const hybridResult = await hybridSearchCollection(
          collectionConfig.name,
          embedding,
          query,
          safeLimit,
          { filter: qdrantFilter }
        );
        results = hybridResult.results;
        metadata = {
          searchType: 'hybrid',
          ...hybridResult.metadata
        };
      } else {
        // Vector search
        let embedding = useCache ? getCachedEmbedding(query) : null;

        if (!embedding) {
          console.error(`[Search] Generating embedding for vector search`);
          embedding = await generateEmbedding(query);
          if (useCache) {
            cacheEmbedding(query, embedding);
          }
        } else {
          console.error(`[Search] Using cached embedding`);
        }

        console.error(`[Search] Performing vector search in ${collectionConfig.name}`);
        results = await searchCollection(collectionConfig.name, embedding, safeLimit, qdrantFilter);
        metadata.searchType = 'vector';
      }

      if (!results || results.length === 0) {
        const response = {
          collection: collectionConfig.displayName,
          query: query,
          searchMode: searchMode,
          message: 'Keine Ergebnisse gefunden',
          results: [],
          metadata,
          filters: filters || null
        };
        return response;
      }

      const response = {
        collection: collectionConfig.displayName,
        description: collectionConfig.description,
        query: query,
        searchMode: searchMode,
        resultsCount: results.length,
        results: results.map((r, i) => ({
          rank: i + 1,
          relevance: `${Math.round(r.score * 100)}%`,
          source: r.title,
          excerpt: r.text.length > 800 ? r.text.substring(0, 800) + '...' : r.text,
          searchMethod: r.searchMethod || searchMode
        })),
        metadata,
        filters: filters || null,
        cached: false
      };

      // Cache the results
      if (useCache) {
        cacheSearch(collection, query, searchMode, response, filters);
      }

      return response;

    } catch (error) {
      console.error('[Search] Fehler:', error.message);
      return {
        error: true,
        message: `Suchfehler: ${error.message}`
      };
    }
  }
};

/**
 * Build Qdrant filter from metadata filters
 */
function buildQdrantFilter(filters) {
  if (!filters) return null;

  const must = [];

  if (filters.documentType) {
    must.push({
      key: 'document_type',
      match: { value: filters.documentType }
    });
  }

  if (filters.title) {
    must.push({
      key: 'title',
      match: { value: filters.title }
    });
  }

  if (filters.section) {
    must.push({
      key: 'section',
      match: { value: filters.section }
    });
  }

  if (filters.article_type) {
    must.push({
      key: 'article_type',
      match: { value: filters.article_type }
    });
  }

  if (filters.category) {
    must.push({
      key: 'category',
      match: { value: filters.category }
    });
  }

  return must.length > 0 ? { must } : null;
}

/**
 * Get cache statistics tool
 */
export const cacheStatsTool = {
  name: 'gruenerator_cache_stats',
  description: 'Zeigt Cache-Statistiken für die Suche an',

  inputSchema: {},

  async handler() {
    const stats = getCacheStats();
    return {
      message: 'Cache-Statistiken',
      ...stats
    };
  }
};
