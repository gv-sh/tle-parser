/**
 * GraphQL Server for TLE Parser API
 */

import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { readFileSync } from 'fs';
import { join } from 'path';
import { resolvers } from './resolvers';
import { PubSub } from 'graphql-subscriptions';

// Read schema from file
const typeDefs = readFileSync(join(__dirname, 'schema.graphql'), 'utf-8');

// Create PubSub instance for subscriptions
const pubsub = new PubSub();

// Create Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  csrfPrevention: true,
  cache: 'bounded',
  introspection: true, // Enable GraphQL Playground
  plugins: [
    {
      async requestDidStart() {
        return {
          async didEncounterErrors(requestContext) {
            console.error('GraphQL Errors:', requestContext.errors);
          },
        };
      },
    },
  ],
});

// Start server
async function startServer() {
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      // API key authentication
      const apiKey = req.headers['x-api-key'];

      // In production, validate against database
      if (!apiKey && process.env.REQUIRE_API_KEY === 'true') {
        throw new Error('API key is required');
      }

      return {
        apiKey,
        pubsub,
      };
    },
    listen: { port: parseInt(process.env.PORT || '4000', 10) },
  });

  console.log(`🚀 GraphQL Server ready at ${url}`);
  console.log(`📊 GraphQL Playground: ${url}`);
  console.log(`🔍 Health check: query { health { status } }`);
}

// Start the server
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export { server, pubsub };
