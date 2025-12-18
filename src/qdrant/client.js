import { QdrantClient } from '@qdrant/js-client-rest';
import { config } from '../config.js';

let client = null;

export async function getQdrantClient() {
  if (client) {
    return client;
  }

  const url = new URL(config.qdrant.url);

  const clientConfig = {
    host: url.hostname,
    port: url.port ? parseInt(url.port) : (url.protocol === 'https:' ? 443 : 80),
    https: url.protocol === 'https:',
    apiKey: config.qdrant.apiKey,
    timeout: 30000
  };

  // Basic Auth falls konfiguriert
  if (config.qdrant.basicAuth?.username && config.qdrant.basicAuth?.password) {
    const basicAuth = Buffer.from(
      `${config.qdrant.basicAuth.username}:${config.qdrant.basicAuth.password}`
    ).toString('base64');
    clientConfig.headers = {
      'Authorization': `Basic ${basicAuth}`
    };
  }

  client = new QdrantClient(clientConfig);

  // Verbindung testen
  try {
    await client.getCollections();
    console.error('[Qdrant] Verbindung hergestellt');
  } catch (error) {
    console.error('[Qdrant] Verbindungsfehler:', error.message);
    throw error;
  }

  return client;
}

export async function searchCollection(collectionName, embedding, limit = 5) {
  const qdrant = await getQdrantClient();

  const results = await qdrant.search(collectionName, {
    vector: embedding,
    limit: limit,
    with_payload: true
  });

  return results.map(hit => ({
    score: hit.score,
    title: hit.payload?.title || hit.payload?.metadata?.title || 'Unbekannt',
    text: hit.payload?.chunk_text || '',
    documentId: hit.payload?.document_id,
    filename: hit.payload?.filename || hit.payload?.metadata?.filename
  }));
}

export async function getCollectionInfo(collectionName) {
  const qdrant = await getQdrantClient();

  try {
    const info = await qdrant.getCollection(collectionName);
    return {
      name: collectionName,
      pointsCount: info.points_count,
      status: info.status
    };
  } catch (error) {
    return {
      name: collectionName,
      error: error.message
    };
  }
}
