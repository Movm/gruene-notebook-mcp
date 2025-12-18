import dotenv from 'dotenv';
dotenv.config();

export const config = {
  server: {
    publicUrl: process.env.PUBLIC_URL || null
  },

  qdrant: {
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
    basicAuth: {
      username: process.env.QDRANT_BASIC_AUTH_USERNAME,
      password: process.env.QDRANT_BASIC_AUTH_PASSWORD
    }
  },

  mistral: {
    apiKey: process.env.MISTRAL_API_KEY
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
  if (!config.mistral.apiKey) {
    throw new Error('MISTRAL_API_KEY ist nicht gesetzt');
  }
}
