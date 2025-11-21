/**
 * WebSocket Server for TLE Parser Real-time Updates
 */

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import * as TLEParser from '../../../src/index';

const app = express();
const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer });

const PORT = process.env.PORT || 8080;

// Track active subscriptions
interface Subscription {
  type: 'position' | 'tle' | 'visibility';
  catalogNumber?: number;
  interval?: number;
  intervalId?: NodeJS.Timeout;
  observer?: {
    latitude: number;
    longitude: number;
    altitude: number;
  };
}

const subscriptions = new Map<WebSocket, Subscription[]>();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    connections: wss.clients.size,
    subscriptions: Array.from(subscriptions.values()).flat().length,
    timestamp: new Date().toISOString(),
  });
});

// WebSocket connection handler
wss.on('connection', (ws: WebSocket, req) => {
  console.log('New WebSocket connection from', req.socket.remoteAddress);

  // Initialize subscriptions for this client
  subscriptions.set(ws, []);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'Connected to TLE Parser WebSocket API',
    timestamp: new Date().toISOString(),
  }));

  // Message handler
  ws.on('message', async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      await handleMessage(ws, message);
    } catch (error: any) {
      ws.send(JSON.stringify({
        type: 'error',
        error: {
          code: 'INVALID_MESSAGE',
          message: error.message,
        },
        timestamp: new Date().toISOString(),
      }));
    }
  });

  // Close handler
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    cleanupSubscriptions(ws);
    subscriptions.delete(ws);
  });

  // Error handler
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    cleanupSubscriptions(ws);
  });
});

// Handle incoming messages
async function handleMessage(ws: WebSocket, message: any) {
  const { type, data } = message;

  switch (type) {
    case 'subscribe:position':
      await subscribePosition(ws, data);
      break;

    case 'subscribe:tle':
      await subscribeTLE(ws, data);
      break;

    case 'subscribe:visibility':
      await subscribeVisibility(ws, data);
      break;

    case 'unsubscribe':
      unsubscribe(ws, data);
      break;

    case 'parse':
      await parseTLE(ws, data);
      break;

    case 'ping':
      ws.send(JSON.stringify({
        type: 'pong',
        timestamp: new Date().toISOString(),
      }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        error: {
          code: 'UNKNOWN_MESSAGE_TYPE',
          message: `Unknown message type: ${type}`,
        },
        timestamp: new Date().toISOString(),
      }));
  }
}

// Subscribe to position updates
async function subscribePosition(ws: WebSocket, data: any) {
  const { catalogNumber, interval = 5000 } = data;

  if (!catalogNumber) {
    ws.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'MISSING_CATALOG_NUMBER',
        message: 'Catalog number is required',
      },
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  try {
    // Fetch TLE
    const fetcher = new TLEParser.TLEFetcher({ source: 'celestrak' });
    const result = await fetcher.fetchByCatalogNumber(catalogNumber);

    if (result.error || !result.data) {
      ws.send(JSON.stringify({
        type: 'error',
        error: {
          code: 'TLE_FETCH_ERROR',
          message: `Failed to fetch TLE for satellite ${catalogNumber}`,
        },
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    const tle = result.data;
    const calculator = new TLEParser.OrbitalCalculator();

    // Create interval for position updates
    const intervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const now = new Date();
        const position = calculator.calculatePosition(tle, now);

        ws.send(JSON.stringify({
          type: 'position:update',
          data: {
            catalogNumber,
            timestamp: now.toISOString(),
            position: {
              x: position.position.x,
              y: position.position.y,
              z: position.position.z,
            },
            velocity: {
              x: position.velocity.x,
              y: position.velocity.y,
              z: position.velocity.z,
            },
            altitude: position.altitude,
            latitude: position.latitude,
            longitude: position.longitude,
            eclipsed: position.eclipsed || false,
          },
        }));
      } else {
        clearInterval(intervalId);
      }
    }, interval);

    // Store subscription
    const clientSubs = subscriptions.get(ws) || [];
    clientSubs.push({
      type: 'position',
      catalogNumber,
      interval,
      intervalId,
    });
    subscriptions.set(ws, clientSubs);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'subscribed',
      subscription: {
        type: 'position',
        catalogNumber,
        interval,
      },
      timestamp: new Date().toISOString(),
    }));
  } catch (error: any) {
    ws.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'SUBSCRIPTION_ERROR',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }));
  }
}

// Subscribe to TLE updates
async function subscribeTLE(ws: WebSocket, data: any) {
  const { catalogNumber } = data;

  if (!catalogNumber) {
    ws.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'MISSING_CATALOG_NUMBER',
        message: 'Catalog number is required',
      },
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // Store subscription
  const clientSubs = subscriptions.get(ws) || [];
  clientSubs.push({
    type: 'tle',
    catalogNumber,
  });
  subscriptions.set(ws, clientSubs);

  // Send confirmation
  ws.send(JSON.stringify({
    type: 'subscribed',
    subscription: {
      type: 'tle',
      catalogNumber,
    },
    timestamp: new Date().toISOString(),
  }));

  // In production, this would listen to a message queue or database changes
  // For demo, we'll just confirm the subscription
}

