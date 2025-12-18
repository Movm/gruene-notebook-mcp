import dotenv from 'dotenv';
dotenv.config();

export const config = {
  qdrant: {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    basicAuth: {
      username: process.env.QDRANT_BASIC_AUTH_USERNAME,
      password: process.env.QDRANT_BASIC_AUTH_PASSWORD
    }
  },

  collections: {
    oesterreich: {
      name: 'oesterreich_gruene_documents',
      displayName: 'Die Grünen Österreich',
      description: 'EU-Wahlprogramm, Grundsatzprogramm, Nationalratswahl-Programm'
    },
    deutschland: {
      name: 'grundsatz_documents',
      displayName: 'Bündnis 90/Die Grünen',
      description: 'Grundsatzprogramm 2020'
    },
    bundestag: {
      name: 'bundestag_content',
      displayName: 'Bundestagsfraktion',
      description: 'Pressemitteilungen und Positionen'
    }
  }
};

export function validateConfig() {
  if (!config.qdrant.url) {
    throw new Error('QDRANT_URL ist nicht gesetzt');
  }
  if (!config.qdrant.apiKey) {
    throw new Error('QDRANT_API_KEY ist nicht gesetzt');
  }
}
