#!/usr/bin/env node

import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { config, validateConfig } from './config.js';
import { searchTool } from './tools/search.js';
import { clientConfigTool, generateClientConfigs } from './tools/clientConfig.js';

// Konfiguration validieren
try {
  validateConfig();
} catch (error) {
  console.error(`[Config] ${error.message}`);
  console.error('[Config] Bitte Umgebungsvariablen setzen (QDRANT_URL, QDRANT_API_KEY)');
  process.exit(1);
}

const app = express();
app.use(express.json());

// Helper: Base URL ermitteln
function getBaseUrl(req) {
  return config.server.publicUrl || `${req.protocol}://${req.get('host')}`;
}

// Session-Verwaltung
const transports = {};

// MCP Server Factory
function createMcpServer(baseUrl) {
  const server = new McpServer({
    name: 'gruenerator-mcp',
    version: '1.0.0'
  });

  // Such-Tool registrieren mit Zod Schema
  server.tool(
    searchTool.name,
    searchTool.inputSchema,
    async ({ query, collection, limit }) => {
      const result = await searchTool.handler({ query, collection, limit });
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  // Client-Config-Tool registrieren
  server.tool(
    clientConfigTool.name,
    clientConfigTool.inputSchema,
    async ({ client }) => {
      const result = clientConfigTool.handler({ client }, baseUrl);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
    }
  );

  return server;
}

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'gruenerator-mcp',
    version: '1.0.0',
    collections: Object.keys(config.collections)
  });
});

// Auto-Discovery Endpoint (Standard für MCP-Clients)
app.get('/.well-known/mcp.json', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    name: 'gruenerator-mcp',
    version: '1.0.0',
    description: 'Suche in Grünen Parteiprogrammen (Deutschland & Österreich)',
    homepage: 'https://github.com/Movm/Gruenerator-MCP',
    mcp_endpoint: `${baseUrl}/mcp`,
    transport: 'streamable-http',
    tools: [
      {
        name: 'gruenerator_search',
        description: 'Durchsucht Grüne Parteiprogramme (Österreich/Deutschland)'
      },
      {
        name: 'get_client_config',
        description: 'Generiert fertige MCP-Client-Konfigurationen'
      }
    ],
    collections: Object.entries(config.collections).map(([key, col]) => ({
      id: key,
      name: col.displayName,
      description: col.description
    })),
    supported_clients: ['claude', 'cursor', 'vscode']
  });
});

// Client-spezifische Konfiguration
app.get('/config/:client', (req, res) => {
  const { client } = req.params;
  const baseUrl = getBaseUrl(req);
  const validClients = ['claude', 'cursor', 'vscode'];

  if (!validClients.includes(client)) {
    return res.status(404).json({
      error: 'Unbekannter Client',
      message: `Unterstützte Clients: ${validClients.join(', ')}`,
      available: validClients
    });
  }

  const result = clientConfigTool.handler({ client }, baseUrl);
  res.json(result);
});

// Server-Info Endpoint
app.get('/info', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.json({
    server: {
      name: 'gruenerator-mcp',
      version: '1.0.0',
      description: 'MCP Server für Grüne Parteiprogramme (Deutschland & Österreich)'
    },
    endpoints: {
      mcp: `${baseUrl}/mcp`,
      health: `${baseUrl}/health`,
      discovery: `${baseUrl}/.well-known/mcp.json`,
      config: `${baseUrl}/config/:client`,
      info: `${baseUrl}/info`
    },
    tools: [
      {
        name: 'gruenerator_search',
        description: 'Durchsucht Grüne Parteiprogramme',
        collections: Object.keys(config.collections)
      },
      {
        name: 'get_client_config',
        description: 'Generiert MCP-Client-Konfigurationen',
        clients: ['claude', 'cursor', 'vscode']
      }
    ],
    collections: Object.entries(config.collections).map(([key, col]) => ({
      id: key,
      name: col.displayName,
      description: col.description
    })),
    links: {
      github: 'https://github.com/Movm/Gruenerator-MCP',
      documentation: 'https://github.com/Movm/Gruenerator-MCP#readme'
    }
  });
});

// MCP POST Endpoint (Hauptkommunikation)
app.post('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  let transport;

  if (sessionId && transports[sessionId]) {
    transport = transports[sessionId];
  } else if (!sessionId && isInitializeRequest(req.body)) {
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        transports[id] = transport;
        console.log(`[Session] Neue Session: ${id}`);
      },
      onsessionclosed: (id) => {
        delete transports[id];
        console.log(`[Session] Session beendet: ${id}`);
      }
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        delete transports[transport.sessionId];
      }
    };

    const baseUrl = getBaseUrl(req);
    const server = createMcpServer(baseUrl);
    await server.connect(transport);
  } else {
    res.status(400).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Ungültige Session' },
      id: null
    });
    return;
  }

  await transport.handleRequest(req, res, req.body);
});

// MCP GET Endpoint (SSE Stream)
app.get('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const transport = transports[sessionId];

  if (transport) {
    await transport.handleRequest(req, res);
  } else {
    res.status(400).json({ error: 'Ungültige Session' });
  }
});

// MCP DELETE Endpoint (Session beenden)
app.delete('/mcp', async (req, res) => {
  const sessionId = req.headers['mcp-session-id'];
  const transport = transports[sessionId];

  if (transport) {
    await transport.handleRequest(req, res);
  } else {
    res.status(400).json({ error: 'Ungültige Session' });
  }
});

// Server starten
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const localUrl = `http://localhost:${PORT}`;
  const publicUrl = config.server.publicUrl;

  console.log('='.repeat(50));
  console.log('Gruenerator MCP Server');
  console.log('='.repeat(50));
  console.log(`Port: ${PORT}`);
  console.log(`Qdrant: ${config.qdrant.url}`);
  console.log(`Sammlungen: ${Object.keys(config.collections).join(', ')}`);
  if (publicUrl) {
    console.log(`Public URL: ${publicUrl}`);
  }
  console.log('='.repeat(50));
  console.log('Endpoints:');
  console.log(`  MCP:        ${localUrl}/mcp`);
  console.log(`  Health:     ${localUrl}/health`);
  console.log(`  Discovery:  ${localUrl}/.well-known/mcp.json`);
  console.log(`  Info:       ${localUrl}/info`);
  console.log(`  Config:     ${localUrl}/config/:client`);
  console.log('='.repeat(50));
});