// Subscribe to visibility updates
async function subscribeVisibility(ws: WebSocket, data: any) {
  const { catalogNumber, observer, interval = 60000 } = data;

  if (!catalogNumber || !observer) {
    ws.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'MISSING_PARAMETERS',
        message: 'Catalog number and observer are required',
      },
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  try {
    // Fetch TLE
    const fetcher = new TLEParser.TLEFetcher({ source: 'celestrak' });
    const result = await fetcher.fetchByCatalogNumber(catalogNumber);

    if (result.error || !result.data) {
      ws.send(JSON.stringify({
        type: 'error',
        error: {
          code: 'TLE_FETCH_ERROR',
          message: `Failed to fetch TLE for satellite ${catalogNumber}`,
        },
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    const tle = result.data;
    const calculator = new TLEParser.OrbitalCalculator();

    // Create interval for visibility updates
    const intervalId = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const now = new Date();
        const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Next 24 hours

        const passes = calculator.calculatePasses(tle, observer, now, endTime, 10);

        ws.send(JSON.stringify({
          type: 'visibility:update',
          data: {
            catalogNumber,
            timestamp: now.toISOString(),
            passes: passes.map((pass: any) => ({
              startTime: pass.startTime.toISOString(),
              endTime: pass.endTime.toISOString(),
              maxElevation: pass.maxElevation,
              duration: Math.floor((pass.endTime.getTime() - pass.startTime.getTime()) / 1000),
              direction: pass.direction,
            })),
          },
        }));
      } else {
        clearInterval(intervalId);
      }
    }, interval);

    // Store subscription
    const clientSubs = subscriptions.get(ws) || [];
    clientSubs.push({
      type: 'visibility',
      catalogNumber,
      interval,
      intervalId,
      observer,
    });
    subscriptions.set(ws, clientSubs);

    // Send confirmation
    ws.send(JSON.stringify({
      type: 'subscribed',
      subscription: {
        type: 'visibility',
        catalogNumber,
        observer,
        interval,
      },
      timestamp: new Date().toISOString(),
    }));
  } catch (error: any) {
    ws.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'SUBSCRIPTION_ERROR',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }));
  }
}

// Unsubscribe from updates
function unsubscribe(ws: WebSocket, data: any) {
  const { type, catalogNumber } = data;

  const clientSubs = subscriptions.get(ws) || [];
  const filtered = clientSubs.filter(sub => {
    const matches = sub.type === type && (!catalogNumber || sub.catalogNumber === catalogNumber);
    if (matches && sub.intervalId) {
      clearInterval(sub.intervalId);
    }
    return !matches;
  });

  subscriptions.set(ws, filtered);

  ws.send(JSON.stringify({
    type: 'unsubscribed',
    subscription: { type, catalogNumber },
    timestamp: new Date().toISOString(),
  }));
}

// Parse TLE (one-time request)
async function parseTLE(ws: WebSocket, data: any) {
  const { tle, strict = true } = data;

  if (!tle) {
    ws.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'MISSING_TLE',
        message: 'TLE data is required',
      },
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  try {
    const parser = new TLEParser.TLEParser({ strict });
    const result = parser.parse(tle);

    if (result.error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: {
          code: result.error.code,
          message: result.error.message,
        },
        timestamp: new Date().toISOString(),
      }));
      return;
    }

    ws.send(JSON.stringify({
      type: 'parse:result',
      data: result.data,
      timestamp: new Date().toISOString(),
    }));
  } catch (error: any) {
    ws.send(JSON.stringify({
      type: 'error',
      error: {
        code: 'PARSE_ERROR',
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    }));
  }
}

// Cleanup subscriptions for a client
function cleanupSubscriptions(ws: WebSocket) {
  const clientSubs = subscriptions.get(ws) || [];
  clientSubs.forEach(sub => {
    if (sub.intervalId) {
      clearInterval(sub.intervalId);
    }
  });
}

// Broadcast TLE update to all subscribers
export function broadcastTLEUpdate(catalogNumber: number, tle: any) {
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      const clientSubs = subscriptions.get(ws) || [];
      const hasSub = clientSubs.some(
        sub => sub.type === 'tle' && sub.catalogNumber === catalogNumber
      );

      if (hasSub) {
        ws.send(JSON.stringify({
          type: 'tle:update',
          data: {
            catalogNumber,
            tle,
            timestamp: new Date().toISOString(),
          },
        }));
      }
    }
  });
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket Server running on port ${PORT}`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});

export { wss, app };
