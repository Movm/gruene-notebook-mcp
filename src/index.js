#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { config, validateConfig } from './config.js';
import { searchTool } from './tools/search.js';

// Konfiguration validieren
try {
  validateConfig();
} catch (error) {
  console.error(`[Config] ${error.message}`);
  console.error('[Config] Bitte .env Datei erstellen (siehe .env.example)');
  process.exit(1);
}

// MCP Server erstellen
const server = new Server(
  {
    name: 'gruene-notebook-mcp',
    version: '1.0.0'
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

// Tools auflisten
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: searchTool.name,
        description: searchTool.description,
        inputSchema: searchTool.inputSchema
      }
    ]
  };
});

// Tool aufrufen
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === searchTool.name) {
    const result = await searchTool.handler(args);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }

  throw new Error(`Unbekanntes Tool: ${name}`);
});

// Server starten
async function main() {
  console.error('='.repeat(50));
  console.error('Grüne Notebook MCP Server');
  console.error('='.repeat(50));
  console.error(`Qdrant: ${config.qdrant.url}`);
  console.error(`Sammlungen: ${Object.keys(config.collections).join(', ')}`);
  console.error('='.repeat(50));

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('[Server] Bereit für Anfragen');
}

main().catch((error) => {
  console.error('[Server] Kritischer Fehler:', error);
  process.exit(1);
});
