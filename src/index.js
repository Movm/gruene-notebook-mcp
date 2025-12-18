#!/usr/bin/env node

import express from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';

import { config, validateConfig } from './config.js';
import { searchTool } from './tools/search.js';

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

// Session-Verwaltung
const transports = {};

// MCP Server Factory
function createMcpServer() {
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

    const server = createMcpServer();
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
  console.log('='.repeat(50));
  console.log('Gruenerator MCP Server');
  console.log('='.repeat(50));
  console.log(`Port: ${PORT}`);
  console.log(`Qdrant: ${config.qdrant.url}`);
  console.log(`Sammlungen: ${Object.keys(config.collections).join(', ')}`);
  console.log('='.repeat(50));
  console.log(`MCP Endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});
